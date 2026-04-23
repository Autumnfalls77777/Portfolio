require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────────────
// Allow the frontend origin with credentials (cookies/sessions)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5500',   // VS Code Live Server
  'http://127.0.0.1:5500',  // VS Code Live Server (IP)
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'null', // file:// protocol (opening index.html directly)
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true); // permissive for local dev; restrict in production
  },
  credentials: true,
}));

// ── Body parsers ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session ───────────────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'portfolio_secret_key',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   false,  // set true in production with HTTPS
    httpOnly: true,
    maxAge:   24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
}));

// ── Static: serve uploaded files ──────────────────────────────────────
// Files saved to ../uploads/ are publicly available at /uploads/
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API Routes ────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/settings',     require('./routes/settings'));
app.use('/api/projects',     require('./routes/projects'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/skills',       require('./routes/skills'));
app.use('/api/experience',   require('./routes/experience'));
app.use('/api/social',       require('./routes/social'));
app.use('/api/contacts',     require('./routes/contacts'));

// ── Health check ──────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Portfolio API running', port: PORT });
});

// ── 404 catch-all ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
});

// ── Global error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Portfolio API running → http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Press Ctrl+C to stop\n`);
});
