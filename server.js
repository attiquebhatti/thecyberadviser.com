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


const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': "frame-ancestors 'self'; upgrade-insecure-requests",
};

function shouldUseSeoCachePolicy(req) {
  const path = parse(req.url || '/', true).pathname || '/';
  if (path.startsWith('/_next/static/') || path.startsWith('/_next/image')) return false;
  if (/\.(?:js|css|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|map)$/i.test(path)) return false;
  return req.method === 'GET' || req.method === 'HEAD';
}

function applySeoHeaders(req, res) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    res.setHeader(key, value);
  }

  if (shouldUseSeoCachePolicy(req)) {
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const writeHead = res.writeHead.bind(res);

    res.writeHead = function patchedWriteHead(...args) {
      applySeoHeaders(req, res);
      return writeHead(...args);
    };

    applySeoHeaders(req, res);
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
