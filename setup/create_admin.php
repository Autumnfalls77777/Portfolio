<?php
// ============================================================
//  Create Admin Account — Run this ONCE via browser or CLI
//  Usage: php setup/create_admin.php
//  Or visit: http://localhost/portfolio/setup/create_admin.php
// ============================================================
require_once __DIR__ . '/../config/db.php';

$username = 'admin';
$email    = 'prabaljaiswal69420@gmail.com';
$password = 'gamingwithprabal@123'; // Change this!
$role     = 'admin';

$hashed = password_hash($password, PASSWORD_BCRYPT);
$db     = getDB();

// Check if admin exists
$st = $db->prepare('SELECT id FROM admins WHERE username = ? OR email = ?');
$st->execute([$username, $email]);

if ($st->fetch()) {
    // Update password
    $db->prepare('UPDATE admins SET password = ?, role = ? WHERE username = ? OR email = ?')
       ->execute([$hashed, $role, $username, $email]);
    echo "✅ Admin password updated for: $username ($email)\n";
} else {
    $db->prepare('INSERT INTO admins (username, email, password, role, created_at) VALUES (?,?,?,?,NOW())')
       ->execute([$username, $email, $hashed, $role]);
    echo "✅ Admin account created: $username ($email)\n";
}

echo "🔒 Password hash: $hashed\n";
echo "\n⚠️  DELETE THIS FILE after running it!\n";
