import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pool from './db.js';
import licensesRouter from './routes/licenses.js';
import agenciesRouter from './routes/agencies.js';
import locationsRouter from './routes/locations.js';
import industriesRouter from './routes/industries.js';
import businesstypesRouter from './routes/businesstypes.js';
import activitiesRouter from './routes/activities.js';
import regulationsRouter from './routes/regulations.js';
import contentRouter from './routes/content.js';
import workflowsRouter from './routes/workflows.js';
import searchRouter from './routes/search.js';
import linkClicksRouter from './routes/linkclicks.js';
import licenseAdminRouter from './routes/license-admin.js';
import usersRouter from './routes/users.js';
import statsRouter from './routes/stats.js';

// Resolve .env relative to this file, not the working directory (see db.js).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
// Railway injects PORT for the service and routes external traffic to it.
// Always trust process.env.PORT when present; only fall back to 8080 (the
// port Railway routes the public domain to) when PORT is unset or unusable.
// NOTE: never hardcode a DB port (e.g. 3306/5432) here — those belong to the
// separate MySQL service, not this API's HTTP listener.
const parsedPort = parseInt(process.env.PORT, 10);
const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 8080;
console.log(`[index.js] Using PORT=${PORT} (from ${process.env.PORT ? 'process.env.PORT' : 'default 8080'})`);

// Ensure the process doesn't die silently without logging why
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

// CORS: merge Railway/local env with defaults so production frontend still works if CORS_ORIGIN is wrong/missing.
const DEFAULT_CORS_ORIGINS = [
  'https://brraeregliverailway-production.up.railway.app',
  'https://zambia-business-hub-production.up.railway.app',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

function parseCorsOrigins(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((o) => o.trim()).filter(Boolean);
}

const corsOriginsFromEnv = parseCorsOrigins(process.env.CORS_ORIGIN);
const allowedCorsOrigins = [...new Set([...corsOriginsFromEnv, ...DEFAULT_CORS_ORIGINS])];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedCorsOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());

