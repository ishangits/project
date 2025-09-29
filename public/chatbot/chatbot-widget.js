// Standalone chatbot widget
window.initChatbotWidget = function(config) {
  const container = document.getElementById('chatbot-widget-container') || document.body;
  const widget = document.createElement('div');
  widget.id = 'standalone-chatbot-widget';
  widget.innerHTML = `
    <div class="chatbot-toggle" style="
      position: fixed;
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      width: 60px;
      height: 60px;
      background: ${config.themeColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
      </svg>
    </div>
    
    <div class="chatbot-window" style="
      position: fixed;
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      ${config.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
      width: 350px;
      height: 450px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
      display: none;
      flex-direction: column;
      z-index: 9998;
      border: 1px solid #e1e8ed;
    ">
      <div class="chat-header" style="
        background: ${config.themeColor};
        color: white;
        padding: 16px 20px;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <span>Chat Support</span>
        <div class="header-buttons" style="display: flex; gap: 8px; align-items: center;">
          <button class="clear-button" title="Clear chat history" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 14px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
          ">🗑️</button>
          <button class="close-button" style="
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
          ">×</button>
        </div>
      </div>
      
      <div class="messages-container" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f8f9fa;
        display: flex;
        flex-direction: column;
        gap: 12px;
      "></div>
      
      <div class="input-area" style="
        padding: 16px;
        border-top: 1px solid #e1e8ed;
        background: white;
        display: flex;
        gap: 12px;
        align-items: flex-end;
      ">
        <input type="text" class="message-input" placeholder="Type your message..." style="
          flex: 1;
          border: 1px solid #d1d9e0;
          border-radius: 20px;
          padding: 12px 16px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        ">
        <button class="send-button" style="
          background: ${config.themeColor};
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
      
      ${config.showBranding ? `
      <div class="chatbot-branding" style="
        padding: 8px;
        text-align: center;
        font-size: 11px;
        color: #6c757d;
        border-top: 1px solid #e1e8ed;
        background: #f8f9fa;
      ">
        Powered by <strong>${config.brandingText || "YourCompany"}</strong>
      </div>
      ` : ''}
    </div>
  `;

  container.appendChild(widget);

  // Inject CSS for bot message formatting
const style = document.createElement('style');
style.textContent = `
  .message { display: flex; flex-direction: column; max-width: 80%; animation: fadeIn 0.3s ease-out; }
  .user-message { align-self: flex-end; align-items: flex-end; }
  .bot-message { align-self: flex-start; align-items: flex-start; }
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
  .typing-indicator .message-bubble {
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
  @keyframes typing {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;
document.head.appendChild(style);

  
  const messagesContainer = widget.querySelector('.messages-container');
  const toggleButton = widget.querySelector('.chatbot-toggle');
  const chatWindow = widget.querySelector('.chatbot-window');
  const closeButton = widget.querySelector('.close-button');
  const clearButton = widget.querySelector('.clear-button');
  const messageInput = widget.querySelector('.message-input');
  const sendButton = widget.querySelector('.send-button');

  let messages = [];
let currentSessionId = null;
const storedData = localStorage.getItem(`chatbot-${config.tenantId}`);
if (storedData) {
  try {
    const parsed = JSON.parse(storedData);
    currentSessionId = parsed.sessionId || null;
  } catch(e) { console.error(e); }
}
  let isTyping = false;

  const scrollToMessage = (messageEl) => {
    if (messageEl) messageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getStoredChatData = () => {
    try {
      const stored = localStorage.getItem(`chatbot-${config.tenantId}`);
      if (stored) return JSON.parse(stored);
    } catch(e) { console.error(e); }
    return null;
  };

  const storeChatData = () => {
    try {
localStorage.setItem(`chatbot-${config.tenantId}`, 
  JSON.stringify({ messages, sessionId: currentSessionId })
);    } catch(e) { console.error(e); }
  };

  const createMessage = (text, isUser) => {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = text;
    messageEl.appendChild(bubble);
    messagesContainer.appendChild(messageEl);

    scrollToMessage(messageEl); // scroll to this message
    return messageEl;
  };

  // Initialize chat
  const loadChatHistory = () => {
    const storedData = getStoredChatData();
    messagesContainer.innerHTML = '';
    messages = [];
    if (storedData && storedData.messages?.length) {
      storedData.messages.forEach(msg => {
        const msgEl = createMessage(msg.text, msg.isUser);
        messages.push({ ...msg, element: msgEl });
      });
      currentSessionId = storedData.sessionId || currentSessionId;
    } else {
      const msgEl = createMessage(config.greetingMessage || "Hello! How can I help you?", false);
      messages.push({ id: 1, text: config.greetingMessage, isUser: false, element: msgEl });
    }
  };

  loadChatHistory();

  toggleButton.addEventListener('click', () => {
    const isVisible = chatWindow.style.display === 'flex';
    chatWindow.style.display = isVisible ? 'none' : 'flex';
  });

  closeButton.addEventListener('click', () => {
    chatWindow.style.display = 'none';
  });

  clearButton.addEventListener('click', () => {
    messagesContainer.innerHTML = '';
    messages = [];
    localStorage.removeItem(`chatbot-${config.tenantId}`);
    const msgEl = createMessage(config.greetingMessage || "Hello! How can I help you?", false);
    messages.push({ id: 1, text: config.greetingMessage, isUser: false, element: msgEl });
  });

 const sendMessage = async () => {
  if (isTyping) return;
  const message = messageInput.value.trim();
  if (!message) return;

  // Ensure we have a session ID
if (!currentSessionId) {
  currentSessionId = Math.floor(Math.random() * 1000000); // random int between 0 and 999999
  storeChatData();
}


  // Add user message
  const userEl = createMessage(message, true);
  messages.push({ id: Date.now(), text: message, isUser: true, element: userEl });
  messageInput.value = '';
  isTyping = true;

  // Typing indicator
  const typingEl = createMessage('...', false);
  typingEl.classList.add('typing-indicator');

  try {
    const response = await fetch(`${config.apiBase}/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'tenantid': config.tenantId },
      body: JSON.stringify({ message, session_id: currentSessionId }) // always valid
    });

    const data = await response.json();
    messagesContainer.removeChild(typingEl);

    // Update session id if backend returns one
    if (data.session_id) {
      currentSessionId = data.session_id;
      storeChatData(); // persist
    }

    const botEl = createMessage(data.reply || 'Sorry, I did not understand.', false);
    messages.push({ id: Date.now(), text: data.reply || '', isUser: false, element: botEl });

    storeChatData();
  } catch (e) {
    console.error(e);
    messagesContainer.removeChild(typingEl);
    const botEl = createMessage('Sorry, I encountered an error.', false);
    messages.push({ id: Date.now(), text: 'Error', isUser: false, element: botEl });
  } finally {
    isTyping = false;
  }
};


  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => { if(e.key==='Enter') sendMessage(); });
};
