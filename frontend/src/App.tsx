import React, { useState, useRef, useEffect } from 'react';
import './index.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate backend response
    setTimeout(() => {
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I am Proliphia. You said: "${newUserMsg.content}". When the backend is fully connected, I will search your Obsidian vault to formulate my response.`
      };
      setMessages(prev => [...prev, newAiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isHome = messages.length === 0;

  return (
    <div className="app-container">
      {isHome ? (
        <>
          <div className="top-nav">
            <div className="plan-pill">Free plan · <span>Upgrade</span></div>
          </div>

          <main className="chat-area">
            <div className="branding-header">
              {/* Thin clean line P logo instead of the star */}
              <span className="logo-p" style={{ fontSize: '3rem', fontWeight: 200, lineHeight: 1 }}>P</span>
              <h1 className="site-title">Back at it, Amy</h1>
            </div>

            <div className="input-wrapper">
              <div className="input-box">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="How can I help you today?"
                  disabled={isTyping}
                />
                <div className="input-actions">
                  <button className="action-btn" aria-label="Add attachment">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    aria-label="Send message"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                </div>
              </div>

              <div className="tool-bar">
                <span>Connect your tools to Proliphia</span>
                <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg, #10b981, #059669)' }}></div>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}></div>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}></div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
              </div>
            </div>
          </main>
        </>
      ) : (
        <div className="active-chat-container">
          <div className="messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.role}`}>
                <div className="chat-avatar">{msg.role === 'user' ? 'A' : 'P'}</div>
                <div className="chat-content">{msg.content}</div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message assistant">
                <div className="chat-avatar" style={{ fontWeight: 200 }}>P</div>
                <div className="chat-content typing">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bottom-input-wrapper">
            <div className="input-box">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="How can I help you today?"
                disabled={isTyping}
              />
              <div className="input-actions">
                <button className="action-btn" aria-label="Add attachment">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  aria-label="Send message"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
