'use strict';
const express = require('express');
const db      = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  next();
}

router.get('/', requireAuth, async (req, res) => {
  const profileId = req.query.profileId || req.session.activeProfileId;
  if (!profileId) return res.json([]);
  const [rows] = await db.query('SELECT * FROM favorites WHERE profile_id = ?', [profileId]);
  res.json(rows.map(r => ({ profileId: r.profile_id, contentId: r.content_id })));
});

router.post('/', requireAuth, async (req, res) => {
  const { profileId, contentId } = req.body;
  if (!profileId || !contentId)
    return res.status(400).json({ error: 'profileId e contentId são obrigatórios.' });
  await db.query('INSERT IGNORE INTO favorites (profile_id, content_id) VALUES (?, ?)', [profileId, contentId]);
  res.status(201).json({ profileId, contentId });
});

router.delete('/:profileId/:contentId', requireAuth, async (req, res) => {
  await db.query('DELETE FROM favorites WHERE profile_id = ? AND content_id = ?',
    [req.params.profileId, req.params.contentId]);
  res.status(204).send();
});

module.exports = router;
