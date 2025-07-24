import React, { useState, useEffect } from 'react';
import { Menu, X, Wifi, WifiOff } from 'lucide-react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MessageArea } from './MessageArea';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../contexts/ChatContext';

export const ChatApp = ({ user, onLogout, isConnected, setIsConnected }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { socket } = useSocket();
  const { currentRoom } = useChat();

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
      
      return () => {
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, [socket, setIsConnected]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <Header 
        user={user}
        currentRoom={currentRoom}
        isConnected={isConnected}
        onLogout={onLogout}
        onToggleMobileMenu={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMobileMenu}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-0
          transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 transition-transform duration-300 ease-in-out
          w-80 md:w-72 bg-white border-r border-gray-200
          flex-shrink-0 pt-16 md:pt-0
        `}>
          <Sidebar onRoomChange={closeMobileMenu} />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <MessageArea user={user} />
        </div>
      </div>

      {/* Connection Status */}
      <div className={`
        fixed top-20 right-4 z-30 px-3 py-1 rounded-full text-xs font-medium
        transition-all duration-300 ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }
      `}>
        {isConnected ? (
          <div className="flex items-center space-x-1">
            <Wifi className="w-3 h-3" />
            <span>Connected</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <WifiOff className="w-3 h-3" />
            <span>Connecting...</span>
          </div>
        )}
      </div>
    </div>
  );
};
