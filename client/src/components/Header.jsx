import React from 'react';
import { MessageCircle, Menu, X, LogOut, Settings, BarChart3 } from 'lucide-react';

export const Header = ({ 
  user, 
  currentRoom, 
  isConnected, 
  onLogout, 
  onToggleMobileMenu, 
  isMobileMenuOpen 
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
      {/* Left Section */}
      <div className="flex items-center space-x-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-gray-800">FastChat</h1>
          </div>
        </div>
      </div>

      {/* Center Section - Current Room */}
      <div className="flex-1 text-center">
        <div className="text-sm text-gray-500">Current Room</div>
        <div className="text-lg font-semibold text-gray-800">#{currentRoom}</div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* User Info */}
        <div className="hidden sm:flex items-center space-x-3 mr-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-700">{user.username}</span>
        </div>

        {/* Action Buttons */}
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <BarChart3 className="w-5 h-5 text-gray-600" />
        </button>
        
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={onLogout}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-red-600"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
