import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Chat reducer for state management
const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return { 
        ...state, 
        messages: [...state.messages, action.payload]
      };
    
    case 'SET_USERS':
      return { ...state, users: action.payload };
    
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload };
    
    case 'ADD_ROOM':
      return { 
        ...state, 
        rooms: [...state.rooms, action.payload]
      };
    
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };
    
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    
    default:
      return state;
  }
};

const initialState = {
  currentRoom: 'general',
  messages: [],
  users: [],
  rooms: [
    { name: 'general', description: 'General discussion' },
    { name: 'random', description: 'Random conversations' },
    { name: 'tech', description: 'Technology discussions' }
  ],
  typingUsers: []
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket } = useSocket();

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Message events
    socket.on('new-message', (message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    socket.on('message-history', (messages) => {
      dispatch({ type: 'SET_MESSAGES', payload: messages });
    });

    // User events
    socket.on('room-users', (users) => {
      dispatch({ type: 'SET_USERS', payload: users });
    });

    socket.on('user-connected', (data) => {
      toast.success(data.message);
    });

    socket.on('user-disconnected', (data) => {
      toast.info(data.message);
    });

    socket.on('user-joined-room', (data) => {
      toast.info(`${data.username} joined the room`);
    });

    socket.on('user-left', (data) => {
      toast.info(`${data.username} left the room`);
    });

    // Room events
    socket.on('room-created', (room) => {
      dispatch({ type: 'ADD_ROOM', payload: room });
      toast.success(`Room "${room.name}" created!`);
    });

    socket.on('room-changed', (data) => {
      dispatch({ type: 'SET_CURRENT_ROOM', payload: data.room });
      dispatch({ type: 'CLEAR_MESSAGES' });
    });

    // Typing events
    socket.on('user-typing', (data) => {
      if (data.isTyping) {
        dispatch({ 
          type: 'SET_TYPING_USERS', 
          payload: [...state.typingUsers.filter(u => u !== data.username), data.username]
        });
      } else {
        dispatch({ 
          type: 'SET_TYPING_USERS', 
          payload: state.typingUsers.filter(u => u !== data.username)
        });
      }
    });

    // Cleanup
    return () => {
      socket.off('new-message');
      socket.off('message-history');
      socket.off('room-users');
      socket.off('user-connected');
      socket.off('user-disconnected');
      socket.off('user-joined-room');
      socket.off('user-left');
      socket.off('room-created');
      socket.off('room-changed');
      socket.off('user-typing');
    };
  }, [socket, state.typingUsers]);

  // Actions
  const sendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit('send-message', { text: text.trim() });
    }
  };

  const joinRoom = (roomName) => {
    if (socket && roomName !== state.currentRoom) {
      socket.emit('join-room', { room: roomName });
    }
  };

  const createRoom = (roomData) => {
    if (socket) {
      socket.emit('create-room', roomData);
    }
  };

  const startTyping = () => {
    if (socket) {
      socket.emit('typing-start');
    }
  };

  const stopTyping = () => {
    if (socket) {
      socket.emit('typing-stop');
    }
  };

  const value = {
    ...state,
    sendMessage,
    joinRoom,
    createRoom,
    startTyping,
    stopTyping
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
