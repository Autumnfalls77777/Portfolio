const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

// ── GET /api/social ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const showAll = req.query.all === '1';
    if (showAll) {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'portfolio_jwt_secret_fallback';
      let authed = false;
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try { jwt.verify(authHeader.slice(7), JWT_SECRET); authed = true; } catch(e) {}
      }
      if (!authed && req.session && req.session.admin_id) authed = true;
      if (!authed) return res.status(401).json({ success: false, error: 'Unauthorized.' });
      const [rows] = await pool.query('SELECT * FROM social_links ORDER BY platform');
      return res.json({ success: true, data: rows });
    }
    const [rows] = await pool.query('SELECT * FROM social_links WHERE is_active=1 ORDER BY platform');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Social GET error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── POST /api/social (create) ─────────────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { platform = '', url = '', icon_class = '', is_active = 1 } = req.body;
    if (!platform || !url) return res.status(400).json({ success: false, error: 'Platform and URL are required.' });
    const [result] = await pool.query(
      'INSERT INTO social_links (platform, url, icon_class, is_active, created_at) VALUES (?, ?, ?, ?, NOW())',
      [platform, url, icon_class, is_active ? 1 : 0]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, message: 'Social link added.' } });
  } catch (err) {
    console.error('Social POST error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── PUT /api/social/:id (update) ──────────────────────────────────────
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { platform = '', url = '', icon_class = '', is_active = 1 } = req.body;
    if (!platform || !url) return res.status(400).json({ success: false, error: 'Platform and URL are required.' });
    await pool.query(
      'UPDATE social_links SET platform=?, url=?, icon_class=?, is_active=? WHERE id=?',
      [platform, url, icon_class, is_active ? 1 : 0, id]
    );
    res.json({ success: true, data: { message: 'Social link updated.' } });
  } catch (err) {
    console.error('Social PUT error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── DELETE /api/social/:id ────────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('DELETE FROM social_links WHERE id=?', [id]);
    res.json({ success: true, data: { message: 'Social link deleted.' } });
  } catch (err) {
    console.error('Social DELETE error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
