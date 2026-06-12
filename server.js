// Custom Next.js server with Socket.io for CyberQuiz real-time game support.
require('dotenv').config({ path: '.env.local' });

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIO } = require('socket.io');
const { registerGameHandlers } = require('./lib/cyberquiz/gameHandler.js');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIO(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    registerGameHandlers(io, socket);
    socket.on('disconnect', () => {});
  });

  // Expose io to API routes via global (rate-limited, read-only usage only)
  global.__socketIo = io;

  const PORT = parseInt(process.env.PORT || '3000', 10);
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> CyberAdviser ready on http://localhost:${PORT}`);
  });
});
