import './config/env.js';

// --- Env validation FIRST, before anything else ---
import { validateEnv } from './config/validateEnv.js';
validateEnv();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { corsOptions } from './config/corsOptions.js';
import { helmetOptions } from './config/helmetOptions.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, searchLimiter, uploadLimiter, sessionLimiter, messageLimiter } from './middleware/rateLimiter.js';
import { sanitizeMiddleware } from './middleware/sanitize.js';
import logger from './utils/logger.js';

const app = express();

// ── Security headers (first) ──────────────────────────────────────────────
app.use(helmet(helmetOptions));

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));

// ── HTTP request logging ──────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ── Body parsing & cookies ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Input Sanitization (XSS prevention) ──────────────────────────────────────
// Apply to all API routes - sanitizes body, query, params
app.use('/api/', sanitizeMiddleware({
  htmlFields: ['bio', 'description', 'content', 'notes', 'comment', 'replyContent'],
  textFields: ['name', 'email', 'location', 'timezone', 'title', 'skill', 'category', 'search', 'query'],
}));

// ── Static uploads ────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// ── Database ──────────────────────────────────────────────────────────────
connectDB();

// ── Rate Limiting (after body parsing) ───────────────────────────────────────
app.use('/api/', apiLimiter); // General API rate limit

// ── Routes ────────────────────────────────────────────────────────────────
import healthRoutes from './routes/healthRoutes.js';
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
import searchRoutes from './routes/searchRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';

app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes); // Stricter auth rate limit
app.use('/api/skills', skillRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/sessions', sessionLimiter, sessionRoutes); // Session booking limit
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', messageLimiter, chatRoutes); // Message rate limit
app.use('/api/notifications', notificationRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/search', searchLimiter, searchRoutes); // Search rate limit
app.use('/api/challenges', challengeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verification', verificationRoutes);

// Specific upload limiter for avatar uploads (if separate route exists)
// app.use('/api/users/avatar', uploadLimiter);

// ── Global error handler (LAST middleware) ─────────────────────────────────
app.use(globalErrorHandler);

// ── HTTP + Socket.IO ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const allowedOriginsList = (process.env.ALLOWED_ORIGINS || '').trim()
  .split(',').map(o => o.trim()).filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOriginsList.length > 0 ? allowedOriginsList : true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Track connected users: userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
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
    socket.to(`chat_${data.conversationId}`).emit('new-message', data);
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
    socket.to(`chat_${data.conversationId}`).emit('user-stop-typing', { userId: data.userId });
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
  socket.on('video-chat-message', (payload) => {
    socket.to(payload.target).emit('video-chat-message', payload.message);
  });

  // --- NOTIFICATION EVENTS ---
  socket.on('send-notification', (data) => {
    if (data.userId && onlineUsers.has(data.userId)) {
      io.to(onlineUsers.get(data.userId)).emit('new-notification', data);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('online-users', Array.from(onlineUsers.keys()));
  });
});

app.set('io', io);
app.set('onlineUsers', onlineUsers);

server.listen(PORT, () => {
  const mongoHost = (process.env.MONGO_URI || '').replace(/\/\/[^@]+@/, '//<credentials>@');
  logger.info(`Server running on port ${PORT} | NODE_ENV=${process.env.NODE_ENV || 'development'} | DB=${mongoHost}`);
});
