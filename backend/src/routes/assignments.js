/**
 * Assignments Routes
 * POST /api/assignments           - Student uploads a PDF assignment
 * GET  /api/assignments           - Teacher views all submitted assignments
 * GET  /api/assignments/:id/download - Teacher downloads an assignment
 */

const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const { assignmentsUpload } = require('../middleware/upload');

const router = express.Router();

// POST /api/assignments — Student uploads an assignment
router.post('/', authenticate, requireRole('student'), (req, res) => {
  assignmentsUpload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 20MB.' });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required.' });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    try {
      const result = await pool.query(
        'INSERT INTO assignments (student_id, title, filename, filepath) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.user.id, title, req.file.originalname, req.file.path]
      );

      res.status(201).json({ message: 'Assignment uploaded successfully.', assignment: result.rows[0] });
    } catch (dbErr) {
      console.error('[assignments] Upload error:', dbErr.message);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
});

// GET /api/assignments — Teacher views all assignments (read-only)
router.get('/', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.title, a.filename, a.uploaded_at, u.name as student_name
       FROM assignments a
       JOIN users u ON a.student_id = u.id
       ORDER BY a.uploaded_at DESC`
    );
    res.json({ assignments: result.rows });
  } catch (err) {
    console.error('[assignments] List error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/assignments/:id/download — Teacher downloads an assignment
router.get('/:id/download', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assignments WHERE id = $1', [req.params.id]);
    const assignment = result.rows[0];

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    res.download(assignment.filepath, assignment.filename);
  } catch (err) {
    console.error('[assignments] Download error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
