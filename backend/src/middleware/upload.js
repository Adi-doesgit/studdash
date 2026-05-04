/**
 * Multer File Upload Middleware
 * - PDF-only uploads
 * - Max file size: 20MB
 * - Stores files to /app/uploads/{notes|assignments}/
 */

const multer = require('multer');
const path = require('path');
const config = require('../config');

/**
 * Create a multer instance for a specific subdirectory
 * @param {string} subDir - 'notes' or 'assignments'
 */
function createUploader(subDir) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(config.UPLOAD_DIR, subDir));
    },
    filename: (req, file, cb) => {
      // Use timestamp + random suffix to avoid collisions
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
      cb(null, uniqueSuffix + '.pdf');
    },
  });

  const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: config.UPLOAD_MAX_SIZE },
  });
}

// Pre-configured uploaders
const notesUpload = createUploader('notes');
const assignmentsUpload = createUploader('assignments');

module.exports = { notesUpload, assignmentsUpload };
