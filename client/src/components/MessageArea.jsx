import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

export const MessageArea = () => {
  const { messages, sendMessage, currentRoom, username } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      await sendMessage({
        content: newMessage.trim(),
        room: currentRoom
      });
      
      setNewMessage('');
      setIsTyping(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-4">
          {Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600 font-medium">
                  {formatDate(new Date(date))}
                </div>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const isOwnMessage = message.username === username;
                const showAvatar = index === 0 || dateMessages[index - 1].username !== message.username;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                      showAvatar ? 'mt-4' : 'mt-1'
                    }`}
                  >
                    <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-xs sm:max-w-md lg:max-w-lg`}>
                      {/* Avatar */}
                      {!isOwnMessage && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3 ${
                          showAvatar ? 'visible' : 'invisible'
                        } bg-gradient-to-r from-purple-400 to-pink-500`}>
                          {message.username.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}>
                        {/* Username (only for others' messages and when showing avatar) */}
                        {!isOwnMessage && showAvatar && (
                          <div className="text-xs font-semibold text-gray-600 mb-1">
                            {message.username}
                          </div>
                        )}
                        
                        {/* Message Content */}
                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                        
                        {/* Timestamp */}
                        <div className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-sm text-center">Start the conversation in #{currentRoom}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          {/* Input Container */}
          <div className="flex-1 relative">
            <div className="flex items-end bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              {/* Attachment Button */}
              <button
                type="button"
                className="p-3 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={`Message #${currentRoom}`}
                className="flex-1 bg-transparent border-none outline-none resize-none py-3 px-1 text-sm placeholder-gray-500 max-h-32"
                rows="1"
                style={{ minHeight: '24px' }}
              />

              {/* Emoji Button */}
              <button
                type="button"
                className="p-3 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full transition-all ${
              newMessage.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Typing Indicator */}
        {isTyping && (
          <div className="mt-2 text-xs text-gray-500">
            Typing in #{currentRoom}...
          </div>
        )}
      </div>
    </div>
  );
};
