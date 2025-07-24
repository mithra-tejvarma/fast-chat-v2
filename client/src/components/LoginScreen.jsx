import React, { useState } from 'react';
import { MessageCircle, Users, Hash, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (username.length < 2) {
      toast.error('Username must be at least 2 characters');
      return;
    }

    if (username.length > 20) {
      toast.error('Username must be less than 20 characters');
      return;
    }

    setIsLoading(true);
    
    // Simulate loading for better UX
    setTimeout(() => {
      onLogin({
        username: username.trim(),
        room: room.trim() || 'general'
      });
      toast.success(`Welcome, ${username}!`);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FastChat</h1>
          <p className="text-gray-600">Lightning fast messaging</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              maxLength="20"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-2" />
              Room (optional)
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="general"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              maxLength="20"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Joining...</span>
              </>
            ) : (
              <>
                <span>Join Chat</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Features */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">⚡</div>
              <div className="text-sm text-gray-600">Lightning Fast</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">🔒</div>
              <div className="text-sm text-gray-600">Secure</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
