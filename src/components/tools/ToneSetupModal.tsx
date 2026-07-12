import React, { useState, useEffect } from 'react';

interface ToneSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ToneSetupModal: React.FC<ToneSetupModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Подгружаем ключ из localStorage при открытии окна
  useEffect(() => {
    const savedKey = localStorage.getItem('fretlab_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('fretlab_api_key', apiKey.trim());
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1000);
    } else {
      localStorage.removeItem('fretlab_api_key');
      onClose();
    }
  };

  const handleClear = () => {
    localStorage.removeItem('fretlab_api_key');
    setApiKey('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', width: '480px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            🎛 Tone & AI Setup
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>

        {/* Info Box */}
        <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', borderLeft: '3px solid var(--accent)' }}>
          <strong>Bring Your Own Key (BYOK):</strong> Вставь свой личный API-ключ DeepSeek. Он будет надежно сохранен в локальном хранилище твоего браузера (localStorage) и никогда не утечет в публичный репозиторий GitHub.
        </div>

        {/* Input Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
            DeepSeek API Key
          </label>
          <input 
            type="password" 
            placeholder="sk-..." 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ background: 'var(--bg-primary)', color: '#fff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px', outline: 'none', fontSize: '14px', fontFamily: 'monospace' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <button 
            onClick={handleClear}
            style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid transparent', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            Clear Key
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onClose}
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 20px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              style={{ background: isSaved ? 'transparent' : 'var(--accent)', color: isSaved ? 'var(--accent)' : '#000', border: isSaved ? '1px solid var(--accent)' : 'none', padding: '8px 24px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: isSaved ? 'none' : '0 0 12px var(--accent)' }}
            >
              {isSaved ? '✓ SAVED' : 'SAVE SETUP'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};