'use client';
import { io, Socket } from 'socket.io-client';

// Singleton Socket.io client — shared by host and player views.
// Connects to the same origin (our custom Next.js + Socket.io server).
let socket: Socket;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}
