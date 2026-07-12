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
        // Пробрасываем команду переключения окон в AppShell
        if (onAction) onAction(res.action);
      }
    } catch (err) {
      setResponse('🔴 Ошибка обработки запроса.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask TouchGrass 🎵 to show a chord, write a solo, or change the jam..."
          style={{ flex: 1, background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
        />
        <button type="submit" disabled={isLoading} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0 24px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}>
          {isLoading ? 'THINKING...' : 'ASK AI'}
        </button>
      </form>
      {response && (
        <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', fontSize: '14px', color: 'var(--text-secondary)', borderLeft: '4px solid var(--accent)', lineHeight: '1.5' }}>
          {response}
        </div>
      )}
    </div>
  );
};

export default AISearchBar;