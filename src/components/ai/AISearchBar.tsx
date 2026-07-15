// src/components/ai/AISearchBar.tsx

import React, { useState, useRef, useEffect } from 'react';
import { processAIQuery, type TrackOption, type VideoPlatform } from '../../services/AIEngine';
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
  tipData?: {  // 🔥 НОВОЕ: данные для отображения совета в красивом формате
    title?: string;
    category?: string;
    berkleeTip?: string;
    actionable?: string;
    relatedArtists?: string[];
  };
}

const HINTS = [
  "Ask TouchGrass AI...",
  "🎸 Try: 'Find a blues backing track in Am'",
  "🎹 Try: 'Show me the Cmaj7 chord'",
  "🎼 Try: 'How to play over E7 alt?'",
  "⚡ Try: 'Generate a Dorian lick'",
  "🎵 Try: 'Set tempo to 96 BPM'"
];

const QUICK_PROMPTS = [
  { label: "🎸 Find backing track", query: "Find a blues backing track in Am" },
  { label: "🎹 Show chord", query: "Show me Cmaj7 chord" },
  { label: "🎼 Play over", query: "How to play over E7 alt?" },
  { label: "⚡ Generate lick", query: "Generate a Dorian lick in E" },
  { label: "🎵 Set tempo", query: "Set tempo to 96 BPM" }
];

const WELCOME_MESSAGE = {
  text: "🤖 Привет! Я TouchGrass AI — ваш музыкальный ассистент.\n\n" +
        "🎸 Что я умею:\n" +
        "• Находить минусовки: *«Найди блюз минус в Am»*\n" +
        "• Показывать аккорды: *«Покажи Cmaj7»*\n" +
        "• Подсвечивать лады: *«Как обыграть E7?»*\n" +
        "• Генерировать табы: *«Придумай фразу в Dorian»*\n\n" +
        "Напиши свой запрос или выбери одно из действий ниже 👇"
};

// ============================================================
// 🔥 НОВЫЙ КОМПОНЕНТ — ОТОБРАЖЕНИЕ СОВЕТА В СТИЛЕ BERKLEE
// ============================================================

const TipDisplay: React.FC<{ 
  text: string;
  tipData?: {
    title?: string;
    category?: string;
    berkleeTip?: string;
    actionable?: string;
    relatedArtists?: string[];
  };
}> = ({ text, tipData }) => {
  // Определяем, есть ли в тексте маркеры Berklee или TouchGrass
  const hasBerklee = text.includes('Berklee') || text.includes('🎓');
  const hasTouchGrass = text.includes('TouchGrass') || text.includes('🌿');

  // Извлекаем заголовок (первая строка до \n или : )
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const titleLine = lines.find(line => 
    line.includes(':') || 
    line.match(/^[A-ZА-Я][a-zа-я]+/) ||
    line.match(/^[🎸🤘🎵🌀🎹🎯🔥🥁⚡🌊🎩📝🧠🌿]/)
  );
  
  let title = tipData?.title || '';
  let description = text;
  
  // Если есть заголовок в тексте (формат "Заголовок: описание")
  if (titleLine && titleLine.includes(':')) {
    const parts = titleLine.split(':');
    title = parts[0].trim();
    description = text.replace(titleLine, parts.slice(1).join(':').trim()).trim();
  } else if (tipData?.title) {
    title = tipData.title;
    description = text;
  }

  // Получаем категорию
  const category = tipData?.category || 'Совет';
  const categoryEmojis: Record<string, string> = {
    'technique': '🎸',
    'harmony': '🎹',
    'rhythm': '🥁',
    'dynamics': '🌊',
    'style': '🎩',
    'practice': '📝',
    'touchgrass': '🌿',
    'general': '💡'
  };
  const categoryEmoji = categoryEmojis[category] || '💡';

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,255,157,0.04), rgba(0,255,157,0.01))',
      border: '1px solid rgba(0,255,157,0.08)',
      borderRadius: '16px',
      padding: '14px 18px',
      maxWidth: '95%',
      width: '100%',
      fontSize: '13px',
      lineHeight: '1.6',
      color: 'var(--text-primary)',
      marginTop: '4px',
    }}>
      {/* Заголовок с категорией */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '6px',
      }}>
        <span style={{ fontSize: '18px' }}>{categoryEmoji}</span>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          opacity: 0.7,
          background: 'rgba(0,255,157,0.08)',
          padding: '2px 10px',
          borderRadius: '12px',
        }}>
          {category}
        </span>
        {tipData?.relatedArtists && tipData.relatedArtists.length > 0 && (
          <span style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            opacity: 0.5,
            marginLeft: 'auto',
          }}>
            🎤 {tipData.relatedArtists.slice(0, 2).join(' · ')}
          </span>
        )}
      </div>

      {/* Заголовок совета */}
      {title && (
        <div style={{
          fontSize: '16px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '6px',
          letterSpacing: '-0.3px',
        }}>
          {title}
        </div>
      )}

      {/* Описание */}
      <div style={{
        color: 'var(--text-secondary)',
        fontSize: '13px',
        lineHeight: '1.6',
        marginBottom: '8px',
        whiteSpace: 'pre-wrap',
      }}>
        {description}
      </div>

      {/* Практическое действие (actionable) */}
      {tipData?.actionable && (
        <div style={{
          background: 'rgba(0,255,157,0.06)',
          borderLeft: '3px solid var(--accent)',
          padding: '6px 12px',
          borderRadius: '4px',
          marginBottom: '8px',
          fontSize: '12px',
          color: 'var(--text-primary)',
        }}>
          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>🎯 Практика:</span> {tipData.actionable}
        </div>
      )}

      {/* Цитата Berklee */}
      {tipData?.berkleeTip && (
        <div style={{
          marginTop: '6px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(0,255,157,0.08)',
          fontSize: '12px',
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          opacity: 0.8,
        }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>🎓</span> “{tipData.berkleeTip}”
        </div>
      )}

      {/* Брендирование TouchGrass */}
      {hasTouchGrass && (
        <div style={{
          marginTop: '6px',
          fontSize: '10px',
          color: '#6bcb77',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          opacity: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span>🌿</span> TouchGrass Philosophy
        </div>
      )}

      {/* Брендирование Berklee */}
      {hasBerklee && !tipData?.berkleeTip && (
        <div style={{
          marginTop: '4px',
          fontSize: '10px',
          color: 'var(--accent)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          opacity: 0.5,
        }}>
          🎓 Berklee Tip
        </div>
      )}
    </div>
  );
};

// ============================================================
// 🔥 КОМПОНЕНТЫ ВЫБОРА
// ============================================================

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
            background: 'rgba(0, 255, 157, 0.08)',
            border: '1px solid rgba(0, 255, 157, 0.2)',
            color: 'var(--accent)',
            padding: '6px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0, 255, 157, 0.15)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0, 255, 157, 0.08)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {p.icon} {p.label}
        </button>
      ))}
    </div>
  );
};

