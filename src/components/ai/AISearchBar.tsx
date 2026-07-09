import React, { useState } from 'react';

const AISearchBar: React.FC = () => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (!query.trim()) return;
    alert(`🤖 AI Module:\n\nProcessing request: "${query}"\n\n(AI will auto-configure Tone and Tabs soon!)`);
    setQuery('');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '450px', position: 'relative' }}>
      <div style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>🧠</div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="Ask AI for tones, chords, or licks..."
        style={{
          width: '100%', padding: '8px 12px 8px 36px', borderRadius: '20px', 
          border: '1px solid var(--border-color)', background: 'var(--bg-primary)', 
          color: 'var(--text-primary)', fontSize: '12px', outline: 'none',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
};

export default AISearchBar;