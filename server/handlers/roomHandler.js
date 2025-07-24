export class RoomHandler {
  constructor(db, io) {
    this.db = db;
    this.io = io;
  }

  async handleJoinRoom(socket, roomData, user) {
    try {
      const newRoom = roomData.room;
      const oldRoom = user.room;

      if (newRoom === oldRoom) {
        return; // Already in the room
      }

      // Leave old room
      socket.leave(oldRoom);
      
      // Join new room
      socket.join(newRoom);
      user.room = newRoom;

      // Save session
      await this.db.saveUserSession(socket.id, user.username, newRoom);

      // Send room history
      const messages = await this.db.getRecentMessages(newRoom, 50);
      socket.emit('message-history', messages);

      // Notify room change
      socket.emit('room-changed', { room: newRoom });

      console.log(`🚪 ${user.username} moved from ${oldRoom} to ${newRoom}`);

    } catch (error) {
      console.error('Room join error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  async handleCreateRoom(socket, roomData, user) {
    try {
      const room = await this.db.createRoom({
        name: roomData.name,
        description: roomData.description,
        createdBy: user.username,
        isPrivate: roomData.isPrivate || false,
        passwordHash: roomData.passwordHash || null
      });

      // Broadcast new room to all users
      this.io.emit('room-created', {
        name: room.name,
        description: room.description,
        createdBy: user.username
      });

      socket.emit('room-create-success', room);

      console.log(`🏠 Room ${room.name} created by ${user.username}`);
      return room;

    } catch (error) {
      console.error('Room creation error:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  }

  async getRooms() {
    try {
      return await this.db.getRooms();
    } catch (error) {
      console.error('Error getting rooms:', error);
      return [];
    }
  }
}
