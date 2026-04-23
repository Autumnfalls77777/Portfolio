const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

// ── POST /api/contacts (public form submit) ───────────────────────────
router.post('/', async (req, res) => {
  try {
    let { name = '', email = '', subject = '', message = '' } = req.body;
    name    = name.trim();
    email   = email.trim();
    subject = subject.trim();
    message = message.trim();

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }

    // Rate limiting: max 5 per IP per hour
    const ip = (req.headers['x-forwarded-for'] || req.ip || '0.0.0.0').split(',')[0].trim();
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as cnt FROM contacts WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
      [ip]
    );
    if (countRows[0].cnt >= 5) {
      return res.status(429).json({ success: false, error: 'Too many submissions. Please try again later.' });
    }

    await pool.query(
      'INSERT INTO contacts (name, email, subject, message, is_read, created_at, ip_address) VALUES (?, ?, ?, ?, 0, NOW(), ?)',
      [name, email, subject, message, ip]
    );

    res.status(201).json({ success: true, data: { message: 'Message sent successfully! I will get back to you soon.' } });
  } catch (err) {
    console.error('Contacts POST error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── GET /api/contacts (admin) ─────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const onlyUnread = req.query.unread === '1';
    const sql = onlyUnread
      ? 'SELECT * FROM contacts WHERE is_read=0 ORDER BY created_at DESC'
      : 'SELECT * FROM contacts ORDER BY created_at DESC';
    const [rows] = await pool.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Contacts GET error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── PUT /api/contacts/:id/read (admin - mark read/unread) ─────────────
router.put('/:id/read', requireAdmin, async (req, res) => {
  try {
    const id    = parseInt(req.params.id);
    const value = req.body.is_read ? 1 : 0;
    await pool.query('UPDATE contacts SET is_read=? WHERE id=?', [value, id]);
    res.json({ success: true, data: { message: 'Contact updated.' } });
  } catch (err) {
    console.error('Contacts PUT error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── DELETE /api/contacts/:id (admin) ──────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('DELETE FROM contacts WHERE id=?', [id]);
    res.json({ success: true, data: { message: 'Contact deleted.' } });
  } catch (err) {
    console.error('Contacts DELETE error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
