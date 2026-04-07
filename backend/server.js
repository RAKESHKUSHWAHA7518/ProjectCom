import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Routes
import authRoutes from './routes/authRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
  res.send('SkillSwap API is running...');
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Track connected users: userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User registers their userId
  socket.on('register-user', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('online-users', Array.from(onlineUsers.keys()));
  });

  // --- CHAT EVENTS ---
  socket.on('join-conversation', (conversationId) => {
    socket.join(`chat_${conversationId}`);
  });

  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`chat_${conversationId}`);
  });

  socket.on('send-message', (data) => {
    // Broadcast to conversation room
    socket.to(`chat_${data.conversationId}`).emit('new-message', data);

    // Also notify recipient if online
    if (data.recipientId && onlineUsers.has(data.recipientId)) {
      io.to(onlineUsers.get(data.recipientId)).emit('message-notification', {
        conversationId: data.conversationId,
        sender: data.sender,
        content: data.content,
      });
    }
  });

  socket.on('typing', (data) => {
    socket.to(`chat_${data.conversationId}`).emit('user-typing', {
      userId: data.userId,
      userName: data.userName,
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(`chat_${data.conversationId}`).emit('user-stop-typing', {
      userId: data.userId,
    });
  });

  // --- WEBRTC SIGNALING EVENTS ---
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);
  });

  socket.on('leave-room', (roomId, userId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-disconnected', userId);
  });

  socket.on('offer', (payload) => {
    socket.to(payload.target).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    socket.to(payload.target).emit('answer', payload);
  });

  socket.on('ice-candidate', (incoming) => {
    socket.to(incoming.target).emit('ice-candidate', incoming.candidate);
  });

  // --- NOTIFICATION EVENTS ---
  socket.on('send-notification', (data) => {
    if (data.userId && onlineUsers.has(data.userId)) {
      io.to(onlineUsers.get(data.userId)).emit('new-notification', data);
    }
  });

  socket.on('disconnect', () => {
    // Remove from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('online-users', Array.from(onlineUsers.keys()));
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to controllers if needed
app.set('io', io);
app.set('onlineUsers', onlineUsers);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
