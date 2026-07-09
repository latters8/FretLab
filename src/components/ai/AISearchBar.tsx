import React, { useState } from 'react';

const AISearchBar: React.FC = () => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (!query.trim()) return;
    
    // Заглушка ответов AI (в будущем здесь будет реальный API-запрос к LLM)
    const responses = [
      "🎵 The circle of fifths shows your current key perfectly. Try exploring the relative minor!",
      "🎶 A classic progression here would be I - IV - V. Try playing it with a shuffle feel!",
      "🎸 For faster picking in this scale, practice alternate picking starting slow."
    ];
    const reply = responses[Math.floor(Math.random() * responses.length)];
    
    alert(`🤖 AI Assistant:\n\n${reply}\n\n💡 (В будущих спринтах AI будет генерировать табы прямо на гриф!)`);
    setQuery('');
  };

  return (
    <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '4px' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="🧠 Ask AI to generate a lick, explain chords, or suggest a tone..."
        style={{
          flex: 1, padding: '10px 20px', borderRadius: '30px', 
          border: '1px solid var(--border-color)', background: 'var(--bg-panel)', 
          color: 'var(--text-primary)', fontSize: '13px', outline: 'none'
        }}
      />
      <button
        onClick={handleSearch}
        style={{
          padding: '0 20px', borderRadius: '30px', background: 'var(--accent)', 
          color: 'var(--bg-primary)', border: 'none', fontWeight: 'bold', 
          cursor: 'pointer'
        }}
      >
        Ask AI
      </button>
    </div>
  );
};

export default AISearchBar;