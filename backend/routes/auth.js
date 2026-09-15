const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { query } = require('../database/db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

// POST /api/auth/register (Student Registration)
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Full Name is required'),
    body('register_number').trim().notEmpty().withMessage('Register Number is required'),
    body('email').trim().isEmail().withMessage('Valid College Email is required'),
    body('department_id').notEmpty().withMessage('Department is required'),
    body('year').isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirm_password').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, register_number, email, department_id, year, password } = req.body;

      // Check existing email or register number
      const existing = await query(
        'SELECT id, email, register_number FROM users WHERE email = ? OR register_number = ?',
        [email.toLowerCase(), register_number.toUpperCase()]
      );

      if (existing.rows.length > 0) {
        const found = existing.rows[0];
        if (found.email.toLowerCase() === email.toLowerCase()) {
          return res.status(400).json({ success: false, message: 'Email address is already registered.' });
        }
        return res.status(400).json({ success: false, message: 'Register Number is already registered.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create student user
      const result = await query(
        `INSERT INTO users (name, email, register_number, password_hash, role, department_id, year, is_active)
         VALUES (?, ?, ?, ?, 'student', ?, ?, 1)`,
        [name, email.toLowerCase(), register_number.toUpperCase(), password_hash, department_id, year]
      );

      const newUserId = result.insertId;

      // Fetch created user with department
      const userRes = await query(
        `SELECT u.id, u.name, u.email, u.register_number, u.role, u.department_id, u.year, d.name AS department_name, d.code AS department_code
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE u.id = ?`,
        [newUserId]
      );
      const user = userRes.rows[0];

      // Sign JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name, department_id: user.department_id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to the feedback system.',
        token,
        user
      });
    } catch (err) {
      console.error('[Register Error]', err);
      return res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('identifier').trim().notEmpty().withMessage('Email or Register Number is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').optional().isIn(['student', 'faculty', 'admin']).withMessage('Invalid role specified')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { identifier, password, role } = req.body;
      const cleanIdent = identifier.trim();

      // Find user by email or register number
      const userRes = await query(
        `SELECT u.id, u.name, u.email, u.register_number, u.password_hash, u.role, u.department_id, u.year, u.is_active,
                d.name AS department_name, d.code AS department_code
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE LOWER(u.email) = LOWER(?) OR UPPER(u.register_number) = UPPER(?)`,
        [cleanIdent, cleanIdent]
      );

      if (userRes.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      }

      const user = userRes.rows[0];

      if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact administrator.' });
      }

      // Check role if specified
      if (role && user.role !== role) {
        return res.status(401).json({
          success: false,
          message: `This account does not have ${role.toUpperCase()} privileges. Please choose the correct role.`
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name, department_id: user.department_id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Exclude password_hash
      delete user.password_hash;

      return res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        token,
        user
      });
    } catch (err) {
      console.error('[Login Error]', err);
      return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userRes = await query(
      `SELECT u.id, u.name, u.email, u.register_number, u.role, u.department_id, u.year, u.is_active,
              d.name AS department_name, d.code AS department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      user: userRes.rows[0]
    });
  } catch (err) {
    console.error('[Me Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
});

module.exports = router;
