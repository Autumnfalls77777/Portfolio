const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'portfolio_jwt_secret_fallback';

/**
 * requireAdmin middleware
 * Checks JWT Bearer token first, then falls back to session cookie.
 */
function requireAdmin(req, res, next) {
  // 1. Check Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = decoded;
      return next();
    } catch (e) {
      // Token invalid — don't fall through, reject immediately if header was provided
      return res.status(401).json({ success: false, error: 'Unauthorized. Invalid or expired token.' });
    }
  }

  // 2. Fallback: session cookie
  if (req.session && req.session.admin_id) {
    req.admin = { id: req.session.admin_id, username: req.session.admin_name, role: req.session.admin_role };
    return next();
  }

  return res.status(401).json({ success: false, error: 'Unauthorized. Please login.' });
}

module.exports = { requireAdmin };
