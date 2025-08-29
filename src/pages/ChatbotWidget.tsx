import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';

interface ChatbotWidgetProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  tenantId: string;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ tenantId, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! How can I help you today?",
      isUser: false,
      timestamp: new Date(),
      tenantId: tenantId
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);



const sendMessage = async () => {
  const message = inputValue.trim();
  if (!message) return;

  const userMessage: Message = {
    id: Date.now(),
    text: message,
    isUser: true,
    timestamp: new Date(),
    tenantId: tenantId
  };

  setMessages(prev => [...prev, userMessage]);
  setInputValue('');
  setIsTyping(true);

  try {
    const data = await apiService.sendChatMessage(tenantId, message, sessionId);

    if (!sessionId && data.session_id) {
      setSessionId(data.session_id);
    }

    const botMessage: Message = {
      id: Date.now() + 1,
      text: data.reply || 'Sorry, I did not understand.',
      isUser: false,
      timestamp: new Date(),
      tenantId: tenantId
    };

    setMessages(prev => [...prev, botMessage]);
  } catch (error) {
    console.error('Error:', error);
    const errorMessage: Message = {
      id: Date.now() + 1,
      text: 'Sorry, I encountered an error. Please try again.',
      isUser: false,
      timestamp: new Date(),
      tenantId: tenantId
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsTyping(false);
  }
};


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-widget">
      <div className="chat-window">
        <div className="chat-header">
          <span>Chat Support</span>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>

        <div className="messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
            >
              <div className="message-bubble">
                {message.text}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message bot-message">
              <div className="message-bubble typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="message-input"
            disabled={isTyping}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="send-button"
            aria-label="Send message"
          >
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .chatbot-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .chat-window {
          width: 350px;
          height: 450px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e1e8ed;
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 20px;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .close-button {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
          transition: opacity 0.2s;
          border-radius: 4px;
        }

        .close-button:hover {
          opacity: 1;
          background: rgba(255,255,255,0.1);
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          display: flex;
          flex-direction: column;
          max-width: 80%;
          animation: fadeIn 0.3s ease-out;
        }

        .user-message {
          align-self: flex-end;
          align-items: flex-end;
        }

        .bot-message {
          align-self: flex-start;
          align-items: flex-start;
        }

        .message-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .user-message .message-bubble {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .bot-message .message-bubble {
          background: #e9ecef;
          color: #495057;
          border-bottom-left-radius: 4px;
        }

        .message-time {
          font-size: 11px;
          color: #6c757d;
          margin-top: 4px;
          padding: 0 4px;
        }

        .typing-indicator {
          background: #e9ecef !important;
          padding: 16px !important;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
        }

        .typing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6c757d;
          animation: typing 1.4s infinite ease-in-out;
        }

        .input-area {
          padding: 16px;
          border-top: 1px solid #e1e8ed;
          background: white;
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .message-input {
          flex: 1;
          border: 1px solid #d1d9e0;
          border-radius: 20px;
          padding: 12px 16px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .message-input:focus {
          border-color: #667eea;
        }

        .send-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .chat-window {
            width: calc(100vw - 40px);
            height: calc(100vh - 140px);
            bottom: 70px;
            right: 20px;
            left: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatbotWidget;