/**
 * PostgreSQL Connection Pool
 * - Uses pg Pool for connection management
 * - Reads config from environment/Docker secrets
 */

const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool events
pool.on('connect', () => {
  console.log('[db] New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message);
});

module.exports = pool;
