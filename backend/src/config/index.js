/**
 * Configuration module
 * - Reads Docker secrets from /run/secrets/ if available
 * - Falls back to .env variables
 * - Never logs sensitive values
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Read a Docker secret from /run/secrets/<name>
 * Returns the secret value or null if not found
 */
function readDockerSecret(secretName) {
  const secretPath = path.join('/run/secrets', secretName);
  try {
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, 'utf8').trim();
    }
  } catch (err) {
    // Secret file not accessible — fall back to env
  }
  return null;
}

// JWT_SECRET: Docker secret first, then .env fallback
const JWT_SECRET = readDockerSecret('jwt_secret') || process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not configured. Set it via Docker secret or .env');
  process.exit(1);
}

const config = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  JWT_SECRET,

  // PostgreSQL connection
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_USER: process.env.DB_USER || 'studdash',
  DB_PASSWORD: process.env.DB_PASSWORD || 'studdash_password',
  DB_NAME: process.env.DB_NAME || 'studdash',

  // File uploads
  UPLOAD_MAX_SIZE: 20 * 1024 * 1024, // 20MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || '/app/uploads',
};

// Log non-sensitive config on startup
console.log(`[config] PORT=${config.PORT}`);
console.log(`[config] DB_HOST=${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);
console.log(`[config] JWT_SECRET loaded from ${readDockerSecret('jwt_secret') ? 'Docker secret' : '.env file'}`);
console.log(`[config] UPLOAD_DIR=${config.UPLOAD_DIR}`);

module.exports = config;
