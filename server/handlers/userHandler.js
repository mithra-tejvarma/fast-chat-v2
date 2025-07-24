export class UserHandler {
  constructor(db, io) {
    this.db = db;
    this.io = io;
  }

  async handleUserJoin(socket, userData) {
    try {
      const user = {
        id: socket.id,
        username: userData.username || `User${Date.now()}`,
        room: userData.room || 'general',
        avatar: this.generateAvatar(userData.username),
        joinedAt: new Date()
      };

      // Save user session
      await this.db.saveUserSession(socket.id, user.username, user.room);

      // Join room
      socket.join(user.room);

      console.log(`✅ User ${user.username} joined room ${user.room}`);
      return user;

    } catch (error) {
      console.error('User join error:', error);
      throw error;
    }
  }

  async handleUserLeave(socket, user) {
    try {
      if (user) {
        // Remove from database
        await this.db.removeUserSession(socket.id);
        
        // Notify room
        socket.to(user.room).emit('user-left', {
          username: user.username,
          message: `${user.username} left the chat`
        });

        console.log(`👋 User ${user.username} left room ${user.room}`);
      }
    } catch (error) {
      console.error('User leave error:', error);
    }
  }

  generateAvatar(username) {
    if (!username) return '👤';
    return username.charAt(0).toUpperCase();
  }

  async getRoomUsers(room) {
    try {
      // This would get active users from the database
      // For now, we'll rely on the in-memory tracking in the main server
      return [];
    } catch (error) {
      console.error('Error getting room users:', error);
      return [];
    }
  }
}
