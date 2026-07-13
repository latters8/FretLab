// src/components/ai/AISearchBar.tsx

import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { processAIQuery, type TrackOption, type VideoPlatform, type AIResponse } from '../../services/AIEngine';
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
  platformOptions?: { platform: VideoPlatform; label: string; icon: string }[];
  searchQuery?: string;
}

const HINTS = [
  "Ask TouchGrass AI...",
  "🎸 Try: 'Find a blues backing track in Am'",
  "🎹 Try: 'Show me the Cmaj7 chord'",
  "🎼 Try: 'How to play over E7 alt?'",
  "⚡ Try: 'Generate a Dorian lick'"
];

// 🔥 КОМПОНЕНТ ВЫБОРА ПЛАТФОРМЫ
const PlatformSelector: React.FC<{ 
  platforms: { platform: VideoPlatform; label: string; icon: string }[];
  onSelect: (platform: VideoPlatform) => void;
}> = ({ platforms, onSelect }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
      {platforms.map(p => (
        <button
          key={p.platform}
          onClick={() => onSelect(p.platform)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--bg-panel)', border: '1px solid var(--border-color)',
            padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
            color: 'var(--text-primary)', fontSize: '12px', fontWeight: 800,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        >
          <span>{p.icon}</span> {p.label}
        </button>
      ))}
    </div>
  );
};

