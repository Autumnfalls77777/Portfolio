/**
 * Create/Reset Admin Account for the Portfolio Backend
 * =====================================================
 * Usage: node setup/create_admin.js
 *
 * Run this from the project root:
 *   cd portfolio
 *   node setup/create_admin.js
 */
require('dotenv').config({ path: __dirname + '/../backend/.env' });

const bcrypt = require(__dirname + '/../backend/node_modules/bcrypt');
const mysql  = require(__dirname + '/../backend/node_modules/mysql2/promise');

const USERNAME = 'admin';
const EMAIL    = 'prabaljaiswal69420@gmail.com'; // ← change if needed
const PASSWORD = 'gamingwithprabal@123';          // ← change in production!
const ROLE     = 'admin';

async function main() {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'portfolio',
  });

  const hash = await bcrypt.hash(PASSWORD, 12);
  const [rows] = await db.query('SELECT id FROM admins WHERE username = ? OR email = ?', [USERNAME, EMAIL]);

  if (rows.length > 0) {
    await db.query('UPDATE admins SET password = ?, role = ? WHERE username = ? OR email = ?', [hash, ROLE, USERNAME, EMAIL]);
    console.log(`✅ Admin password updated for: ${USERNAME} (${EMAIL})`);
  } else {
    await db.query(
      'INSERT INTO admins (username, email, password, role, created_at) VALUES (?,?,?,?,NOW())',
      [USERNAME, EMAIL, hash, ROLE]
    );
    console.log(`✅ Admin account created: ${USERNAME} (${EMAIL})`);
  }

  console.log(`\n🔑 You can now log in with:`);
  console.log(`   Username: ${USERNAME}  (or email: ${EMAIL})`);
  console.log(`   Password: ${PASSWORD}`);
  console.log(`\n⚠️  Change the password after first login!`);
  await db.end();
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
