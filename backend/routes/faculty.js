const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Require faculty role
router.use(authenticateToken, authorizeRoles('faculty'));

// GET /api/faculty/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const facultyId = req.user.id;

    // Get subjects assigned to this faculty
    const assignedSubjectsRes = await query(
      `SELECT s.id, s.code, s.name, s.semester
       FROM faculty_subjects fs
       JOIN subjects s ON fs.subject_id = s.id
       WHERE fs.faculty_id = ?`,
      [facultyId]
    );
    const subjects = assignedSubjectsRes.rows;
    const subjectIds = subjects.map(s => s.id);

    // Total Feedback Count
    let totalFeedback = 0;
    let avgRatings = {
      overall: 0.0,
      teaching_quality: 0.0,
      subject_knowledge: 0.0,
      communication: 0.0,
      doubt_clarification: 0.0,
      classroom_interaction: 0.0,
      punctuality: 0.0
    };
    let sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 };
    let positiveHighlights = [];
    let commonComplaints = [];
    let suggestions = [];

    const feedbackRes = await query(
      `SELECT f.id, f.written_feedback, f.feedback_category, f.is_anonymous, f.created_at,
              fr.teaching_quality, fr.subject_knowledge, fr.communication, fr.doubt_clarification, fr.classroom_interaction, fr.punctuality, fr.average_rating,
              fs.sentiment, fs.sentiment_score, fs.confidence_score, fs.positive_aspects, fs.negative_aspects, fs.suggestions
       FROM feedback f
       JOIN feedback_ratings fr ON f.id = fr.feedback_id
       JOIN feedback_sentiment fs ON f.id = fs.feedback_id
       WHERE f.faculty_id = ?`,
      [facultyId]
    );

    const rows = feedbackRes.rows;
    totalFeedback = rows.length;

    if (totalFeedback > 0) {
      let sumOverall = 0;
      let sumTQ = 0, sumSK = 0, sumCOM = 0, sumDC = 0, sumCI = 0, sumPUNC = 0;

      rows.forEach(r => {
        sumOverall += Number(r.average_rating || 0);
        sumTQ += Number(r.teaching_quality || 0);
        sumSK += Number(r.subject_knowledge || 0);
        sumCOM += Number(r.communication || 0);
        sumDC += Number(r.doubt_clarification || 0);
        sumCI += Number(r.classroom_interaction || 0);
        sumPUNC += Number(r.punctuality || 0);

        const sent = r.sentiment || 'Neutral';
        if (sentimentCounts[sent] !== undefined) {
          sentimentCounts[sent]++;
        } else {
          sentimentCounts[sent] = 1;
        }

        // Collect insights
        try {
          const pos = r.positive_aspects ? JSON.parse(r.positive_aspects) : [];
          pos.forEach(p => { if (p && !positiveHighlights.includes(p)) positiveHighlights.push(p); });
        } catch (e) {}

        try {
          const neg = r.negative_aspects ? JSON.parse(r.negative_aspects) : [];
          neg.forEach(n => { if (n && !commonComplaints.includes(n)) commonComplaints.push(n); });
        } catch (e) {}

        try {
          const sug = r.suggestions ? JSON.parse(r.suggestions) : [];
          sug.forEach(s => { if (s && !suggestions.includes(s)) suggestions.push(s); });
        } catch (e) {}
      });

      avgRatings = {
        overall: Number((sumOverall / totalFeedback).toFixed(2)),
        teaching_quality: Number((sumTQ / totalFeedback).toFixed(2)),
        subject_knowledge: Number((sumSK / totalFeedback).toFixed(2)),
        communication: Number((sumCOM / totalFeedback).toFixed(2)),
        doubt_clarification: Number((sumDC / totalFeedback).toFixed(2)),
        classroom_interaction: Number((sumCI / totalFeedback).toFixed(2)),
        punctuality: Number((sumPUNC / totalFeedback).toFixed(2))
      };
    }

    // Prepare sentiment chart data
    const sentimentDistribution = [
      { name: 'Positive', count: sentimentCounts.Positive, percentage: totalFeedback ? Math.round((sentimentCounts.Positive / totalFeedback) * 100) : 0, color: '#10B981' },
      { name: 'Neutral', count: sentimentCounts.Neutral, percentage: totalFeedback ? Math.round((sentimentCounts.Neutral / totalFeedback) * 100) : 0, color: '#F59E0B' },
      { name: 'Negative', count: sentimentCounts.Negative, percentage: totalFeedback ? Math.round((sentimentCounts.Negative / totalFeedback) * 100) : 0, color: '#EF4444' }
    ];

    return res.json({
      success: true,
      stats: {
        totalFeedback,
        assignedSubjectsCount: subjects.length,
        averageRatings: avgRatings,
        sentimentCounts
      },
      sentimentDistribution,
      assignedSubjects: subjects,
      insights: {
        positiveHighlights: positiveHighlights.slice(0, 5),
        commonComplaints: commonComplaints.slice(0, 5),
        suggestions: suggestions.slice(0, 5)
      }
    });
  } catch (err) {
    console.error('[Faculty Dashboard Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to load faculty dashboard.' });
  }
});

