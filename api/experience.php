<?php
// ============================================================
//  Experience API
//  GET    /api/experience.php          → all experience
//  POST   /api/experience.php          → create (admin)
//  POST   /api/experience.php?id=1     → update (admin)
//  DELETE /api/experience.php?id=1     → delete (admin)
// ============================================================
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

if ($method === 'GET') {
    $rows = $db->query('SELECT * FROM experience ORDER BY is_current DESC, created_at DESC')->fetchAll();
    jsonSuccess($rows);
}

if ($method === 'POST') {
    requireAdmin();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    if (empty($body)) $body = $_POST;

    $company     = trim($body['company']     ?? '');
    $role        = trim($body['role']        ?? '');
    $duration    = trim($body['duration']    ?? '');
    $description = trim($body['description'] ?? '');
    $location    = trim($body['location']    ?? '');
    $is_current  = (int)($body['is_current'] ?? 0);

    if (!$company || !$role) jsonError('Company and role are required.');

    if ($id) {
        // UPDATE
        $db->prepare('UPDATE experience SET company=?, role=?, duration=?, description=?, location=?, is_current=? WHERE id=?')
           ->execute([$company, $role, $duration, $description, $location, $is_current, $id]);
        jsonSuccess(['message' => 'Experience updated.']);
    }

    // CREATE
    $db->prepare('INSERT INTO experience (company, role, duration, description, location, is_current, created_at)
                  VALUES (?,?,?,?,?,?,NOW())')
       ->execute([$company, $role, $duration, $description, $location, $is_current]);
    jsonSuccess(['id' => (int)$db->lastInsertId(), 'message' => 'Experience added.'], 201);
}

if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) jsonError('Experience ID required.');
    $db->prepare('DELETE FROM experience WHERE id=?')->execute([$id]);
    jsonSuccess(['message' => 'Experience deleted.']);
}

jsonError('Method not allowed.', 405);
