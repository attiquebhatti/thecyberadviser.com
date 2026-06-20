import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { PERSONA_V1_SEED } from '@/lib/chatbot/persona';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// AI Training Chatbot has no identity tables of its own — it reuses CyberQuiz's
// existing `profiles` table (same MySQL database) for user identity via SSO.
// Only chatbot-specific tables (courses, transcripts, chunks, logs, persona) live here.
export async function POST(req: NextRequest) {
  const secret = process.env.ATC_SEED_SECRET;
  if (!secret || req.headers.get('x-seed-secret') !== secret)
    return NextResponse.json({ error: 'Forbidden — set ATC_SEED_SECRET and pass as x-seed-secret header' }, { status: 403 });

  try {
    // "Cohort" here means an open, browsable course — any logged-in site user can pick one to chat with.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS atc_cohorts (
        id               INT          AUTO_INCREMENT PRIMARY KEY,
        name             VARCHAR(255) NOT NULL,
        course_code      VARCHAR(64)  NOT NULL,
        instructor_name  VARCHAR(255) NOT NULL DEFAULT 'Attique Bhatti',
        is_listed        TINYINT(1)   NOT NULL DEFAULT 1,
        starts_at        DATETIME     NULL,
        expires_at       DATETIME     NULL,
        created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_course_code (course_code),
        INDEX idx_listed (is_listed)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS atc_transcripts (
        id               INT          AUTO_INCREMENT PRIMARY KEY,
        cohort_id        INT          NOT NULL,
        session_number   INT          NOT NULL,
        title            VARCHAR(255) NOT NULL DEFAULT '',
        file_name        VARCHAR(255) NOT NULL,
        file_path        VARCHAR(512) NOT NULL,
        status           ENUM('pending','review_needed','processing','published','failed') NOT NULL DEFAULT 'pending',
        raw_text         LONGTEXT     NULL,
        processing_error TEXT         NULL,
        created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        processed_at     DATETIME     NULL,
        INDEX idx_cohort_session (cohort_id, session_number),
        INDEX idx_status (status),
        CONSTRAINT fk_transcript_cohort FOREIGN KEY (cohort_id) REFERENCES atc_cohorts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS atc_chunks (
        id               BIGINT       AUTO_INCREMENT PRIMARY KEY,
        transcript_id    INT          NOT NULL,
        cohort_id        INT          NOT NULL,
        chunk_index      INT          NOT NULL,
        text             TEXT         NOT NULL,
        embedding        JSON         NOT NULL,
        created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_transcript (transcript_id),
        INDEX idx_cohort (cohort_id),
        CONSTRAINT fk_chunk_transcript FOREIGN KEY (transcript_id) REFERENCES atc_transcripts(id) ON DELETE CASCADE,
        CONSTRAINT fk_chunk_cohort     FOREIGN KEY (cohort_id)     REFERENCES atc_cohorts(id)     ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // user_id stores CyberQuiz's profiles.id (VARCHAR(36) UUID) — no FK constraint since
    // profiles isn't formally migrated in this repo either; identity is trusted via JWT, not DB FK.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS atc_question_logs (
        id               BIGINT       AUTO_INCREMENT PRIMARY KEY,
        cohort_id        INT          NOT NULL,
        user_id          VARCHAR(36)  NOT NULL,
        question         TEXT         NOT NULL,
        response         LONGTEXT     NOT NULL,
        sources          JSON         NULL,
        feedback         TINYINT      NULL,
        feedback_text    TEXT         NULL,
        created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cohort (cohort_id),
        INDEX idx_user (user_id),
        INDEX idx_created (created_at),
        CONSTRAINT fk_qlog_cohort FOREIGN KEY (cohort_id) REFERENCES atc_cohorts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS atc_persona_versions (
        id               INT          AUTO_INCREMENT PRIMARY KEY,
        prompt_text      LONGTEXT     NOT NULL,
        is_active        TINYINT(1)   NOT NULL DEFAULT 0,
        created_by       VARCHAR(255) NOT NULL DEFAULT '',
        created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // Seed persona v1 only if no active version exists yet (idempotent)
    const [[activeCount]] = await pool.query(
      'SELECT COUNT(*) AS n FROM atc_persona_versions WHERE is_active = 1'
    ) as any[];
    let personaSeeded = false;
    if (activeCount.n === 0) {
      await pool.query(
        'INSERT INTO atc_persona_versions (prompt_text, is_active, created_by) VALUES (?, 1, ?)',
        [PERSONA_V1_SEED, 'system-seed']
      );
      personaSeeded = true;
    }

    return NextResponse.json({ ok: true, message: 'Migration complete.', personaSeeded });
  } catch (err: any) {
    console.error('chatbot migrate error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