// GET /api/faculty/feedback (Filtered feedback list with anonymous privacy protection)
router.get('/feedback', async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { subject_id, sentiment, min_rating, start_date, end_date } = req.query;

    let sql = `
      SELECT f.id, f.is_anonymous, f.written_feedback, f.feedback_category, f.status, f.created_at,
             s.name AS subject_name, s.code AS subject_code,
             u.name AS student_name, u.register_number AS student_reg,
             fr.teaching_quality, fr.subject_knowledge, fr.communication, fr.doubt_clarification, fr.classroom_interaction, fr.punctuality, fr.average_rating,
             fs.sentiment, fs.sentiment_score, fs.confidence_score, fs.keywords, fs.detected_topics, fs.positive_aspects, fs.negative_aspects, fs.suggestions
      FROM feedback f
      LEFT JOIN subjects s ON f.subject_id = s.id
      LEFT JOIN users u ON f.student_id = u.id
      LEFT JOIN feedback_ratings fr ON f.id = fr.feedback_id
      LEFT JOIN feedback_sentiment fs ON f.id = fs.feedback_id
      WHERE f.faculty_id = ?
    `;
    const params = [facultyId];

    if (subject_id) {
      sql += ' AND f.subject_id = ?';
      params.push(subject_id);
    }
    if (sentiment) {
      sql += ' AND fs.sentiment = ?';
      params.push(sentiment);
    }
    if (min_rating) {
      sql += ' AND fr.average_rating >= ?';
      params.push(Number(min_rating));
    }
    if (start_date) {
      sql += ' AND f.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND f.created_at <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY f.created_at DESC';

    const feedbackRes = await query(sql, params);

    // STRICT PRIVACY PROTECTION: Mask student identity if is_anonymous = 1
    const sanitizedFeedback = feedbackRes.rows.map(row => {
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

      const isAnonymous = Boolean(row.is_anonymous);
      return {
        id: row.id,
        is_anonymous: isAnonymous,
        student_name: isAnonymous ? 'Anonymous Student' : row.student_name,
        student_reg: isAnonymous ? 'REDACTED' : row.student_reg,
        subject_name: row.subject_name,
        subject_code: row.subject_code,
        feedback_category: row.feedback_category,
        written_feedback: row.written_feedback,
        status: row.status,
        created_at: row.created_at,
        ratings: {
          teaching_quality: row.teaching_quality,
          subject_knowledge: row.subject_knowledge,
          communication: row.communication,
          doubt_clarification: row.doubt_clarification,
          classroom_interaction: row.classroom_interaction,
          punctuality: row.punctuality,
          average_rating: row.average_rating
        },
        sentiment: {
          label: row.sentiment,
          score: row.sentiment_score,
          confidence: row.confidence_score,
          keywords,
          detected_topics,
          positive_aspects,
          negative_aspects,
          suggestions
        }
      };
    });

    return res.json({
      success: true,
      count: sanitizedFeedback.length,
      feedback: sanitizedFeedback
    });
  } catch (err) {
    console.error('[Faculty Feedback Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve feedback.' });
  }
});

module.exports = router;
