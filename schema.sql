-- ESTFlix – Script de criação da base de dados
-- Executar: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS estflix
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE estflix;

CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  name       VARCHAR(100) NOT NULL,
  avatar_url TEXT DEFAULT '',
  role       ENUM('USER', 'ADMIN') DEFAULT 'USER',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS contents (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255) UNIQUE NOT NULL,
  description     TEXT,
  category_id     INT,
  year            INT,
  rating          DECIMAL(3,1) DEFAULT 0.0,
  image_url       TEXT,
  type            ENUM('movie', 'series') DEFAULT 'movie',
  runtime_minutes INT,
  cast            JSON,
  tagline         VARCHAR(500),
  trailer_url     TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  profile_id INT NOT NULL,
  content_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (profile_id, content_id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS history (
  profile_id INT NOT NULL,
  content_id INT NOT NULL,
  watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  times      INT DEFAULT 1,
  PRIMARY KEY (profile_id, content_id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);
