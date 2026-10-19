import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, X, MessageSquare, Loader2, Sparkles, TrendingUp, HelpCircle, ShieldAlert, PieChart } from 'lucide-react';
import { chatAPI, txnAPI, accountAPI, budgetAPI, loanAPI, subAPI, investAPI } from '../services/api';
import { analyzeFinancialHealth, generateCopilotResponse } from '../lib/aiFinancialCopilot';

const PROMPT_SUGGESTIONS = [
  'Where did I spend the most?',
  'Analyze my 50/30/20 budget',
  'Emergency fund safety net',
  'How can I pay off debt faster?',
  'What is my savings rate?',
  'Review recurring subscriptions',
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [financialContext, setFinancialContext] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! I am **FinBot**, your FinTrack intelligence copilot. Ask me about your top spending merchants, 50/30/20 budget balance, debt payoff velocity, or emergency fund status.',
      sender: 'ai',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const loadFinancialContext = useCallback(async () => {
    try {
      const [txnsRes, acctsRes, budgetsRes, loansRes, subsRes, investRes] = await Promise.allSettled([
        txnAPI.getAll({ limit: 100 }),
        accountAPI.getAll(),
        budgetAPI.getAll(),
        loanAPI.getAll(),
        subAPI.getAll(),
        investAPI.getAll(),
      ]);

      const transactions = txnsRes.status === 'fulfilled' ? (txnsRes.value?.data?.data || []) : [];
      const accounts = acctsRes.status === 'fulfilled' ? (acctsRes.value?.data?.data || []) : [];
      const budgets = budgetsRes.status === 'fulfilled' ? (budgetsRes.value?.data?.data || []) : [];
      const loans = loansRes.status === 'fulfilled' ? (loansRes.value?.data?.data || []) : [];
      const subscriptions = subsRes.status === 'fulfilled' ? (subsRes.value?.data?.data || []) : [];
      const investments = investRes.status === 'fulfilled' ? (investRes.value?.data?.data || []) : [];

      const analysis = analyzeFinancialHealth({
        transactions,
        accounts,
        budgets,
        loans,
        subscriptions,
        investments,
      });
      setFinancialContext(analysis);
    } catch {
      // Keep running with empty context fallback
    }
  }, []);

  useEffect(() => {
    if (isOpen && !financialContext) {
      loadFinancialContext();
    }
  }, [isOpen, financialContext, loadFinancialContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e, customMsg) => {
    if (e) e.preventDefault();
    const query = customMsg || input;
    if (!query.trim() || isLoading) return;

    const userMsg = query.trim();
    if (!customMsg) setInput('');
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        text: userMsg,
        sender: 'user',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setIsLoading(true);

    // Generate intelligent instant response using client financial context
    setTimeout(async () => {
      let botReply = '';
      if (financialContext) {
        botReply = generateCopilotResponse(userMsg, financialContext);
      }

      // If client context didn't trigger a tailored answer and network is available, try backend API
      if (!botReply || botReply.startsWith('Here is a real-time summary')) {
        try {
          const { data } = await chatAPI.sendMessage(userMsg);
          if (data && data.reply) {
            botReply = data.reply;
          }
        } catch {
          // Fall back to financial copilot analysis
          if (!botReply && financialContext) {
            botReply = generateCopilotResponse(userMsg, financialContext);
          }
        }
      }

      if (!botReply) {
        botReply = 'I am currently unable to fetch additional records. You can check your cash flow summary in the Analytics tab.';
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: botReply,
          sender: 'ai',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsLoading(false);
    }, 450);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Financial Assistant"
        title="FinBot AI Financial Assistant"
        className="ai-chatbot-trigger"
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Bot size={24} strokeWidth={2.2} />
      </button>
    );
  }

  return (
    <div className="ai-chatbot-window">
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          background: 'var(--surface-strong)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Bot size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>FinBot AI</strong>
              <span className="badge-pill badge-pill-mint" style={{ fontSize: '0.65rem' }}>Active</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Financial Intelligence Assistant</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close Assistant"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--bg)',
        }}
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              backgroundColor: msg.sender === 'user' ? '#10b981' : 'var(--surface)',
              color: msg.sender === 'user' ? '#ffffff' : 'var(--text)',
              padding: '10px 14px',
              borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              boxShadow: 'var(--shadow-sm)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
              fontSize: '0.86rem',
              lineHeight: 1.5,
            }}
          >
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {msg.text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
            </div>
            {msg.time && (
              <div
                style={{
                  fontSize: '0.65rem',
                  color: msg.sender === 'user' ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)',
                  marginTop: 4,
                  textAlign: msg.sender === 'user' ? 'right' : 'left',
                }}
              >
                {msg.time}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <Loader2 size={15} className="spin" />
            <span style={{ fontSize: '0.8rem' }}>Analyzing ledger records...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips */}
      {messages.length <= 2 && (
        <div style={{ padding: '6px 14px', background: 'var(--surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {PROMPT_SUGGESTIONS.map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(null, prompt)}
              className="badge-pill badge-pill-neutral"
              style={{ cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.72rem', padding: '4px 8px' }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '8px',
          backgroundColor: 'var(--surface-strong)',
        }}
      >
        <input
          type="text"
          placeholder="Ask FinBot about expenses, budgets..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '9px 14px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            borderRadius: '10px',
            outline: 'none',
            fontSize: '0.85rem',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            background: isLoading || !input.trim() ? 'var(--surface-strong)' : '#10b981',
            color: isLoading || !input.trim() ? 'var(--text-muted)' : '#ffffff',
            border: '1px solid var(--border)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
