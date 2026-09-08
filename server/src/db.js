import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve .env relative to this file, not the working directory, so the server
// loads server/.env no matter which directory it is started from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function parseMysqlUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: parseInt(u.port) || 3306,
      user: u.username,
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
    };
  } catch {
    return null;
  }
}

const connString =
  parseMysqlUrl(process.env.MYSQL_URL) ||
  parseMysqlUrl(process.env.MYSQL_PUBLIC_URL) ||
  {};

const config = {
  host: connString.host || process.env.MYSQLHOST || process.env.DB_HOST,
  port: connString.port || parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10),
  user: connString.user || process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: connString.password || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: connString.database || process.env.MYSQLDATABASE || process.env.DB_NAME || 'zambiaeregistry',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

if (!config.host) {
  console.error(
    '[db.js] No MySQL host configured. Set MYSQL_URL or MYSQLHOST (via Railway reference variables ' +
    'from the linked MySQL service), or DB_HOST for local development. Refusing to default to localhost.'
  );
}

console.log('[db.js] DB config:', {
  host: config.host,
  port: config.port,
  user: config.user,
  database: config.database,
  password: config.password ? '***set***' : '***empty***',
  envVarsPresent: {
    MYSQL_URL: !!process.env.MYSQL_URL,
    MYSQL_PUBLIC_URL: !!process.env.MYSQL_PUBLIC_URL,
    MYSQLHOST: !!process.env.MYSQLHOST,
    MYSQLPORT: !!process.env.MYSQLPORT,
    MYSQLUSER: !!process.env.MYSQLUSER,
    MYSQLPASSWORD: !!process.env.MYSQLPASSWORD,
    MYSQLDATABASE: !!process.env.MYSQLDATABASE,
    DB_HOST: !!process.env.DB_HOST,
  },
});

const pool = mysql.createPool(config);

// Log any connection-level errors emitted by the pool
pool.on('connection', (connection) => {
  console.log('[db.js] New connection established, threadId:', connection.threadId);
  connection.on('error', (err) => {
    console.error('[db.js] Connection error (threadId %d): code=%s message=%s', connection.threadId, err.code, err.message, err);
  });
});

pool.on('acquire', (connection) => {
  console.log('[db.js] Connection acquired from pool, threadId:', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('[db.js] Connection released back to pool, threadId:', connection.threadId);
});

// Eagerly test the pool on startup so any misconfiguration surfaces immediately
pool.getConnection()
  .then((conn) => {
    console.log('[db.js] Pool connectivity check passed — threadId:', conn.threadId);
    conn.release();
  })
  .catch((err) => {
    console.error('[db.js] Pool connectivity check FAILED:', {
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      message: err.message,
      stack: err.stack,
    });
  });

export default pool;
