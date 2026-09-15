require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getMode } = require('./database/db');
const { seed } = require('./database/seed');

// Import route modules
const authRoutes = require('./routes/auth');
const metadataRoutes = require('./routes/metadata');
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Student Feedback API Backend',
    database: getMode(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.method} ${req.originalUrl} not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
async function startServer() {
  try {
    await initDatabase();
    // Auto-seed demo data if fresh
    await seed();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` Student Feedback Sentiment Backend Running!       `);
      console.log(` Port:     http://localhost:${PORT}                 `);
      console.log(` Database: ${getMode().toUpperCase()}               `);
      console.log(` Health:   http://localhost:${PORT}/api/health      `);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Server Startup Failure]', err);
    process.exit(1);
  }
}

startServer();
