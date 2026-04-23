<?php
// ============================================================
//  Database Configuration — Portfolio MySQL/PDO Connection
// ============================================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'portfolio');
define('DB_USER', 'root');       // Change to your MySQL username
define('DB_PASS', '');           // Change to your MySQL password
define('DB_CHARSET', 'utf8mb4');

// Upload directory (relative to project root)
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL', 'uploads/'); // Public URL prefix (relative)

// ---- PDO connection (singleton) ----------------------------
function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        DB_HOST, DB_NAME, DB_CHARSET
    );
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        die(json_encode(['success' => false, 'error' => 'Database connection failed']));
    }
    return $pdo;
}

// ---- JSON response helpers ----------------------------------
function jsonSuccess(mixed $data = null, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

function jsonError(string $message, int $code = 400): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

// ---- CORS for local dev (restrict in production) -----------
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---- Session helper ----------------------------------------
function startSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function requireAdmin(): void {
    startSession();
    if (empty($_SESSION['admin_id'])) {
        jsonError('Unauthorized. Please login.', 401);
    }
}

function isAdminLoggedIn(): bool {
    startSession();
    return !empty($_SESSION['admin_id']);
}

// ---- File upload helper ------------------------------------
function handleUpload(string $field, string $subfolder = ''): ?string {
    if (empty($_FILES[$field]['tmp_name'])) return null;

    $file     = $_FILES[$field];
    $allowed  = ['image/jpeg','image/png','image/webp','image/gif'];

    if (!in_array($file['type'], $allowed)) {
        jsonError('Only JPG, PNG, WEBP, GIF images are allowed.');
    }
    if ($file['size'] > 10 * 1024 * 1024) {
        jsonError('File too large. Max 10 MB.');
    }

    $dir = UPLOAD_DIR . ltrim($subfolder, '/');
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = uniqid('img_', true) . '.' . $ext;
    $dest     = $dir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        jsonError('Failed to save uploaded file.');
    }

    return UPLOAD_URL . ltrim($subfolder, '/') . '/' . $filename;
}

// ---- Delete uploaded file helper ---------------------------
function deleteUploadedFile(string $path): void {
    if (!$path || !str_starts_with($path, 'uploads/')) return;
    $fp = __DIR__ . '/../' . $path;
    if (file_exists($fp)) @unlink($fp);
}
