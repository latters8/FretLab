import React, { useState, useEffect, useRef } from 'react';
import { processAIQuery } from '../../services/AIEngine';
import { useMusic } from '../../context/MusicContext';

interface AISearchBarProps {
  onAction?: (action: any) => void;
}

// 🔥 Новый интерфейс для хранения сообщений в памяти
interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

const AISearchBar: React.FC<AISearchBarProps> = ({ onAction }) => {
  const [query, setQuery] = useState('');
  const [modalQuery, setModalQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🔥 Подключаем LocalStorage: история не пропадет после обновления страницы
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('fretlab_chat_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [showPopover, setShowPopover] = useState(false);
  const [showFullChat, setShowFullChat] = useState(false);
  const { setKeyNote, setMode, setBpm } = useMusic();
  
  // Реф для автоскролла вниз в полном чате
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Сохраняем каждый чих в локальную память браузера
  useEffect(() => {
    localStorage.setItem('fretlab_chat_history', JSON.stringify(history));
  }, [history]);

  // Плавный скролл к новым сообщениям
  useEffect(() => {
    if (showFullChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, showFullChat]);

  // Общая логика обработки запросов
  const processSearch = async (text: string, fromModal: boolean) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setHistory(prev => [...prev, userMsg]);
    setIsLoading(true);
    
    // Показываем маленький поповер только если мы не в полноэкранном режиме
    if (!fromModal) setShowPopover(true);

    try {
      const res = await processAIQuery(text);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: res.text,
        timestamp: Date.now()
      };
      
      setHistory(prev => [...prev, aiMsg]);

      // Пробрасываем системные команды дирижера
      if (res.action) {
        if (res.action.type === 'SET_CONTEXT') {
          const p = res.action.payload;
          if (p.key) setKeyNote(p.key);
          if (p.mode) setMode(p.mode);
          if (p.bpm) setBpm(p.bpm);
        }
        if (onAction) onAction(res.action);
      }
    } catch (err) {
      setHistory(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: '🔴 Ошибка обработки запроса.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeaderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processSearch(query, false);
    setQuery('');
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processSearch(modalQuery, true);
    setModalQuery('');
  };

  const clearHistory = () => {
    setHistory([]);
    setShowPopover(false);
  };

  // Ищем последнее сообщение ИИ для мини-поповера
  const latestAiMessage = [...history].reverse().find(m => m.role === 'ai');

  return (
    <>
      {/* --- HEADER BAR (Компактный вид) --- */}
      <div style={{ position: 'relative', flex: 1, maxWidth: '540px', margin: '0 24px', display: 'flex', gap: '8px' }}>
        <form onSubmit={handleHeaderSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>✨</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask TouchGrass 🎵..."
              style={{ width: '100%', background: 'var(--bg-root)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px 8px 36px', borderRadius: '20px', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>
          <button type="submit" disabled={isLoading} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0 16px', borderRadius: '20px', fontWeight: 800, fontSize: '11px', cursor: 'pointer', transition: '0.2s' }}>
            {isLoading ? '...' : 'ASK'}
          </button>
        </form>
        
        {/* 🔥 КНОПКА ОТКРЫТИЯ ПОЛНОГО ЧАТА */}
        <button 
          onClick={() => { setShowFullChat(true); setShowPopover(false); }}
          style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0 12px', borderRadius: '20px', fontSize: '14px', cursor: 'pointer', transition: '0.2s' }}
          title="Open Full Chat History"
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          💬
        </button>

        {/* --- MINI POPOVER (Всплывает только если полный чат закрыт) --- */}
        {showPopover && latestAiMessage && !showFullChat && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '16px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>TouchGrass 🎵</span>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button onClick={() => { setShowFullChat(true); setShowPopover(false); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px', padding: 0 }}>FULL CHAT ↗</button>
                <button onClick={() => setShowPopover(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: 0, lineHeight: 1 }}>✕</button>
              </div>
            </div>
            {latestAiMessage.text}
          </div>
        )}
      </div>

      {/* --- 🔥 FULL CHAT MODAL OVERLAY --- */}
      {showFullChat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '700px', height: '85vh', background: 'var(--bg-panel)', borderRadius: '16px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>💬</span>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)' }}>TouchGrass AI</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Guitar Companion History</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button onClick={clearHistory} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ff4d4d'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  CLEAR HISTORY
                </button>
                <button onClick={() => setShowFullChat(false)} style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)', width: '32px', height: '32px', borderRadius: '50%', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}>
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-root)' }}>
              {history.length === 0 ? (
                <div style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>
                  <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px', opacity: 0.2 }}>✨</span>
                  No messages yet.<br/>Start the conversation below!
                </div>
              ) : (
                history.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', padding: '0 4px' }}>
                      {msg.role === 'user' ? 'You' : 'TouchGrass 🎵'}
                    </span>
                    <div style={{ 
                      background: msg.role === 'user' ? 'var(--bg-hover)' : 'var(--bg-panel)', 
                      color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: `1px solid var(--border-color)`,
                      borderLeft: msg.role === 'ai' ? '3px solid var(--accent)' : '1px solid var(--border-color)',
                      padding: '12px 16px', 
                      borderRadius: '12px', 
                      borderTopRightRadius: msg.role === 'user' ? '4px' : '12px',
                      borderTopLeftRadius: msg.role === 'ai' ? '4px' : '12px',
                      maxWidth: '85%',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div style={{ alignSelf: 'flex-start', background: 'var(--bg-panel)', borderLeft: '3px solid var(--accent)', padding: '12px 16px', borderRadius: '12px', borderTopLeftRadius: '4px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 800 }}>
                  Thinking...
                </div>
              )}
              {/* Невидимый якорь для автоскролла */}
              <div ref={messagesEndRef} />
            </div>

            {/* Modal Input Area */}
            <div style={{ padding: '20px 24px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
              <form onSubmit={handleModalSubmit} style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={modalQuery}
                  onChange={e => setModalQuery(e.target.value)}
                  placeholder="Ask for a chord, tab, or backing track..."
                  style={{ flex: 1, background: 'var(--bg-root)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '24px', fontSize: '14px', outline: 'none', transition: '0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
                <button type="submit" disabled={isLoading} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0 24px', borderRadius: '24px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: '0.2s' }}>
                  SEND
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AISearchBar;