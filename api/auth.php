<?php
// ============================================================
//  Auth API — Login / Logout / Session Check
//  POST /api/auth.php?action=login
//  POST /api/auth.php?action=logout
//  GET  /api/auth.php?action=check
// ============================================================
require_once __DIR__ . '/../config/db.php';
startSession();

$action = $_GET['action'] ?? '';

switch ($action) {

    // ----------------------------------------------------------
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonError('Method not allowed.', 405);
        }

        $body     = json_decode(file_get_contents('php://input'), true) ?? [];
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';

        if (!$username || !$password) {
            jsonError('Username/email and password are required.');
        }

        $db  = getDB();
        $sql = 'SELECT id, username, email, password, role FROM admins WHERE username = ? OR email = ? LIMIT 1';
        $st  = $db->prepare($sql);
        $st->execute([$username, $username]);
        $admin = $st->fetch();

        if (!$admin || !password_verify($password, $admin['password'])) {
            jsonError('Invalid credentials.', 401);
        }

        // Regenerate session to prevent fixation
        session_regenerate_id(true);
        $_SESSION['admin_id']   = $admin['id'];
        $_SESSION['admin_name'] = $admin['username'];
        $_SESSION['admin_role'] = $admin['role'];

        jsonSuccess([
            'id'       => $admin['id'],
            'username' => $admin['username'],
            'email'    => $admin['email'],
            'role'     => $admin['role'],
        ]);

    // ----------------------------------------------------------
    case 'logout':
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $p['path'], $p['domain'], $p['secure'], $p['httponly']
            );
        }
        session_destroy();
        jsonSuccess(['message' => 'Logged out successfully.']);

    // ----------------------------------------------------------
    case 'check':
        if (!empty($_SESSION['admin_id'])) {
            jsonSuccess([
                'logged_in' => true,
                'id'        => $_SESSION['admin_id'],
                'username'  => $_SESSION['admin_name'],
                'role'      => $_SESSION['admin_role'],
            ]);
        } else {
            jsonSuccess(['logged_in' => false]);
        }

    // ----------------------------------------------------------
    default:
        jsonError('Unknown action.', 404);
}
