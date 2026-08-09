import { useState, useEffect } from 'react';
import type React from 'react';
import { useMusic } from '../../context/MusicContext';
import { playNote } from '../../utils/audioEngine';
import { Button } from '../ui/Button';
import { useTranslation } from '../../context/LocaleContext';

const TUNINGS: Record<string, string[]> = {
  'Standard E': ['E', 'A', 'D', 'G', 'B', 'E'],
  'Drop D': ['D', 'A', 'D', 'G', 'B', 'E'],
  'Drop C': ['C', 'G', 'C', 'F', 'A', 'D'],
  'D Standard': ['D', 'G', 'C', 'F', 'A', 'D'],
};

const MATERIALS = {
  ebony: { bg: '#1a1a1a', dot: '#e0e0e0', fretDark: '#111215', fretLight: '#c0c0c0' },
  rosewood: { bg: '#3e2723', dot: '#d7ccc8', fretDark: '#211512', fretLight: '#d7ccc8' },
  maple: { bg: '#f1ba54', dot: '#3e2723', fretDark: '#5c4314', fretLight: '#fafafa' },
  glass: { bg: 'rgba(255,255,255,0.04)', dot: '#d7ccc8', fretDark: 'rgba(255,255,255,0.15)', fretLight: 'var(--accent)' },
};

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STRING_GAUGES = [1.2, 1.8, 2.4, 3.2, 4.2, 5.4];
const INTERVAL_MAP = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
const MODE_LABELS: Record<string, string> = {
  major: 'Major', minor: 'Minor', dorian: 'Dorian', phrygian: 'Phrygian',
  lydian: 'Lydian', mixolydian: 'Mixolydian', aeolian: 'Aeolian', locrian: 'Locrian',
  harmonic_minor: 'Harm. Minor', melodic_minor: 'Mel. Minor', pentatonic: 'Pentatonic', blues: 'Blues',
  maj7_arp: 'Maj7 Arp.', min7_arp: 'Min7 Arp.', dom7_arp: 'Dom7 Arp.', dom9_arp: 'Dom9 Arp.', altered: 'Altered',
};

const MODE_LABELS_RU: Record<string, string> = {
  major: 'Мажор', minor: 'Минор', dorian: 'Дорийский', phrygian: 'Фригийский',
  lydian: 'Лидийский', mixolydian: 'Миксолидийский', aeolian: 'Эолийский', locrian: 'Локрийский',
  harmonic_minor: 'Гарм. мин.', melodic_minor: 'Мел. мин.', pentatonic: 'Пентатоника', blues: 'Блюз',
  maj7_arp: 'Бол. 7', min7_arp: 'Мин. 7', dom7_arp: 'Дом. 7', dom9_arp: 'Дом. 9', altered: 'Альтеред',
};

type DisplayMode = 'notes' | 'intervals' | 'caged' | 'clean';

const DISPLAY_MODES: { value: DisplayMode; label: string }[] = [
  { value: 'notes', label: '🎵 Notes' },
  { value: 'intervals', label: '🔢 Intervals' },
  { value: 'caged', label: '🦴 CAGED' },
  { value: 'clean', label: '⏺ Clean' },
];

