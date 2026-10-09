import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Loader2 } from 'lucide-react';
import api from '../services/api'; // Or just axios, wait we use axios instance in api.js

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi there! I am your FinTrack AI Assistant. Ask me about your spending, budgets, or savings!', sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), text: userMsg, sender: 'user' }]);
    setIsLoading(true);

    try {
      // Need to import the axios instance properly
      // api.js exports `authAPI`, `dashAPI`, etc., but we can use fetch for simplicity if we pass the token, 
      // or we can just import the raw api client. Wait, api.js exports default api.
      const token = localStorage.getItem('fintrack_token');
      const res = await fetch('http://localhost:5173/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { id: Date.now() + 1, text: data.reply || data.error, sender: 'ai' }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: 'Sorry, I am having trouble connecting to the server.', sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageSquare size={28} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '350px',
      height: '500px',
      backgroundColor: 'var(--surface)',
      borderRadius: '16px',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      border: '1px solid var(--border)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        backgroundColor: '#10b981',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={20} />
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>FinTrack AI</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: 'var(--bg)'
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            backgroundColor: msg.sender === 'user' ? 'var(--mint)' : 'var(--surface)',
            color: msg.sender === 'user' ? 'white' : 'var(--text)',
            padding: '10px 14px',
            borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
            fontSize: '0.95rem',
            lineHeight: 1.4
          }}>
            {/* Convert simple markdown ** to bold */}
            {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.875rem' }}>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '8px',
        backgroundColor: 'var(--surface)'
      }}>
        <input 
          type="text" 
          placeholder="Ask me anything..." 
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            borderRadius: '24px',
            outline: 'none',
            fontSize: '0.95rem'
          }}
        />
        <button 
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            background: isLoading || !input.trim() ? 'var(--text-muted)' : 'var(--mint)',
            color: 'white',
            border: 'none',
            width: '40px',
            height: '40px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <Send size={18} style={{ marginLeft: '2px' }} />
        </button>
      </form>
    </div>
  );
}
