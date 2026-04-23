const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

// ── GET /api/skills ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM skills ORDER BY category, skill_name');
    const grouped = {};
    rows.forEach(row => {
      const cat = row.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ id: row.id, skill_name: row.skill_name, category: row.category, proficiency: row.proficiency });
    });
    res.json({ success: true, data: { skills: rows, grouped } });
  } catch (err) {
    console.error('Skills GET error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── POST /api/skills (create) ─────────────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { skill_name = '', category = '', proficiency = 0 } = req.body;
    if (!skill_name) return res.status(400).json({ success: false, error: 'Skill name is required.' });
    const prof = Math.min(100, Math.max(0, parseInt(proficiency) || 0));
    const [result] = await pool.query(
      'INSERT INTO skills (skill_name, category, proficiency, created_at) VALUES (?, ?, ?, NOW())',
      [skill_name, category, prof]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, message: 'Skill added.' } });
  } catch (err) {
    console.error('Skills POST error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── PUT /api/skills/:id (update) ──────────────────────────────────────
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { skill_name = '', category = '', proficiency = 0 } = req.body;
    if (!skill_name) return res.status(400).json({ success: false, error: 'Skill name is required.' });
    const prof = Math.min(100, Math.max(0, parseInt(proficiency) || 0));
    await pool.query(
      'UPDATE skills SET skill_name=?, category=?, proficiency=? WHERE id=?',
      [skill_name, category, prof, id]
    );
    res.json({ success: true, data: { message: 'Skill updated.' } });
  } catch (err) {
    console.error('Skills PUT error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── DELETE /api/skills/:id ────────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('DELETE FROM skills WHERE id=?', [id]);
    res.json({ success: true, data: { message: 'Skill deleted.' } });
  } catch (err) {
    console.error('Skills DELETE error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
