'use strict';
const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  next();
}

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT id, email, created_at FROM users ORDER BY id');
  res.json(rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT id, email, created_at FROM users WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name)
    return res.status(400).json({ error: 'Email, password e nome são obrigatórios.' });

  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing.length)
    return res.status(409).json({ error: 'Já existe uma conta com este email.' });

  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email.toLowerCase().trim(), hash]);
  const userId = result.insertId;
  await db.query('INSERT INTO profiles (user_id, name, role) VALUES (?, ?, ?)', [userId, name, 'USER']);

  const [rows] = await db.query('SELECT id, email, created_at FROM users WHERE id = ?', [userId]);
  res.status(201).json(rows[0]);
});

router.put('/:id', requireAuth, async (req, res) => {
  if (String(req.user.id) !== String(req.params.id))
    return res.status(403).json({ error: 'Sem permissão para alterar este utilizador.' });

  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório.' });

  const [dup] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase().trim(), req.params.id]);
  if (dup.length) return res.status(409).json({ error: 'Email já em uso.' });

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET email = ?, password_hash = ? WHERE id = ?', [email.toLowerCase().trim(), hash, req.params.id]);
  } else {
    await db.query('UPDATE users SET email = ? WHERE id = ?', [email.toLowerCase().trim(), req.params.id]);
  }

  const [rows] = await db.query('SELECT id, email, created_at FROM users WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (String(req.user.id) !== String(req.params.id))
    return res.status(403).json({ error: 'Sem permissão.' });
  await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  req.logout(() => req.session.destroy(() => res.status(204).send()));
});

module.exports = router;
