import React, { useState } from 'react';
import { processAIQuery } from '../../services/AIEngine';
import { useMusic } from '../../context/MusicContext';

interface AISearchBarProps {
  onAction?: (action: any) => void;
}

const AISearchBar: React.FC<AISearchBarProps> = ({ onAction }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const { setKeyNote, setMode, setBpm } = useMusic();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse('');
    
    try {
      const res = await processAIQuery(query);
      setResponse(res.text);

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
      setResponse('🔴 Ошибка обработки запроса.');
    } finally {
      setIsLoading(false);
      setQuery(''); // Очищаем строку после отправки
    }
  };

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: '480px', margin: '0 24px' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', width: '100%' }}>
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
      
      {/* Выпадающее окно (Popover) с ответом ИИ */}
      {response && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '16px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>TouchGrass 🎵</span>
            <button onClick={() => setResponse('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: 0 }}>✕</button>
          </div>
          {response}
        </div>
      )}
    </div>
  );
};

export default AISearchBar;