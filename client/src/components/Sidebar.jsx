import React, { useState } from 'react';
import { Hash, Users, Plus, Search } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

export const Sidebar = ({ onRoomChange }) => {
  const { currentRoom, rooms, users, joinRoom, createRoom } = useChat();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleRoomClick = (roomName) => {
    if (roomName !== currentRoom) {
      joinRoom(roomName);
      onRoomChange(); // Close mobile menu
    }
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      createRoom({
        name: newRoomName.trim(),
        description: `${newRoomName} discussion`
      });
      setNewRoomName('');
      setShowCreateRoom(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Rooms Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <Hash className="w-4 h-4 inline mr-1" />
              Rooms
            </h2>
            <button
              onClick={() => setShowCreateRoom(!showCreateRoom)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Create Room Form */}
          {showCreateRoom && (
            <form onSubmit={handleCreateRoom} className="mb-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength="20"
                autoFocus
              />
              <div className="flex space-x-2 mt-2">
                <button
                  type="submit"
                  className="flex-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Rooms List */}
          <div className="space-y-1">
            {rooms.map((room) => (
              <button
                key={room.name}
                onClick={() => handleRoomClick(room.name)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  currentRoom === room.name
                    ? 'bg-blue-100 text-blue-800 border-r-2 border-blue-500'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{room.name}</div>
                    {room.description && (
                      <div className="text-xs text-gray-500 truncate">{room.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Users Section */}
        <div className="border-t border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            <Users className="w-4 h-4 inline mr-1" />
            Online ({users.length})
          </h2>
          
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 truncate">
                    {user.username}
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Online</span>
                  </div>
                </div>
              </div>
            ))}
            
            {users.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No users online
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
