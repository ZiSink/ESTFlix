'use strict';
const express = require('express');
const db      = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  next();
}

function mapRow(r) {
  return { profileId: r.profile_id, contentId: r.content_id, watchedAt: r.watched_at, times: r.times };
}

function mapContent(r) {
  return {
    id: r.id, title: r.title, description: r.description,
    categoryId: r.category_id, year: r.year,
    rating: typeof r.rating === 'string' ? parseFloat(r.rating) : r.rating,
    imageUrl: r.image_url, type: r.type,
    runtimeMinutes: r.runtime_minutes,
    cast: typeof r.cast === 'string' ? JSON.parse(r.cast) : (r.cast ?? []),
    tagline: r.tagline, trailerUrl: r.trailer_url
  };
}

// GET /api/history/recommendations?profileId=
// Deve estar antes de /:profileId para não ser capturado pelo param
router.get('/recommendations', requireAuth, async (req, res) => {
  const profileId = req.query.profileId || req.session.activeProfileId;
  if (!profileId) return res.json([]);

  // Géneros mais vistos pelo perfil
  const [genreRows] = await db.query(`
    SELECT c.category_id, COUNT(*) AS cnt
    FROM history h
    JOIN contents c ON c.id = h.content_id
    WHERE h.profile_id = ?
    GROUP BY c.category_id
    ORDER BY cnt DESC
    LIMIT 3
  `, [profileId]);

  if (!genreRows.length) {
    // Sem histórico – devolver os mais bem classificados
    const [top] = await db.query('SELECT * FROM contents ORDER BY rating DESC LIMIT 6');
    return res.json(top.map(mapContent));
  }

  const catIds     = genreRows.map(r => r.category_id);
  const [histRows] = await db.query('SELECT content_id FROM history WHERE profile_id = ?', [profileId]);
  const watchedIds = histRows.map(r => r.content_id);

  const inCats = catIds.map(() => '?').join(',');
  let sql    = `SELECT * FROM contents WHERE category_id IN (${inCats})`;
  let params = [...catIds];

  if (watchedIds.length) {
    sql    += ` AND id NOT IN (${watchedIds.map(() => '?').join(',')})`;
    params  = [...params, ...watchedIds];
  }
  sql += ' ORDER BY rating DESC LIMIT 6';

  const [rows] = await db.query(sql, params);
  // Completar com tops caso faltem resultados
  if (rows.length < 3) {
    const [extra] = await db.query(
      'SELECT * FROM contents ORDER BY rating DESC LIMIT 6'
    );
    const existingIds = new Set(rows.map(r => r.id));
    for (const r of extra) {
      if (!existingIds.has(r.id)) rows.push(r);
      if (rows.length >= 6) break;
    }
  }
  res.json(rows.map(mapContent));
});

// GET /api/history?profileId=
router.get('/', requireAuth, async (req, res) => {
  const profileId = req.query.profileId || req.session.activeProfileId;
  if (!profileId) return res.json([]);
  const [rows] = await db.query(
    'SELECT * FROM history WHERE profile_id = ? ORDER BY watched_at DESC', [profileId]
  );
  res.json(rows.map(mapRow));
});

// POST /api/history
router.post('/', requireAuth, async (req, res) => {
  const { profileId, contentId } = req.body;
  if (!profileId || !contentId)
    return res.status(400).json({ error: 'profileId e contentId são obrigatórios.' });

  await db.query(
    'INSERT INTO history (profile_id, content_id, times, watched_at) VALUES (?, ?, 1, NOW()) ON DUPLICATE KEY UPDATE times = times + 1, watched_at = NOW()',
    [profileId, contentId]
  );
  const [rows] = await db.query('SELECT * FROM history WHERE profile_id = ? AND content_id = ?', [profileId, contentId]);
  res.status(201).json(mapRow(rows[0]));
});

// DELETE /api/history/:profileId/:contentId
router.delete('/:profileId/:contentId', requireAuth, async (req, res) => {
  await db.query('DELETE FROM history WHERE profile_id = ? AND content_id = ?',
    [req.params.profileId, req.params.contentId]);
  res.status(204).send();
});

module.exports = router;
