import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e7 // 10MB limit for high-res photo uploads
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Store active users and message history per room
const roomUsers = new Map();     // roomCode -> Map of socketId to userInfo
const roomMessages = new Map();  // roomCode -> Array of message objects

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on('join_room', ({ roomCode, nickname, avatar }) => {
    const cleanRoom = (roomCode || 'secret-nest').trim().toLowerCase();
    
    if (!roomUsers.has(cleanRoom)) {
      roomUsers.set(cleanRoom, new Map());
    }
    if (!roomMessages.has(cleanRoom)) {
      roomMessages.set(cleanRoom, []);
    }

    const roomMap = roomUsers.get(cleanRoom);
    const messageHistory = roomMessages.get(cleanRoom);

    currentUser = {
      socketId: socket.id,
      id: socket.id,
      nickname: nickname || 'Partner',
      avatar: avatar || '❤️',
      joinedAt: new Date().toISOString()
    };

    socket.join(cleanRoom);
    currentRoom = cleanRoom;
    roomMap.set(socket.id, currentUser);

    const partners = Array.from(roomMap.values());
    const peer = partners.find(p => p.socketId !== socket.id) || null;

    // Send room_joined to user with current peer and last 50 room messages
    socket.emit('room_joined', {
      roomCode: cleanRoom,
      user: currentUser,
      partner: peer,
      connectedCount: roomMap.size,
      history: messageHistory.slice(-50)
    });

    // Notify partner in room
    socket.to(cleanRoom).emit('partner_status_change', {
      type: 'connected',
      partner: currentUser,
      connectedCount: roomMap.size
    });

    console.log(`[Join] User ${currentUser.nickname} joined room: ${cleanRoom} (${roomMap.size} active connections)`);
  });

  socket.on('send_message', (messageData) => {
    if (!currentRoom) return;

    const payload = {
      ...messageData,
      senderId: messageData.senderId || socket.id,
      timestamp: messageData.timestamp || new Date().toISOString()
    };

    // Store in room history
    if (roomMessages.has(currentRoom)) {
      roomMessages.get(currentRoom).push(payload);
    }

    // Broadcast to room
    io.in(currentRoom).emit('receive_message', payload);
  });

  socket.on('disconnect', () => {
    if (currentRoom && roomUsers.has(currentRoom)) {
      const roomMap = roomUsers.get(currentRoom);
      roomMap.delete(socket.id);

      socket.to(currentRoom).emit('partner_status_change', {
        type: 'disconnected',
        partner: currentUser,
        connectedCount: roomMap.size
      });

      console.log(`[Leave/Background] User ${currentUser?.nickname} left room: ${currentRoom}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  const localIP = getLocalIP();
  console.log(`\n==================================================`);
  console.log(`💖 DUO PRIVATE CHAT SERVER IS RUNNING!`);
  console.log(`--------------------------------------------------`);
  console.log(`🏠 Local Access:   http://localhost:${PORT}`);
  console.log(`📱 Phone/WiFi URL: http://${localIP}:${PORT}`);
  console.log(`==================================================\n`);
});
