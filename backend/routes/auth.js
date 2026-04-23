const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'portfolio_jwt_secret_fallback';
const JWT_EXPIRES = '7d';

// ── POST /api/auth/login ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username/email and password are required.' });
    }

    const [rows] = await pool.query(
      'SELECT id, username, email, password, role FROM admins WHERE username = ? OR email = ? LIMIT 1',
      [username, username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    // Set session (for same-origin setups)
    req.session.admin_id   = admin.id;
    req.session.admin_name = admin.username;
    req.session.admin_role = admin.role;

    // Also issue a JWT token (works reliably cross-origin)
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      data: {
        id:       admin.id,
        username: admin.username,
        email:    admin.email,
        role:     admin.role,
        token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true, data: { message: 'Logged out successfully.' } });
  });
});

// ── GET /api/auth/check ───────────────────────────────────────────────
router.get('/check', (req, res) => {
  // 1. Try JWT from Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.json({
        success: true,
        data: { logged_in: true, id: decoded.id, username: decoded.username, role: decoded.role },
      });
    } catch (e) { /* token invalid, fall through */ }
  }

  // 2. Fallback: session cookie
  if (req.session && req.session.admin_id) {
    return res.json({
      success: true,
      data: { logged_in: true, id: req.session.admin_id, username: req.session.admin_name, role: req.session.admin_role },
    });
  }

  res.json({ success: true, data: { logged_in: false } });
});

// ── POST /api/auth/change-credentials ────────────────────────────────
router.post('/change-credentials', async (req, res) => {
  const authHeader = req.headers['authorization'];
  let authed = false;
  let adminId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
      authed = true;
      adminId = decoded.id;
    } catch(e) {}
  }
  if (!authed && req.session && req.session.admin_id) {
    authed = true;
    adminId = req.session.admin_id;
  }
  if (!authed) return res.status(401).json({ success: false, error: 'Unauthorized. Please login.' });

  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required.' });
    const hash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE admins SET email = ?, password = ? WHERE id = ?', [email, hash, adminId]);
    res.json({ success: true, data: { message: 'Credentials updated.' } });
  } catch (err) {
    console.error('Change credentials error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
