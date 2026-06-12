import mysql from 'mysql2/promise';

// Singleton pool — reused across hot-reloads in dev via globalThis cache
declare global {
  // eslint-disable-next-line no-var
  var __cqPool: mysql.Pool | undefined;
}

function createPool() {
  return mysql.createPool({
    host:     process.env.CQ_DB_HOST || 'localhost',
    port:     parseInt(process.env.CQ_DB_PORT || '3306', 10),
    user:     process.env.CQ_DB_USER || 'root',
    password: process.env.CQ_DB_PASS || '',
    database: process.env.CQ_DB_NAME || 'quizarena',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z',
    typeCast(field, next) {
      if (field.type === 'TINY' && field.length === 1) return field.string() === '1';
      return next();
    },
  });
}

export const pool: mysql.Pool =
  globalThis.__cqPool ?? (globalThis.__cqPool = createPool());
