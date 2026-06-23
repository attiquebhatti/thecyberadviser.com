// ────────────────────────────────────────────────────────────────
// Config Migration — usage logging (who ran a migration, when, what)
// ────────────────────────────────────────────────────────────────
//
// The migration itself runs client-side; after a run the browser POSTs
// a small record here so the admin Insights dashboard can show how many
// migrations have been run and by whom. Reuses the CyberQuiz MySQL pool.
//

import { pool } from '@/lib/cyberquiz/db';

let ensured = false;

async function ensureTable() {
  if (ensured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migration_runs (
      id             BIGINT       AUTO_INCREMENT PRIMARY KEY,
      user_id        VARCHAR(64)  NOT NULL,
      user_email     VARCHAR(255) NOT NULL DEFAULT '',
      user_name      VARCHAR(255) NOT NULL DEFAULT '',
      source_vendor  VARCHAR(40)  NOT NULL DEFAULT '',
      target_vendor  VARCHAR(40)  NOT NULL DEFAULT '',
      file_name      VARCHAR(255) NOT NULL DEFAULT '',
      automated_rate INT          NULL,
      flagged        INT          NULL,
      created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (user_id),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  ensured = true;
}

export interface MigrationRunRecord {
  userId: string;
  userEmail: string;
  userName: string;
  sourceVendor: string;
  targetVendor: string;
  fileName: string;
  automatedRate?: number | null;
  flagged?: number | null;
}

export async function recordMigrationRun(r: MigrationRunRecord): Promise<void> {
  await ensureTable();
  await pool.query(
    `INSERT INTO migration_runs
       (user_id, user_email, user_name, source_vendor, target_vendor, file_name, automated_rate, flagged)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.userId, r.userEmail || '', r.userName || '',
      (r.sourceVendor || '').slice(0, 40), (r.targetVendor || '').slice(0, 40),
      (r.fileName || '').slice(0, 255),
      r.automatedRate ?? null, r.flagged ?? null,
    ]
  );
}

export interface MigrationInsights {
  totalRuns: number;
  uniqueUsers: number;
  runsLast30Days: number;
  byUser: { user: string; email: string; runs: number; lastRun: string }[];
  byTarget: { target: string; runs: number }[];
  recent: { user: string; email: string; source: string; target: string; fileName: string; at: string }[];
}

export async function getMigrationInsights(): Promise<MigrationInsights> {
  await ensureTable();
  const [[totals]] = (await pool.query(
    `SELECT COUNT(*) AS totalRuns,
            COUNT(DISTINCT user_id) AS uniqueUsers,
            SUM(created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS runsLast30Days
       FROM migration_runs`
  )) as any[];
  const [byUser] = (await pool.query(
    `SELECT user_name AS user, user_email AS email, COUNT(*) AS runs, MAX(created_at) AS lastRun
       FROM migration_runs GROUP BY user_id, user_name, user_email ORDER BY runs DESC LIMIT 50`
  )) as any[];
  const [byTarget] = (await pool.query(
    `SELECT target_vendor AS target, COUNT(*) AS runs FROM migration_runs GROUP BY target_vendor ORDER BY runs DESC`
  )) as any[];
  const [recent] = (await pool.query(
    `SELECT user_name AS user, user_email AS email, source_vendor AS source, target_vendor AS target, file_name AS fileName, created_at AS at
       FROM migration_runs ORDER BY created_at DESC LIMIT 25`
  )) as any[];
  return {
    totalRuns: Number(totals?.totalRuns || 0),
    uniqueUsers: Number(totals?.uniqueUsers || 0),
    runsLast30Days: Number(totals?.runsLast30Days || 0),
    byUser: byUser || [],
    byTarget: byTarget || [],
    recent: recent || [],
  };
}
