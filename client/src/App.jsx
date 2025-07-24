import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { LoginScreen } from './components/LoginScreen';
import { ChatApp } from './components/ChatApp';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';

function App() {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check for saved user data
    const savedUser = localStorage.getItem('fastchat-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('fastchat-user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('fastchat-user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsConnected(false);
    localStorage.removeItem('fastchat-user');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            borderRadius: '8px',
            fontSize: '14px'
          }
        }}
      />
      
      {!user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <SocketProvider user={user}>
          <ChatProvider>
            <ChatApp 
              user={user} 
              onLogout={handleLogout}
              isConnected={isConnected}
              setIsConnected={setIsConnected}
            />
          </ChatProvider>
        </SocketProvider>
      )}
    </div>
  );
}

export default App;
