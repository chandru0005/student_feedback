const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { query } = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const { analyzeFeedbackText } = require('../services/nlpClient');

// Require student role for all endpoints
router.use(authenticateToken, authorizeRoles('student'));

// Helper to check system settings
async function getSetting(key, defaultValue) {
  const res = await query('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
  if (res.rows.length > 0) return res.rows[0].setting_value;
  return defaultValue;
}

// GET /api/student/dashboard-summary
router.get('/dashboard-summary', async (req, res) => {
  try {
    const studentId = req.user.id;

    // Total Feedback submitted
    const totalRes = await query(
      'SELECT count(*) AS total FROM feedback WHERE student_id = ?',
      [studentId]
    );
    const totalFeedback = totalRes.rows[0].total || 0;

    // Completed & Pending
    const completedRes = await query(
      "SELECT count(*) AS count FROM feedback WHERE student_id = ? AND status = 'reviewed'",
      [studentId]
    );
    const completedFeedback = completedRes.rows[0].count || 0;

    const pendingRes = await query(
      "SELECT count(*) AS count FROM feedback WHERE student_id = ? AND status = 'submitted'",
      [studentId]
    );
    const pendingFeedback = pendingRes.rows[0].count || 0;

    // Average Rating given
    const ratingRes = await query(
      `SELECT AVG(fr.average_rating) AS avg_rating
       FROM feedback_ratings fr
       JOIN feedback f ON fr.feedback_id = f.id
       WHERE f.student_id = ?`,
      [studentId]
    );
    const avgRating = ratingRes.rows[0].avg_rating
      ? Number(Number(ratingRes.rows[0].avg_rating).toFixed(1))
      : 0.0;

    // Recent submissions (last 5)
    const recentRes = await query(
      `SELECT f.id, f.feedback_category, f.written_feedback, f.is_anonymous, f.status, f.created_at,
              s.name AS subject_name, s.code AS subject_code,
              u.name AS faculty_name,
              fr.average_rating,
              fs.sentiment, fs.sentiment_score, fs.confidence_score
       FROM feedback f
       LEFT JOIN subjects s ON f.subject_id = s.id
       LEFT JOIN users u ON f.faculty_id = u.id
       LEFT JOIN feedback_ratings fr ON f.id = fr.feedback_id
       LEFT JOIN feedback_sentiment fs ON f.id = fs.feedback_id
       WHERE f.student_id = ?
       ORDER BY f.created_at DESC
       LIMIT 5`,
      [studentId]
    );

    // Available subjects to review
    const deptId = req.user.department_id;
    const subjectsRes = await query(
      `SELECT s.id, s.code, s.name, s.semester, d.name AS department_name
       FROM subjects s
       JOIN departments d ON s.department_id = d.id
       WHERE s.department_id = ?
       ORDER BY s.code ASC`,
      [deptId]
    );

    return res.json({
      success: true,
      stats: {
        totalFeedback,
        completedFeedback,
        pendingFeedback,
        averageRating: avgRating
      },
      recentSubmissions: recentRes.rows,
      availableSubjects: subjectsRes.rows
    });
  } catch (err) {
    console.error('[Student Dashboard Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard summary.' });
  }
});

