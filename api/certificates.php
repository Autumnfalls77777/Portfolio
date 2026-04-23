<?php
// ============================================================
//  Certificates API
//  GET    /api/certificates.php                   → all certs
//  GET    /api/certificates.php?category=college   → filtered
//  GET    /api/certificates.php?id=1              → single
//  POST   /api/certificates.php                   → create (admin)
//  POST   /api/certificates.php?id=1              → update (admin)
//  DELETE /api/certificates.php?id=1              → delete (admin)
// ============================================================
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// ---- GET -------------------------------------------------------
if ($method === 'GET') {
    if ($id) {
        $st = $db->prepare('SELECT * FROM certificates WHERE id = ? LIMIT 1');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) jsonError('Certificate not found.', 404);
        jsonSuccess(normCert($row));
    }

    $cat = $_GET['category'] ?? null;
    if ($cat) {
        $st = $db->prepare('SELECT * FROM certificates WHERE category = ? ORDER BY issue_date DESC, created_at DESC');
        $st->execute([$cat]);
    } else {
        $st = $db->prepare('SELECT * FROM certificates ORDER BY issue_date DESC, created_at DESC');
        $st->execute();
    }
    jsonSuccess(array_map('normCert', $st->fetchAll()));
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

    $title           = trim($body['title']           ?? '');
    $issuer          = trim($body['issuer']          ?? '');
    $issue_date      = trim($body['issue_date']      ?? '');
    $category        = trim($body['category']        ?? 'college');
    $credential_link = trim($body['credential_link'] ?? '');

    $image = handleUpload('image', 'certificates');
    if (!$image) $image = trim($body['image'] ?? '');

    if ($id) {
        // UPDATE
        $st = $db->prepare('SELECT * FROM certificates WHERE id = ?');
        $st->execute([$id]);
        $old = $st->fetch();
        if (!$old) jsonError('Certificate not found.', 404);

        if (!$title) $title = $old['title'];
        if (!$image) $image = $old['image'];

        if ($image !== $old['image'] && $old['image']) {
            deleteUploadedFile($old['image']);
        }

        $db->prepare('UPDATE certificates SET title=?, issuer=?, issue_date=?, image=?,
                      category=?, credential_link=? WHERE id=?')
           ->execute([$title, $issuer, $issue_date ?: null, $image, $category, $credential_link, $id]);

        $st = $db->prepare('SELECT * FROM certificates WHERE id = ?');
        $st->execute([$id]);
        jsonSuccess(normCert($st->fetch()));
    }

    // CREATE
    if (!$title) jsonError('Title is required.');

    $db->prepare('INSERT INTO certificates (title, issuer, issue_date, image, category, credential_link, created_at)
                  VALUES (?,?,?,?,?,?,NOW())')
       ->execute([$title, $issuer, $issue_date ?: null, $image, $category, $credential_link]);

    $newId = $db->lastInsertId();
    $st = $db->prepare('SELECT * FROM certificates WHERE id = ?');
    $st->execute([$newId]);
    jsonSuccess(normCert($st->fetch()), 201);
}

// ---- DELETE ---------------------------------------------------
if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) jsonError('Certificate ID required.');

    $st = $db->prepare('SELECT image FROM certificates WHERE id = ?');
    $st->execute([$id]);
    $row = $st->fetch();
    if (!$row) jsonError('Certificate not found.', 404);

    deleteUploadedFile($row['image'] ?? '');

    $db->prepare('DELETE FROM certificates WHERE id = ?')->execute([$id]);
    jsonSuccess(['message' => 'Certificate deleted.']);
}

jsonError('Method not allowed.', 405);

// ---- Normalize -------------------------------------------------
function normCert(array $r): array {
    return [
        'id'              => (int)$r['id'],
        'title'           => $r['title'],
        'issuer'          => $r['issuer'] ?? '',
        'issue_date'      => $r['issue_date'] ?? '',
        'image'           => $r['image'] ?? '',
        'category'        => $r['category'] ?? 'college',
        'credential_link' => $r['credential_link'] ?? '',
        'created_at'      => $r['created_at'] ?? '',
        // Frontend aliases
        'imageUrl' => $r['image'] ?? '',
        'date'     => $r['issue_date'] ?? '',
    ];
}
