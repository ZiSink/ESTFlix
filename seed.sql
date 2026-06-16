USE estflix;

INSERT IGNORE INTO users (email, password_hash) VALUES
  ('admin@estflix.test',  '$2a$10$otVm6XSGWfjXShCiUw24huI/4kjV/Wf6lx2yIFIC27P/cAt6XmNN2'),
  ('viewer@estflix.test', '$2a$10$yFaopDE6SsM2ucUfbQDqaepJDb.BMLOZAx2P3OaXLeS8B2TKSM4WS');

INSERT IGNORE INTO profiles (user_id, name, role) VALUES
  ((SELECT id FROM users WHERE email = 'admin@estflix.test'),  'Admin',     'ADMIN'),
  ((SELECT id FROM users WHERE email = 'admin@estflix.test'),  'Cinephile', 'USER'),
  ((SELECT id FROM users WHERE email = 'viewer@estflix.test'), 'Viewer',    'USER');

INSERT IGNORE INTO categories (name) VALUES
  ('Action'),
  ('Drama'),
  ('Comedy'),
  ('Sci-Fi');

INSERT IGNORE INTO contents
  (title, description, tagline, category_id, year, rating, image_url, type, runtime_minutes, cast, trailer_url)
VALUES
  (
    'The Dark Knight',
    'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague Gotham City.',
    'Why so serious?',
    (SELECT id FROM categories WHERE name = 'Action'),
    2008, 4.9,
    'https://image.tmdb.org/t/p/w500/eC3EDsKJwv7RtWhG2aQai6d9jw5.jpg',
    'movie', 152,
    '["Christian Bale","Heath Ledger","Aaron Eckhart"]',
    'https://www.youtube.com/embed/EXeTwQWrcwY'
  ),
  (
    'Inception',
    'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    'Your mind is the scene of the crime.',
    (SELECT id FROM categories WHERE name = 'Sci-Fi'),
    2010, 4.8,
    'https://image.tmdb.org/t/p/w500/ms1bJvwa4BJycBakQ7afcedGlwY.jpg',
    'movie', 148,
    '["Leonardo DiCaprio","Joseph Gordon-Levitt","Elliot Page"]',
    'https://www.youtube.com/embed/YoHD9XEInc0'
  ),
  (
    'Interstellar',
    'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.',
    'Mankind was born on Earth. It was never meant to die here.',
    (SELECT id FROM categories WHERE name = 'Sci-Fi'),
    2014, 4.7,
    'https://image.tmdb.org/t/p/w500/6ricSDD83BClJsFdGB6x7cM0MFQ.jpg',
    'movie', 169,
    '["Matthew McConaughey","Anne Hathaway","Jessica Chastain"]',
    'https://www.youtube.com/embed/zSWdZVtXT7E'
  ),
  (
    'The Matrix',
    'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth – the life he knows is the elaborate deception of an evil cyber-intelligence.',
    'Free your mind.',
    (SELECT id FROM categories WHERE name = 'Sci-Fi'),
    1999, 4.8,
    'https://image.tmdb.org/t/p/w500/lDqMDI3xpbB9UQRyeXfei0MXhqb.jpg',
    'movie', 136,
    '["Keanu Reeves","Laurence Fishburne","Carrie-Anne Moss"]',
    'https://www.youtube.com/embed/vKQi3bBA1y8'
  ),
  (
    'Joker',
    'In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime.',
    'Put on a happy face.',
    (SELECT id FROM categories WHERE name = 'Drama'),
    2019, 4.5,
    'https://image.tmdb.org/t/p/w500/miFPa7bgu2wEcJYLjB4hrg2PG4E.jpg',
    'movie', 122,
    '["Joaquin Phoenix","Robert De Niro","Zazie Beetz"]',
    'https://www.youtube.com/embed/zAGVQLHvwOY'
  ),
  (
    'Parasite',
    'All unemployed, Ki-taek''s family takes a peculiar interest in the wealthy and well-educated Park family, as they begin to infiltrate their household one by one.',
    'Act like you own the place.',
    (SELECT id FROM categories WHERE name = 'Drama'),
    2019, 4.6,
    'https://image.tmdb.org/t/p/w500/bik2BZjmVjeE6LOZqtuTjb4jJPQ.jpg',
    'movie', 132,
    '["Song Kang-ho","Lee Sun-kyun","Cho Yeo-jeong"]',
    'https://www.youtube.com/embed/5xH0HfJHsaY'
  ),
  (
    'The Grand Budapest Hotel',
    'The adventures of Gustave H, a legendary concierge at a famous hotel between the wars, and Zero Moustafa, the lobby boy who becomes his most trusted friend.',
    'A world that no longer exists.',
    (SELECT id FROM categories WHERE name = 'Comedy'),
    2014, 4.4,
    'https://image.tmdb.org/t/p/w500/yabOguSrb8ffUXCkI6t8Rw7xtSh.jpg',
    'movie', 99,
    '["Ralph Fiennes","Tony Revolori","Tilda Swinton"]',
    'https://www.youtube.com/embed/1Fg9a1yuQo4'
  ),
  (
    'Breaking Bad',
    'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family''s future.',
    'All bad things must come to an end.',
    (SELECT id FROM categories WHERE name = 'Drama'),
    2008, 4.9,
    'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    'series', 47,
    '["Bryan Cranston","Aaron Paul","Anna Gunn"]',
    'https://www.youtube.com/embed/HhesaQXJuRY'
  ),
  (
    'Stranger Things',
    'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    'The world is turning upside down.',
    (SELECT id FROM categories WHERE name = 'Sci-Fi'),
    2016, 4.7,
    'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    'series', 51,
    '["Millie Bobby Brown","Finn Wolfhard","Winona Ryder"]',
    'https://www.youtube.com/embed/b9EkMc79ZSU'
  ),
  (
    'The Office',
    'A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.',
    'Work is hell. This is its documentary.',
    (SELECT id FROM categories WHERE name = 'Comedy'),
    2005, 4.6,
    'https://image.tmdb.org/t/p/w500/e7BoS8uUnew9ioS6reqtK9matqy.jpg',
    'series', 22,
    '["Steve Carell","John Krasinski","Jenna Fischer"]',
    'https://www.youtube.com/embed/LHOtClSmNkM'
  );