const OptionsRenderer: React.FC<{ 
  options: TrackOption[];
  onSelect: (opt: TrackOption) => void;
}> = ({ options, onSelect }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt)}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '10px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0, 255, 157, 0.05)';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          }}
        >
          {opt.icon && <span style={{ fontSize: '16px' }}>{opt.icon}</span>}
          {opt.title}
        </button>
      ))}
    </div>
  );
};

const QuickPrompts: React.FC<{ onSelect: (query: string) => void }> = ({ onSelect }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '8px', 
      marginTop: '12px',
      justifyContent: 'center'
    }}>
      {QUICK_PROMPTS.map((prompt, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(prompt.query)}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-secondary)',
            padding: '6px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0, 255, 157, 0.08)';
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {prompt.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================
// 🔥 ОСНОВНОЙ КОМПОНЕНТ AISearchBar
// ============================================================

const AISearchBar: React.FC<AISearchBarProps> = ({ onAction }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hintIndex, setHintIndex] = useState(0);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { setKeyNote, setMode, setBpm } = useMusic();

  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % HINTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (isOpen && !hasWelcomed && messages.length === 0) {
      setHasWelcomed(true);
      addMessage({
        role: 'ai',
        text: WELCOME_MESSAGE.text
      });
    }
  }, [isOpen, hasWelcomed, messages.length]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { 
      ...msg, 
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now() 
    }]);
  };

  const handleAction = (action: any) => {
    if (!action) return;
    const normalize = (n: string) => ({ 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' }[n] || n);

    if (action.type === 'SET_BPM') {
      setBpm(action.payload?.bpm);
    } else if (action.type === 'SET_CONTEXT') {
      if (action.payload?.key) setKeyNote(normalize(action.payload.key));
      if (action.payload?.mode) setMode(action.payload.mode);
    } else if (action.type === 'OPEN_AUTOTAB') {
      if (action.payload?.key) setKeyNote(normalize(action.payload.key));
      if (action.payload?.mode) setMode(action.payload.mode);
      if (onAction) onAction({ type: 'OPEN_AUTOTAB' });
    } else if (onAction) {
      onAction(action);
    }
  };

  const handleSearch = async (text?: string) => {
    const userText = (text || query).trim();
    if (!userText) return;
    
    setQuery('');
    setIsOpen(true);
    addMessage({ role: 'user', text: userText });
    setIsLoading(true);

    try {
      const res = await processAIQuery(userText);
      
      // 🔥 Проверяем, является ли ответ советом (содержит маркеры Berklee или TouchGrass)
      const isTip = res.text.includes('Berklee') || 
                    res.text.includes('TouchGrass') || 
                    res.text.includes('🎓') || 
                    res.text.includes('🌿') ||
                    res.text.includes('Практика:') ||
                    res.text.includes('Совет');
      
      addMessage({
        role: 'ai',
        text: res.text,
        options: res.options,
        platformOptions: res.platformOptions,
        searchQuery: res.searchQuery,
        // 🔥 Если это совет — добавляем метаданные для красивого отображения
        tipData: isTip ? {
          title: extractTipTitle(res.text),
          category: detectTipCategory(res.text),
          berkleeTip: extractBerkleeQuote(res.text),
          actionable: extractActionable(res.text),
          relatedArtists: extractArtists(res.text),
        } : undefined,
      });
      if (res.action) handleAction(res.action);
    } catch (error) {
      addMessage({ role: 'ai', text: '❌ Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // 🔥 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ИЗВЛЕЧЕНИЯ ДАННЫХ ИЗ ТЕКСТА
  // ============================================================

  const extractTipTitle = (text: string): string => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const titleLine = lines.find(line => 
      line.includes(':') && !line.includes('Berklee') && !line.includes('TouchGrass')
    );
    if (titleLine && titleLine.includes(':')) {
      return titleLine.split(':')[0].trim();
    }
    // Ищем первую строку без эмодзи в начале
    const cleanLine = lines.find(line => 
      !line.match(/^[🤖🎸🤘🎵🌀🎹🎯🔥🥁⚡🌊🎩📝🧠🌿💡]/) && 
      line.length > 5 && 
      line.length < 60
    );
    return cleanLine ? cleanLine.trim() : 'Совет от TouchGrass';
  };

  const detectTipCategory = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('техник') || lower.includes('бенд') || lower.includes('легат') || lower.includes('вибрат')) return 'technique';
    if (lower.includes('гармон') || lower.includes('аккорд') || lower.includes('арпеджи') || lower.includes('тональн')) return 'harmony';
    if (lower.includes('ритм') || lower.includes('синкоп') || lower.includes('темп') || lower.includes('метр')) return 'rhythm';
    if (lower.includes('динамик') || lower.includes('громк') || lower.includes('тих')) return 'dynamics';
    if (lower.includes('стиль') || lower.includes('джаз') || lower.includes('блюз') || lower.includes('рок')) return 'style';
    if (lower.includes('практик') || lower.includes('упражн') || lower.includes('ежедн') || lower.includes('запис')) return 'practice';
    if (lower.includes('touchgrass') || lower.includes('трав') || lower.includes('парк') || lower.includes('свеж')) return 'touchgrass';
    return 'general';
  };

  const extractBerkleeQuote = (text: string): string | undefined => {
    const match = text.match(/["„]([^"„"]+)["”]/);
    if (match) return match[1];
    // Ищем строку с Berklee
    const lines = text.split('\n');
    const berkleeLine = lines.find(line => line.includes('Berklee'));
    if (berkleeLine) {
      const clean = berkleeLine.replace(/[🎓BerkleeTip]/g, '').trim();
      if (clean.length > 0 && clean.length < 100) return clean;
    }
    return undefined;
  };

  const extractActionable = (text: string): string | undefined => {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes('Практика:') || line.includes('🎯') || line.includes('Сделай:')) {
        const clean = line.replace(/[🎯Практика:]/g, '').trim();
        if (clean.length > 0 && clean.length < 80) return clean;
      }
    }
    return undefined;
  };

  const extractArtists = (text: string): string[] | undefined => {
    const match = text.match(/[🎤|:]?\s*([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][a-z]+\s[A-Z][a-z]+|[A-Z]\. [A-Z][a-z]+)/g);
    if (match) {
      return match.slice(0, 3).map(a => a.replace(/[🎤|:]/g, '').trim()).filter(Boolean);
    }
    return undefined;
  };

  // ============================================================
  // 🔥 ОБРАБОТЧИКИ СОБЫТИЙ
  // ============================================================

  const handleOptionSelect = (opt: TrackOption) => {
    if (!opt.action) return;
    
    if (opt.action.type === 'OPEN_CHORD') {
      if (onAction) onAction(opt.action);
      setIsOpen(false);
      return;
    }
    
    if (opt.action.type === 'SEARCH_BACKING') {
      const query = opt.action.payload?.query || 'guitar backing track';
      const encoded = encodeURIComponent(query);
      window.open(`https://www.youtube.com/results?search_query=${encoded}`, '_blank');
      setIsOpen(false);
      return;
    }
    
    if (opt.action.type === 'OPEN_AUTOTAB') {
      if (opt.action.payload?.key) {
        const normalize = (n: string) => ({ 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' }[n] || n);
        setKeyNote(normalize(opt.action.payload.key));
        if (opt.action.payload?.mode) setMode(opt.action.payload.mode);
      }
      if (onAction) onAction({ type: 'OPEN_AUTOTAB' });
      setIsOpen(false);
      return;
    }
    
    handleAction(opt.action);
    setIsOpen(false);
  };

  const handlePlatformSelect = (platform: VideoPlatform, searchQuery: string) => {
    const encoded = encodeURIComponent(searchQuery);
    const urls = {
      youtube: `https://www.youtube.com/results?search_query=${encoded}`,
      rutube: `https://rutube.ru/search/?query=${encoded}`,
      vk: `https://vk.com/video?q=${encoded}`
    };
    window.open(urls[platform], '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleQuickPrompt = (query: string) => {
    handleSearch(query);
  };

  const clearChat = () => {
    setMessages([]);
    setHasWelcomed(false);
  };

  // ============================================================
  // 🔥 РЕНДЕР
  // ============================================================

  return (
    <div ref={wrapperRef} style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border-color)'}`,
        borderRadius: '24px',
        padding: '4px 16px 4px 20px',
        transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        boxShadow: isOpen ? '0 4px 20px rgba(0,255,157,0.1)' : 'none',
      }}>
        <span style={{ fontSize: '18px', marginRight: '10px', opacity: 0.6 }}>🤖</span>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => {
            setIsOpen(true);
            if (messages.length === 0 && !hasWelcomed) {
              setHasWelcomed(true);
              addMessage({
                role: 'ai',
                text: WELCOME_MESSAGE.text
              });
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder={HINTS[hintIndex]}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: '14px',
            padding: '10px 0',
            fontWeight: 500,
          }}
        />
        
        {isLoading ? (
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, padding: '0 8px' }}>
            ...
          </span>
        ) : query && (
          <button
            onClick={() => handleSearch()}
            style={{
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 16px',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              transition: '0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Send
          </button>
        )}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          maxHeight: '450px',
          overflowY: 'auto',
          padding: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          zIndex: 1000,
        }}>
          
          {messages.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button
                onClick={clearChat}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: '0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                ✕ Clear chat
              </button>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px',
                width: '100%',
              }}
            >
              {/* Сообщение пользователя */}
              {msg.role === 'user' && (
                <div
                  style={{
                    background: 'var(--accent)',
                    color: '#000',
                    padding: '10px 14px',
                    borderRadius: '16px 16px 4px 16px',
                    maxWidth: '85%',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    fontWeight: 700,
                  }}
                >
                  {msg.text}
                </div>
              )}

              {/* Сообщение AI */}
              {msg.role === 'ai' && (
                <>
                  {/* 🔥 Если это совет — используем TipDisplay */}
                  {msg.tipData ? (
                    <TipDisplay 
                      text={msg.text} 
                      tipData={msg.tipData}
                    />
                  ) : (
                    // Обычное сообщение
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: '16px 16px 16px 4px',
                        maxWidth: '95%',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        fontWeight: 400,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.text}
                    </div>
                  )}

                  {/* Опции и платформы */}
                  {msg.options && (
                    <OptionsRenderer options={msg.options} onSelect={handleOptionSelect} />
                  )}
                  {msg.platformOptions && msg.searchQuery && (
                    <PlatformSelector
                      platforms={msg.platformOptions}
                      onSelect={(p) => handlePlatformSelect(p, msg.searchQuery!)}
                    />
                  )}
                </>
              )}
            </div>
          ))}

          {isLoading && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '8px 0' }}>
              <span style={{ 
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent)',
                marginRight: '8px',
                animation: 'pulse 1s infinite',
              }} />
              Thinking...
            </div>
          )}

          {messages.length === 0 && (
            <QuickPrompts onSelect={handleQuickPrompt} />
          )}
          {messages.length > 0 && messages[messages.length - 1]?.role === 'ai' && (
            <QuickPrompts onSelect={handleQuickPrompt} />
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
};

export default AISearchBar;