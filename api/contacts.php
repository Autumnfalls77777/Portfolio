<?php
// ============================================================
//  Contacts API
//  POST   /api/contacts.php                   → submit form (public)
//  GET    /api/contacts.php                   → list all (admin)
//  POST   /api/contacts.php?id=1&action=read  → mark read (admin)
//  POST   /api/contacts.php?id=1&action=unread→ mark unread (admin)
//  DELETE /api/contacts.php?id=1              → delete (admin)
// ============================================================
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$action = $_GET['action'] ?? '';

// ---- POST ------------------------------------------------------
if ($method === 'POST') {

    // Admin actions: mark read/unread
    if ($id && ($action === 'read' || $action === 'unread')) {
        requireAdmin();
        $val = ($action === 'read') ? 1 : 0;
        $db->prepare('UPDATE contacts SET is_read=? WHERE id=?')->execute([$val, $id]);
        jsonSuccess(['message' => 'Contact updated.']);
    }

    // Public contact form submission
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    if (empty($body)) $body = $_POST;

    $name    = trim($body['name']    ?? '');
    $email   = trim($body['email']   ?? '');
    $subject = trim($body['subject'] ?? '');
    $message = trim($body['message'] ?? '');

    if (!$name || !$email || !$message) {
        jsonError('Name, email, and message are required.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonError('Invalid email address.');
    }

    // Sanitize
    $name    = htmlspecialchars($name,    ENT_QUOTES, 'UTF-8');
    $email   = htmlspecialchars($email,   ENT_QUOTES, 'UTF-8');
    $subject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
    $message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

    // Rate limiting: max 5 submissions per IP per hour
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $ip = explode(',', $ip)[0];

    $rateSt = $db->prepare('SELECT COUNT(*) FROM contacts WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
    $rateSt->execute([$ip]);
    if ((int)$rateSt->fetchColumn() >= 5) {
        jsonError('Too many submissions. Please try again later.', 429);
    }

    $db->prepare('INSERT INTO contacts (name, email, subject, message, is_read, created_at, ip_address)
                  VALUES (?,?,?,?,0,NOW(),?)')
       ->execute([$name, $email, $subject, $message, $ip]);

    jsonSuccess(['message' => 'Message sent successfully! I will get back to you soon.'], 201);
}

// ---- GET (admin only) ------------------------------------------
if ($method === 'GET') {
    requireAdmin();
    $onlyUnread = ($_GET['unread'] ?? '') === '1';
    $sql = $onlyUnread
        ? 'SELECT * FROM contacts WHERE is_read=0 ORDER BY created_at DESC'
        : 'SELECT * FROM contacts ORDER BY created_at DESC';
    $rows = $db->query($sql)->fetchAll();
    jsonSuccess($rows);
}

// ---- DELETE (admin only) ---------------------------------------
if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) jsonError('Contact ID required.');
    $db->prepare('DELETE FROM contacts WHERE id=?')->execute([$id]);
    jsonSuccess(['message' => 'Contact deleted.']);
}

jsonError('Method not allowed.', 405);
