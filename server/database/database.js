import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export class DatabaseManager {
  constructor() {
    // PostgreSQL connection configuration
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Fallback for local development
    if (!process.env.DATABASE_URL) {
      this.pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'fastchat',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    }
  }

  async initialize() {
    try {
      // Test connection
      const client = await this.pool.connect();
      console.log('📚 PostgreSQL connected successfully');
      client.release();

      // Create tables
      await this.createTables();
      await this.createIndexes();
      
      console.log('✅ Database initialized');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async createTables() {
    const createTablesQuery = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        avatar VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Rooms table
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_private BOOLEAN DEFAULT FALSE,
        password_hash VARCHAR(255)
      );

      -- Messages table (optimized for performance)
      CREATE TABLE IF NOT EXISTS messages (
        id BIGSERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        username VARCHAR(50) NOT NULL,
        room VARCHAR(50) NOT NULL,
        avatar VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        message_type VARCHAR(20) DEFAULT 'user',
        edited_at TIMESTAMP NULL,
        is_deleted BOOLEAN DEFAULT FALSE
      );

      -- User sessions table
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        socket_id VARCHAR(100) UNIQUE NOT NULL,
        username VARCHAR(50) NOT NULL,
        room VARCHAR(50) NOT NULL,
        connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert default rooms
      INSERT INTO rooms (name, description, created_by) 
      VALUES 
        ('general', 'General discussion', 'system'),
        ('random', 'Random conversations', 'system'),
        ('tech', 'Technology discussions', 'system')
      ON CONFLICT (name) DO NOTHING;
    `;

    await this.pool.query(createTablesQuery);
  }

  async createIndexes() {
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room);',
      'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_messages_room_created_at ON messages(room, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_socket_id ON user_sessions(socket_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_room ON user_sessions(room);'
    ];

    for (const query of indexQueries) {
      await this.pool.query(query);
    }
  }

  async saveMessage(message) {
    const query = `
      INSERT INTO messages (text, username, room, avatar, message_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `;
    
    const values = [
      message.text,
      message.username,
      message.room,
      message.avatar,
      message.message_type || 'user'
    ];

    try {
      const result = await this.pool.query(query, values);
      return {
        ...message,
        id: result.rows[0].id,
        timestamp: result.rows[0].created_at
      };
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async getRecentMessages(room, limit = 50) {
    const query = `
      SELECT id, text, username, room, avatar, created_at as timestamp, message_type
      FROM messages 
      WHERE room = $1 AND is_deleted = FALSE
      ORDER BY created_at DESC 
      LIMIT $2
    `;

    try {
      const result = await this.pool.query(query, [room, limit]);
      return result.rows.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async getRooms() {
    const query = `
      SELECT r.name, r.description, r.created_at, r.is_private,
             COUNT(m.id) as message_count,
             MAX(m.created_at) as last_activity
      FROM rooms r
      LEFT JOIN messages m ON r.name = m.room
      GROUP BY r.id, r.name, r.description, r.created_at, r.is_private
      ORDER BY last_activity DESC NULLS LAST
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting rooms:', error);
      return [];
    }
  }

  async createRoom(roomData) {
    const query = `
      INSERT INTO rooms (name, description, created_by, is_private, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      roomData.name,
      roomData.description || '',
      roomData.createdBy,
      roomData.isPrivate || false,
      roomData.passwordHash || null
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async saveUserSession(socketId, username, room) {
    const query = `
      INSERT INTO user_sessions (socket_id, username, room)
      VALUES ($1, $2, $3)
      ON CONFLICT (socket_id) 
      DO UPDATE SET 
        username = EXCLUDED.username,
        room = EXCLUDED.room,
        last_activity = CURRENT_TIMESTAMP
    `;

    try {
      await this.pool.query(query, [socketId, username, room]);
    } catch (error) {
      console.error('Error saving user session:', error);
    }
  }

  async removeUserSession(socketId) {
    const query = 'DELETE FROM user_sessions WHERE socket_id = $1';
    
    try {
      await this.pool.query(query, [socketId]);
    } catch (error) {
      console.error('Error removing user session:', error);
    }
  }

  async getStats() {
    const queries = {
      totalMessages: 'SELECT COUNT(*) as count FROM messages WHERE is_deleted = FALSE',
      totalUsers: 'SELECT COUNT(DISTINCT username) as count FROM user_sessions WHERE last_activity > NOW() - INTERVAL \'24 hours\'',
      totalRooms: 'SELECT COUNT(*) as count FROM rooms',
      activeUsers: 'SELECT COUNT(*) as count FROM user_sessions WHERE last_activity > NOW() - INTERVAL \'5 minutes\'',
      messagesLast24h: 'SELECT COUNT(*) as count FROM messages WHERE created_at > NOW() - INTERVAL \'24 hours\' AND is_deleted = FALSE'
    };

    try {
      const stats = {};
      
      for (const [key, query] of Object.entries(queries)) {
        const result = await this.pool.query(query);
        stats[key] = parseInt(result.rows[0].count);
      }

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalMessages: 0,
        totalUsers: 0,
        totalRooms: 0,
        activeUsers: 0,
        messagesLast24h: 0
      };
    }
  }

  async searchMessages(room, searchTerm, limit = 20) {
    const query = `
      SELECT id, text, username, room, avatar, created_at as timestamp
      FROM messages 
      WHERE room = $1 AND text ILIKE $2 AND is_deleted = FALSE
      ORDER BY created_at DESC 
      LIMIT $3
    `;

    try {
      const result = await this.pool.query(query, [room, `%${searchTerm}%`, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  async cleanup() {
    // Clean up old sessions (older than 1 day)
    const cleanupQuery = `
      DELETE FROM user_sessions 
      WHERE last_activity < NOW() - INTERVAL '1 day'
    `;

    try {
      await this.pool.query(cleanupQuery);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  async close() {
    await this.pool.end();
    console.log('📚 Database connection closed');
  }
}
