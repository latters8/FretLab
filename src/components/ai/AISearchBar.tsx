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
  options?: TrackOption[]; // 🔥 Добавили поддержку кнопок в истории чата
}

const AISearchBar: React.FC<AISearchBarProps> = ({ onAction }) => {
  const [query, setQuery] = useState('');
  const [modalQuery, setModalQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('fretlab_chat_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [showPopover, setShowPopover] = useState(false);
  const [showFullChat, setShowFullChat] = useState(false);
  const { setKeyNote, setMode, setBpm } = useMusic();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('fretlab_chat_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (showFullChat) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, showFullChat]);

  const processSearch = async (text: string, fromModal: boolean) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    setHistory(prev => [...prev, userMsg]);
    setIsLoading(true);
    if (!fromModal) setShowPopover(true);

    try {
      const res = await processAIQuery(text);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: res.text,
        timestamp: Date.now(),
        options: res.options // Передаем опции в чат
      };
      setHistory(prev => [...prev, aiMsg]);

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
      setHistory(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: '🔴 Ошибка обработки.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 ОБРАБОТЧИК КЛИКА ПО ПРЕДЛОЖЕННОМУ ТРЕКУ
  const handleOptionClick = (opt: TrackOption) => {
    // 1. Применяем настройки трека
    if (opt.key) setKeyNote(opt.key);
    if (opt.mode) setMode(opt.mode as any);
    if (opt.bpm) setBpm(opt.bpm);
    
    if (onAction) {
      onAction({
        type: 'SET_CONTEXT',
        payload: { track: { platform: 'youtube', id: opt.id, title: opt.title } }
      });
    }

    // 2. Добавляем уведомление в чат об успехе
    setHistory(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'user', text: `Selected: ${opt.title}`, timestamp: Date.now() },
      { id: (Date.now() + 1).toString(), role: 'ai', text: `TouchGrass 🎵: Отличный выбор! Трек загружен, параметры установлены. Приятного джема!`, timestamp: Date.now() }
    ]);
    
    setShowPopover(false);
  };

  const handleHeaderSubmit = (e: React.FormEvent) => { e.preventDefault(); processSearch(query, false); setQuery(''); };
  const handleModalSubmit = (e: React.FormEvent) => { e.preventDefault(); processSearch(modalQuery, true); setModalQuery(''); };

  const latestAiMessage = [...history].reverse().find(m => m.role === 'ai');

  // Компонент для рендера кнопок опций
  const OptionsRenderer = ({ options }: { options: TrackOption[] }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
      {options.map((opt, i) => (
        <button 
          key={i} 
          onClick={() => handleOptionClick(opt)}
          style={{ background: 'var(--bg-primary)', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--accent)'; }}
        >
          <span>▶</span>
          <span>{opt.title}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div style={{ position: 'relative', flex: 1, maxWidth: '540px', margin: '0 24px', display: 'flex', gap: '8px' }}>
        <form onSubmit={handleHeaderSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>✨</span>
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Ask TouchGrass to find a backing track..."
              style={{ width: '100%', background: 'var(--bg-root)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px 8px 36px', borderRadius: '20px', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <button type="submit" disabled={isLoading} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0 16px', borderRadius: '20px', fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>ASK</button>
        </form>
        
        <button onClick={() => { setShowFullChat(true); setShowPopover(false); }} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0 12px', borderRadius: '20px', cursor: 'pointer' }}>💬</button>

        {/* POPOVER */}
        {showPopover && latestAiMessage && !showFullChat && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '16px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>TouchGrass 🎵</span>
              <button onClick={() => setShowPopover(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>{latestAiMessage.text}</div>
            
            {/* Отрисовка кнопок-опций в поповере */}
            {latestAiMessage.options && <OptionsRenderer options={latestAiMessage.options} />}
          </div>
        )}
      </div>

      {/* FULL CHAT MODAL */}
      {showFullChat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '700px', height: '85vh', background: 'var(--bg-panel)', borderRadius: '16px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 900 }}>💬 TouchGrass AI</div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => { setHistory([]); setShowPopover(false); }} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}>CLEAR</button>
                <button onClick={() => setShowFullChat(false)} style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-root)' }}>
              {history.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                  <div style={{ background: msg.role === 'user' ? 'var(--bg-hover)' : 'var(--bg-panel)', color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)', borderLeft: msg.role === 'ai' ? '3px solid var(--accent)' : '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '12px', maxWidth: '85%', fontSize: '14px', lineHeight: '1.6' }}>
                    {msg.text}
                    {/* Отрисовка кнопок-опций в полном чате */}
                    {msg.options && <OptionsRenderer options={msg.options} />}
                  </div>
                </div>
              ))}
              {isLoading && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Thinking...</div>}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '20px 24px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
              <form onSubmit={handleModalSubmit} style={{ display: 'flex', gap: '12px' }}>
                <input type="text" value={modalQuery} onChange={e => setModalQuery(e.target.value)} placeholder="Ask for a chord, tab, or backing track..." style={{ flex: 1, background: 'var(--bg-root)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '12px 20px', borderRadius: '24px', outline: 'none' }} />
                <button type="submit" disabled={isLoading} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0 24px', borderRadius: '24px', fontWeight: 800, cursor: 'pointer' }}>SEND</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AISearchBar;