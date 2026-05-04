/**
 * Notes Routes
 * POST /api/notes           - Teacher uploads a PDF note
 * GET  /api/notes           - Student lists all available notes
 * GET  /api/notes/:id/download - Student downloads a note
 */

const express = require('express');
const path = require('path');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const { notesUpload } = require('../middleware/upload');

const router = express.Router();

// POST /api/notes — Teacher uploads a note
router.post('/', authenticate, requireRole('teacher'), (req, res) => {
  notesUpload.single('file')(req, res, async (err) => {
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
        'INSERT INTO notes (teacher_id, title, filename, filepath) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.user.id, title, req.file.originalname, req.file.path]
      );

      res.status(201).json({ message: 'Note uploaded successfully.', note: result.rows[0] });
    } catch (dbErr) {
      console.error('[notes] Upload error:', dbErr.message);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
});

// GET /api/notes — Student views all notes
router.get('/', authenticate, requireRole('student'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.id, n.title, n.filename, n.uploaded_at, u.name as teacher_name
       FROM notes n
       JOIN users u ON n.teacher_id = u.id
       ORDER BY n.uploaded_at DESC`
    );
    res.json({ notes: result.rows });
  } catch (err) {
    console.error('[notes] List error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/notes/:id/download — Student downloads a note
router.get('/:id/download', authenticate, requireRole('student'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE id = $1', [req.params.id]);
    const note = result.rows[0];

    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    res.download(note.filepath, note.filename);
  } catch (err) {
    console.error('[notes] Download error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
