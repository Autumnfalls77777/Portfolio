const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

// ── GET /api/experience ───────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM experience ORDER BY is_current DESC, created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Experience GET error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── POST /api/experience (create) ─────────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { company = '', role = '', duration = '', description = '', location = '', is_current = 0 } = req.body;
    if (!company || !role) return res.status(400).json({ success: false, error: 'Company and role are required.' });
    const [result] = await pool.query(
      `INSERT INTO experience (company, role, duration, description, location, is_current, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [company, role, duration, description, location, is_current ? 1 : 0]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, message: 'Experience added.' } });
  } catch (err) {
    console.error('Experience POST error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── PUT /api/experience/:id (update) ──────────────────────────────────
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { company = '', role = '', duration = '', description = '', location = '', is_current = 0 } = req.body;
    if (!company || !role) return res.status(400).json({ success: false, error: 'Company and role are required.' });
    await pool.query(
      `UPDATE experience SET company=?, role=?, duration=?, description=?, location=?, is_current=? WHERE id=?`,
      [company, role, duration, description, location, is_current ? 1 : 0, id]
    );
    res.json({ success: true, data: { message: 'Experience updated.' } });
  } catch (err) {
    console.error('Experience PUT error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── DELETE /api/experience/:id ────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('DELETE FROM experience WHERE id=?', [id]);
    res.json({ success: true, data: { message: 'Experience deleted.' } });
  } catch (err) {
    console.error('Experience DELETE error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
