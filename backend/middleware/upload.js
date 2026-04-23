const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

/**
 * Creates a multer uploader that saves to uploads/<subfolder>/
 */
function createUploader(subfolder) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../../uploads', subfolder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const name = `img_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, GIF images are allowed.'));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  });
}

/**
 * Safely deletes a file under uploads/ directory.
 * Path must start with "uploads/" to prevent directory traversal.
 */
function deleteFile(filePath) {
  if (!filePath || !filePath.startsWith('uploads/')) return;
  const full = path.join(__dirname, '../../', filePath);
  if (fs.existsSync(full)) {
    try { fs.unlinkSync(full); } catch (e) { /* silently ignore */ }
  }
}

module.exports = { createUploader, deleteFile };
