<?php
// ============================================================
//  Settings API
//  GET  /api/settings.php          → fetch settings
//  POST /api/settings.php          → update settings (admin)
// ============================================================
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

if ($method === 'GET') {
    $st = $db->query('SELECT * FROM settings WHERE id = 1 LIMIT 1');
    $row = $st->fetch();
    if (!$row) {
        // Default fallback
        jsonSuccess([
            'full_name'     => 'Prabal Jaiswal',
            'hero_title'    => 'Graphic Designer · Server Admin · Game Dev',
            'hero_subtitle' => 'Crafting Digital Experiences with Code & Creativity',
            'about_text'    => 'Passionate creator building at the intersection of design, code, and gaming.',
            'profile_image' => '',
            'github'        => '',
            'linkedin'      => '',
            'resume_link'   => '',
        ]);
    }
    jsonSuccess($row);
}

if ($method === 'POST') {
    requireAdmin();

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($contentType, 'application/json')) {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $body = $_POST;
    }

    $full_name     = trim($body['full_name']     ?? '');
    $hero_title    = trim($body['hero_title']    ?? '');
    $hero_subtitle = trim($body['hero_subtitle'] ?? '');
    $about_text    = trim($body['about_text']    ?? '');
    $github        = trim($body['github']        ?? '');
    $linkedin      = trim($body['linkedin']      ?? '');
    $resume_link   = trim($body['resume_link']   ?? '');

    // Handle profile image upload
    $profile_image = handleUpload('profile_image', 'profile');
    if (!$profile_image) {
        $profile_image = trim($body['profile_image'] ?? '');
    }

    // If we got a new profile image, delete old one
    $exists = $db->query('SELECT id, profile_image FROM settings WHERE id = 1')->fetch();

    if ($exists) {
        // Preserve old values if not provided
        if (!$full_name) $full_name = $exists['full_name'] ?? '';
        if (!$profile_image) $profile_image = $exists['profile_image'] ?? '';

        // Delete old image if changed
        if ($profile_image !== ($exists['profile_image'] ?? '')) {
            deleteUploadedFile($exists['profile_image'] ?? '');
        }

        $sql = 'UPDATE settings SET full_name=?, hero_title=?, hero_subtitle=?, about_text=?,
                profile_image=?, github=?, linkedin=?, resume_link=?, updated_at=NOW()
                WHERE id=1';
        $st = $db->prepare($sql);
        $st->execute([
            $full_name, $hero_title, $hero_subtitle, $about_text,
            $profile_image, $github, $linkedin, $resume_link
        ]);
    } else {
        $sql = 'INSERT INTO settings (id, full_name, hero_title, hero_subtitle, about_text,
                profile_image, github, linkedin, resume_link)
                VALUES (1,?,?,?,?,?,?,?,?)';
        $st = $db->prepare($sql);
        $st->execute([
            $full_name, $hero_title, $hero_subtitle, $about_text,
            $profile_image, $github, $linkedin, $resume_link
        ]);
    }

    // Return updated settings
    $st = $db->query('SELECT * FROM settings WHERE id = 1');
    jsonSuccess($st->fetch());
}

jsonError('Method not allowed.', 405);
