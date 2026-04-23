const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { requireAdmin }             = require('../middleware/auth');
const { createUploader, deleteFile } = require('../middleware/upload');

const upload = createUploader('profile');

// ── GET /api/settings ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1 LIMIT 1');
    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          full_name: 'Prabal Jaiswal',
          hero_title: 'Graphic Designer · Server Admin · Game Dev',
          hero_subtitle: 'Crafting Digital Experiences with Code & Creativity',
          about_text: 'Passionate creator building at the intersection of design, code, and gaming.',
          profile_image: '', github: '', linkedin: '', resume_link: '',
        },
      });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Settings GET error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── POST /api/settings (admin) ────────────────────────────────────────
router.post('/', requireAdmin, upload.single('profile_image'), async (req, res) => {
  try {
    const { full_name = '', hero_title = '', hero_subtitle = '', about_text = '', github = '', linkedin = '', resume_link = '' } = req.body;

    let profile_image = req.body.profile_image || '';
    if (req.file) {
      profile_image = `uploads/profile/${req.file.filename}`;
    }

    const [exists] = await pool.query('SELECT id, profile_image FROM settings WHERE id = 1');

    if (exists.length > 0) {
      const old = exists[0];
      if (profile_image && profile_image !== old.profile_image && old.profile_image) {
        deleteFile(old.profile_image);
      }
      if (!profile_image) profile_image = old.profile_image || '';
      await pool.query(
        `UPDATE settings SET full_name=?, hero_title=?, hero_subtitle=?, about_text=?,
         profile_image=?, github=?, linkedin=?, resume_link=?, updated_at=NOW() WHERE id=1`,
        [full_name || old.full_name, hero_title, hero_subtitle, about_text, profile_image, github, linkedin, resume_link]
      );
    } else {
      await pool.query(
        `INSERT INTO settings (id, full_name, hero_title, hero_subtitle, about_text, profile_image, github, linkedin, resume_link)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [full_name, hero_title, hero_subtitle, about_text, profile_image, github, linkedin, resume_link]
      );
    }

    const [updated] = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error('Settings POST error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
