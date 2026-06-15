'use strict';
const express = require('express');
const db      = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  next();
}

function mapRow(r) {
  return { id: r.id, userId: r.user_id, name: r.name, avatarUrl: r.avatar_url, role: r.role };
}

// GET /api/profiles
router.get('/', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM profiles WHERE user_id = ? ORDER BY id', [req.user.id]);
  res.json(rows.map(mapRow));
});

// GET /api/profiles/:id
router.get('/:id', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM profiles WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'Perfil não encontrado.' });
  res.json(mapRow(rows[0]));
});

// POST /api/profiles
router.post('/', requireAuth, async (req, res) => {
  const { name, avatarUrl, role } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });

  const [dup] = await db.query('SELECT id FROM profiles WHERE user_id = ? AND LOWER(name) = LOWER(?)', [req.user.id, name]);
  if (dup.length) return res.status(409).json({ error: 'Já tem um perfil com esse nome.' });

  const [result] = await db.query(
    'INSERT INTO profiles (user_id, name, avatar_url, role) VALUES (?, ?, ?, ?)',
    [req.user.id, name, avatarUrl || '', role || 'USER']
  );
  const [rows] = await db.query('SELECT * FROM profiles WHERE id = ?', [result.insertId]);
  res.status(201).json(mapRow(rows[0]));
});

// PUT /api/profiles/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { name, avatarUrl } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });

  const [dup] = await db.query(
    'SELECT id FROM profiles WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id != ?',
    [req.user.id, name, req.params.id]
  );
  if (dup.length) return res.status(409).json({ error: 'Já tem um perfil com esse nome.' });

  const [result] = await db.query(
    'UPDATE profiles SET name = ?, avatar_url = ? WHERE id = ? AND user_id = ?',
    [name, avatarUrl || '', req.params.id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Perfil não encontrado.' });

  const [rows] = await db.query('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
  res.json(mapRow(rows[0]));
});

// DELETE /api/profiles/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const [result] = await db.query('DELETE FROM profiles WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Perfil não encontrado.' });
  res.status(204).send();
});

module.exports = router;
