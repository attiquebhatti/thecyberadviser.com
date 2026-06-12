// CJS MySQL pool used by server.js and gameHandler.js (outside Next.js compilation).
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.CQ_DB_HOST     || 'localhost',
  port:     parseInt(process.env.CQ_DB_PORT || '3306', 10),
  user:     process.env.CQ_DB_USER     || 'root',
  password: process.env.CQ_DB_PASS     || '',
  database: process.env.CQ_DB_NAME     || 'quizarena',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
  typeCast(field, next) {
    if (field.type === 'TINY' && field.length === 1) return field.string() === '1';
    return next();
  },
});

module.exports = { pool };
