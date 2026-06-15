'use strict';
const express  = require('express');
const passport = require('passport');
const bcrypt   = require('bcryptjs');
const db       = require('../db');

const router = express.Router();

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.user) return res.json({ user: null, activeProfileId: null, profile: null });

  let profile = null;
  const pid = req.session.activeProfileId;
  if (pid) {
    const [rows] = await db.query('SELECT id, name, role, user_id FROM profiles WHERE id = ?', [pid]);
    if (rows[0]) profile = { id: rows[0].id, name: rows[0].name, role: rows[0].role, userId: rows[0].user_id };
  }

  res.json({
    user:            { id: req.user.id, email: req.user.email },
    activeProfileId: pid ?? null,
    profile
  });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name)
    return res.status(400).json({ error: 'Email, password e nome são obrigatórios.' });
  if (password.length < 4)
    return res.status(400).json({ error: 'A password deve ter pelo menos 4 caracteres.' });

  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing.length)
    return res.status(409).json({ error: 'Já existe uma conta com este email.' });

  const hash = await bcrypt.hash(password, 10);
  const [userRes] = await db.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email.toLowerCase().trim(), hash]);
  const userId = userRes.insertId;

  const [profRes] = await db.query('INSERT INTO profiles (user_id, name, role) VALUES (?, ?, ?)', [userId, name, 'USER']);
  const profileId = profRes.insertId;

  req.login({ id: userId, email: email.toLowerCase().trim() }, err => {
    if (err) return res.status(500).json({ error: 'Erro de sessão.' });
    req.session.activeProfileId = profileId;
    res.status(201).json({ user: { id: userId, email: email.toLowerCase().trim() }, activeProfileId: profileId });
  });
});

// POST /api/auth/login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Email ou password inválidos.' });

    req.login(user, async loginErr => {
      if (loginErr) return next(loginErr);
      const [profiles] = await db.query('SELECT id FROM profiles WHERE user_id = ? ORDER BY id LIMIT 1', [user.id]);
      req.session.activeProfileId = profiles[0]?.id ?? null;
      res.json({ user: { id: user.id, email: user.email }, activeProfileId: req.session.activeProfileId });
    });
  })(req, res, next);
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: 'Logout falhou.' });
    req.session.destroy(() => res.json({ ok: true }));
  });
});

// PUT /api/auth/profile – define o perfil ativo na sessão
router.put('/profile', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  req.session.activeProfileId = req.body.profileId ?? null;
  res.json({ activeProfileId: req.session.activeProfileId });
});

module.exports = router;
