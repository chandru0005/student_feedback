const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { query } = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

// Require admin role for all routes in this file
router.use(authenticateToken, authorizeRoles('admin'));

// GET /api/admin/dashboard (University-wide KPIs and Analytics)
router.get('/dashboard', async (req, res) => {
  try {
    // 1. Overall counts
    const studentsCount = (await query("SELECT count(*) as c FROM users WHERE role = 'student'")).rows[0].c;
    const facultyCount = (await query("SELECT count(*) as c FROM users WHERE role = 'faculty'")).rows[0].c;
    const deptCount = (await query('SELECT count(*) as c FROM departments')).rows[0].c;
    const subjectCount = (await query('SELECT count(*) as c FROM subjects')).rows[0].c;
    const totalFeedbackCount = (await query('SELECT count(*) as c FROM feedback')).rows[0].c;
    const flaggedCount = (await query("SELECT count(*) as c FROM feedback WHERE status = 'flagged'")).rows[0].c;

    // 2. Sentiment distribution across entire institution
    const sentimentRes = await query(`
      SELECT fs.sentiment, count(*) as count
      FROM feedback_sentiment fs
      GROUP BY fs.sentiment
    `);
    const sentMap = { Positive: 0, Neutral: 0, Negative: 0 };
    sentimentRes.rows.forEach(r => {
      if (sentMap[r.sentiment] !== undefined) sentMap[r.sentiment] = Number(r.count);
    });

    const sentimentDistribution = [
      { name: 'Positive', count: sentMap.Positive, color: '#10B981' },
      { name: 'Neutral', count: sentMap.Neutral, color: '#F59E0B' },
      { name: 'Negative', count: sentMap.Negative, color: '#EF4444' }
    ];

    // 3. Department-wise Sentiment & Rating Performance
    const deptStatsRes = await query(`
      SELECT d.code, d.name,
             count(f.id) as total_feedback,
             AVG(fr.average_rating) as avg_rating,
             SUM(CASE WHEN fs.sentiment = 'Positive' THEN 1 ELSE 0 END) as positive_count,
             SUM(CASE WHEN fs.sentiment = 'Neutral' THEN 1 ELSE 0 END) as neutral_count,
             SUM(CASE WHEN fs.sentiment = 'Negative' THEN 1 ELSE 0 END) as negative_count
      FROM departments d
      LEFT JOIN feedback f ON d.id = f.department_id
      LEFT JOIN feedback_ratings fr ON f.id = fr.feedback_id
      LEFT JOIN feedback_sentiment fs ON f.id = fs.feedback_id
      GROUP BY d.id
    `);

    const departmentStats = deptStatsRes.rows.map(row => ({
      code: row.code,
      name: row.name,
      totalFeedback: Number(row.total_feedback || 0),
      avgRating: row.avg_rating ? Number(Number(row.avg_rating).toFixed(2)) : 0.0,
      positive: Number(row.positive_count || 0),
      neutral: Number(row.neutral_count || 0),
      negative: Number(row.negative_count || 0)
    }));

    // 4. Category-wise Distribution
    const categoryStatsRes = await query(`
      SELECT f.feedback_category, count(*) as count, AVG(fr.average_rating) as avg_rating
      FROM feedback f
      LEFT JOIN feedback_ratings fr ON f.id = fr.feedback_id
      GROUP BY f.feedback_category
      ORDER BY count DESC
    `);

    // 5. Recent Submissions
    const recentRes = await query(`
      SELECT f.id, f.written_feedback, f.feedback_category, f.is_anonymous, f.status, f.created_at,
             u.name as student_name, u.register_number as student_reg,
             fac.name as faculty_name,
             s.name as subject_name,
             fr.average_rating,
             fs.sentiment, fs.confidence_score
      FROM feedback f
      LEFT JOIN users u ON f.student_id = u.id
      LEFT JOIN users fac ON f.faculty_id = fac.id
      LEFT JOIN subjects s ON f.subject_id = s.id
      LEFT JOIN feedback_ratings fr ON f.id = fr.feedback_id
      LEFT JOIN feedback_sentiment fs ON f.id = fs.feedback_id
      ORDER BY f.created_at DESC
      LIMIT 6
    `);

    return res.json({
      success: true,
      kpis: {
        totalStudents: Number(studentsCount),
        totalFaculty: Number(facultyCount),
        totalDepartments: Number(deptCount),
        totalSubjects: Number(subjectCount),
        totalFeedback: Number(totalFeedbackCount),
        flaggedFeedback: Number(flaggedCount)
      },
      sentimentDistribution,
      departmentStats,
      categoryStats: categoryStatsRes.rows,
      recentSubmissions: recentRes.rows
    });
  } catch (err) {
    console.error('[Admin Dashboard Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to load admin analytics.' });
  }
});

