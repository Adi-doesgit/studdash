/**
 * Admin Routes
 * GET   /api/admin/users     - List all users
 * PATCH /api/admin/users/:id - Suspend/enable a user account
 */

const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();

// GET /api/admin/users — List all users
router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, name, email, role, is_active, created_at FROM users ORDER BY id'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('[admin] List users error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/admin/users/:id — Suspend or enable a user
router.patch('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean.' });
    }

    // Prevent admin from disabling their own account
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot modify your own account.' });
    }

    const result = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, username, name, email, role, is_active',
      [is_active, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: `User ${is_active ? 'enabled' : 'suspended'}.`, user: result.rows[0] });
  } catch (err) {
    console.error('[admin] Update user error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
