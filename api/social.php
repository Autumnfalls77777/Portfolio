<?php
// ============================================================
//  Social Links API
//  GET    /api/social.php          → all active links (public)
//  GET    /api/social.php?all=1    → all links (admin)
//  POST   /api/social.php          → create (admin)
//  POST   /api/social.php?id=1     → update (admin)
//  DELETE /api/social.php?id=1     → delete (admin)
// ============================================================
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

if ($method === 'GET') {
    $showAll = isset($_GET['all']) && $_GET['all'] === '1';
    if ($showAll) {
        requireAdmin();
        $rows = $db->query('SELECT * FROM social_links ORDER BY platform')->fetchAll();
    } else {
        $rows = $db->query('SELECT * FROM social_links WHERE is_active=1 ORDER BY platform')->fetchAll();
    }
    jsonSuccess($rows);
}

if ($method === 'POST') {
    requireAdmin();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    if (empty($body)) $body = $_POST;

    $platform   = trim($body['platform']   ?? '');
    $url        = trim($body['url']        ?? '');
    $icon_class = trim($body['icon_class'] ?? '');
    $is_active  = (int)($body['is_active'] ?? 1);

    if (!$platform || !$url) jsonError('Platform and URL are required.');

    if ($id) {
        // UPDATE
        $db->prepare('UPDATE social_links SET platform=?, url=?, icon_class=?, is_active=? WHERE id=?')
           ->execute([$platform, $url, $icon_class, $is_active, $id]);
        jsonSuccess(['message' => 'Social link updated.']);
    }

    // CREATE
    $db->prepare('INSERT INTO social_links (platform, url, icon_class, is_active, created_at) VALUES (?,?,?,?,NOW())')
       ->execute([$platform, $url, $icon_class, $is_active]);
    jsonSuccess(['id' => (int)$db->lastInsertId(), 'message' => 'Social link added.'], 201);
}

if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) jsonError('Link ID required.');
    $db->prepare('DELETE FROM social_links WHERE id=?')->execute([$id]);
    jsonSuccess(['message' => 'Social link deleted.']);
}

jsonError('Method not allowed.', 405);