// POST /api/student/feedback (Submit feedback)
router.post(
  '/feedback',
  [
    body('department_id').notEmpty().withMessage('Department is required'),
    body('semester').isInt({ min: 1, max: 10 }).withMessage('Valid semester is required'),
    body('teaching_quality').isInt({ min: 1, max: 5 }).withMessage('Teaching Quality rating must be 1-5'),
    body('subject_knowledge').isInt({ min: 1, max: 5 }).withMessage('Subject Knowledge rating must be 1-5'),
    body('communication').isInt({ min: 1, max: 5 }).withMessage('Communication rating must be 1-5'),
    body('doubt_clarification').isInt({ min: 1, max: 5 }).withMessage('Doubt Clarification rating must be 1-5'),
    body('classroom_interaction').isInt({ min: 1, max: 5 }).withMessage('Classroom Interaction rating must be 1-5'),
    body('punctuality').isInt({ min: 1, max: 5 }).withMessage('Punctuality rating must be 1-5'),
    body('written_feedback').trim().isLength({ min: 5 }).withMessage('Feedback text must be at least 5 characters'),
    body('feedback_category').notEmpty().withMessage('Feedback category is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const {
        department_id,
        year,
        semester,
        subject_id,
        faculty_id,
        teaching_quality,
        subject_knowledge,
        communication,
        doubt_clarification,
        classroom_interaction,
        punctuality,
        written_feedback,
        feedback_category,
        is_anonymous
      } = req.body;

      // Check anonymous permission
      const allowAnonSetting = await getSetting('allow_anonymous_feedback', 'true');
      const finalAnonymous = allowAnonSetting === 'true' ? (Boolean(is_anonymous) ? 1 : 0) : 0;

      // Calculate average rating
      const ratings = [
        Number(teaching_quality),
        Number(subject_knowledge),
        Number(communication),
        Number(doubt_clarification),
        Number(classroom_interaction),
        Number(punctuality)
      ];
      const avgRating = Number((ratings.reduce((a, b) => a + b, 0) / 6).toFixed(2));

      // 1. Insert Feedback Master Record
      const academicYear = await getSetting('academic_year', '2026-2027');
      const feedbackInsert = await query(
        `INSERT INTO feedback (student_id, faculty_id, subject_id, department_id, academic_year, semester, feedback_category, written_feedback, is_anonymous, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
        [
          studentId,
          faculty_id || null,
          subject_id || null,
          department_id,
          academicYear,
          semester,
          feedback_category,
          written_feedback,
          finalAnonymous
        ]
      );
      const feedbackId = feedbackInsert.insertId;

      // 2. Insert Ratings
      await query(
        `INSERT INTO feedback_ratings (feedback_id, teaching_quality, subject_knowledge, communication, doubt_clarification, classroom_interaction, punctuality, average_rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          feedbackId,
          teaching_quality,
          subject_knowledge,
          communication,
          doubt_clarification,
          classroom_interaction,
          punctuality,
          avgRating
        ]
      );

      // 3. Trigger NLP Sentiment Analysis Service
      const nlpResult = await analyzeFeedbackText(written_feedback, feedback_category);

      // 4. Save Sentiment Analysis Output
      await query(
        `INSERT INTO feedback_sentiment (feedback_id, sentiment, sentiment_score, confidence_score, subjectivity_score, keywords, detected_topics, positive_aspects, negative_aspects, suggestions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          feedbackId,
          nlpResult.sentiment,
          nlpResult.sentiment_score,
          nlpResult.confidence_score,
          nlpResult.subjectivity_score,
          JSON.stringify(nlpResult.keywords || []),
          JSON.stringify(nlpResult.detected_topics || []),
          JSON.stringify(nlpResult.aspect_breakdown?.positive_aspects || []),
          JSON.stringify(nlpResult.aspect_breakdown?.negative_aspects || []),
          JSON.stringify(nlpResult.aspect_breakdown?.suggestions || [])
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'Feedback submitted and analyzed successfully!',
        feedbackId,
        sentiment: nlpResult
      });
    } catch (err) {
      console.error('[Submit Feedback Error]', err);
      return res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
    }
  }
);

// GET /api/student/feedback-history
router.get('/feedback-history', async (req, res) => {
  try {
    const studentId = req.user.id;
    const historyRes = await query(
      `SELECT f.id, f.feedback_category, f.written_feedback, f.is_anonymous, f.status, f.created_at, f.academic_year, f.semester,
              s.name AS subject_name, s.code AS subject_code,
              u.name AS faculty_name,
              d.name AS department_name,
              fr.teaching_quality, fr.subject_knowledge, fr.communication, fr.doubt_clarification, fr.classroom_interaction, fr.punctuality, fr.average_rating,
              fs.sentiment, fs.sentiment_score, fs.confidence_score, fs.keywords, fs.detected_topics, fs.positive_aspects, fs.negative_aspects, fs.suggestions
       FROM feedback f
       LEFT JOIN subjects s ON f.subject_id = s.id
       LEFT JOIN users u ON f.faculty_id = u.id
       LEFT JOIN departments d ON f.department_id = d.id
       LEFT JOIN feedback_ratings fr ON f.id = fr.feedback_id
       LEFT JOIN feedback_sentiment fs ON f.id = fs.feedback_id
       WHERE f.student_id = ?
       ORDER BY f.created_at DESC`,
      [studentId]
    );

    // Parse JSON fields
    const parsedRows = historyRes.rows.map(row => {
      let keywords = [];
      let detected_topics = [];
      let positive_aspects = [];
      let negative_aspects = [];
      let suggestions = [];
      try { keywords = row.keywords ? JSON.parse(row.keywords) : []; } catch (e) {}
      try { detected_topics = row.detected_topics ? JSON.parse(row.detected_topics) : []; } catch (e) {}
      try { positive_aspects = row.positive_aspects ? JSON.parse(row.positive_aspects) : []; } catch (e) {}
      try { negative_aspects = row.negative_aspects ? JSON.parse(row.negative_aspects) : []; } catch (e) {}
      try { suggestions = row.suggestions ? JSON.parse(row.suggestions) : []; } catch (e) {}

      return {
        ...row,
        keywords,
        detected_topics,
        aspect_breakdown: { positive_aspects, negative_aspects, suggestions }
      };
    });

    const allowEdit = (await getSetting('allow_student_edit', 'true')) === 'true';

    return res.json({
      success: true,
      allowEdit,
      feedback: parsedRows
    });
  } catch (err) {
    console.error('[Feedback History Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve feedback history.' });
  }
});

// PUT /api/student/feedback/:id (Edit submitted feedback if permitted)
router.put('/:id', async (req, res) => {
  try {
    const studentId = req.user.id;
    const feedbackId = req.params.id;

    const allowEdit = (await getSetting('allow_student_edit', 'true')) === 'true';
    if (!allowEdit) {
      return res.status(403).json({
        success: false,
        message: 'Feedback editing is currently disabled by university administration.'
      });
    }

    // Verify ownership
    const checkRes = await query('SELECT id, student_id, status FROM feedback WHERE id = ?', [feedbackId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }
    if (checkRes.rows[0].student_id !== studentId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this feedback.' });
    }

    const { written_feedback, is_anonymous, teaching_quality, subject_knowledge, communication, doubt_clarification, classroom_interaction, punctuality } = req.body;

    if (written_feedback) {
      await query(
        'UPDATE feedback SET written_feedback = ?, is_anonymous = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [written_feedback, is_anonymous ? 1 : 0, feedbackId]
      );

      // Re-run NLP
      const nlpResult = await analyzeFeedbackText(written_feedback);
      await query(
        `UPDATE feedback_sentiment
         SET sentiment = ?, sentiment_score = ?, confidence_score = ?, keywords = ?, detected_topics = ?, suggestions = ?
         WHERE feedback_id = ?`,
        [
          nlpResult.sentiment,
          nlpResult.sentiment_score,
          nlpResult.confidence_score,
          JSON.stringify(nlpResult.keywords || []),
          JSON.stringify(nlpResult.detected_topics || []),
          JSON.stringify(nlpResult.aspect_breakdown?.suggestions || []),
          feedbackId
        ]
      );
    }

    if (teaching_quality && subject_knowledge && communication && doubt_clarification && classroom_interaction && punctuality) {
      const avg = Number(((teaching_quality + subject_knowledge + communication + doubt_clarification + classroom_interaction + punctuality) / 6).toFixed(2));
      await query(
        `UPDATE feedback_ratings
         SET teaching_quality = ?, subject_knowledge = ?, communication = ?, doubt_clarification = ?, classroom_interaction = ?, punctuality = ?, average_rating = ?
         WHERE feedback_id = ?`,
        [teaching_quality, subject_knowledge, communication, doubt_clarification, classroom_interaction, punctuality, avg, feedbackId]
      );
    }

    return res.json({ success: true, message: 'Feedback updated successfully!' });
  } catch (err) {
    console.error('[Edit Feedback Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update feedback.' });
  }
});

// DELETE /api/student/feedback/:id (Delete feedback if permitted)
router.delete('/:id', async (req, res) => {
  try {
    const studentId = req.user.id;
    const feedbackId = req.params.id;

    const allowEdit = (await getSetting('allow_student_edit', 'true')) === 'true';
    if (!allowEdit) {
      return res.status(403).json({
        success: false,
        message: 'Feedback deletion is currently disabled by university administration.'
      });
    }

    const checkRes = await query('SELECT id, student_id FROM feedback WHERE id = ?', [feedbackId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }
    if (checkRes.rows[0].student_id !== studentId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this feedback.' });
    }

    await query('DELETE FROM feedback_ratings WHERE feedback_id = ?', [feedbackId]);
    await query('DELETE FROM feedback_sentiment WHERE feedback_id = ?', [feedbackId]);
    await query('DELETE FROM feedback WHERE id = ?', [feedbackId]);

    return res.json({ success: true, message: 'Feedback deleted successfully.' });
  } catch (err) {
    console.error('[Delete Feedback Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete feedback.' });
  }
});

module.exports = router;
