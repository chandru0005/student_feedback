const express = require('express');
const router = express.Router();
const { query } = require('../database/db');

// GET /api/metadata/departments
router.get('/departments', async (req, res) => {
  try {
    const depts = await query('SELECT id, code, name FROM departments ORDER BY name ASC');
    return res.json({ success: true, departments: depts.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
});

// GET /api/metadata/subjects (Optional filter by department_id and semester)
router.get('/subjects', async (req, res) => {
  try {
    const { department_id, semester } = req.query;
    let sql = `
      SELECT s.id, s.code, s.name, s.department_id, s.semester, d.name AS department_name
      FROM subjects s
      JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) {
      sql += ' AND s.department_id = ?';
      params.push(department_id);
    }
    if (semester) {
      sql += ' AND s.semester = ?';
      params.push(semester);
    }
    sql += ' ORDER BY s.code ASC';

    const subjects = await query(sql, params);
    return res.json({ success: true, subjects: subjects.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subjects.' });
  }
});

// GET /api/metadata/faculty (Optional filter by subject_id or department_id)
router.get('/faculty', async (req, res) => {
  try {
    const { subject_id, department_id } = req.query;
    let sql = `
      SELECT DISTINCT u.id, u.name, u.email, u.department_id, d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN faculty_subjects fs ON u.id = fs.faculty_id
      WHERE u.role = 'faculty' AND u.is_active = 1
    `;
    const params = [];

    if (subject_id) {
      sql += ' AND fs.subject_id = ?';
      params.push(subject_id);
    }
    if (department_id) {
      sql += ' AND u.department_id = ?';
      params.push(department_id);
    }
    sql += ' ORDER BY u.name ASC';

    const faculty = await query(sql, params);
    return res.json({ success: true, faculty: faculty.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch faculty.' });
  }
});

// GET /api/metadata/settings (Public system configuration)
router.get('/settings', async (req, res) => {
  try {
    const settingsRes = await query('SELECT setting_key, setting_value FROM system_settings');
    const config = {};
    settingsRes.rows.forEach(r => {
      config[r.setting_key] = r.setting_value;
    });

    const categories = (config.categories || 'Teaching,Faculty,Subject,Laboratory,Infrastructure,Library,Hostel,Transport,Internet,Other')
      .split(',')
      .map(c => c.trim());

    return res.json({
      success: true,
      settings: {
        allow_anonymous_feedback: config.allow_anonymous_feedback === 'true',
        allow_student_edit: config.allow_student_edit === 'true',
        academic_year: config.academic_year || '2026-2027',
        categories
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch system settings.' });
  }
});

module.exports = router;
