// 🔥 ИСПРАВЛЕНО: Добавлен type перед KeyboardEvent
import React, { useState, type KeyboardEvent, useRef, useEffect } from 'react';
// 🔥 ИСПРАВЛЕНО: Добавлен type перед AIResponse и TrackOption
import { processAIQuery, type AIResponse, type TrackOption } from '../../services/AIEngine';

interface AISearchBarProps {
  onAction?: (action: any) => void;
}

const AISearchBar: React.FC<AISearchBarProps> = ({ onAction }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setIsOpen(true);
    const res = await processAIQuery(query);
    setResponse(res);
    setIsLoading(false);
    
    if (res.action && onAction) onAction(res.action);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleOptionClick = (opt: TrackOption) => {
    if (opt.action && onAction) {
      onAction(opt.action);
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '4px 16px', boxShadow: isOpen ? '0 0 12px rgba(0,255,157,0.2)' : 'none', transition: '0.2s' }}>
        <span style={{ marginRight: '8px', opacity: 0.5, fontSize: '14px' }}>✨</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask TouchGrass AI (e.g. 'Blues track in A')"
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', padding: '8px 0', fontWeight: 600 }}
        />
        {isLoading && <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Thinking...</span>}
      </div>

      {isOpen && response && (
        <div style={{ position: 'absolute', top: 'calc(100% + 12px)', left: 0, right: 0, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', zIndex: 100, boxShadow: '0 12px 48px rgba(0,0,0,0.6)' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)', fontWeight: 600 }}>{response.text}</p>
          
          {response.options && (
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              {response.options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionClick(opt)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', color: 'var(--text-primary)', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  {opt.icon && <span style={{ fontSize: '18px' }}>{opt.icon}</span>}
                  <span style={{ fontWeight: 800, fontSize: '13px' }}>{opt.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISearchBar;