import React, { useState, useEffect, useRef } from 'react';
import { CHORD_DB, generateFallbackVoicing, type Voicing } from '../../services/ChordDatabase';

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];

// 🔥 ПРИНИМАЕМ КОМАНДУ ОТ ИИ ЧЕРЕЗ PROPS
interface Props {
  targetChord?: string | null;
}

const ChordDictionary: React.FC<Props> = ({ targetChord }) => {
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedSuffix, setSelectedSuffix] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof typeof CHORD_CATEGORIES>('Major');

  // 🔥 НОВОЕ: раньше компонент вообще не знал о ширине экрана — три колонки
  // по 260px/300px/flex стояли жёстко всегда, поэтому на мобильном третья
  // колонка (диаграмма аккорда) просто обрезалась за край экрана.
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ⚠️ FIX: раньше playChordAudio создавал новый AudioContext на КАЖДЫЙ клик
  // по аккорду и никогда его не закрывал. Это словарь аккордов — по нему
  // кликают десятками за сессию, так что за пару минут накапливались десятки
  // не закрытых AudioContext (тяжёлый нативный ресурс, отдельный аудио-поток).
  // Теперь держим один общий контекст на весь компонент и закрываем при unmount.
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  const currentChordName = `${selectedRoot}${selectedSuffix}`;

  // 🔥 СЛУШАЕМ ИИ: Если пришла команда показать аккорд, парсим его и настраиваем интерфейс
  useEffect(() => {
    if (targetChord) {
      // Разбиваем аккорд (например, F#m7b5) на корень (F#) и суффикс (m7b5)
      const match = targetChord.match(/^([A-G]#?)(.*)$/);
      if (match) {
        const root = match[1];
        const suffix = match[2] || '';
        
        setSelectedRoot(root);
        setSelectedSuffix(suffix);
        
        // Ищем категорию, в которой лежит этот суффикс, чтобы открыть нужную вкладку
        for (const [catName, chords] of Object.entries(CHORD_CATEGORIES)) {
          if (chords.some(c => c.suffix === suffix)) {
            setActiveCategory(catName as any);
            break;
          }
        }
      }
    }
  }, [targetChord]);

  const getVoicings = (): Voicing[] => {
    if (CHORD_DB[currentChordName]) return CHORD_DB[currentChordName];
    return generateFallbackVoicing(currentChordName);
  };

  const voicings = getVoicings();

  const playChordAudio = (frets: (number | 'x')[]) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      // Переиспользуем один контекст вместо создания нового при каждом клике
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const OPEN_FREQS = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
      let delay = 0;
      for (let i = 0; i <= 5; i++) {
        const fret = frets[i];
        if (fret === 'x') continue;
        const freq = OPEN_FREQS[i] * Math.pow(2, Number(fret) / 12);
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 1.0);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 1.0);
        delay += 0.05; 
      }
    } catch (e) {
      console.error("Audio Synthesis Failed:", e);
    }
  };

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      <div style={{ padding: isMobile ? '14px 16px' : '18px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>📖</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Interactive Chord Dictionary</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Explore professional guitar voicings</span>
        </div>
      </div>

      {/* 🔥 ИЗМЕНЕНО: flexDirection зависит от isMobile — на мобильном колонки
          складываются в вертикальный поток вместо трёх параллельных рядов.
          overflowY тоже переезжает сюда на мобильном, чтобы можно было
          скроллить всю цепочку шагов целиком. */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, overflow: 'hidden', overflowY: isMobile ? 'auto' : 'hidden' }} className="dictionary-layout">
        <div style={{ width: isMobile ? '100%' : '260px', borderRight: isMobile ? 'none' : '1px solid var(--border-color)', borderBottom: isMobile ? '1px solid var(--border-color)' : 'none', background: 'var(--bg-primary)', padding: isMobile ? '16px' : '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: isMobile ? 'visible' : 'auto', flexShrink: 0 }}>
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

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>2. Category</div>
            {/* 🔥 ИЗМЕНЕНО: на мобильном категории — горизонтальная лента чипов
                (scroll-x), а не вертикальный список на всю ширину — экономит
                высоту экрана в пользу самой диаграммы аккорда ниже. */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '6px', overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch', paddingBottom: isMobile ? '2px' : 0 }}>
              {Object.keys(CHORD_CATEGORIES).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat as any);
                    setSelectedSuffix(CHORD_CATEGORIES[cat as keyof typeof CHORD_CATEGORIES][0].suffix);
                  }}
                  style={{ background: activeCategory === cat ? 'var(--bg-hover)' : 'transparent', color: activeCategory === cat ? 'var(--accent)' : 'var(--text-secondary)', border: `1px solid ${isMobile ? 'var(--border-color)' : 'transparent'}`, padding: '10px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textAlign: 'left', cursor: 'pointer', transition: '0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {cat === 'Major' ? '🟢 ' : cat === 'Minor' ? '🔵 ' : cat === 'Dominant' ? '🟡 ' : '🔴 '}
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ width: isMobile ? '100%' : '300px', borderRight: isMobile ? 'none' : '1px solid var(--border-color)', borderBottom: isMobile ? '1px solid var(--border-color)' : 'none', padding: isMobile ? '16px' : '20px', overflowY: isMobile ? 'visible' : 'auto', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>3. Select Extensions</div>
          {/* 🔥 ИЗМЕНЕНО: на мобильном — тоже горизонтальная лента чипов вместо
              списка широких строк (тот же приём, что и для категорий). */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '8px', overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch' }}>
            {CHORD_CATEGORIES[activeCategory].map(item => (
              <button
                key={item.suffix}
                onClick={() => setSelectedSuffix(item.suffix)}
                style={{ background: selectedSuffix === item.suffix ? 'var(--bg-primary)' : 'transparent', color: selectedSuffix === item.suffix ? 'var(--accent)' : 'var(--text-primary)', border: `1px solid ${selectedSuffix === item.suffix ? 'var(--border-color)' : (isMobile ? 'var(--border-color)' : 'transparent')}`, padding: '12px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', textAlign: 'left', cursor: 'pointer', transition: '0.15s', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '2px' : '0', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', whiteSpace: isMobile ? 'nowrap' : 'normal', flexShrink: 0 }}
                onMouseEnter={e => { if(selectedSuffix !== item.suffix) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={e => { if(selectedSuffix !== item.suffix) e.currentTarget.style.background = 'transparent'; }}
              >
                <span>{selectedRoot}{item.suffix || ' (maj)'}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, padding: isMobile ? '20px 16px' : '24px', overflowY: isMobile ? 'visible' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-root)' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: isMobile ? '26px' : '32px', fontWeight: 900, margin: '0 0 4px 0', color: 'var(--accent)', textShadow: '0 0 20px rgba(0,255,157,0.2)' }}>
              {currentChordName}
            </h2>
          </div>

          {voicings.map((voicing, vIdx) => (
            <div key={vIdx} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span>Pos: {voicing.name}</span>
                <button 
                  onClick={() => playChordAudio(voicing.frets)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center', transition: '0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#000'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--accent)'; }}
                >
                  🔊 LISTEN
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {voicing.frets.map((f, idx) => (
                  <span key={idx} style={{ color: f !== 'x' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {STRINGS[idx]}:{f}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <svg viewBox="0 0 240 280" style={{ width: '180px', height: 'auto', display: 'block' }}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <line key={`fline-${i}`} x1="40" y1={50 + i * 40} x2="200" y2={50 + i * 40} stroke={voicing.baseFret === 1 && i === 0 ? "#ffffff" : "rgba(255,255,255,0.2)"} strokeWidth={voicing.baseFret === 1 && i === 0 ? "4" : "1.5"} />
                  ))}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <line key={`sline-${i}`} x1={40 + i * 32} y1="50" x2={40 + i * 32} y2="250" stroke="rgba(255,255,255,0.3)" strokeWidth={1 + i * 0.3} />
                  ))}
                  {voicing.baseFret > 1 && (
                    <text x="15" y="75" fill="var(--accent)" fontSize="12" fontWeight="800" textAnchor="middle">{voicing.baseFret}fr</text>
                  )}
                  {STRINGS.map((letter, i) => (
                    <text key={`lbl-${i}`} x={40 + i * 32} y="270" fill="var(--text-muted)" fontSize="11" fontWeight="800" textAnchor="middle">{letter}</text>
                  ))}
                  {voicing.frets.map((fretVal, stringIdx) => {
                    const gridX = 40 + stringIdx * 32;
                    if (fretVal === 'x') return <text key={`x-${stringIdx}`} x={gridX} y="38" fill="#ff4d4d" fontSize="14" fontWeight="900" textAnchor="middle">✕</text>;
                    if (fretVal === 0) return <circle key={`o-${stringIdx}`} cx={gridX} cy={34} r="5" fill="transparent" stroke="var(--text-secondary)" strokeWidth="2" />;
                    const relativeFret = fretVal - voicing.baseFret + 1;
                    const gridY = 50 + (relativeFret - 1) * 40 + 20;
                    if (relativeFret >= 1 && relativeFret <= 5) {
                      return (
                        <g key={`dot-${stringIdx}`}>
                          <circle cx={gridX} cy={gridY} r="11" fill="var(--accent)" style={{ filter: 'drop-shadow(0 0 6px var(--accent))' }} />
                          <text x={gridX} y={gridY + 4} fill="#000000" fontSize="11" fontWeight="900" textAnchor="middle">{fretVal}</text>
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChordDictionary;