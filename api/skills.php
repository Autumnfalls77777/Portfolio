<?php
// ============================================================
//  Skills API
//  GET    /api/skills.php          → all skills (grouped)
//  POST   /api/skills.php          → create (admin)
//  POST   /api/skills.php?id=1     → update (admin)
//  DELETE /api/skills.php?id=1     → delete (admin)
// ============================================================
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

if ($method === 'GET') {
    $rows = $db->query('SELECT * FROM skills ORDER BY category, skill_name')->fetchAll();

    // Group by category
    $grouped = [];
    foreach ($rows as $row) {
        $cat = $row['category'] ?: 'Other';
        if (!isset($grouped[$cat])) $grouped[$cat] = [];
        $grouped[$cat][] = [
            'id'          => (int)$row['id'],
            'skill_name'  => $row['skill_name'],
            'category'    => $row['category'],
            'proficiency' => (int)$row['proficiency'],
        ];
    }

    jsonSuccess(['skills' => $rows, 'grouped' => $grouped]);
}

if ($method === 'POST') {
    requireAdmin();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    if (empty($body)) $body = $_POST;

    $skill_name  = trim($body['skill_name']  ?? '');
    $category    = trim($body['category']    ?? '');
    $proficiency = (int)($body['proficiency'] ?? 0);

    if (!$skill_name) jsonError('Skill name is required.');

    if ($id) {
        // UPDATE
        $db->prepare('UPDATE skills SET skill_name=?, category=?, proficiency=? WHERE id=?')
           ->execute([$skill_name, $category, min(100, max(0, $proficiency)), $id]);
        jsonSuccess(['message' => 'Skill updated.']);
    }

    // CREATE
    $db->prepare('INSERT INTO skills (skill_name, category, proficiency, created_at) VALUES (?,?,?,NOW())')
       ->execute([$skill_name, $category, min(100, max(0, $proficiency))]);

    jsonSuccess(['id' => (int)$db->lastInsertId(), 'message' => 'Skill added.'], 201);
}

if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) jsonError('Skill ID required.');
    $db->prepare('DELETE FROM skills WHERE id=?')->execute([$id]);
    jsonSuccess(['message' => 'Skill deleted.']);
}

jsonError('Method not allowed.', 405);
