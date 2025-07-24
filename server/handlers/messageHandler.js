export class MessageHandler {
  constructor(db, io) {
    this.db = db;
    this.io = io;
  }

  async handleMessage(socket, messageData, user) {
    try {
      // Validate message
      if (!messageData.text || messageData.text.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      if (messageData.text.length > 1000) {
        socket.emit('error', { message: 'Message too long' });
        return;
      }

      // Create message object
      const message = {
        id: Date.now().toString(),
        text: messageData.text.trim(),
        username: user.username,
        room: user.room,
        avatar: user.avatar,
        timestamp: new Date(),
        messageType: 'user'
      };

      // Save to database
      const savedMessage = await this.db.saveMessage(message);

      // Broadcast to room
      this.io.to(user.room).emit('new-message', savedMessage);

      console.log(`💬 Message from ${user.username} in ${user.room}`);
      return savedMessage;

    } catch (error) {
      console.error('Message handling error:', error);
      socket.emit('error', { message: 'Failed to send message' });
      throw error;
    }
  }

  async getMessageHistory(room, limit = 50) {
    try {
      return await this.db.getRecentMessages(room, limit);
    } catch (error) {
      console.error('Error getting message history:', error);
      return [];
    }
  }

  async searchMessages(room, query, limit = 20) {
    try {
      return await this.db.searchMessages(room, query, limit);
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }
}
