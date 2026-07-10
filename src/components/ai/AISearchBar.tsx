import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { processAIQuery, type AIResponse } from '../../services/AIEngine';

const AISearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  
  // Подключаемся к глобальному мозгу, чтобы ИИ мог им управлять
  const { setKeyNote, setMode, setCurrentTrack } = useMusic();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(null);

    // Отправляем запрос в наш AI Engine
    const aiResult = await processAIQuery(query);
    setResponse(aiResult);

    // 🧠 МАГИЯ ИИ: Если ИИ прислал команду изменить интерфейс, мы её выполняем!
    if (aiResult.action && aiResult.action.type === 'SET_CONTEXT') {
      const { key, mode, track } = aiResult.action.payload;
      if (key) setKeyNote(key);
      if (mode) setMode(mode);
      if (track) setCurrentTrack(track);
    }

    setIsLoading(false);
    setQuery(''); // Очищаем строку после запроса
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '600px', margin: '0 auto', gap: '12px' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', position: 'relative' }}>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AI: 'Найди фанк джем в Ля миноре...'"
          style={{ 
              width: '100%', padding: '12px 20px 12px 48px', 
              background: 'var(--bg-primary)', border: '1px solid var(--accent)', 
              borderRadius: '24px', color: 'var(--text-primary)', 
              fontSize: '14px', outline: 'none',
              boxShadow: '0 0 15px rgba(163, 116, 255, 0.15)'
          }}
          disabled={isLoading}
        />
        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', opacity: isLoading ? 0.5 : 1 }}>
          🧠
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
              position: 'absolute', right: '4px', top: '4px', bottom: '4px', 
              background: 'var(--accent)', color: '#000', border: 'none', 
              borderRadius: '20px', padding: '0 20px', fontWeight: 800, cursor: 'pointer',
              opacity: isLoading ? 0.7 : 1
          }}>
          {isLoading ? 'Thinking...' : 'Generate'}
        </button>
      </form>

      {/* Окно ответа ИИ */}
      {response && (
        <div style={{ 
          background: 'var(--bg-panel)', border: '1px solid var(--border-color)', 
          padding: '16px 20px', borderRadius: '12px', color: 'var(--text-primary)', 
          fontSize: '13px', lineHeight: '1.6', position: 'relative',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ position: 'absolute', top: '-10px', left: '24px', background: 'var(--bg-panel)', padding: '0 8px', color: 'var(--accent)', fontSize: '11px', fontWeight: 800 }}>
            AI Assistant
          </div>
          {response.text}
        </div>
      )}
    </div>
  );
};

export default AISearchBar;