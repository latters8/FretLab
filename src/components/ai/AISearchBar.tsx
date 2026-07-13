import React, { useState, useEffect, useRef } from 'react';
import { processAIQuery, type TrackOption } from '../../services/AIEngine';
import { useMusic } from '../../context/MusicContext';

interface AISearchBarProps {
  onAction?: (action: any) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  options?: TrackOption[];
}

// 🔥 МАССИВ ДИНАМИЧЕСКИХ ПОДСКАЗОК ДЛЯ ИИ
const HINTS = [
  "Ask TouchGrass AI...",
  "🎸 Try: 'Find a blues backing track in Am'",
  "🎹 Try: 'Show me the Cmaj7 chord'",
  "🎼 Try: 'How to play over E7 alt?'",
  "⚡ Try: 'Generate a Dorian lick'"
];

const OptionsRenderer: React.FC<{options: TrackOption[]}> = ({ options }) => {
  const { setKeyNote, setMode, setBpm, setCurrentTrack } = useMusic();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
      {options.map(opt => (
        <button 
          key={opt.id}
          onClick={() => {
            if (opt.key) setKeyNote(opt.key);
            if (opt.mode) setMode(opt.mode as any);
            if (opt.bpm) setBpm(opt.bpm);
            setCurrentTrack({ platform: 'youtube', id: opt.id, title: opt.title });
          }}
          style={{ background: 'rgba(0, 255, 157, 0.1)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 800, transition: '0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 255, 157, 0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 255, 157, 0.1)'}
        >
          ▶ {opt.title}
        </button>
      ))}
    </div>
  );
};

const AISearchBar: React.FC<AISearchBarProps> = ({ onAction }) => {
  const [query, setQuery] = useState('');
  const [modalQuery, setModalQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Стейт для текущей подсказки
  const [hintIndex, setHintIndex] = useState(0);
  
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('fretlab_chat_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [showFullChat, setShowFullChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('fretlab_chat_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (showFullChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, showFullChat]);

  // 🔥 МАГИЯ РОТАЦИИ: Меняем плейсхолдер каждые 4 секунды
  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % HINTS.length);
    }, 4000);
    return () => clearInterval(interval); // Очистка таймера при размонтировании
  }, []);

  const handleSubmit = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    setHistory(prev => [...prev, userMsg]);
    setQuery('');
    setModalQuery('');
    setIsLoading(true);

    const response = await processAIQuery(text);
    
    const aiMsg: ChatMessage = { 
      id: (Date.now() + 1).toString(), 
      role: 'ai', 
      text: response.text, 
      timestamp: Date.now(),
      options: response.options 
    };
    
    setHistory(prev => [...prev, aiMsg]);
    setIsLoading(false);

    if (response.action && onAction) {
      onAction(response.action);
    }
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      
      {/* СТРОКА ПОИСКА В ПРЕХЕДЕРЕ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '4px 16px', transition: '0.2s', width: '100%' }}>
        <span style={{ fontSize: '16px' }}>🤖</span>
        <form onSubmit={e => { e.preventDefault(); handleSubmit(query); setShowFullChat(true); }} style={{ flex: 1 }}>
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder={HINTS[hintIndex]} 
            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', padding: '8px 0' }} 
          />
        </form>
        <button onClick={() => setShowFullChat(true)} style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }} title="Open Full Chat">
          ⛶
        </button>
      </div>

      {/* ПОЛНОЭКРАННЫЙ ЧАТ (МОДАЛКА) */}
      {showFullChat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: '800px', height: '80vh', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            
            <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <div>
                  <div style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '16px', letterSpacing: '1px' }}>TouchGrass AI</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Your Personal Music Assistant</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setHistory([])} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}>CLEAR CHAT</button>
                <button onClick={() => setShowFullChat(false)} style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.length === 0 && (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', maxWidth: '300px' }}>
                  <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px', opacity: 0.2 }}>🎸</span>
                  Ask me to find a backing track, show a chord, or map an arpeggio on the fretboard!
                </div>
              )}
              {history.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ background: msg.role === 'user' ? 'var(--bg-secondary)' : 'var(--bg-primary)', color: 'var(--text-primary)', border: msg.role === 'user' ? '1px solid var(--accent)' : '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '12px', maxWidth: '85%', fontSize: '14px', lineHeight: '1.6' }}>
                    {msg.text}
                    {msg.options && <OptionsRenderer options={msg.options} />}
                  </div>
                </div>
              ))}
              {isLoading && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Thinking...</div>}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '20px 24px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
              <form onSubmit={e => { e.preventDefault(); handleSubmit(modalQuery); }} style={{ display: 'flex', gap: '12px' }}>
                {/* 🔥 Динамическая подсказка в модальном окне */}
                <input type="text" value={modalQuery} onChange={e => setModalQuery(e.target.value)} placeholder={HINTS[hintIndex]} style={{ flex: 1, background: 'var(--bg-root)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '24px', outline: 'none' }} />
                <button type="submit" disabled={isLoading} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0 24px', borderRadius: '24px', fontWeight: 900, cursor: 'pointer', transition: '0.2s' }}>SEND</button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AISearchBar;