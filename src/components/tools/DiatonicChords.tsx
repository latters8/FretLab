import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import ChordDictionaryModal from './ChordDictionaryModal';
import { CHORD_DB, generateFallbackVoicing, type Voicing } from '../../services/ChordDatabase';

type FilterType = 'DIA' | '7TH' | '9TH' | 'ALT';

const DiatonicChords: React.FC = () => {
  const { getDiatonicChords, mode, keyNote, setKeyNote, setMode } = useMusic();
  const [activeFilter, setActiveFilter] = useState<FilterType>('7TH');
  const [modalConfig, setModalConfig] = useState<{chord: string} | null>(null);

  const baseChords = getDiatonicChords();
  const isArpeggioOrAltered = mode.includes('_arp') || mode === 'altered' || mode === 'pentatonic' || mode === 'blues';

  const getDisplayedChords = () => {
    // Режим умных предложений для изолированных обыгрываний
    if (isArpeggioOrAltered) {
      switch(mode) {
        case 'min7_arp': return [{roman: 'i7', chord: keyNote+'m7'}, {roman: 'i9', chord: keyNote+'m9'}, {roman: 'i11', chord: keyNote+'m11'}, {roman: 'i13', chord: keyNote+'m13'}];
        case 'maj7_arp': return [{roman: 'Imaj7', chord: keyNote+'maj7'}, {roman: 'Imaj9', chord: keyNote+'maj9'}, {roman: 'I6', chord: keyNote+'6'}, {roman: 'I6/9', chord: keyNote+'6/9'}];
        case 'dom7_arp': return [{roman: 'V7', chord: keyNote+'7'}, {roman: 'V9', chord: keyNote+'9'}, {roman: 'V13', chord: keyNote+'13'}, {roman: 'V7b9', chord: keyNote+'7b9'}];
        case 'dom9_arp': return [{roman: 'V9', chord: keyNote+'9'}, {roman: 'V13', chord: keyNote+'13'}, {roman: 'V7#9', chord: keyNote+'7#9'}, {roman: 'V7b9', chord: keyNote+'7b9'}];
        case 'altered': return [{roman: 'Valt', chord: keyNote+'7#9'}, {roman: 'Valt', chord: keyNote+'7b9'}, {roman: 'Valt', chord: keyNote+'7b13'}, {roman: 'Valt', chord: keyNote+'7#5'}];
        case 'pentatonic':
        case 'blues':
          return [{roman: 'I', chord: keyNote+'m7'}, {roman: 'IV', chord: keyNote+'m7'}, {roman: 'V', chord: keyNote+'m7'}];
        default: return [{roman: 'I', chord: keyNote}];
      }
    }

    // 🔥 ИСПРАВЛЕНО: Генерация корректной мажорной/минорной диатоники в зависимости от колеса квинт
    return baseChords.map(c => {
      if (activeFilter === 'DIA') return { roman: c.baseRoman, chord: c.triad };
      if (activeFilter === '7TH') return { roman: c.seventhRoman, chord: c.seventhChord };
      if (activeFilter === '9TH') return { roman: c.ninthRoman, chord: c.ninthChord };
      if (activeFilter === 'ALT') return { roman: c.eleventhRoman, chord: c.eleventhChord };
      return { roman: c.baseRoman, chord: c.triad };
    });
  };

  const handlePlayOverChord = (chordStr: string) => {
    const match = chordStr.match(/^([A-G][b#]?)(.*)$/);
    if (!match) return;
    const root = match[1];
    const quality = match[2].toLowerCase();

    setKeyNote(root);
    // Настраиваем гриф, но НЕ закрываем и не ломаем панель
    if (quality.includes('alt')) setMode('altered');
    else if (quality.includes('maj7') || quality.includes('maj9')) setMode('maj7_arp');
    else if (quality.includes('m7') || quality.includes('m9') || quality.includes('m11')) setMode('min7_arp');
    else if (quality.includes('9')) setMode('dom9_arp');
    else if (quality.includes('7')) setMode('dom7_arp');
    else if (quality.includes('m') && !quality.includes('dim')) setMode('minor');
    else if (quality.includes('dim')) setMode('locrian');
    else setMode('major');
  };

  const chords = getDisplayedChords();

  return (
    <>
      <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>
            {isArpeggioOrAltered ? '💡 Suggested Harmony' : '🎹 Diatonic Harmony'} <span style={{ color: 'var(--accent)' }}>({keyNote} {mode.replace('_', ' ')})</span>
            </div>
            
            {!isArpeggioOrAltered && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {(['DIA', '7TH', '9TH', 'ALT'] as FilterType[]).map(type => (
                      <button
                          key={type}
                          onClick={() => setActiveFilter(type)}
                          style={{
                              flex: 1,
                              background: activeFilter === type ? 'var(--accent)' : 'transparent',
                              color: activeFilter === type ? '#000' : 'var(--text-muted)',
                              border: 'none', borderRadius: '4px', padding: '6px 0',
                              fontSize: '10px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                          }}
                      >
                          {type}
                      </button>
                  ))}
              </div>
            )}
        </div>
        
        {chords.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {chords.map((c, i) => {
              const isTonic = i === 0 && (isArpeggioOrAltered || activeFilter === 'DIA');
              
              // Безопасное извлечение аппликатур для проверки длины массива
              const dbResult = CHORD_DB[c.chord];
              const voicings: Voicing[] = Array.isArray(dbResult) 
                ? dbResult 
                : (dbResult && typeof dbResult === 'object' && 'voicings' in dbResult 
                    ? (dbResult as any).voicings 
                    : [generateFallbackVoicing(c.chord)]);

              return (
                <div key={i} style={{ 
                    display: 'flex', alignItems: 'center', background: isTonic ? 'var(--bg-hover)' : 'var(--bg-primary)', 
                    padding: '12px 16px', borderRadius: '8px', border: `1px solid ${isTonic ? 'var(--accent)' : 'var(--border-color)'}`,
                    boxShadow: isTonic ? 'inset 3px 0 0 var(--accent)' : 'none', justifyContent: 'space-between'
                  }}>
                  
                  <div 
                    onClick={() => handlePlayOverChord(c.chord)}
                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', transition: '0.2s' }}
                    title={`Click to map ${c.chord} notes on Fretboard`}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 800, width: '40px' }}>{c.roman}</span>
                    <span style={{ color: isTonic ? 'var(--accent)' : 'var(--text-primary)', fontWeight: 900, fontSize: '15px' }}>{c.chord}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalConfig({ chord: c.chord });
                    }}
                    style={{
                      background: 'var(--accent)', color: '#000', border: 'none',
                      padding: '6px 16px', borderRadius: '12px', fontSize: '11px',
                      fontWeight: 900, cursor: 'pointer', transition: 'transform 0.2s',
                      boxShadow: '0 4px 12px rgba(0,255,157,0.3)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    SHOW
                  </button>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalConfig && (
        <ChordDictionaryModal 
          chord={modalConfig.chord} 
          onClose={() => setModalConfig(null)} 
        />
      )}
    </>
  );
};

export default DiatonicChords;