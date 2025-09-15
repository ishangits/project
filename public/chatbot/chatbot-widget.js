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
    .bot-message h3 {
      font-size: 15px;
      font-weight: 600;
      margin: 6px 0 4px;
      color: #333;
    }
     .bot-message ul, .bot-message ol {
    margin: 6px 0 6px 18px;
    padding: 0;
  }
    .bot-message li {
    margin-bottom: 4px;
    line-height: 1.4;
  }
    .bot-message a {
      color: ${config.themeColor};
      text-decoration: none;
      font-weight: 500;
    }
    .bot-message a:hover {
      text-decoration: underline;
    }
  `;
  document.head.appendChild(style);
  
  const messagesContainer = widget.querySelector('.messages-container');
  const botMessage = createMessage(config.greetingMessage, false);
  messagesContainer.appendChild(botMessage);
  
  const toggleButton = widget.querySelector('.chatbot-toggle');
  const chatWindow = widget.querySelector('.chatbot-window');
  const closeButton = widget.querySelector('.close-button');
  
  toggleButton.addEventListener('click', () => {
    const isVisible = chatWindow.style.display === 'flex';
    chatWindow.style.display = isVisible ? 'none' : 'flex';
  });
  
  closeButton.addEventListener('click', () => {
    chatWindow.style.display = 'none';
  });
  
  const messageInput = widget.querySelector('.message-input');
  const sendButton = widget.querySelector('.send-button');
  
  const sendMessage = async () => {
    const message = messageInput.value.trim();
    if (!message) return;
    
    const userMessage = createMessage(message, true);
    messagesContainer.appendChild(userMessage);
    messageInput.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    const typingIndicator = createTypingIndicator();
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
      let sessionId = localStorage.getItem(`chat_session_${config.tenantId}`);
      
      if (!sessionId) {
        const randomUserId = Math.floor(Math.random() * 10000).toString();
const sessionResponse = await fetch(`${config.apiBase}/v1/open/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'tenantid': config.tenantId,
          },
          body: JSON.stringify({ user_id: randomUserId })
        });
        
        const sessionData = await sessionResponse.json();
        sessionId = sessionData.session_id;
        localStorage.setItem(`chat_session_${config.tenantId}`, sessionId);
      }
      
      const response = await fetch(`${config.apiBase}/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'tenantid': config.tenantId,
        },
        body: JSON.stringify({
          message: message,
          session_id: sessionId
        })
      });
      
      const data = await response.json();
      messagesContainer.removeChild(typingIndicator);
      const botMessage = createMessage(data.reply || 'Sorry, I did not understand.', false);
      messagesContainer.appendChild(botMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
    } catch (error) {
      console.error('Error:', error);
      messagesContainer.removeChild(typingIndicator);
      const errorMessage = createMessage('Sorry, I encountered an error. Please try again.', false);
      messagesContainer.appendChild(errorMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };
  
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  function createMessage(text, isUser) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isUser ? "user-message" : "bot-message"}`;
    messageEl.style.cssText = `
      display: flex;
      flex-direction: column;
      max-width: 80%;
      align-self: ${isUser ? 'flex-end' : 'flex-start'};
      align-items: ${isUser ? 'flex-end' : 'flex-start'};
    `;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.style.cssText = `
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      background: ${isUser ? config.themeColor : '#e9ecef'};
      color: ${isUser ? 'white' : '#495057'};
      border-bottom-${isUser ? 'right' : 'left'}-radius: 4px;
    `;
    
    if (isUser) {
      bubble.textContent = text;
    } else {
      bubble.innerHTML = marked.parse(text);
    }
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.style.cssText = `
      font-size: 11px;
      color: #6c757d;
      margin-top: 4px;
      padding: 0 4px;
    `;
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageEl.appendChild(bubble);
    messageEl.appendChild(time);
    return messageEl;
  }
  
  function createTypingIndicator() {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.style.cssText = `
      display: flex;
      flex-direction: column;
      max-width: 80%;
      align-self: flex-start;
      align-items: flex-start;
    `;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble typing-indicator';
    bubble.style.cssText = `
      padding: 16px;
      border-radius: 18px;
      background: #e9ecef;
      border-bottom-left-radius: 4px;
    `;
    
    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.style.cssText = `display: flex; gap: 4px;`;
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.style.cssText = `
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #6c757d;
        animation: typing 1.4s infinite ease-in-out;
        animation-delay: ${i * 0.16}s;
      `;
      dots.appendChild(dot);
    }
    
    bubble.appendChild(dots);
    messageEl.appendChild(bubble);
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-4px); }
      }
    `;
    document.head.appendChild(style);
    
    return messageEl;
  }
};
