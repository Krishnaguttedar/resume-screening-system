const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

const MAX_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.txt']);

/**
 * Returns a multer instance that stores files under uploads/<sessionId>/
 */
function createUploader(subDir = '') {
  const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', subDir || req.params.id || 'misc');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const safe = uuidv4() + ext;
      cb(null, safe);
    },
  });

  const fileFilter = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.has(file.mimetype) || ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.originalname}. Use PDF, DOC, or DOCX.`), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE_BYTES },
  });
}

module.exports = { createUploader };
