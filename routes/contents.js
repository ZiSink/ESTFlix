'use strict';
const express = require('express');
const db      = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  next();
}

function mapRow(row) {
  const cast = Array.isArray(row.cast) ? row.cast
    : (typeof row.cast === 'string' ? JSON.parse(row.cast || '[]') : []);
  return {
    id:             row.id,
    title:          row.title,
    description:    row.description,
    categoryId:     row.category_id,
    year:           row.year,
    rating:         Number(row.rating),
    imageUrl:       row.image_url,
    type:           row.type,
    runtimeMinutes: row.runtime_minutes,
    cast,
    tagline:        row.tagline,
    trailerUrl:     row.trailer_url
  };
}

router.get('/', async (req, res) => {
  let sql = 'SELECT * FROM contents WHERE 1=1';
  const params = [];
  if (req.query.type)     { sql += ' AND type = ?';                       params.push(req.query.type); }
  if (req.query.category) { sql += ' AND category_id = ?';                params.push(req.query.category); }
  if (req.query.q)        { sql += ' AND LOWER(title) LIKE ?';            params.push(`%${req.query.q.toLowerCase()}%`); }
  sql += ' ORDER BY rating DESC';
  const [rows] = await db.query(sql, params);
  res.json(rows.map(mapRow));
});

router.get('/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM contents WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Conteúdo não encontrado.' });
  res.json(mapRow(rows[0]));
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description, categoryId, year, rating, imageUrl, type, runtimeMinutes, cast, tagline, trailerUrl } = req.body;
  if (!title || !description || !imageUrl)
    return res.status(400).json({ error: 'Título, descrição e imageUrl são obrigatórios.' });

  const [dup] = await db.query('SELECT id FROM contents WHERE LOWER(title) = LOWER(?)', [title]);
  if (dup.length) return res.status(409).json({ error: 'Já existe um conteúdo com este título.' });

  const [result] = await db.query(
    'INSERT INTO contents (title, description, category_id, year, rating, image_url, type, runtime_minutes, cast, tagline, trailer_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [title, description, categoryId || null, year || null, rating || null, imageUrl,
     type || 'movie', runtimeMinutes || null, JSON.stringify(cast || []), tagline || '', trailerUrl || null]
  );
  const [rows] = await db.query('SELECT * FROM contents WHERE id = ?', [result.insertId]);
  res.status(201).json(mapRow(rows[0]));
});

router.put('/:id', requireAuth, async (req, res) => {
  const { title, description, categoryId, year, rating, imageUrl, type, runtimeMinutes, cast, tagline, trailerUrl } = req.body;
  if (!title || !description || !imageUrl)
    return res.status(400).json({ error: 'Título, descrição e imageUrl são obrigatórios.' });

  const [dup] = await db.query('SELECT id FROM contents WHERE LOWER(title) = LOWER(?) AND id != ?', [title, req.params.id]);
  if (dup.length) return res.status(409).json({ error: 'Já existe um conteúdo com este título.' });

  const [result] = await db.query(
    'UPDATE contents SET title=?, description=?, category_id=?, year=?, rating=?, image_url=?, type=?, runtime_minutes=?, cast=?, tagline=?, trailer_url=? WHERE id=?',
    [title, description, categoryId || null, year || null, rating || null, imageUrl,
     type || 'movie', runtimeMinutes || null, JSON.stringify(cast || []), tagline || '', trailerUrl || null, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Conteúdo não encontrado.' });

  const [rows] = await db.query('SELECT * FROM contents WHERE id = ?', [req.params.id]);
  res.json(mapRow(rows[0]));
});

router.delete('/:id', requireAuth, async (req, res) => {
  const [result] = await db.query('DELETE FROM contents WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Conteúdo não encontrado.' });
  res.status(204).send();
});

module.exports = router;
