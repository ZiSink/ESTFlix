'use strict';
const express  = require('express');
const session  = require('express-session');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const db       = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

app.use(session({
  secret:            process.env.SESSION_SECRET || 'estflix-dev-secret-2025',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user) return done(null, false, { message: 'Invalid email or password.' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return done(null, false, { message: 'Invalid email or password.' });
    return done(null, user);
  } catch (err) { return done(err); }
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query('SELECT id, email, created_at FROM users WHERE id = ?', [id]);
    done(null, rows[0] ?? null);
  } catch (err) { done(err); }
});

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/contents',   require('./routes/contents'));
app.use('/api/profiles',   require('./routes/profiles'));
app.use('/api/favorites',  require('./routes/favorites'));
app.use('/api/history',    require('./routes/history'));

app.use((req, res) => {
  if (!req.path.startsWith('/api')) res.sendFile(path.join(__dirname, 'login.html'));
  else res.status(404).json({ error: 'Not found.' });
});

app.use((err, req, res, _next) => {
  console.error(err.stack || err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`ESTFlix a correr em http://localhost:${PORT}`);
  console.log('Credenciais demo: admin@estflix.test / admin  |  viewer@estflix.test / viewer');
});
