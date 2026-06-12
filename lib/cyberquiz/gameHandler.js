// CJS Socket.io game handler — direct port of QuizArena's gameHandler.js
const { v4: uuidv4 } = require('uuid');
const { pool } = require('./serverDb.js');

// ── Scoring ──────────────────────────────────────────────────────────────────

function calcPoints(basePoints, responseTimeMs, timeLimitSeconds, streak) {
  const maxTime = timeLimitSeconds * 1000;
  const timeRatio = Math.max(0, 1 - responseTimeMs / maxTime);
  const speedMultiplier = 0.5 + 0.5 * timeRatio;
  let streakMultiplier = 1.0;
  if      (streak >= 10) streakMultiplier = 1.5;
  else if (streak >= 5)  streakMultiplier = 1.25;
  else if (streak >= 3)  streakMultiplier = 1.1;
  return Math.round(basePoints * speedMultiplier * streakMultiplier);
}

function calcCoins(isCorrect, streak) {
  if (!isCorrect) return 0;
  return 10 + (streak >= 5 ? 10 : streak >= 3 ? 5 : 0);
}

function roomKey(joinCode)     { return `session:${joinCode}`; }
function hostRoomKey(joinCode) { return `host:${joinCode}`;    }

async function getSession(id) {
  const [[row]] = await pool.query('SELECT * FROM sessions WHERE id = ?', [id]);
  return row ?? null;
}

async function getSessionByCode(code) {
  const [[row]] = await pool.query('SELECT * FROM sessions WHERE join_code = ?', [code]);
  return row ?? null;
}

async function getLeaderboard(sessionId) {
  const [rows] = await pool.query(
    'SELECT * FROM players WHERE session_id = ? ORDER BY score DESC',
    [sessionId]
  );
  return rows;
}

function parseOptions(row) {
  if (!row) return row;
  return {
    ...row,
    options: row.options
      ? (typeof row.options === 'string' ? JSON.parse(row.options) : row.options)
      : [],
  };
}

async function getQuestion(id) {
  const [[row]] = await pool.query('SELECT * FROM questions WHERE id = ?', [id]);
  return parseOptions(row ?? null);
}

async function getQuestions(quizId) {
  const [rows] = await pool.query(
    'SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index',
    [quizId]
  );
  return rows.map(parseOptions);
}

const autoRevealPending = new Set();