// GET /api/admin/users (List users with role, department, status filters)
router.get('/users', async (req, res) => {
  try {
    const { role, department_id, search } = req.query;
    let sql = `
      SELECT u.id, u.name, u.email, u.register_number, u.role, u.department_id, u.year, u.is_active, u.created_at,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      sql += ' AND u.role = ?';
      params.push(role);
    }
    if (department_id) {
      sql += ' AND u.department_id = ?';
      params.push(department_id);
    }
    if (search) {
      sql += ' AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.register_number) LIKE ?)';
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY u.created_at DESC';

    const usersRes = await query(sql, params);
    return res.json({ success: true, users: usersRes.rows });
  } catch (err) {
    console.error('[Admin Users Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// POST /api/admin/users (Create new faculty or student user)
router.post(
  '/users',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['student', 'faculty', 'admin']).withMessage('Role must be student, faculty, or admin'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, email, register_number, password, role, department_id, year } = req.body;

      const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const insertRes = await query(
        `INSERT INTO users (name, email, register_number, password_hash, role, department_id, year, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [name, email.toLowerCase(), register_number || null, password_hash, role, department_id || null, year || 1]
      );

      return res.status(201).json({
        success: true,
        message: `${role.toUpperCase()} user created successfully!`,
        userId: insertRes.insertId
      });
    } catch (err) {
      console.error('[Create User Error]', err);
      return res.status(500).json({ success: false, message: 'Failed to create user.' });
    }
  }
);

// PUT /api/admin/users/:id/toggle-status
router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = (await query('SELECT id, is_active FROM users WHERE id = ?', [userId])).rows[0];
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const newStatus = user.is_active ? 0 : 1;
    await query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, userId]);

    return res.json({
      success: true,
      message: `User status changed to ${newStatus ? 'Active' : 'Inactive'}.`,
      is_active: newStatus
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle user status.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    if (Number(userId) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }
    await query('DELETE FROM users WHERE id = ?', [userId]);
    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
});

