<?php
// ============================================================
//  Projects API
//  GET    /api/projects.php                → all projects
//  GET    /api/projects.php?category=coding → filtered
//  GET    /api/projects.php?id=1           → single
//  POST   /api/projects.php                → create (admin, multipart)
//  POST   /api/projects.php?id=1           → update (admin, multipart)
//  DELETE /api/projects.php?id=1           → delete (admin)
// ============================================================
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// ---- GET -------------------------------------------------------
if ($method === 'GET') {
    if ($id) {
        $st = $db->prepare('SELECT * FROM projects WHERE id = ? LIMIT 1');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) jsonError('Project not found.', 404);
        jsonSuccess(normProject($row));
    }

    $cat = $_GET['category'] ?? null;
    if ($cat) {
        $st = $db->prepare('SELECT * FROM projects WHERE category = ? ORDER BY featured DESC, created_at DESC');
        $st->execute([$cat]);
    } else {
        $st = $db->prepare('SELECT * FROM projects ORDER BY featured DESC, created_at DESC');
        $st->execute();
    }
    jsonSuccess(array_map('normProject', $st->fetchAll()));
}

// ---- POST (Create or Update) -----------------------------------
if ($method === 'POST') {
    requireAdmin();

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($contentType, 'application/json')) {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $body = $_POST;
    }

    $title       = trim($body['title']       ?? '');
    $description = trim($body['description'] ?? '');
    $tech_stack  = trim($body['tech_stack']  ?? '');
    $category    = trim($body['category']    ?? 'others');
    $github_link = trim($body['github_link'] ?? '');
    $live_link   = trim($body['live_link']   ?? '');
    $featured    = (int)($body['featured']   ?? 0);

    // Handle image upload
    $image = handleUpload('image', 'projects');
    if (!$image) $image = trim($body['image'] ?? '');

    if ($id) {
        // UPDATE
        $st = $db->prepare('SELECT * FROM projects WHERE id = ?');
        $st->execute([$id]);
        $old = $st->fetch();
        if (!$old) jsonError('Project not found.', 404);

        if (!$title) $title = $old['title'];
        if (!$image) $image = $old['image'];

        // Delete old image if new one uploaded
        if ($image !== $old['image'] && $old['image']) {
            deleteUploadedFile($old['image']);
        }

        $db->prepare('UPDATE projects SET title=?, description=?, tech_stack=?, category=?,
                      image=?, github_link=?, live_link=?, featured=? WHERE id=?')
           ->execute([$title, $description, $tech_stack, $category, $image, $github_link, $live_link, $featured, $id]);

        $st = $db->prepare('SELECT * FROM projects WHERE id = ?');
        $st->execute([$id]);
        jsonSuccess(normProject($st->fetch()));
    }

    // CREATE
    if (!$title) jsonError('Title is required.');

    $db->prepare('INSERT INTO projects (title, description, tech_stack, category, image, github_link, live_link, featured, created_at)
                  VALUES (?,?,?,?,?,?,?,?,NOW())')
       ->execute([$title, $description, $tech_stack, $category, $image, $github_link, $live_link, $featured]);

    $newId = $db->lastInsertId();
    $st = $db->prepare('SELECT * FROM projects WHERE id = ?');
    $st->execute([$newId]);
    jsonSuccess(normProject($st->fetch()), 201);
}

// ---- DELETE ---------------------------------------------------
if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) jsonError('Project ID required.');

    $st = $db->prepare('SELECT image FROM projects WHERE id = ?');
    $st->execute([$id]);
    $row = $st->fetch();
    if (!$row) jsonError('Project not found.', 404);

    deleteUploadedFile($row['image'] ?? '');

    $db->prepare('DELETE FROM projects WHERE id = ?')->execute([$id]);
    jsonSuccess(['message' => 'Project deleted.']);
}

jsonError('Method not allowed.', 405);

// ---- Normalize for frontend ------------------------------------
function normProject(array $r): array {
    $ts = array_filter(array_map('trim', explode(',', $r['tech_stack'] ?? '')));
    return [
        'id'          => (int)$r['id'],
        'title'       => $r['title'],
        'description' => $r['description'] ?? '',
        'tech_stack'  => $r['tech_stack'] ?? '',
        'category'    => $r['category'] ?? 'others',
        'image'       => $r['image'] ?? '',
        'github_link' => $r['github_link'] ?? '',
        'live_link'   => $r['live_link'] ?? '',
        'featured'    => (bool)($r['featured'] ?? false),
        'created_at'  => $r['created_at'] ?? '',
        // Frontend aliases
        'bannerUrl'       => $r['image'] ?? '',
        'projectImageUrl' => $r['image'] ?? '',
        'githubLink'      => $r['github_link'] ?? '',
        'liveUrl'         => $r['live_link'] ?? '',
        'bullets'         => [],
        'techStack'       => $ts,
        'codeSnippet'     => '',
    ];
}
