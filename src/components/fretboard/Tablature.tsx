import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { generateSmartLick, type Lick } from '../../services/AIEngine';

const Tablature: React.FC = () => {
  const { mode, keyNote, getScaleNotes, bpm } = useMusic();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentLick, setCurrentLick] = useState<Lick | null>(null);
  
  // Локальный стейт для бегущего курсора (подсветка текущей ноты)
  const [localActiveStep, setLocalActiveStep] = useState<number>(-1);

  // Мгновенная инициализация при старте
  useEffect(() => {
    const scale = getScaleNotes();
    const safeScale = scale && scale.length > 0 ? scale : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const safeKey = keyNote || 'C';
    const safeMode = mode || 'major';
    
    setCurrentLick(generateSmartLick(safeScale, safeKey, safeMode));
  }, [keyNote, mode]);

  const handleGenerate = () => {
    if (isPlayingAudio) return;
    setIsGenerating(true);
    const scale = getScaleNotes();
    const safeScale = scale && scale.length > 0 ? scale : ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    
    setTimeout(() => {
      setCurrentLick(generateSmartLick(safeScale, keyNote || 'C', mode || 'major'));
      setIsGenerating(false);
      setLocalActiveStep(-1);
    }, 400);
  };

  // 🔥 Web Audio API: Синтезатор для проигрывания табулатуры
  const playLickAudio = () => {
    if (!currentLick || isPlayingAudio) return;
    setIsPlayingAudio(true);
    setLocalActiveStep(-1);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      // Базовые частоты открытых струн: e, B, G, D, A, E (от тонкой к толстой)
      const OPEN_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41]; 
      
      let startTime = ctx.currentTime + 0.1;
      const currentBpm = bpm || 120;
      const quarterDuration = 60 / currentBpm; // Длительность одной четверти в секундах

      currentLick.notes.forEach((note, index) => {
        // Вычисляем частоту ноты: Базовая частота струны * 2^(лад/12)
        const freq = OPEN_FREQS[note.string] * Math.pow(2, note.fret / 12);
        
        // Вычисляем длительность ноты в секундах
        let noteDuration = quarterDuration;
        if (note.duration === 'eighth') noteDuration = quarterDuration / 2;
        if (note.duration === 'sixteenth') noteDuration = quarterDuration / 4;

        // Синхронизируем визуальный курсор с аудио через таймер
        setTimeout(() => {
          setLocalActiveStep(index);
        }, (startTime - ctx.currentTime) * 1000);

        // Создаем звук
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle'; // Мягкий гитарный/синтовый тембр
        
        // Вибрато (если есть техника)
        if (note.technique === 'vibrato') {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.type = 'sine';
          lfo.frequency.value = 5; // 5 Гц вибрато
          lfoGain.gain.value = freq * 0.03; // Глубина
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start(startTime);
          lfo.stop(startTime + noteDuration);
        }

        osc.frequency.setValueAtTime(freq, startTime);
        
        // Огибающая громкости (Attack -> Decay)
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration - 0.02);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + noteDuration);

        // Сдвигаем время для следующей ноты
        startTime += noteDuration;
      });

      // Сброс состояния после завершения фразы
      setTimeout(() => {
        setLocalActiveStep(-1);
        setIsPlayingAudio(false);
      }, (startTime - ctx.currentTime) * 1000 + 200);

    } catch (e) {
      console.error("Audio Synthesis Failed:", e);
      setIsPlayingAudio(false);
    }
  };

  const stringSpacing = 20;
  const startY = 40;
  const noteSpacing = 70;
  const startX = 80;

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, minHeight: '310px', marginTop: '8px' }}>
      
      {/* HEADER */}
      <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            🎸 Lick & Short Phrase Generator
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent)' }}>
            {currentLick ? currentLick.name : 'Initializing Tab Engine...'}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* 🔥 НОВАЯ КНОПКА ВОСПРОИЗВЕДЕНИЯ */}
          <button 
            onClick={playLickAudio}
            disabled={isGenerating || isPlayingAudio || !currentLick}
            style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '6px 16px', borderRadius: '20px', fontWeight: 900, fontSize: '12px', cursor: isPlayingAudio ? 'default' : 'pointer', transition: '0.2s', display: 'flex', gap: '8px', alignItems: 'center', opacity: (isGenerating || !currentLick) ? 0.5 : 1 }}
          >
            {isPlayingAudio ? '🎶 PLAYING...' : '🔊 PLAY LICK'}
          </button>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || isPlayingAudio || !currentLick}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', transition: '0.2s', display: 'flex', gap: '8px', alignItems: 'center', opacity: isPlayingAudio ? 0.5 : 1 }}
            onMouseEnter={e => { if(!isPlayingAudio) e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            {isGenerating ? '⏳ GENERATING...' : '🎲 GENERATE NEW'}
          </button>
        </div>
      </div>

      {/* SVG TABLATURE RENDERER */}
      <div style={{ padding: '24px', overflowX: 'auto', background: '#111216', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        
        {!currentLick ? (
          <div style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '12px', letterSpacing: '1px', width: '100%', textAlign: 'center' }}>
            ⏳ LOADING VECTOR TABLATURE ENGINE...
          </div>
        ) : (
          <svg viewBox={`0 0 ${Math.max(800, currentLick.notes.length * noteSpacing + 150)} 240`} style={{ width: '100%', minWidth: '600px', height: '180px', display: 'block' }}>
            
            {/* РИСУЕМ СТРУНЫ */}
            {[0, 1, 2, 3, 4, 5].map((strIndex) => (
              <line 
                key={`str-${strIndex}`}
                x1="30" y1={startY + strIndex * stringSpacing} 
                x2={Math.max(770, currentLick.notes.length * noteSpacing + 100)} y2={startY + strIndex * stringSpacing} 
                stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" 
              />
            ))}

            {/* Названия струн слева */}
            {['e', 'B', 'G', 'D', 'A', 'E'].map((note, i) => (
              <text key={`tune-${i}`} x="45" y={startY + i * stringSpacing + 4} fill="var(--text-muted)" fontSize="12" fontWeight="800" fontFamily="monospace" textAnchor="middle">
                {note}
              </text>
            ))}

            {/* Тактовая черта */}
            <line x1="70" y1={startY} x2="70" y2={startY + 5 * stringSpacing} stroke="var(--text-muted)" strokeWidth="2" />
            <line x1={Math.max(770, currentLick.notes.length * noteSpacing + 100)} y1={startY} x2={Math.max(770, currentLick.notes.length * noteSpacing + 100)} y2={startY + 5 * stringSpacing} stroke="var(--text-muted)" strokeWidth="2" />

            {/* РИСУЕМ НОТЫ, ШТИЛИ И ТЕХНИКИ */}
            {currentLick.notes.map((note, index) => {
              const x = startX + index * noteSpacing;
              const y = startY + note.string * stringSpacing;
              const nextX = startX + (index + 1) * noteSpacing;
              const nextY = startY + (currentLick.notes[index + 1]?.string || 0) * stringSpacing;
              
              const stemBottomY = 190;
              // 🔥 Проверка активности ноты для бегущего курсора
              const isActive = localActiveStep === index;
              
              return (
                <g key={`note-${index}`} style={{ opacity: isGenerating ? 0.3 : 1, transition: 'all 0.1s' }}>
                  
                  {/* ДУГИ ЛЕГАТО */}
                  {note.tiedToNext && currentLick.notes[index + 1] && (
                    <path 
                      d={`M ${x + 6} ${y - 12} Q ${(x + nextX) / 2} ${Math.min(y, nextY) - 25} ${nextX - 6} ${nextY - 12}`} 
                      fill="transparent" stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="1.5"
                    />
                  )}
                  {note.technique === 'slide' && (
                    <line x1={x + 12} y1={y - 8} x2={nextX - 12} y2={nextY + 8} stroke="var(--accent)" strokeWidth="2" opacity="0.7" />
                  )}
                  {note.technique === 'vibrato' && (
                    <path d={`M ${x-10} ${y-20} Q ${x-5} ${y-25} ${x} ${y-20} T ${x+10} ${y-20} T ${x+20} ${y-20}`} fill="transparent" stroke="var(--accent)" strokeWidth="2" />
                  )}

                  {/* ШТИЛЬ (Stem) */}
                  <line x1={x} y1={y + 10} x2={x} y2={stemBottomY} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="1.5" />
                  
                  {/* Хвостики длительностей */}
                  {(note.duration === 'eighth' || note.duration === 'sixteenth') && (
                    <line x1={x} y1={stemBottomY} x2={x + 15} y2={stemBottomY - 5} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2" />
                  )}
                  {note.duration === 'sixteenth' && (
                    <line x1={x} y1={stemBottomY - 6} x2={x + 15} y2={stemBottomY - 11} stroke={isActive ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2" />
                  )}

                  {/* ФОН НОТЫ (Прямоугольник затирающий линию струны) */}
                  <rect x={x - 12} y={y - 12} width="24" height="24" fill="#111216" rx="4" />

                  {/* ПОДСВЕТКА АКТИВНОЙ НОТЫ (Бегущий курсор) */}
                  {isActive && (
                    <circle cx={x} cy={y} r="16" fill="var(--accent)" opacity="0.8" style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }} />
                  )}

                  {/* САМА ЦИФРА ЛАДА */}
                  <text 
                    x={x} y={y + 4} 
                    fill={isActive ? '#000' : (note.technique !== 'none' ? 'var(--accent)' : 'var(--text-primary)')} 
                    fontSize={isActive ? "18" : "14"} 
                    fontWeight="900" fontFamily="monospace" textAnchor="middle"
                  >
                    {note.fret}
                  </text>

                  {/* Подпись техники над дугой */}
                  {note.tiedToNext && (
                    <text x={(x + nextX) / 2} y={Math.min(y, nextY) - 20} fill="var(--accent)" fontSize="10" fontWeight="800" textAnchor="middle">
                      {note.technique === 'hammer' ? 'H' : note.technique === 'pull' ? 'P' : note.technique === 'slide' ? 'sl' : ''}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};

export default Tablature;