async function doStartQuestion(io, sessionId, questionIndex, joinCode) {
  const session = await getSession(sessionId);
  if (!session) return;
  const allQuestions = await getQuestions(session.quiz_id);

  let settings = {};
  try { settings = session.settings ? JSON.parse(session.settings) : {}; } catch { /* */ }
  let questionIdsOrder = settings.question_ids_order ?? null;

  if (questionIndex === 0 && settings.shuffle_questions) {
    const ids = allQuestions.map(q => q.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    questionIdsOrder = ids;
    await pool.query('UPDATE sessions SET settings = ? WHERE id = ?',
      [JSON.stringify({ ...settings, question_ids_order: ids }), sessionId]);
  }

  const question = questionIdsOrder
    ? allQuestions.find(q => q.id === questionIdsOrder[questionIndex])
    : allQuestions[questionIndex];

  if (!question) return;

  await pool.query(
    "UPDATE sessions SET current_question_index = ?, status = 'active', started_at = IFNULL(started_at, NOW()) WHERE id = ?",
    [questionIndex, sessionId]
  );

  const safeOptions = Array.isArray(question.options)
    ? question.options.map(({ text, order }) => ({ text, ...(order != null ? { order } : {}) }))
    : question.options;

  const playerQuestion = {
    id: question.id, type: question.type,
    question_text: question.question_text, image_url: question.image_url,
    options: safeOptions, time_limit_seconds: question.time_limit_seconds,
    points: question.points, order_index: questionIndex, total: allQuestions.length,
  };

  io.to(hostRoomKey(joinCode)).emit('game:question_start', {
    ...playerQuestion,
    options: question.options,
    correct_answer: question.correct_answer,
    explanation: question.explanation,
  });
  io.to(roomKey(joinCode)).emit('game:question_start', playerQuestion);

  return { question, allQuestions };
}

// ── Handler registration ─────────────────────────────────────────────────────

function registerGameHandlers(io, socket) {

  socket.on('host:join', async ({ sessionId, joinCode }) => {
    try {
      socket.join(roomKey(joinCode));
      socket.join(hostRoomKey(joinCode));
      const players = await getLeaderboard(sessionId);
      socket.emit('host:state', { players });
    } catch (err) { console.error('host:join error', err); }
  });

  socket.on('player:join', async ({ sessionCode, nickname, avatarConfig }) => {
    try {
      const session = await getSessionByCode(sessionCode);
      if (!session) return socket.emit('player:error', { message: 'Session not found' });
      if (session.status === 'completed') return socket.emit('player:error', { message: 'Game has already ended' });

      const playerId = uuidv4();
      await pool.query(
        'INSERT INTO players (id, session_id, nickname, avatar_config) VALUES (?, ?, ?, ?)',
        [playerId, session.id, nickname, JSON.stringify(avatarConfig ?? {})]
      );
      const [[player]] = await pool.query('SELECT * FROM players WHERE id = ?', [playerId]);

      socket.join(roomKey(sessionCode));
      socket.data.playerId  = playerId;
      socket.data.sessionId = session.id;
      socket.data.joinCode  = sessionCode;

      socket.emit('player:joined', { player, session });
      io.to(hostRoomKey(sessionCode)).emit('lobby:player_joined', { player });
    } catch (err) {
      console.error('player:join error', err);
      socket.emit('player:error', { message: 'Failed to join session' });
    }
  });

  socket.on('player:rejoin', async ({ playerId, sessionCode }) => {
    try {
      const session = await getSessionByCode(sessionCode);
      if (!session) return socket.emit('player:error', { message: 'Session not found' });

      const [[player]] = await pool.query(
        'SELECT * FROM players WHERE id = ? AND session_id = ?',
        [playerId, session.id]
      );
      if (!player) return socket.emit('player:error', { message: 'Player not found — please rejoin' });

      socket.join(roomKey(sessionCode));
      socket.data.playerId  = playerId;
      socket.data.sessionId = session.id;
      socket.data.joinCode  = sessionCode;

      let currentQuestion = null;
      if (session.quiz_id && session.status === 'active') {
        const allQs = await getQuestions(session.quiz_id);
        let settings = {};
        try { settings = session.settings ? JSON.parse(session.settings) : {}; } catch { /* */ }
        const idsOrder = settings.question_ids_order ?? null;
        const q = idsOrder
          ? allQs.find(x => x.id === idsOrder[session.current_question_index])
          : allQs[session.current_question_index];
        if (q) {
          const safeOptions = Array.isArray(q.options)
            ? q.options.map(({ text, order }) => ({ text, ...(order != null ? { order } : {}) }))
            : q.options;
          currentQuestion = {
            id: q.id, type: q.type, question_text: q.question_text,
            image_url: q.image_url, options: safeOptions,
            time_limit_seconds: q.time_limit_seconds, points: q.points,
            order_index: session.current_question_index, total: allQs.length,
          };
        }
      }
      socket.emit('player:rejoined', { player, session, currentQuestion });
    } catch (err) {
      console.error('player:rejoin error', err);
      socket.emit('player:error', { message: 'Rejoin failed — please refresh' });
    }
  });

  socket.on('host:start_question', async ({ sessionId, questionIndex, joinCode }) => {
    try { await doStartQuestion(io, sessionId, questionIndex, joinCode); }
    catch (err) { console.error('host:start_question error', err); }
  });

  socket.on('player:answer', async ({ sessionId, playerId, questionId, answerValue, responseTimeMs }) => {
    try {
      const [[existing]] = await pool.query(
        'SELECT id FROM answers WHERE session_id = ? AND player_id = ? AND question_id = ?',
        [sessionId, playerId, questionId]
      );
      if (existing) return;

      const question = await getQuestion(questionId);
      if (!question) return;

      let isCorrect = false;
      if (['multiple_choice', 'true_false', 'short_answer', 'fill_blank'].includes(question.type)) {
        isCorrect = answerValue?.trim().toLowerCase() === question.correct_answer?.trim().toLowerCase();
      } else {
        isCorrect = true; // poll / word_cloud
      }

      const [[player]] = await pool.query('SELECT streak FROM players WHERE id = ?', [playerId]);
      const currentStreak = player?.streak ?? 0;
      const newStreak = isCorrect ? currentStreak + 1 : 0;
      const pts   = isCorrect ? calcPoints(question.points, responseTimeMs, question.time_limit_seconds, newStreak) : 0;
      const coins = calcCoins(isCorrect, newStreak);

      await pool.query(
        `INSERT INTO answers (id, session_id, question_id, player_id, answer_value, is_correct, response_time_ms, points_earned, coins_earned)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), sessionId, questionId, playerId, answerValue ?? null, isCorrect ? 1 : 0, responseTimeMs, pts, coins]
      );
      await pool.query(
        'UPDATE players SET score = score + ?, coins = coins + ?, streak = ? WHERE id = ?',
        [pts, coins, newStreak, playerId]
      );

      socket.emit('player:answer_received', { isCorrect, pointsEarned: pts, coinsEarned: coins, streak: newStreak });

      const [[{ cnt }]] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM answers WHERE session_id = ? AND question_id = ?',
        [sessionId, questionId]
      );
      const [[{ total }]] = await pool.query(
        'SELECT COUNT(*) AS total FROM players WHERE session_id = ? AND is_eliminated = 0',
        [sessionId]
      );
      const [optionRows] = await pool.query(
        'SELECT answer_value, COUNT(*) AS cnt FROM answers WHERE session_id = ? AND question_id = ? GROUP BY answer_value',
        [sessionId, questionId]
      );
      const options = Array.isArray(question.options) ? question.options : [];
      const optionCounts = {};
      options.forEach((opt, i) => {
        const match = optionRows.find(r => r.answer_value?.trim().toLowerCase() === opt.text?.trim().toLowerCase());
        optionCounts[i] = match ? parseInt(match.cnt, 10) : 0;
      });

      const joinCode = socket.data.joinCode;
      if (joinCode) {
        const answeredCount = parseInt(cnt, 10);
        const totalPlayers  = parseInt(total, 10);
        io.to(hostRoomKey(joinCode)).emit('game:answer_count', { questionId, count: answeredCount, total: totalPlayers, optionCounts });

        if (totalPlayers > 0 && answeredCount >= totalPlayers && !autoRevealPending.has(questionId)) {
          autoRevealPending.add(questionId);
          setTimeout(async () => {
            try {
              const q = await getQuestion(questionId);
              const [answers] = await pool.query(
                'SELECT a.*, p.nickname, p.avatar_config FROM answers a JOIN players p ON p.id = a.player_id WHERE a.session_id = ? AND a.question_id = ?',
                [sessionId, questionId]
              );
              const leaderboard = await getLeaderboard(sessionId);
              io.to(roomKey(joinCode)).emit('game:reveal', {
                question: { id: q.id, type: q.type, question_text: q.question_text, options: q.options, correct_answer: q.correct_answer, explanation: q.explanation },
                answers, leaderboard,
              });
              setTimeout(async () => {
                try {
                  const session = await getSessionByCode(joinCode);
                  if (!session) return;
                  const allQs = await getQuestions(session.quiz_id);
                  const nextIdx = session.current_question_index + 1;
                  if (nextIdx >= allQs.length) {
                    await pool.query("UPDATE sessions SET status = 'completed', ended_at = NOW() WHERE id = ?", [session.id]);
                    const finalLb = await getLeaderboard(session.id);
                    io.to(roomKey(joinCode)).emit('game:ended', { leaderboard: finalLb });
                  } else {
                    await doStartQuestion(io, session.id, nextIdx, joinCode);
                  }
                } catch (err) { console.error('auto-advance error', err); }
                finally { autoRevealPending.delete(questionId); }
              }, 4000);
            } catch (err) {
              console.error('auto-reveal error', err);
              autoRevealPending.delete(questionId);
            }
          }, 1500);
        }
      }
    } catch (err) { console.error('player:answer error', err); }
  });

  socket.on('host:reveal', async ({ sessionId, questionId, joinCode }) => {
    try {
      const question = await getQuestion(questionId);
      const [answers] = await pool.query(
        'SELECT a.*, p.nickname, p.avatar_config FROM answers a JOIN players p ON p.id = a.player_id WHERE a.session_id = ? AND a.question_id = ?',
        [sessionId, questionId]
      );
      const leaderboard = await getLeaderboard(sessionId);
      io.to(roomKey(joinCode)).emit('game:reveal', {
        question: { id: question.id, type: question.type, question_text: question.question_text, options: question.options, correct_answer: question.correct_answer, explanation: question.explanation },
        answers, leaderboard,
      });
    } catch (err) { console.error('host:reveal error', err); }
  });

  socket.on('host:end_game', async ({ sessionId, joinCode }) => {
    try {
      await pool.query("UPDATE sessions SET status = 'completed', ended_at = NOW() WHERE id = ?", [sessionId]);
      const leaderboard = await getLeaderboard(sessionId);
      io.to(roomKey(joinCode)).emit('game:ended', { leaderboard });
    } catch (err) { console.error('host:end_game error', err); }
  });

  socket.on('host:kick_player', async ({ playerId, joinCode }) => {
    try {
      await pool.query('DELETE FROM players WHERE id = ?', [playerId]);
      io.to(roomKey(joinCode)).emit('lobby:player_left', { playerId });
    } catch (err) { console.error('host:kick_player error', err); }
  });

  socket.on('disconnect', async () => {
    const { playerId, joinCode } = socket.data;
    if (playerId && joinCode) {
      try { io.to(hostRoomKey(joinCode)).emit('lobby:player_left', { playerId }); }
      catch (_) { /* ignore */ }
    }
  });
}

module.exports = { registerGameHandlers };
