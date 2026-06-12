// Custom Next.js server with Socket.io for CyberQuiz real-time game support.
require('dotenv').config({ path: '.env.local' });

// Ensure NODE_ENV is set (some hosts don't inline env prefixes)
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Socket.io is optional — wrap in try/catch so a socket setup failure
  // doesn't bring down the entire HTTP server (CyberQuiz pages still work,
  // only live multiplayer sessions are affected).
  try {
    const { Server: SocketIO } = require('socket.io');
    const { registerGameHandlers } = require('./lib/cyberquiz/gameHandler.js');

    const io = new SocketIO(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
      transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
      try { registerGameHandlers(io, socket); } catch (e) { console.error('gameHandler error:', e); }
      socket.on('disconnect', () => {});
    });

    global.__socketIo = io;
    console.log('> Socket.io ready');
  } catch (err) {
    console.warn('> Socket.io init failed (live games disabled):', err.message);
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> CyberAdviser ready on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('> Fatal: Next.js failed to prepare:', err);
  process.exit(1);
});
