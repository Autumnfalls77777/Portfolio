const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { requireAdmin }               = require('../middleware/auth');
const { createUploader, deleteFile } = require('../middleware/upload');

const upload = createUploader('projects');

function normProject(r) {
  const ts = (r.tech_stack || '').split(',').map(s => s.trim()).filter(Boolean);
  return {
    id:          r.id,
    title:       r.title,
    description: r.description || '',
    tech_stack:  r.tech_stack  || '',
    category:    r.category    || 'others',
    image:       r.image       || '',
    github_link: r.github_link || '',
    live_link:   r.live_link   || '',
    featured:    Boolean(r.featured),
    created_at:  r.created_at  || '',
    // Frontend aliases
    bannerUrl:       r.image || '',
    projectImageUrl: r.image || '',
    githubLink:      r.github_link || '',
    liveUrl:         r.live_link   || '',
    bullets:         [],
    techStack:       ts,
    codeSnippet:     '',
  };
}

// ── GET /api/projects ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { id, category } = req.query;
    if (id) {
      const [rows] = await pool.query('SELECT * FROM projects WHERE id = ? LIMIT 1', [id]);
      if (!rows.length) return res.status(404).json({ success: false, error: 'Project not found.' });
      return res.json({ success: true, data: normProject(rows[0]) });
    }
    let rows;
    if (category) {
      [rows] = await pool.query('SELECT * FROM projects WHERE category = ? ORDER BY featured DESC, created_at DESC', [category]);
    } else {
      [rows] = await pool.query('SELECT * FROM projects ORDER BY featured DESC, created_at DESC');
    }
    res.json({ success: true, data: rows.map(normProject) });
  } catch (err) {
    console.error('Projects GET error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── POST /api/projects  (create) ──────────────────────────────────────
// ── POST /api/projects/:id (update) ──────────────────────────────────
router.post('/:id?', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const id          = req.params.id ? parseInt(req.params.id) : null;
    const { title = '', description = '', tech_stack = '', category = 'others', github_link = '', live_link = '' } = req.body;
    const featured    = req.body.featured === '1' || req.body.featured === true ? 1 : 0;

    let image = req.body.image || '';
    if (req.file) image = `uploads/projects/${req.file.filename}`;

    if (id) {
      // UPDATE
      const [existing] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
      if (!existing.length) return res.status(404).json({ success: false, error: 'Project not found.' });
      const old = existing[0];
      if (!image) image = old.image || '';
      if (image && image !== old.image && old.image) deleteFile(old.image);
      await pool.query(
        `UPDATE projects SET title=?, description=?, tech_stack=?, category=?,
         image=?, github_link=?, live_link=?, featured=? WHERE id=?`,
        [title || old.title, description, tech_stack, category, image, github_link, live_link, featured, id]
      );
      const [updated] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
      return res.json({ success: true, data: normProject(updated[0]) });
    }

    // CREATE
    if (!title) return res.status(400).json({ success: false, error: 'Title is required.' });
    const [result] = await pool.query(
      `INSERT INTO projects (title, description, tech_stack, category, image, github_link, live_link, featured, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, description, tech_stack, category, image, github_link, live_link, featured]
    );
    const [created] = await pool.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: normProject(created[0]) });
  } catch (err) {
    console.error('Projects POST error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── DELETE /api/projects/:id ──────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT image FROM projects WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Project not found.' });
    deleteFile(rows[0].image || '');
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ success: true, data: { message: 'Project deleted.' } });
  } catch (err) {
    console.error('Projects DELETE error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