// Routes
app.use('/api/licenses', licensesRouter);
app.use('/api/agencies', agenciesRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/industries', industriesRouter);
app.use('/api/businesstypes', businesstypesRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/regulations', regulationsRouter);
app.use('/api/content', contentRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/search', searchRouter);
app.use('/api/link-clicks', linkClicksRouter);
app.use('/api/license-admin', licenseAdminRouter);
app.use('/api/users', usersRouter);
app.use('/api/stats', statsRouter);

// Serve uploaded files
app.use('/uploads', express.static(new URL('../uploads', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')));

// Serve built frontend (if dist exists)
const distPath = new URL('../../dist', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
app.use(express.static(distPath));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('[/api/health] DB connection error:', {
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

// Names only of any database-ish environment variables present, so a
// misnamed or wrongly-scoped reference variable is visible without ever
// exposing a value. Never return the values themselves.
function dbEnvVarNames() {
  return Object.keys(process.env)
    .filter((k) => /mysql|maria|database|^db_|^pg|postgres/i.test(k))
    .sort();
}

// DB diagnostic endpoint — returns full error details to aid debugging
app.get('/api/db-test', async (req, res) => {
  const startMs = Date.now();
  let conn;
  try {
    conn = await pool.getConnection();
    const [[row]] = await conn.query('SELECT 1 AS ok, NOW() AS server_time');
    const elapsed = Date.now() - startMs;
    console.log('[/api/db-test] Query succeeded in %dms, server_time=%s', elapsed, row.server_time);
    res.json({
      status: 'ok',
      database: 'connected',
      elapsed_ms: elapsed,
      server_time: row.server_time,
      config: {
        host: process.env.MYSQLHOST || process.env.DB_HOST || '(not set)',
        port: process.env.MYSQLPORT || process.env.DB_PORT || '(not set)',
        user: process.env.MYSQLUSER || process.env.DB_USER || '(not set)',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || '(not set)',
        mysql_url_set: !!process.env.MYSQL_URL,
        mysql_public_url_set: !!process.env.MYSQL_PUBLIC_URL,
      },
      db_env_var_names: dbEnvVarNames(),
    });
  } catch (err) {
    const elapsed = Date.now() - startMs;
    console.error('[/api/db-test] DB connection FAILED after %dms:', elapsed, {
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      elapsed_ms: elapsed,
      error: {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        message: err.message,
      },
      config: {
        host: process.env.MYSQLHOST || process.env.DB_HOST || '(not set)',
        port: process.env.MYSQLPORT || process.env.DB_PORT || '(not set)',
        user: process.env.MYSQLUSER || process.env.DB_USER || '(not set)',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || '(not set)',
        mysql_url_set: !!process.env.MYSQL_URL,
        mysql_public_url_set: !!process.env.MYSQL_PUBLIC_URL,
      },
      db_env_var_names: dbEnvVarNames(),
    });
  } finally {
    if (conn) conn.release();
  }
});

// Dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const [[{ licenses }]] = await pool.query(
      'SELECT COUNT(*) as licenses FROM businesslicense WHERE deleted = 0'
    );
    const [[{ agencies }]] = await pool.query(
      'SELECT COUNT(*) as agencies FROM businessagency WHERE deleted = 0'
    );
    const [[{ regulations }]] = await pool.query(
      'SELECT COUNT(*) as regulations FROM regulations WHERE deleted = 0'
    );
    const [[{ open_regulations }]] = await pool.query(
      "SELECT COUNT(*) as open_regulations FROM regulations WHERE deleted = 0 AND published = 1 AND closing_date >= CURDATE()"
    );
    const [[{ locations }]] = await pool.query(
      'SELECT COUNT(*) as locations FROM businesslocation WHERE deleted = 0'
    );
    const [[{ industries }]] = await pool.query(
      'SELECT COUNT(*) as industries FROM businessindustry WHERE deleted = 0'
    );
    const [[{ business_types }]] = await pool.query(
      'SELECT COUNT(*) as business_types FROM businesstype WHERE deleted = 0'
    );
    const [[{ activities }]] = await pool.query(
      'SELECT COUNT(*) as activities FROM businessactivity WHERE deleted = 0'
    );
    const [[{ comments }]] = await pool.query(
      'SELECT COUNT(*) as comments FROM comments WHERE deleted = 0'
    );
    const [[{ pending_comments }]] = await pool.query(
      'SELECT COUNT(*) as pending_comments FROM comments WHERE deleted = 0 AND pending_review = 1'
    );
    const [[{ feedback }]] = await pool.query(
      'SELECT COUNT(*) as feedback FROM feedback WHERE replied = 0'
    );
    const [[{ news }]] = await pool.query(
      'SELECT COUNT(*) as news FROM news WHERE deleted = 0 AND published = 1'
    );

    res.json({
      success: true,
      data: {
        licenses,
        agencies,
        regulations,
        open_regulations,
        locations,
        industries,
        business_types,
        activities,
        comments,
        pending_comments,
        feedback_pending: feedback,
        news,
      },
    });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// IMPORTANT: API 404 handler - catches any unmatched /api/* routes
// This MUST come before the SPA fallback
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint not found: ${req.method} ${req.path}` });
});

// SPA fallback — ONLY for non-API routes (MUST come AFTER the API 404 handler)
const indexHtmlPath = new URL('../../dist/index.html', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
if (fs.existsSync(indexHtmlPath)) {
  app.get('*', (req, res) => {
    res.sendFile(indexHtmlPath);
  });
} else {
  // If no frontend build exists, return a simple message
  app.get('*', (req, res) => {
    res.status(200).json({ 
      message: 'Backend API is running. Frontend not built yet.',
      apiEndpoints: '/api/licenses, /api/agencies, /api/industries, etc.'
    });
  });
}

// General error handler (keep at the end)
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});



app.listen(PORT, '0.0.0.0', () => {
  console.log(`eRegistry API server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log('Server running on port', PORT);
});