const Fretboard: React.FC = () => {
  const { t, locale } = useTranslation();
  const { keyNote, mode, getScaleNotes, setKeyNote, setMode } = useMusic();
  const modeLabels = locale === 'ru' ? MODE_LABELS_RU : MODE_LABELS;
  const scaleNotes = getScaleNotes();
  const [tuningName, setTuningName] = useState<string>('Standard E');
  const [material, setMaterial] = useState<keyof typeof MATERIALS>('glass');
  const [fretColor, setFretColor] = useState<'dark' | 'light'>('dark');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('notes');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const strings = TUNINGS[tuningName].slice().reverse();
  const frets = Array.from({ length: 25 }, (_, i) => i);
  const dots = [3, 5, 7, 9, 15, 17, 19, 21];
  const doubleDots = [12, 24];
  const currentMat = MATERIALS[material];
  const currentFretColor = fretColor === 'dark' ? currentMat.fretDark : currentMat.fretLight;
const isCyberpunk = material === 'glass' && fretColor === 'light';

const getNoteAtFret = (openNote: string, fret: number) =>
    ALL_NOTES[(ALL_NOTES.indexOf(openNote) + fret) % 12];

  const handleNoteClick = (note: string) => {
    playNote(note, 0.8, 0.35);
  };

  const getFretLabel = (note: string, noteIdx: number): string => {
    if (displayMode === 'notes') return note;
    if (displayMode === 'intervals') {
      const diff = (ALL_NOTES.indexOf(note) - ALL_NOTES.indexOf(keyNote) + 12) % 12;
      return INTERVAL_MAP[diff];
    }
    if (displayMode === 'caged') return note;
    return '';
  };

  const getFretStyle = (note: string, noteIdx: number): React.CSSProperties => {
    const isRoot = note === keyNote;
    const noteAlpha = material === 'maple' ? '1' : '0.75';
    const base = { width: '24px', height: '24px', fontSize: '11px', fontWeight: '900' };

    if (displayMode === 'notes' || displayMode === 'intervals') {
      return {
        ...base,
        borderRadius: '50%',
        background: isRoot ? 'var(--accent)' : `rgba(255,255,255,${noteAlpha})`,
        color: isRoot ? '#000' : '#111216',
        boxShadow: isRoot ? '0 0 8px var(--color-accent-glow), 0 2px 4px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.4)',
      };
    }
    if (displayMode === 'caged') {
      const isMaple = material === 'maple';
      if (isRoot) {
        return {
          ...base,
          borderRadius: '4px',
          background: 'var(--accent)',
          color: '#000',
          boxShadow: '0 0 8px var(--color-accent-glow)',
        };
      }
      return {
        ...base,
        borderRadius: '4px',
        background: isMaple ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)',
        border: `1px solid ${isMaple ? '#5c4314' : 'rgba(255,255,255,0.4)'}`,
        color: isMaple ? '#5c4314' : 'var(--text-primary)',
      };
    }
    // clean
    return {
      ...base,
      borderRadius: '50%',
      background: isRoot ? 'var(--accent)' : `rgba(255,255,255,${noteAlpha})`,
      boxShadow: isRoot ? '0 0 8px var(--color-accent-glow)' : 'none',
    };
  };

  return (
    <div style={{
      background: 'var(--bg-panel)',
      borderRadius: 'var(--radius)',
padding: isMobile ? '12px' : '16px',
      border: '1px solid var(--border-color)',
    }}>

{/* ── Header: title ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span className="fl-section-label" style={{ color: 'var(--accent)', fontSize: '13px', letterSpacing: '1px' }}>
          {t.fretboard.title}
        </span>
      </div>

      {/* ── Controls row (single row on desktop) ── */}
      <div className="fl-section-panel" style={{ marginBottom: '16px', justifyContent: 'space-between' }}>
        {/* Left: key + mode + display mode toggle */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={keyNote}
            onChange={(e) => setKeyNote(e.target.value)}
            className="fl-select"
            aria-label={t.fretboard.key}
          >
            {ALL_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="fl-select"
            style={{ maxWidth: isMobile ? '120px' : '160px' }}
            aria-label={t.fretboard.mode}
          >
            <optgroup label="Гаммы">
              {['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian', 'harmonic_minor', 'melodic_minor', 'pentatonic', 'blues'].map(m => (
                <option key={m} value={m}>{modeLabels[m]}</option>
              ))}
            </optgroup>
            <optgroup label="Арпеджио">
              <option value="maj7_arp">Maj7 Arp.</option>
              <option value="min7_arp">Min7 Arp.</option>
              <option value="dom7_arp">Dom7 Arp.</option>
              <option value="dom9_arp">Dom9 Arp.</option>
              <option value="altered">Altered</option>
            </optgroup>
          </select>

          {/* Display mode toggle */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {DISPLAY_MODES.map(dm => (
              <Button
                key={dm.value}
                variant={displayMode === dm.value ? 'secondary' : 'ghost'}
                active={displayMode === dm.value}
                size="sm"
                onClick={() => setDisplayMode(dm.value)}
                aria-pressed={displayMode === dm.value}
              >
                {dm.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Right: tuning + material + fret color */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={tuningName}
            onChange={(e) => setTuningName(e.target.value)}
            className="fl-select"
            aria-label={t.fretboard.tuning}
          >
            {Object.keys(TUNINGS).map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value as any)}
            className="fl-select"
            aria-label={t.fretboard.neck}
          >
            {Object.keys(MATERIALS).map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)} Neck</option>)}
          </select>

          <select
            value={fretColor}
            onChange={(e) => setFretColor(e.target.value as any)}
            className="fl-select"
            aria-label={t.fretboard.frets}
          >
            <option value="dark">Dark Frets</option>
            <option value="light">Light Frets</option>
          </select>
        </div>
      </div>

      {/* ── Fretboard grid ── */}
      <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
        <div style={{ minWidth: isMobile ? '600px' : '800px' }}>

          {/* Fret numbers top */}
          <div style={{ display: 'flex', paddingLeft: '40px', marginBottom: '6px' }}>
            {frets.map(f => (
              <div key={`top-${f}`} style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 800 }}>
                {f}
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div style={{
            position: 'relative',
            background: '#000',
            border: '2px solid #000',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
          }}>

            {/* Background board */}
            <div style={{
              position: 'absolute',
              top: '18px', left: '40px', right: 0, bottom: '18px',
              background: currentMat.bg,
              zIndex: 0,
              pointerEvents: 'none',
            }} />

            {/* Fret lines + position dots */}
            <div style={{
              position: 'absolute',
              top: '18px', left: '40px', right: 0, bottom: '18px',
              display: 'flex',
              pointerEvents: 'none',
              zIndex: 1,
            }}>
              {frets.map(f => (
                <div key={`dotcol-${f}`} style={{ flex: 1, position: 'relative', borderRight: f === 0 ? '4px solid #bba182' : `${isCyberpunk ? 'transparent' : '1px'} solid ${isCyberpunk ? 'transparent' : currentFretColor}` }}>
                  {isCyberpunk && f !== 0 && (
                    <div style={{
                      position: 'absolute', right: '-1px', top: 0, bottom: 0, width: '1px',
                      background: 'var(--accent)',
                      boxShadow: '0 0 3px var(--accent)',
                      opacity: 0.3,
                    }} />
                  )}
                  {dots.includes(f) && (
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '12px', height: '12px', borderRadius: '50%',
                      background: currentMat.dot,
                      boxShadow: isCyberpunk ? '0 0 4px var(--accent)' : 'none',
                    }} />
                  )}
                  {doubleDots.includes(f) && (
                    <>
                      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', background: currentMat.dot }} />
                      <div style={{ position: 'absolute', top: '70%', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', background: currentMat.dot }} />
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Strings + notes */}
            {strings.map((openNote, stringIdx) => {
              const thickness = STRING_GAUGES[stringIdx];
              return (
                <div key={stringIdx} style={{ display: 'flex', alignItems: 'center', position: 'relative', height: '36px' }}>
                  {/* String line */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0,
                    height: `${thickness}px`,
                    background: 'linear-gradient(to bottom, #777, #999, #555)',
                    zIndex: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  }} />
                  {/* Open note label */}
                  <div style={{
                    width: '40px', textAlign: 'center',
                    fontWeight: 800, color: 'var(--text-muted)',
                    zIndex: 3, background: 'var(--bg-panel)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {openNote}
                  </div>

                  {/* Frets */}
                  {frets.map(fret => {
                    const note = getNoteAtFret(openNote, fret);
                    const isInScale = scaleNotes.includes(note);
                    const isRoot = note === keyNote;
                    const label = getFretLabel(note, stringIdx);
                    const fretStyle = getFretStyle(note, stringIdx);
                    const isHovered = hoveredNote === `${note}-${stringIdx}-${fret}`;

                    return (
                      <div
                        key={`${stringIdx}-${fret}`}
                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3, position: 'relative' }}
                        onMouseEnter={() => setHoveredNote(`${note}-${stringIdx}-${fret}`)}
                        onMouseLeave={() => setHoveredNote(null)}
                      >
                        {isInScale && (
                          <button
                            type="button"
                            onClick={() => handleNoteClick(note)}
                            aria-label={`${note}${isRoot ? ` ${t.fretboard.tonic}` : ''}`}
                            title={`${note}${isRoot ? ` ${t.fretboard.tonic}` : ''}`}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: 'none', cursor: 'pointer',
                              transform: isHovered ? 'scale(1.18)' : 'scale(1)',
                              transition: 'transform 0.1s ease',
                              ...fretStyle,
                            }}
                          >
                            {label}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Fret numbers bottom */}
          <div style={{ display: 'flex', paddingLeft: '40px', marginTop: '6px' }}>
            {frets.map(f => (
              <div key={`bottom-${f}`} style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 800 }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fretboard;
