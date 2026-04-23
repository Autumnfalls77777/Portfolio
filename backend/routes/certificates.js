const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { requireAdmin }               = require('../middleware/auth');
const { createUploader, deleteFile } = require('../middleware/upload');

const upload = createUploader('certificates');

function normCert(r) {
  return {
    id:              r.id,
    title:           r.title,
    issuer:          r.issuer          || '',
    issue_date:      r.issue_date      || '',
    image:           r.image           || '',
    category:        r.category        || 'college',
    credential_link: r.credential_link || '',
    created_at:      r.created_at      || '',
    // Frontend aliases
    imageUrl: r.image      || '',
    date:     r.issue_date || '',
  };
}

// ── GET /api/certificates ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { id, category } = req.query;
    if (id) {
      const [rows] = await pool.query('SELECT * FROM certificates WHERE id = ? LIMIT 1', [id]);
      if (!rows.length) return res.status(404).json({ success: false, error: 'Certificate not found.' });
      return res.json({ success: true, data: normCert(rows[0]) });
    }
    let rows;
    if (category) {
      [rows] = await pool.query('SELECT * FROM certificates WHERE category = ? ORDER BY issue_date DESC, created_at DESC', [category]);
    } else {
      [rows] = await pool.query('SELECT * FROM certificates ORDER BY issue_date DESC, created_at DESC');
    }
    res.json({ success: true, data: rows.map(normCert) });
  } catch (err) {
    console.error('Certificates GET error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── POST /api/certificates (create or update) ─────────────────────────
router.post('/:id?', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const id = req.params.id ? parseInt(req.params.id) : null;
    const { title = '', issuer = '', issue_date = '', category = 'college', credential_link = '' } = req.body;

    let image = req.body.image || '';
    if (req.file) image = `uploads/certificates/${req.file.filename}`;

    if (id) {
      const [existing] = await pool.query('SELECT * FROM certificates WHERE id = ?', [id]);
      if (!existing.length) return res.status(404).json({ success: false, error: 'Certificate not found.' });
      const old = existing[0];
      if (!image) image = old.image || '';
      if (image && image !== old.image && old.image) deleteFile(old.image);
      await pool.query(
        `UPDATE certificates SET title=?, issuer=?, issue_date=?, image=?, category=?, credential_link=? WHERE id=?`,
        [title || old.title, issuer, issue_date || null, image, category, credential_link, id]
      );
      const [updated] = await pool.query('SELECT * FROM certificates WHERE id = ?', [id]);
      return res.json({ success: true, data: normCert(updated[0]) });
    }

    if (!title) return res.status(400).json({ success: false, error: 'Title is required.' });
    const [result] = await pool.query(
      `INSERT INTO certificates (title, issuer, issue_date, image, category, credential_link, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [title, issuer, issue_date || null, image, category, credential_link]
    );
    const [created] = await pool.query('SELECT * FROM certificates WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: normCert(created[0]) });
  } catch (err) {
    console.error('Certificates POST error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── DELETE /api/certificates/:id ──────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT image FROM certificates WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Certificate not found.' });
    deleteFile(rows[0].image || '');
    await pool.query('DELETE FROM certificates WHERE id = ?', [id]);
    res.json({ success: true, data: { message: 'Certificate deleted.' } });
  } catch (err) {
    console.error('Certificates DELETE error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
