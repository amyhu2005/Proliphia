import React, { useState, useRef, useEffect } from 'react';
import type { MouseEvent } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [vaultPath, setVaultPath] = useState('/Users/amyhu/Documents/Obsidian Vault');
  const [apiKey, setApiKey] = useState('AIzaSyDnZT6b77AFhKNsVkTrE4OlU1u1kwSr1b0');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupStatus, setSetupStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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

  const handleSetup = async () => {
    if (!vaultPath.trim() || !apiKey.trim()) {
      setSetupStatus({ type: 'error', message: 'Please provide both a vault path and an API key.' });
      return;
    }

    setIsSettingUp(true);
    setSetupStatus(null);

    try {
      const response = await fetch('http://localhost:8001/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault_path: vaultPath, gemini_api_key: apiKey }),
      });

      const data = await response.json();
      if (response.ok) {
        setSetupStatus({ type: 'success', message: data.message });
        setTimeout(() => setIsConfigOpen(false), 2000);
      } else {
        setSetupStatus({ type: 'error', message: data.detail || 'Failed to initialize vault.' });
      }
    } catch (err) {
      setSetupStatus({ type: 'error', message: 'Could not connect to the backend server. Make sure it is running.' });
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userContent = input.trim();
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userContent }),
      });

      const data = await response.json();
      if (response.ok) {
        const newAiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response
        };
        setMessages(prev => [...prev, newAiMsg]);
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${data.detail || 'Something went wrong.'}`
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error: Could not connect to the backend server. Make sure it is running.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSidebar = (e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isHome = messages.length === 0;

  return (
    <div className="app-container">
      {/* Invisible Trigger Zone to Open Sidebar on Left Edge Hover/Click */}
      {!isSidebarOpen && (
        <div
          className="sidebar-trigger-zone"
          onMouseEnter={() => setIsSidebarOpen(true)}
          onClick={toggleSidebar}
        />
      )}

      {/* Persistent Toggle Button */}
      <button className="sidebar-toggle-btn" onClick={toggleSidebar} aria-label="Toggle Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      {/* Overlay for clicking outside */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Collapsible Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-branding">
            <img src={`${import.meta.env.BASE_URL}logo.png?v=3`} alt="P" className="sidebar-logo-img" />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 400, letterSpacing: '-0.01em' }}>Proliphia</h2>
          </div>
          <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Active Conversation
          </button>
          <button className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            Vault Explorer
          </button>
          <button className="nav-item" onClick={() => { setIsConfigOpen(true); setIsSidebarOpen(false); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Configuration
          </button>
        </nav>
      </aside>

      {/* Configuration Modal */}
      {isConfigOpen && (
        <div className="modal-overlay" onClick={() => setIsConfigOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500 }}>Vault Configuration</h2>
              <button className="close-btn" onClick={() => setIsConfigOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Obsidian Vault Path</label>
                <input
                  type="text"
                  value={vaultPath}
                  onChange={(e) => setVaultPath(e.target.value)}
                  placeholder="/Users/yourname/Documents/MyVault"
                />
              </div>

              <div className="form-group">
                <label>Gemini API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                />
              </div>

              {setupStatus && (
                <div className={`status-message ${setupStatus.type}`}>
                  {setupStatus.message}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className={`setup-btn ${isSettingUp ? 'loading' : ''}`}
                onClick={handleSetup}
                disabled={isSettingUp}
              >
                {isSettingUp ? 'Initializing Vault...' : 'Initialize Vault'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main-container">
        {isHome ? (
          <main className="chat-area">
            <div className="branding-header">
              <img src={`${import.meta.env.BASE_URL}logo.png?v=3`} alt="Proliphia Logo" className="logo-img" />
              <h1 className="site-title">so, what are we thinking today</h1>
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
            </div>
          </main>
        ) : (
          <div className="active-chat-container">
            <div className="messages-list">
              {messages.map((msg) => <div key={msg.id} className={`chat-message ${msg.role}`}>
                <div className="chat-avatar">
                  {msg.role === 'user' ? 'A' : <img src={`${import.meta.env.BASE_URL}logo.png?v=3`} alt="P" className="avatar-img" />}
                </div>
                <div className="chat-content">{msg.content}</div>
              </div>
              )}
              {isTyping && (
                <div className="chat-message assistant">
                  <div className="chat-avatar">
                    <img src={`${import.meta.env.BASE_URL}logo.png?v=3`} alt="P" className="avatar-img" />
                  </div>
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
    </div>
  );
}

export default App;
