'use strict';
const express = require('express');
const db      = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  next();
}

// GET /api/categories
router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
  res.json(rows);
});

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Categoria não encontrada.' });
  res.json(rows[0]);
});

// POST /api/categories
router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });

  const [dup] = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [name]);
  if (dup.length) return res.status(409).json({ error: 'Categoria já existe.' });

  const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
  const [rows]   = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

// PUT /api/categories/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });

  const [dup] = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?', [name, req.params.id]);
  if (dup.length) return res.status(409).json({ error: 'Nome já em uso.' });

  const [result] = await db.query('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Categoria não encontrada.' });

  const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

// DELETE /api/categories/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const [inUse] = await db.query('SELECT id FROM contents WHERE category_id = ? LIMIT 1', [req.params.id]);
  if (inUse.length)
    return res.status(409).json({ error: 'Remova primeiro os conteúdos desta categoria.' });

  const [result] = await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Categoria não encontrada.' });
  res.status(204).send();
});

module.exports = router;
