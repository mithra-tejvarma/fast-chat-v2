import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DatabaseManager } from './database/database.js';
import { MessageHandler } from './handlers/messageHandler.js';
import { RoomHandler } from './handlers/roomHandler.js';
import { UserHandler } from './handlers/userHandler.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FastChatServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
      allowEIO3: true
    });

    this.port = process.env.PORT || 3000;
    this.setupMiddleware();
    this.setupDatabase();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security and performance middleware
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));
    
    this.app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
      level: 6,
      threshold: 1024
    }));

    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
      optionsSuccessStatus: 200
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.rateLimiter = new RateLimiterMemory({
      keyGenerator: (req) => req.ip,
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
    });

    this.app.use(async (req, res, next) => {
      try {
        await this.rateLimiter.consume(req.ip);
        next();
      } catch (rejRes) {
        res.status(429).json({ error: 'Too many requests' });
      }
    });

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static(path.join(__dirname, '../client/dist')));
    }
  }

  async setupDatabase() {
    this.db = new DatabaseManager();
    await this.db.initialize();
    console.log('✅ Database connected');
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.db.getStats();
        const connectedUsers = this.io.engine.clientsCount;
        
        res.json({
          ...stats,
          connectedUsers,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
      }
    });

    // Serve React app in production
    if (process.env.NODE_ENV === 'production') {
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
      });
    }
  }

  setupSocketHandlers() {
    // Initialize handlers
    this.messageHandler = new MessageHandler(this.db, this.io);
    this.roomHandler = new RoomHandler(this.db, this.io);
    this.userHandler = new UserHandler(this.db, this.io);

    // Store active users
    this.activeUsers = new Map();
    this.userRooms = new Map();

    this.io.on('connection', async (socket) => {
      console.log(`👤 User connected: ${socket.id}`);

      // User authentication and joining
      socket.on('join-chat', async (userData) => {
        try {
          console.log(`User joining:`, userData);
          
          const user = {
            id: socket.id,
            username: userData.username || `User${Date.now()}`,
            room: userData.room || 'general',
            avatar: userData.username?.charAt(0).toUpperCase() || 'U',
            joinedAt: new Date()
          };

          // Store user
          this.activeUsers.set(socket.id, user);
          socket.join(user.room);
          
          // Track room membership
          if (!this.userRooms.has(user.room)) {
            this.userRooms.set(user.room, new Set());
          }
          this.userRooms.get(user.room).add(socket.id);

          // Send user data back
          socket.emit('user-joined', user);

          // Send room users
          const roomUsers = Array.from(this.userRooms.get(user.room) || [])
            .map(id => this.activeUsers.get(id))
            .filter(Boolean);
          
          this.io.to(user.room).emit('room-users', roomUsers);

          // Send recent messages
          const recentMessages = await this.db.getRecentMessages(user.room, 50);
          socket.emit('message-history', recentMessages);

          // Notify others
          socket.to(user.room).emit('user-connected', {
            username: user.username,
            message: `${user.username} joined the chat`
          });

          console.log(`✅ User ${user.username} joined room ${user.room}`);

        } catch (error) {
          console.error('Join error:', error);
          socket.emit('error', { message: 'Failed to join chat' });
        }
      });

      // Handle messages
      socket.on('send-message', async (messageData) => {
        try {
          const user = this.activeUsers.get(socket.id);
          if (!user) {
            socket.emit('error', { message: 'User not authenticated' });
            return;
          }

          const message = {
            id: Date.now().toString(),
            text: messageData.text,
            username: user.username,
            room: user.room,
            timestamp: new Date(),
            avatar: user.avatar
          };

          // Save to database
          await this.db.saveMessage(message);

          // Broadcast to room
          this.io.to(user.room).emit('new-message', message);

          console.log(`💬 Message from ${user.username} in ${user.room}: ${message.text}`);

        } catch (error) {
          console.error('Message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle room changes
      socket.on('join-room', async (roomData) => {
        try {
          const user = this.activeUsers.get(socket.id);
          if (!user) return;

          const oldRoom = user.room;
          const newRoom = roomData.room;

          // Leave old room
          socket.leave(oldRoom);
          this.userRooms.get(oldRoom)?.delete(socket.id);

          // Join new room
          socket.join(newRoom);
          user.room = newRoom;
          
          if (!this.userRooms.has(newRoom)) {
            this.userRooms.set(newRoom, new Set());
          }
          this.userRooms.get(newRoom).add(socket.id);

          // Update room users
          const oldRoomUsers = Array.from(this.userRooms.get(oldRoom) || [])
            .map(id => this.activeUsers.get(id))
            .filter(Boolean);
          const newRoomUsers = Array.from(this.userRooms.get(newRoom) || [])
            .map(id => this.activeUsers.get(id))
            .filter(Boolean);

          this.io.to(oldRoom).emit('room-users', oldRoomUsers);
          this.io.to(newRoom).emit('room-users', newRoomUsers);

          // Send room history
          const roomMessages = await this.db.getRecentMessages(newRoom, 50);
          socket.emit('message-history', roomMessages);

          // Notify rooms
          socket.to(oldRoom).emit('user-left', { username: user.username });
          socket.to(newRoom).emit('user-joined-room', { username: user.username });

          socket.emit('room-changed', { room: newRoom });

        } catch (error) {
          console.error('Room change error:', error);
          socket.emit('error', { message: 'Failed to change room' });
        }
      });

      // Handle typing indicators
      socket.on('typing-start', () => {
        const user = this.activeUsers.get(socket.id);
        if (user) {
          socket.to(user.room).emit('user-typing', {
            username: user.username,
            isTyping: true
          });
        }
      });

      socket.on('typing-stop', () => {
        const user = this.activeUsers.get(socket.id);
        if (user) {
          socket.to(user.room).emit('user-typing', {
            username: user.username,
            isTyping: false
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`👤 User disconnected: ${socket.id}`);
        
        const user = this.activeUsers.get(socket.id);
        if (user) {
          // Remove from room tracking
          this.userRooms.get(user.room)?.delete(socket.id);
          
          // Update room users
          const roomUsers = Array.from(this.userRooms.get(user.room) || [])
            .map(id => this.activeUsers.get(id))
            .filter(Boolean);
          
          this.io.to(user.room).emit('room-users', roomUsers);
          
          // Notify others
          socket.to(user.room).emit('user-disconnected', {
            username: user.username,
            message: `${user.username} left the chat`
          });

          // Remove user
          this.activeUsers.delete(socket.id);
        }
      });
    });
  }

  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      console.error('Express error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }

  async start() {
    try {
      this.server.listen(this.port, () => {
        console.log(`🚀 Fast Chat Server running on port ${this.port}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌍 CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new FastChatServer();
server.start();