// GET /api/admin/departments & POST /api/admin/departments
router.get('/departments', async (req, res) => {
  try {
    const depts = await query(`
      SELECT d.*, count(s.id) as subjects_count
      FROM departments d
      LEFT JOIN subjects s ON d.id = s.department_id
      GROUP BY d.id
      ORDER BY d.name ASC
    `);
    return res.json({ success: true, departments: depts.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
});

router.post('/departments', async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Department code and name are required.' });
    }
    const result = await query('INSERT INTO departments (code, name) VALUES (?, ?)', [code.toUpperCase(), name]);
    return res.status(201).json({ success: true, message: 'Department created!', id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create department.' });
  }
});

// GET /api/admin/subjects & POST /api/admin/subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await query(`
      SELECT s.*, d.name as department_name, d.code as department_code,
             u.id as faculty_id, u.name as faculty_name
      FROM subjects s
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN faculty_subjects fs ON s.id = fs.subject_id
      LEFT JOIN users u ON fs.faculty_id = u.id
      ORDER BY s.code ASC
    `);
    return res.json({ success: true, subjects: subjects.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subjects.' });
  }
});

router.post('/subjects', async (req, res) => {
  try {
    const { code, name, department_id, semester } = req.body;
    if (!code || !name || !department_id) {
      return res.status(400).json({ success: false, message: 'Code, Name, and Department are required.' });
    }
    const result = await query(
      'INSERT INTO subjects (code, name, department_id, semester) VALUES (?, ?, ?, ?)',
      [code.toUpperCase(), name, department_id, semester || 1]
    );
    return res.status(201).json({ success: true, message: 'Subject created!', id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create subject.' });
  }
});

// POST /api/admin/assign-faculty (Assign faculty to subject)
router.post('/assign-faculty', async (req, res) => {
  try {
    const { faculty_id, subject_id, academic_year } = req.body;
    if (!faculty_id || !subject_id) {
      return res.status(400).json({ success: false, message: 'Faculty and Subject are required.' });
    }
    const year = academic_year || '2026-2027';

    // Remove old assignment for this subject in current year if exists
    await query('DELETE FROM faculty_subjects WHERE subject_id = ? AND academic_year = ?', [subject_id, year]);

    await query(
      'INSERT INTO faculty_subjects (faculty_id, subject_id, academic_year) VALUES (?, ?, ?)',
      [faculty_id, subject_id, year]
    );

    return res.json({ success: true, message: 'Faculty assigned to subject successfully!' });
  } catch (err) {
    console.error('[Assign Faculty Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to assign faculty.' });
  }
});

// GET /api/admin/feedback (All feedback with filters and full visibility)
router.get('/feedback', async (req, res) => {
  try {
    const { status, sentiment, department_id, category, search } = req.query;

    let sql = `
      SELECT f.id, f.written_feedback, f.feedback_category, f.is_anonymous, f.status, f.academic_year, f.semester, f.created_at,
             u.name as student_name, u.email as student_email, u.register_number as student_reg,
             fac.name as faculty_name, fac.email as faculty_email,
             s.name as subject_name, s.code as subject_code,
             d.name as department_name, d.code as department_code,
             fr.teaching_quality, fr.subject_knowledge, fr.communication, fr.doubt_clarification, fr.classroom_interaction, fr.punctuality, fr.average_rating,
             fs.sentiment, fs.sentiment_score, fs.confidence_score, fs.subjectivity_score, fs.keywords, fs.detected_topics, fs.positive_aspects, fs.negative_aspects, fs.suggestions
      FROM feedback f
      LEFT JOIN users u ON f.student_id = u.id
      LEFT JOIN users fac ON f.faculty_id = fac.id
      LEFT JOIN subjects s ON f.subject_id = s.id
      LEFT JOIN departments d ON f.department_id = d.id
      LEFT JOIN feedback_ratings fr ON f.id = fr.feedback_id
      LEFT JOIN feedback_sentiment fs ON f.id = fs.feedback_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND f.status = ?';
      params.push(status);
    }
    if (sentiment) {
      sql += ' AND fs.sentiment = ?';
      params.push(sentiment);
    }
    if (department_id) {
      sql += ' AND f.department_id = ?';
      params.push(department_id);
    }
    if (category) {
      sql += ' AND f.feedback_category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (LOWER(f.written_feedback) LIKE ? OR LOWER(fac.name) LIKE ? OR LOWER(s.name) LIKE ?)';
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY f.created_at DESC';

    const feedbackRes = await query(sql, params);

    const parsed = feedbackRes.rows.map(r => {
      let keywords = [];
      let detected_topics = [];
      let positive_aspects = [];
      let negative_aspects = [];
      let suggestions = [];
      try { keywords = r.keywords ? JSON.parse(r.keywords) : []; } catch (e) {}
      try { detected_topics = r.detected_topics ? JSON.parse(r.detected_topics) : []; } catch (e) {}
      try { positive_aspects = r.positive_aspects ? JSON.parse(r.positive_aspects) : []; } catch (e) {}
      try { negative_aspects = r.negative_aspects ? JSON.parse(r.negative_aspects) : []; } catch (e) {}
      try { suggestions = r.suggestions ? JSON.parse(r.suggestions) : []; } catch (e) {}

      return {
        ...r,
        keywords,
        detected_topics,
        positive_aspects,
        negative_aspects,
        suggestions
      };
    });

    return res.json({ success: true, count: parsed.length, feedback: parsed });
  } catch (err) {
    console.error('[Admin Feedback Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve feedback.' });
  }
});

// PUT /api/admin/feedback/:id/status (Moderate feedback status: submitted, reviewed, flagged)
router.put('/feedback/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['submitted', 'reviewed', 'flagged'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }
    await query('UPDATE feedback SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    return res.json({ success: true, message: `Feedback status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update feedback status.' });
  }
});

