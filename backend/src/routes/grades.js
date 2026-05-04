/**
 * Grades Routes
 * GET /api/grades - Get grades + GPA for the logged-in student
 */

const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();

// Grade point mapping
const GRADE_POINTS = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0,
};

// GET /api/grades
router.get('/', authenticate, requireRole('student'), async (req, res) => {
  try {
    const studentId = req.user.id;

    // Fetch all grades with subject details
    const result = await pool.query(
      `SELECT g.grade, s.code, s.name, s.credits
       FROM grades g
       JOIN subjects s ON g.subject_id = s.id
       WHERE g.student_id = $1
       ORDER BY s.code`,
      [studentId]
    );

    // Calculate GPA
    let totalPoints = 0;
    let totalCredits = 0;

    const gradeDetails = result.rows.map((g) => {
      const points = GRADE_POINTS[g.grade] ?? 0;
      totalPoints += points * g.credits;
      totalCredits += g.credits;

      return {
        subjectCode: g.code,
        subjectName: g.name,
        credits: g.credits,
        grade: g.grade,
        gradePoints: points,
      };
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

    res.json({
      grades: gradeDetails,
      gpa: parseFloat(gpa),
      totalCredits,
    });
  } catch (err) {
    console.error('[grades] Error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
