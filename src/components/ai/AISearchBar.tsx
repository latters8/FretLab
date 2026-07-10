import React, { useState } from 'react';
import { processAIQuery } from '../../services/AIEngine';
import { useMusic } from '../../context/MusicContext';

const AISearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { setKeyNote, setMode, setBpm, setCurrentTrack } = useMusic();

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await processAIQuery(query);
      setResponse(res.text);
      setIsExpanded(true); // Автоматически разворачиваем чат при ответе
      if (res.action?.type === 'SET_CONTEXT') {
        if (res.action.payload.key) setKeyNote(res.action.payload.key);
        if (res.action.payload.mode) setMode(res.action.payload.mode);
        if (res.action.payload.bpm) setBpm(res.action.payload.bpm);
        if (res.action.payload.track) setCurrentTrack(res.action.payload.track);
      }
    } catch (e) {
      setResponse('Ошибка связи с AI. Проверьте консоль.');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', margin: '0 auto', zIndex: 5 }}>
      {/* Search Input Line */}
      <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-panel)', padding: '8px 16px', borderRadius: '30px', border: '1px solid var(--border-color)', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
        <span style={{ fontSize: '18px' }}>🧠</span>
        <input
          type="text"
          placeholder="Ask AI: 'Найди фанк джем в Ля миноре...'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
        />
        <button onClick={handleAsk} disabled={loading} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '6px 16px', borderRadius: '20px', fontWeight: 800, cursor: 'pointer' }}>
          {loading ? '...' : 'Generate'}
        </button>
        <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          {isExpanded ? '▲ Close' : '⛶ Chat'}
        </button>
      </div>

      {/* Expanded AI Window */}
      {isExpanded && (
        <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', padding: '20px', border: '1px solid var(--accent)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)', minHeight: '120px', transition: 'all 0.3s' }}>
          <div style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
            // AI Assistant Dialogue
          </div>
          {response ? (
            <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6' }}>{response}</div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>Я готов! Напиши мне, что ты хочешь сыграть, и я подберу трек и настрою интерфейс...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISearchBar;