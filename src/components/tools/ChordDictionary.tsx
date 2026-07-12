import React, { useState } from 'react';
import { CHORD_DB, generateFallbackVoicing, type Voicing } from '../../services/ChordDatabase';

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 📚 Группируем ВСЕ наши новые расширенные аккорды по категориям для удобства навигации
const CHORD_CATEGORIES = {
  'Major': [
    { suffix: '', label: 'Major (Triad)' },
    { suffix: 'maj7', label: 'maj7 (Major 7th)' },
    { suffix: 'maj9', label: 'maj9 (Major 9th)' },
    { suffix: 'maj11', label: 'maj11 (Major 11th)' },
    { suffix: 'maj9#11', label: 'maj9(#11) (Lydian)' },
    { suffix: 'maj7b9', label: 'maj7(b9)' }
  ],
  'Minor': [
    { suffix: 'm', label: 'Minor (Triad)' },
    { suffix: 'm7', label: 'm7 (Minor 7th)' },
    { suffix: 'm9', label: 'm9 (Minor 9th)' },
    { suffix: 'm11', label: 'm11 (Minor 11th)' },
    { suffix: 'm7b9', label: 'm7(b9)' }
  ],
  'Dominant': [
    { suffix: '7', label: '7 (Dominant 7th)' },
    { suffix: '9', label: '9 (Dominant 9th)' },
    { suffix: '11', label: '11 (Dominant 11th)' },
    { suffix: '7b9', label: '7b9 (Dominant b9)' },
    { suffix: '7#9', label: '7#9 (Hendrix Chord)' }
  ],
  'Diminished / Alt': [
    { suffix: 'm7b5', label: 'm7b5 (Half-Diminished)' },
    { suffix: 'm9b5', label: 'm9b5 (Locrian 9th)' },
    { suffix: 'm7b5b9', label: 'm7b5(b9)' },
    { suffix: 'm11b5', label: 'm11b5' },
    { suffix: 'dim7', label: 'dim7 (Full-Diminished)' },
    { suffix: 'dim', label: 'dim (Diminished Triad)' }
  ]
};

const STRINGS = ['e', 'B', 'G', 'D', 'A', 'E'];

const ChordDictionary: React.FC = () => {
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedSuffix, setSelectedSuffix] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof typeof CHORD_CATEGORIES>('Major');

  const currentChordName = `${selectedRoot}${selectedSuffix}`;

  // Ищем аппликатуру в статической БД, либо генерируем через наш умный алгоритм
  const getVoicings = (): Voicing[] => {
    if (CHORD_DB[currentChordName]) {
      return CHORD_DB[currentChordName];
    }
    return generateFallbackVoicing(currentChordName);
  };

  const voicings = getVoicings();

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      
      {/* Header */}
      <div style={{ padding: '18px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>📖</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Interactive Chord Dictionary</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Explore professional guitar voicings</span>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="dictionary-layout">
        
        {/* LEFT COLUMN: ROOTS & CATEGORIES */}
        <div style={{ width: '260px', borderRight: '1px solid var(--border-color)', background: 'var(--bg-primary)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          
          {/* Root Note Grid */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>1. Select Root Note</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {ROOTS.map(root => (
                <button
                  key={root}
                  onClick={() => setSelectedRoot(root)}
                  style={{ background: selectedRoot === root ? 'var(--accent)' : 'var(--bg-secondary)', color: selectedRoot === root ? '#000' : 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 0', borderRadius: '6px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: '0.15s' }}
                >
                  {root}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>2. Category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.keys(CHORD_CATEGORIES).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat as any);
                    // Автоматически выбираем первый суффикс из новой категории, чтобы не было пустых экранов
                    setSelectedSuffix(CHORD_CATEGORIES[cat as keyof typeof CHORD_CATEGORIES][0].suffix);
                  }}
                  style={{ background: activeCategory === cat ? 'var(--bg-hover)' : 'transparent', color: activeCategory === cat ? 'var(--accent)' : 'var(--text-secondary)', border: '1px solid transparent', padding: '10px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textAlign: 'left', cursor: 'pointer', transition: '0.15s' }}
                >
                  {cat === 'Major' ? '🟢 ' : cat === 'Minor' ? '🔵 ' : cat === 'Dominant' ? '🟡 ' : '🔴 '}
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: SPECIFIC SUFFIXES */}
        <div style={{ width: '300px', borderRight: '1px solid var(--border-color)', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>3. Select Extensions</div>
          {CHORD_CATEGORIES[activeCategory].map(item => (
            <button
              key={item.suffix}
              onClick={() => setSelectedSuffix(item.suffix)}
              style={{ background: selectedSuffix === item.suffix ? 'var(--bg-primary)' : 'transparent', color: selectedSuffix === item.suffix ? 'var(--accent)' : 'var(--text-primary)', border: `1px solid ${selectedSuffix === item.suffix ? 'var(--border-color)' : 'transparent'}`, padding: '12px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', textAlign: 'left', cursor: 'pointer', transition: '0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={e => { if(selectedSuffix !== item.suffix) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={e => { if(selectedSuffix !== item.suffix) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{selectedRoot}{item.suffix || ' (maj)'}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* RIGHT COLUMN: VISUAL SHAPE PREVIEW */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-root)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 4px 0', color: 'var(--accent)', textShadow: '0 0 20px rgba(0,255,157,0.2)' }}>
              {currentChordName}
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Found {voicings.length} position(s) in database
            </p>
          </div>

          {voicings.map((voicing, vIdx) => (
            <div key={vIdx} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span>Shape: {voicing.name}</span>
                <span style={{ color: 'var(--accent)' }}>Base Fret: {voicing.baseFret}</span>
              </div>

              {/* Текстовый дамп ладов в линию для быстрой сверки */}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {voicing.frets.map((f, idx) => (
                  <span key={idx} style={{ color: f !== 'x' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {STRINGS[idx]}:{f}
                  </span>
                ))}
              </div>

              {/* Микро-сетка ладов (Гриф в миниатюре) */}
              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {voicing.frets.map((fretVal, stringIdx) => (
                  <div key={stringIdx} style={{ display: 'flex', alignItems: 'center', height: '24px', position: 'relative' }}>
                    
                    {/* Линия струны */}
                    <div style={{ position: 'absolute', left: '24px', right: 0, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    
                    {/* Название струны */}
                    <div style={{ width: '24px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 800 }}>
                      {STRINGS[stringIdx]}
                    </div>

                    {/* Индикатор лада */}
                    <div style={{ flex: 1, display: 'flex', paddingLeft: '10px', fontSize: '13px', fontWeight: 900, zIndex: 2 }}>
                      {fretVal === 'x' ? (
                        <span style={{ color: '#ff4d4d' }}>✕</span>
                      ) : (
                        <span style={{ color: 'var(--accent)', background: 'var(--bg-secondary)', padding: '1px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          Lid: {fretVal}
                        </span>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ChordDictionary;