import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    const serverUrl = import.meta.env.VITE_SERVER_URL || 
      (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin);
    
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🔌 Connected to server');
      setIsConnected(true);
      
      // Join chat immediately after connection
      if (user) {
        newSocket.emit('join-chat', user);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
      setIsConnected(false);
      
      if (reason !== 'io client disconnect') {
        toast.error('Connection lost. Reconnecting...');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      setIsConnected(false);
      toast.error('Failed to connect to server');
    });

    newSocket.on('reconnect', () => {
      console.log('🔌 Reconnected to server');
      setIsConnected(true);
      toast.success('Reconnected!');
      
      // Rejoin chat after reconnection
      if (user) {
        newSocket.emit('join-chat', user);
      }
    });

    newSocket.on('error', (data) => {
      console.error('🔌 Socket error:', data);
      toast.error(data.message || 'An error occurred');
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.close();
    };
  }, [user]);

  const value = {
    socket,
    isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
