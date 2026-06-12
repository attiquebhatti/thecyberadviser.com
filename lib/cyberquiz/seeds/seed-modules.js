/**
 * Seed module question banks into the live DB.
 * Usage:
 *   node lib/cyberquiz/seeds/seed-modules.js
 *
 * Requirements:
 *   - CQ_SEED_SECRET must be set in .env.local
 *   - The server must be running on localhost:3000
 *   - Place module_question_banks_seed.json in this same directory
 */

const fs   = require('fs');
const path = require('path');

// Load env vars from .env.local
const envPath = path.join(__dirname, '../../../.env.local');
const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
const env = {};
for (const line of envLines) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
}

const SEED_SECRET = env.CQ_SEED_SECRET;
if (!SEED_SECRET) {
  console.error('ERROR: CQ_SEED_SECRET not found in .env.local');
  process.exit(1);
}

const seedFile = path.join(__dirname, 'module_question_banks_seed.json');
if (!fs.existsSync(seedFile)) {
  console.error(`ERROR: Seed file not found at:\n  ${seedFile}`);
  console.error('\nCopy the file from:');
  console.error('  C:\\App Development\\QuizArena\\QuizArena_Learning_Platform\\server\\scripts\\module_question_banks_seed.json');
  process.exit(1);
}

const questions = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
console.log(`Loaded ${questions.length} questions.`);

const SITE_URL  = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const ENDPOINT  = `${SITE_URL}/api/cyberquiz/question-banks/_seed-modules`;
const CHUNK     = 500;

async function sendChunk(batch, chunkIndex, totalChunks) {
  const res  = await fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-seed-secret': SEED_SECRET },
    body:    JSON.stringify({ questions: batch, truncate: chunkIndex === 0 }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(body));
  process.stdout.write(`  chunk ${chunkIndex + 1}/${totalChunks} → inserted ${body.inserted ?? batch.length}\n`);
}

(async () => {
  const chunks = [];
  for (let i = 0; i < questions.length; i += CHUNK) chunks.push(questions.slice(i, i + CHUNK));
  console.log(`Sending ${chunks.length} chunk(s) of up to ${CHUNK} questions each…`);

  // First chunk initialises the table and clears old module rows.
  // Subsequent chunks just append.  The route handles idempotency.
  try {
    for (let i = 0; i < chunks.length; i++) {
      await sendChunk(chunks[i], i, chunks.length);
    }
    console.log(`\nSUCCESS: seeded ${questions.length} questions.`);
  } catch (err) {
    console.error('\nFAILED:', err.message);
    process.exit(1);
  }
})();
