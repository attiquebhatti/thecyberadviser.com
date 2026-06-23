// ────────────────────────────────────────────────────────────────
// Contact inquiries — durable store (so submissions are never lost,
// even if SMTP isn't configured yet). Reuses the CyberQuiz MySQL pool.
// ────────────────────────────────────────────────────────────────

import { pool } from '@/lib/cyberquiz/db';

let ensured = false;

async function ensureTable() {
  if (ensured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id           BIGINT       AUTO_INCREMENT PRIMARY KEY,
      full_name    VARCHAR(160) NOT NULL DEFAULT '',
      email        VARCHAR(255) NOT NULL,
      company      VARCHAR(200) NOT NULL DEFAULT '',
      topic        VARCHAR(160) NOT NULL DEFAULT '',
      details      TEXT         NOT NULL,
      emailed      TINYINT(1)   NOT NULL DEFAULT 0,
      created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  ensured = true;
}

export interface InquiryInput {
  fullName: string;
  email: string;
  company: string;
  topic: string;
  details: string;
}

export async function saveInquiry(i: InquiryInput, emailed: boolean): Promise<number | null> {
  await ensureTable();
  const [res] = (await pool.query(
    `INSERT INTO contact_inquiries (full_name, email, company, topic, details, emailed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [i.fullName || '', i.email, i.company || '', i.topic || '', i.details, emailed ? 1 : 0]
  )) as any[];
  return res?.insertId ?? null;
}

export async function listInquiries(limit = 100): Promise<any[]> {
  await ensureTable();
  const [rows] = (await pool.query(
    `SELECT id, full_name AS fullName, email, company, topic, details, emailed, created_at AS createdAt
       FROM contact_inquiries ORDER BY created_at DESC LIMIT ?`,
    [limit]
  )) as any[];
  return rows || [];
}
