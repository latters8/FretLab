// src/components/tools/DiatonicChords.tsx

import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import ChordDictionaryModal from './ChordDictionaryModal';

type FilterType = 'DIA' | '7TH' | '9TH' | 'ALT';

// Универсальный маппинг энгармонизмов для гарантии корректного поиска в словаре
const ENHARMONIC_MAP: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
const normalize = (note: string) => ENHARMONIC_MAP[note] || note;

const DiatonicChords: React.FC = () => {
  const { getDiatonicChords, mode, keyNote } = useMusic();
  const [activeFilter, setActiveFilter] = useState<FilterType>('7TH');
  const [modalConfig, setModalConfig] = useState<{chord: string} | null>(null);

  // Получаем базовые аккорды из "умного" контекста
  const baseChords = getDiatonicChords();

  // Функция для определения, какие аккорды показывать на основе фильтра
  const getDisplayedChords = () => {
    // Если контекст почему-то не вернул аккорды
    if (!baseChords || baseChords.length === 0) {
      return [];
    }

    // Для арпеджио и экзотических шкал показываем вариации тоники
    const isArpeggioOrAltered = mode.includes('_arp') || mode === 'altered' || mode === 'pentatonic' || mode === 'blues';
    
    if (isArpeggioOrAltered) {
      const root = normalize(keyNote);
      if (mode === 'blues') {
        // Для блюза характерны доминантсептаккорды
        return [
          { roman: 'I7', chord: `${root}7` },
          { roman: 'IV7', chord: `${normalize(baseChords[3]?.triad || root)}7` },
          { roman: 'V7', chord: `${normalize(baseChords[4]?.triad || root)}7` }
        ];
      }
      
      // Для остальных нестандартных режимов
      switch (mode) {
        case 'min7_arp': 
        case 'pentatonic':
          return [
            { roman: 'i7', chord: `${root}m7` }, 
            { roman: 'i9', chord: `${root}m9` }, 
            { roman: 'i11', chord: `${root}m11` }
          ];
        case 'maj7_arp': 
          return [
            { roman: 'Imaj7', chord: `${root}maj7` }, 
            { roman: 'Imaj9', chord: `${root}maj9` }, 
            { roman: 'I6', chord: `${root}6` }
          ];
        case 'dom7_arp': 
        case 'dom9_arp':
          return [
            { roman: 'V7', chord: `${root}7` }, 
            { roman: 'V9', chord: `${root}9` }, 
            { roman: 'V13', chord: `${root}13` }
          ];
        case 'altered': 
          return [
            { roman: 'Valt', chord: `${root}7#9` }, 
            { roman: 'V7b9', chord: `${root}7b9` }, 
            { roman: 'V7#5', chord: `${root}7#5` }
          ];
        default:
          return [{ roman: 'I', chord: root }];
      }
    }

    // Для стандартных диатонических режимов применяем фильтр
    return baseChords.map(c => {
      let chordName = c.triad;
      
      switch (activeFilter) {
        case 'DIA':
          chordName = c.triad;
          break;
        case '7TH':
          chordName = c.seventhChord || c.triad; // Используем готовое 7-е трезвучие из контекста
          break;
        case '9TH':
          // Строим 9-й аккорд на основе септаккорда
          if (c.seventhChord) {
            if (c.seventhChord.endsWith('maj7')) chordName = c.seventhChord.replace('maj7', 'maj9');
            else if (c.seventhChord.endsWith('m7')) chordName = c.seventhChord.replace('m7', 'm9');
            else if (c.seventhChord.endsWith('m7b5')) chordName = c.seventhChord; // Оставляем полууменьшенный
            else if (c.seventhChord.endsWith('7')) chordName = c.seventhChord.replace('7', '9');
          } else {
             chordName = c.triad;
          }
          break;
        case 'ALT':
          // Альтерации обычно применяются к доминанте (V)
          if (c.baseRoman === 'V') chordName = `${c.triad.replace(/[^A-G#b]/g, '')}7alt`;
          else if (c.baseRoman === 'ii') chordName = `${c.triad.replace(/[^A-G#b]/g, '')}m7b5`;
          else chordName = c.seventhChord || c.triad;
          break;
      }
      return { roman: c.baseRoman, chord: chordName };
    });
  };

  const displayedChords = getDisplayedChords();

  return (
    <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: 900 }}>🎹 Diatonic Chords</h3>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-root)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {(['DIA', '7TH', '9TH', 'ALT'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: activeFilter === f ? 'var(--accent)' : 'transparent',
                color: activeFilter === f ? '#000' : 'var(--text-muted)',
                border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 900,
                cursor: 'pointer', transition: '0.2s'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {displayedChords.map((c, i) => {
          const isTonic = c.roman === 'I' || c.roman === 'i' || c.roman === 'Imaj7' || c.roman === 'i7';
          return (
            <div 
              key={i} 
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: isTonic ? 'rgba(0,255,157,0.05)' : 'var(--bg-secondary)',
                padding: '10px 14px', borderRadius: '8px',
                border: isTonic ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                transition: '0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {modalConfig && (
        <ChordDictionaryModal 
          chord={modalConfig.chord} 
          onClose={() => setModalConfig(null)} 
        />
      )}
    </div>
  );
};

export default DiatonicChords;