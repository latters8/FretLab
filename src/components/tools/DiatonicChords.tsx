import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';

type ExtLevel = 'triad' | '7th' | '9th' | '11th';

const DiatonicChords: React.FC = () => {
  const { getDiatonicChords, keyNote, mode } = useMusic();
  const chords = getDiatonicChords();
  const [level, setLevel] = useState<ExtLevel>('7th');

  // 🔥 ИСПРАВЛЕНО: Защита от Арпеджио и Альтерированных гамм
  // Диатонические аккорды существуют только для полных 7-нотных гамм.
  const isArpeggioOrAltered = mode.includes('_arp') || mode === 'altered' || mode === 'pentatonic' || mode === 'blues';

  if (isArpeggioOrAltered) {
    return (
      <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Diatonic Harmony
        </div>
        <div style={{ background: 'var(--bg-root)', padding: '24px', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px', opacity: 0.5 }}>🛑</span>
          <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
            Non-Diatonic Mode Active
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.5' }}>
            Diatonic chord generation is not applicable for isolated arpeggios, pentatonics, or altered scales. Please select a standard 7-note scale (e.g., Major, Dorian) to view harmonized chords.
          </div>
        </div>
      </div>
    );
  }

  // Если гамма правильная, рендерим блок как обычно
  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Diatonic Harmony <span style={{ color: 'var(--accent)' }}>({keyNote} {mode.replace('_', ' ')})</span>
        </div>
        
        <select 
          value={level} 
          onChange={(e) => setLevel(e.target.value as ExtLevel)}
          style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
        >
          <option value="triad">Triads</option>
          <option value="7th">7th Chords</option>
          <option value="9th">9th Chords</option>
          <option value="11th">11th Chords</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {chords.map((chordObj, idx) => {
          let topText = '';
          let mainText = '';

          if (level === 'triad') { topText = chordObj.baseRoman; mainText = chordObj.triad; }
          if (level === '7th') { topText = chordObj.seventhRoman; mainText = chordObj.seventhChord; }
          if (level === '9th') { topText = chordObj.ninthRoman; mainText = chordObj.ninthChord; }
          if (level === '11th') { topText = chordObj.eleventhRoman; mainText = chordObj.eleventhChord; }

          const isRoot = idx === 0;

          return (
            <div 
              key={idx} 
              style={{ 
                background: isRoot ? 'var(--bg-secondary)' : 'var(--bg-root)', 
                border: isRoot ? '1px solid var(--accent)' : '1px solid var(--border-color)', 
                borderRadius: '8px', padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' 
              }}
            >
              <div style={{ fontSize: '10px', color: isRoot ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 800 }}>
                {topText}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 900 }}>
                {mainText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DiatonicChords;