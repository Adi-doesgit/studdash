/**
 * Student Dashboard Backend - Main Entry Point
 * - Express server with CORS, JSON parsing, rate limiting
 * - Mounts all route handlers with role-based access
 * - Exposes /metrics for Prometheus
 * - Implements graceful shutdown (SIGINT, SIGTERM)
 */

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const pool = require('./db/pool');
const { client, metricsMiddleware } = require('./metrics');

// Import routes
const authRoutes = require('./routes/auth');
const gradesRoutes = require('./routes/grades');
const notesRoutes = require('./routes/notes');
const assignmentsRoutes = require('./routes/assignments');
const adminRoutes = require('./routes/admin');

const app = express();

// --- Ensure upload directories exist (audit fix #2) ---
const uploadDirs = [
  `${config.UPLOAD_DIR}/notes`,
  `${config.UPLOAD_DIR}/assignments`,
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[init] Created upload directory: ${dir}`);
  }
});

// --- Middleware ---

// CRITICAL: Trust proxy headers (X-Forwarded-For) from nginx
// Without this, express-rate-limit crashes with ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://studdash.local',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(metricsMiddleware);

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  validate: { xForwardedForHeader: false },
});
app.use('/api/', limiter);

// --- Routes ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/admin', adminRoutes);

// --- Prometheus metrics endpoint ---
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// --- Start server ---
const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`[server] Backend running on port ${config.PORT}`);
});

// --- Graceful shutdown ---
function shutdown(signal) {
  console.log(`\n[server] ${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log('[server] HTTP server closed');

    try {
      await pool.end();
      console.log('[server] PostgreSQL pool closed');
    } catch (err) {
      console.error('[server] Error closing pool:', err.message);
    }

    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    console.error('[server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app; // Export for testing