// DELETE /api/admin/feedback/:id
router.delete('/feedback/:id', async (req, res) => {
  try {
    const feedbackId = req.params.id;
    await query('DELETE FROM feedback_ratings WHERE feedback_id = ?', [feedbackId]);
    await query('DELETE FROM feedback_sentiment WHERE feedback_id = ?', [feedbackId]);
    await query('DELETE FROM feedback WHERE id = ?', [feedbackId]);
    return res.json({ success: true, message: 'Feedback submission deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete feedback.' });
  }
});

// GET /api/admin/settings & PUT /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    const rows = (await query('SELECT * FROM system_settings')).rows;
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    return res.json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const updates = req.body; // e.g. { allow_anonymous_feedback: 'true', allow_student_edit: 'false' }
    for (const [key, val] of Object.entries(updates)) {
      await query(
        'INSERT OR REPLACE INTO system_settings (setting_key, setting_value) VALUES (?, ?)',
        [key, String(val)]
      );
    }
    return res.json({ success: true, message: 'System settings updated successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

// GET /api/admin/export (Export feedback report)
router.get('/export', async (req, res) => {
  try {
    const { format } = req.query; // 'csv' or 'json'

    const sql = `
      SELECT f.id, f.created_at, f.academic_year, f.semester, f.feedback_category, f.is_anonymous, f.status,
             f.written_feedback,
             d.code as department,
             s.code as subject_code, s.name as subject_name,
             fac.name as faculty_name,
             u.name as student_name, u.register_number as student_reg,
             fr.teaching_quality, fr.subject_knowledge, fr.communication, fr.doubt_clarification, fr.classroom_interaction, fr.punctuality, fr.average_rating,
             fs.sentiment, fs.sentiment_score, fs.confidence_score
      FROM feedback f
      LEFT JOIN departments d ON f.department_id = d.id
      LEFT JOIN subjects s ON f.subject_id = s.id
      LEFT JOIN users fac ON f.faculty_id = fac.id
      LEFT JOIN users u ON f.student_id = u.id
      LEFT JOIN feedback_ratings fr ON f.id = fr.feedback_id
      LEFT JOIN feedback_sentiment fs ON f.id = fs.feedback_id
      ORDER BY f.created_at DESC
    `;
    const feedbackRes = await query(sql);

    if (format === 'csv') {
      const headers = [
        'ID', 'Date', 'Academic Year', 'Semester', 'Department', 'Subject Code', 'Subject Name',
        'Faculty Name', 'Student Name', 'Register No', 'Is Anonymous', 'Category', 'Average Rating',
        'Teaching Quality', 'Subject Knowledge', 'Communication', 'Doubt Clarification',
        'Classroom Interaction', 'Punctuality', 'Sentiment', 'Sentiment Score', 'Confidence Score',
        'Status', 'Feedback Text'
      ];

      const csvRows = [headers.join(',')];
      feedbackRes.rows.forEach(r => {
        const cleanText = (r.written_feedback || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
        const student = r.is_anonymous ? 'Anonymous' : (r.student_name || '');
        const reg = r.is_anonymous ? 'REDACTED' : (r.student_reg || '');

        const row = [
          r.id,
          `"${r.created_at}"`,
          `"${r.academic_year}"`,
          r.semester,
          `"${r.department}"`,
          `"${r.subject_code || ''}"`,
          `"${r.subject_name || ''}"`,
          `"${r.faculty_name || ''}"`,
          `"${student}"`,
          `"${reg}"`,
          r.is_anonymous ? 'YES' : 'NO',
          `"${r.feedback_category}"`,
          r.average_rating,
          r.teaching_quality,
          r.subject_knowledge,
          r.communication,
          r.doubt_clarification,
          r.classroom_interaction,
          r.punctuality,
          `"${r.sentiment}"`,
          r.sentiment_score,
          r.confidence_score,
          `"${r.status}"`,
          `"${cleanText}"`
        ];
        csvRows.push(row.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="student_feedback_report.csv"');
      return res.send(csvRows.join('\n'));
    }

    return res.json({
      success: true,
      count: feedbackRes.rows.length,
      data: feedbackRes.rows
    });
  } catch (err) {
    console.error('[Export Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to generate export.' });
  }
});

module.exports = router;