const AISearchBar: React.FC<AISearchBarProps> = ({ onAction }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { setKeyNote, setMode } = useMusic();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!query && !isOpen) {
        setCurrentHintIndex(prev => (prev + 1) % HINTS.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [query, isOpen]);

  const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const applyChordToEngine = (chordStr: string) => {
    const match = chordStr.match(/^([A-G][b#]?)(.*)$/);
    if (!match) return;
    const root = match[1];
    const quality = match[2].toLowerCase();

    const ENHARMONIC_MAP: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    const normalize = (n: string) => ENHARMONIC_MAP[n] || n;

    setKeyNote(normalize(root));
    
    if (quality.includes('alt')) setMode('altered');
    else if (quality.includes('maj7') || quality.includes('maj9')) setMode('maj7_arp');
    else if (quality.includes('m7') || quality.includes('m9') || quality.includes('m11')) setMode('min7_arp');
    else if (quality.includes('9')) setMode('dom9_arp');
    else if (quality.includes('7')) setMode('dom7_arp');
    else if (quality.includes('m') && !quality.includes('dim')) setMode('minor');
    else if (quality.includes('dim')) setMode('locrian');
    else setMode('major');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    const userText = query.trim();
    setQuery('');
    setIsOpen(true);
    addMessage({ role: 'user', text: userText });
    setIsLoading(true);

    try {
      const res = await processAIQuery(userText);
      addMessage({
        role: 'ai',
        text: res.text,
        options: res.options,
        platformOptions: res.platformOptions,
        searchQuery: res.searchQuery
      });

      if (res.action && onAction) onAction(res.action);
    } catch (error) {
      addMessage({ role: 'ai', text: 'Ошибка соединения с ИИ. Попробуй позже.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleOptionClick = (opt: TrackOption) => {
    if (!opt.action) return;

    if (opt.action.type === 'FIND_BACKING_TRACK') {
      const aiResp: AIResponse = {
        text: `Отлично! Выбери стриминг, где будем искать джем для **${opt.action.payload.chord}**: 🎧`,
        platformOptions: [
          { platform: 'youtube', label: 'YouTube', icon: '📺' },
          { platform: 'vk', label: 'VK Видео', icon: '🟦' },
          { platform: 'rutube', label: 'RuTube', icon: '▶️' }
        ],
        searchQuery: `${opt.action.payload.chord} guitar backing track` 
      };
      addMessage({ role: 'ai', ...aiResp });
      return;
    }

    if (opt.action.type === 'PLAY_OVER_CHORD') {
      applyChordToEngine(opt.action.payload.chord);
      if (onAction) onAction({ type: 'OPEN_TAB_GEN' }); 
      addMessage({ role: 'ai', text: `Гриф перестроен для обыгрывания аккорда **${opt.action.payload.chord}**! Готово! 🔥` });
      return;
    }

    if (opt.action.type === 'GENERATE_LICK') {
      applyChordToEngine(opt.action.payload.chord);
      if (onAction) onAction({ type: 'OPEN_AUTOTAB' }); 
      addMessage({ role: 'ai', text: `Запускаю генератор соло-фраз в тональности **${opt.action.payload.chord}**! ⚡` });
      return;
    }

    if (onAction) {
      onAction(opt.action);
    }
  };

  const handlePlatformSelect = (platform: VideoPlatform, q?: string) => {
    if (!q) return;
    const encoded = encodeURIComponent(q);
    
    if (platform === 'youtube') window.open(`https://www.youtube.com/results?search_query=${encoded}`, '_blank', 'noopener,noreferrer');
    else if (platform === 'vk') window.open(`https://vk.com/video?q=${encoded}`, '_blank', 'noopener,noreferrer');
    else if (platform === 'rutube') window.open(`https://rutube.ru/search/?query=${encoded}`, '_blank', 'noopener,noreferrer');
    
    const pName = platform === 'youtube' ? 'YouTube' : platform === 'vk' ? 'VK Видео' : 'RuTube';
    addMessage({ role: 'ai', text: `Открываю поиск для "${q}" на платформе ${pName}! 🎸` });
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto', zIndex: 1000 }}>
      
      {isOpen && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: 'var(--bg-root)', border: '1px solid var(--border-color)', borderRadius: '16px 16px 0 0', borderBottom: 'none', padding: '16px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease-out' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '20px' }}>🤖</span>
            <span style={{ fontWeight: 900, color: 'var(--accent)', fontSize: '14px', letterSpacing: '1px' }}>TOUCHGRASS AI</span>
            <button onClick={() => setIsOpen(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>×</button>
          </div>

          {messages.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>
              Ask me to find chords, backing tracks, or generate licks! 🎸
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-panel)',
                color: msg.role === 'user' ? '#000' : 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                maxWidth: '85%',
                fontSize: '14px',
                lineHeight: '1.5',
                border: msg.role === 'ai' ? '1px solid var(--border-color)' : 'none',
                fontWeight: msg.role === 'user' ? 700 : 500
              }}>
                {msg.text}
              </div>

              {msg.platformOptions && msg.searchQuery && (
                <PlatformSelector 
                  platforms={msg.platformOptions} 
                  onSelect={(p) => handlePlatformSelect(p, msg.searchQuery)} 
                />
              )}

              {msg.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', width: '100%', maxWidth: '300px' }}>
                  {msg.options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionClick(opt)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                        padding: '10px 16px', borderRadius: '8px', cursor: 'pointer',
                        color: 'var(--text-primary)', textAlign: 'left',
                        transition: 'all 0.2s', fontSize: '13px', fontWeight: 800
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                    >
                      {opt.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '13px', fontWeight: 800, padding: '12px' }}>
              <span style={{ animation: 'pulse 1s infinite' }}>●</span> AI is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1001 }}>
        <div style={{ 
          background: isOpen ? 'var(--bg-panel)' : 'var(--bg-secondary)', 
          border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border-color)'}`,
          borderRadius: isOpen ? '0 0 24px 24px' : '24px', 
          padding: '8px 8px 8px 24px', 
          display: 'flex', 
          alignItems: 'center',
          boxShadow: isOpen ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <span style={{ marginRight: '12px', opacity: isOpen ? 1 : 0.5, fontSize: '18px', transition: '0.3s', filter: isOpen ? 'drop-shadow(0 0 8px var(--accent))' : 'none' }}>✨</span>
          
          <div style={{ flex: 1, position: 'relative' }}>
            {!query && !isOpen && (
              <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', fontSize: '14px', fontWeight: 600, transition: 'opacity 0.3s' }}>
                {HINTS[currentHintIndex]}
              </div>
            )}
            <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsOpen(true)}
                style={{ 
                  width: '100%', 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  outline: 'none', 
                  fontSize: '15px', 
                  fontWeight: 600,
                  padding: '8px 0',
                  position: 'relative',
                  zIndex: 2
                }}
              />
              <button 
                type="submit" 
                disabled={isLoading} 
                style={{ 
                  background: isLoading ? 'var(--text-muted)' : 'var(--accent)', 
                  color: '#000', 
                  border: 'none', 
                  padding: '10px 28px', 
                  borderRadius: '24px', 
                  fontWeight: 900, 
                  cursor: isLoading ? 'default' : 'pointer', 
                  transition: '0.2s',
                  fontSize: '13px',
                  letterSpacing: '0.5px',
                  marginLeft: '12px'
                }}
                onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(1)'; }}
              >
                SEND
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default AISearchBar;