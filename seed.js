'use strict';
const bcrypt = require('bcryptjs');
const db     = require('./db');

const CATEGORIES = ['Action', 'Drama', 'Comedy', 'Sci-Fi'];

const CONTENTS = [
  { title: 'The Dark Knight', description: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague Gotham City.', tagline: 'Why so serious?', category: 'Action', year: 2008, rating: 4.9, imageUrl: 'https://image.tmdb.org/t/p/w500/eC3EDsKJwv7RtWhG2aQai6d9jw5.jpg', type: 'movie', runtimeMinutes: 152, cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'], trailerUrl: 'https://www.youtube.com/embed/EXeTwQWrcwY' },
  { title: 'Inception', description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', tagline: 'Your mind is the scene of the crime.', category: 'Sci-Fi', year: 2010, rating: 4.8, imageUrl: 'https://image.tmdb.org/t/p/w500/ms1bJvwa4BJycBakQ7afcedGlwY.jpg', type: 'movie', runtimeMinutes: 148, cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'], trailerUrl: 'https://www.youtube.com/embed/YoHD9XEInc0' },
  { title: 'Interstellar', description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', tagline: 'Mankind was born on Earth. It was never meant to die here.', category: 'Sci-Fi', year: 2014, rating: 4.7, imageUrl: 'https://image.tmdb.org/t/p/w500/6ricSDD83BClJsFdGB6x7cM0MFQ.jpg', type: 'movie', runtimeMinutes: 169, cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'], trailerUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E' },
  { title: 'The Matrix', description: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth – the life he knows is the elaborate deception of an evil cyber-intelligence.', tagline: 'Free your mind.', category: 'Sci-Fi', year: 1999, rating: 4.8, imageUrl: 'https://image.tmdb.org/t/p/w500/lDqMDI3xpbB9UQRyeXfei0MXhqb.jpg', type: 'movie', runtimeMinutes: 136, cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss'], trailerUrl: 'https://www.youtube.com/embed/vKQi3bBA1y8' },
  { title: 'Joker', description: 'In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime.', tagline: 'Put on a happy face.', category: 'Drama', year: 2019, rating: 4.5, imageUrl: 'https://image.tmdb.org/t/p/w500/miFPa7bgu2wEcJYLjB4hrg2PG4E.jpg', type: 'movie', runtimeMinutes: 122, cast: ['Joaquin Phoenix', 'Robert De Niro', 'Zazie Beetz'], trailerUrl: 'https://www.youtube.com/embed/zAGVQLHvwOY' },
  { title: 'Parasite', description: 'All unemployed, Ki-taek\'s family takes a peculiar interest in the wealthy and well-educated Park family, as they begin to infiltrate their household one by one.', tagline: 'Act like you own the place.', category: 'Drama', year: 2019, rating: 4.6, imageUrl: 'https://image.tmdb.org/t/p/w500/bik2BZjmVjeE6LOZqtuTjb4jJPQ.jpg', type: 'movie', runtimeMinutes: 132, cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong'], trailerUrl: 'https://www.youtube.com/embed/5xH0HfJHsaY' },
  { title: 'The Grand Budapest Hotel', description: 'The adventures of Gustave H, a legendary concierge at a famous hotel between the wars, and Zero Moustafa, the lobby boy who becomes his most trusted friend.', tagline: 'A world that no longer exists.', category: 'Comedy', year: 2014, rating: 4.4, imageUrl: 'https://image.tmdb.org/t/p/w500/yabOguSrb8ffUXCkI6t8Rw7xtSh.jpg', type: 'movie', runtimeMinutes: 99, cast: ['Ralph Fiennes', 'Tony Revolori', 'Tilda Swinton'], trailerUrl: 'https://www.youtube.com/embed/1Fg9a1yuQo4' },
  { title: 'Breaking Bad', description: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.', tagline: 'All bad things must come to an end.', category: 'Drama', year: 2008, rating: 4.9, imageUrl: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', type: 'series', runtimeMinutes: 47, cast: ['Bryan Cranston', 'Aaron Paul', 'Anna Gunn'], trailerUrl: 'https://www.youtube.com/embed/HhesaQXLuRY' },
  { title: 'Stranger Things', description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.', tagline: 'The world is turning upside down.', category: 'Sci-Fi', year: 2016, rating: 4.7, imageUrl: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', type: 'series', runtimeMinutes: 51, cast: ['Millie Bobby Brown', 'Finn Wolfhard', 'Winona Ryder'], trailerUrl: 'https://www.youtube.com/embed/b9EkMc79ZSU' },
  { title: 'The Office', description: 'A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.', tagline: 'Work is hell. This is its documentary.', category: 'Comedy', year: 2005, rating: 4.6, imageUrl: 'https://image.tmdb.org/t/p/w500/e7BoS8uUnew9ioS6reqtK9matqy.jpg', type: 'series', runtimeMinutes: 22, cast: ['Steve Carell', 'John Krasinski', 'Jenna Fischer'], trailerUrl: 'https://www.youtube.com/embed/LHOtClSmNkM' }
];

async function getId(table, field, value) {
  const [rows] = await db.query(`SELECT id FROM ${table} WHERE ${field} = ?`, [value]);
  return rows[0]?.id ?? null;
}

async function seed() {
  console.log('A popular base de dados ESTFlix...');

  const adminHash  = await bcrypt.hash('admin',  10);
  const viewerHash = await bcrypt.hash('viewer', 10);

  await db.query('INSERT IGNORE INTO users (email, password_hash) VALUES (?, ?)', ['admin@estflix.test',  adminHash]);
  await db.query('INSERT IGNORE INTO users (email, password_hash) VALUES (?, ?)', ['viewer@estflix.test', viewerHash]);

  const adminId  = await getId('users', 'email', 'admin@estflix.test');
  const viewerId = await getId('users', 'email', 'viewer@estflix.test');

  await db.query('INSERT IGNORE INTO profiles (user_id, name, role) VALUES (?, ?, ?)', [adminId,  'Admin',     'ADMIN']);
  await db.query('INSERT IGNORE INTO profiles (user_id, name, role) VALUES (?, ?, ?)', [adminId,  'Cinephile', 'USER']);
  await db.query('INSERT IGNORE INTO profiles (user_id, name, role) VALUES (?, ?, ?)', [viewerId, 'Viewer',    'USER']);

  for (const name of CATEGORIES) {
    await db.query('INSERT IGNORE INTO categories (name) VALUES (?)', [name]);
  }

  const [catRows] = await db.query('SELECT id, name FROM categories');
  const cats = Object.fromEntries(catRows.map(c => [c.name, c.id]));

  for (const c of CONTENTS) {
    await db.query(
      'INSERT IGNORE INTO contents (title, description, category_id, year, rating, image_url, type, runtime_minutes, cast, tagline, trailer_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [c.title, c.description, cats[c.category], c.year, c.rating, c.imageUrl, c.type, c.runtimeMinutes, JSON.stringify(c.cast), c.tagline, c.trailerUrl]
    );
  }

  console.log('Seed concluído com sucesso!');
  console.log('  admin@estflix.test  / admin');
  console.log('  viewer@estflix.test / viewer');
  await db.end();
}

seed().catch(err => { console.error('Seed falhou:', err.message); process.exit(1); });
