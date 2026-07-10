import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';

const TUNING = ['e', 'B', 'G', 'D', 'A', 'E']; 
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface TabNote {
  stringIdx: number; 
  fret: number;
  step: number;      
}

const Tablature: React.FC = () => {
  const { keyNote, mode, getScaleNotes, activeStep } = useMusic();
  const [phrase, setPhrase] = useState<TabNote[]>([]);

  const TOTAL_STEPS = 32;     
  const STEP_WIDTH = 32;      
  const STRING_HEIGHT = 24;   

  // УМНЫЙ ГЕНЕРАТОР: Игра в позиции
  const generateLick = () => {
    const scale = getScaleNotes();
    if (!scale || scale.length === 0) return;

    const findNote = (openNote: string, targetFret: number) => {
      const openIdx = ALL_NOTES.indexOf(openNote.toUpperCase());
      return ALL_NOTES[(openIdx + targetFret) % 12];
    };

    // 1. Создаем пул доступных нот в выбранной позиции (например, с 5 по 9 лад)
    const positionBase = 5; 
    const positionMax = 9;
    const availableNotes: {stringIdx: number, fret: number}[] = [];

    TUNING.forEach((openNote, stringIdx) => {
      // Ищем ноты на первых 4 струнах для соло
      if(stringIdx < 4) {
        for (let fret = positionBase; fret <= positionMax; fret++) {
          const note = findNote(openNote, fret);
          if (scale.includes(note)) {
            availableNotes.push({ stringIdx, fret });
          }
        }
      }
    });

    if(availableNotes.length === 0) return;

    // 2. Генерируем плавную фразу (Random Walk)
    const newPhrase: TabNote[] = [];
    let currentStep = 2;
    // Начинаем со случайной ноты в позиции
    let currentNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    
    const noteCount = Math.floor(Math.random() * 6) + 6; // От 6 до 11 нот
    
    for (let i = 0; i < noteCount; i++) {
      if (currentStep >= TOTAL_STEPS - 2) break; 
      
      newPhrase.push({ 
        stringIdx: currentNote.stringIdx, 
        fret: currentNote.fret, 
        step: currentStep 
      });
      
      currentStep += Math.random() > 0.4 ? 2 : 4; // Чередование длительностей (восьмые/четверти)

      // Ищем следующую ноту поблизости (соседняя струна или та же, сдвиг не больше 2 ладов)
      const nextCandidates = availableNotes.filter(n => 
        Math.abs(n.stringIdx - currentNote.stringIdx) <= 1 &&
        Math.abs(n.fret - currentNote.fret) <= 2
      );

      if (nextCandidates.length > 0) {
        currentNote = nextCandidates[Math.floor(Math.random() * nextCandidates.length)];
      }
    }
    setPhrase(newPhrase);
  };

  useEffect(() => {
    generateLick();
  }, [keyNote, mode]);

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '1px' }}>
          📝 AI Phrase Generator (Guitar Pro Style)
        </div>
        <button 
          onClick={generateLick}
          style={{ padding: '8px 16px', fontSize: '11px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', transition: '0.2s' }}
        >
          🎲 Generate Lick
        </button>
      </div>

      <div style={{ background: 'var(--bg-primary)', padding: '20px 10px', borderRadius: '6px', overflowX: 'auto', border: '1px solid var(--border-color)', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '16px', borderRight: '2px solid var(--border-color)', zIndex: 5, background: 'var(--bg-primary)' }}>
            {TUNING.map((stringName, i) => (
              <div key={`name-${i}`} style={{ height: `${STRING_HEIGHT}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontWeight: 800, fontSize: '13px' }}>
                {stringName}
              </div>
            ))}
          </div>

          <div style={{ position: 'relative', width: `${TOTAL_STEPS * STEP_WIDTH}px`, height: `${TUNING.length * STRING_HEIGHT}px`, marginLeft: '16px' }}>
            {/* Индикатор Playhead */}
            {activeStep >= 0 && (
              <div style={{ position: 'absolute', left: `${activeStep * STEP_WIDTH}px`, top: 0, bottom: 0, width: '2px', background: 'var(--accent-blue)', zIndex: 0, opacity: 0.2, transition: 'left 0.1s linear' }} />
            )}

            {/* Линии струн */}
            {TUNING.map((_, i) => (
              <div key={`line-${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${(i * STRING_HEIGHT) + (STRING_HEIGHT / 2)}px`, height: '1px', background: 'var(--border-color)', zIndex: 1 }} />
            ))}

            {/* Тактовые черты */}
            {Array.from({ length: Math.floor(TOTAL_STEPS / 8) + 1 }).map((_, i) => (
              <div key={`bar-${i}`} style={{ position: 'absolute', left: `${i * 8 * STEP_WIDTH}px`, top: '4px', bottom: '4px', width: '2px', background: 'var(--border-color)', zIndex: 1, opacity: 0.6 }} />
            ))}

            {/* Ноты (Guitar Pro Style) */}
            {phrase.map((note, i) => {
              const isPlaying = activeStep === note.step;
              
              return (
                <div key={`note-${i}`} style={{
                  position: 'absolute',
                  left: `${note.step * STEP_WIDTH}px`,
                  top: `${(note.stringIdx * STRING_HEIGHT) + (STRING_HEIGHT / 2)}px`,
                  transform: 'translate(-50%, -50%)',
                  // Изящное перекрытие струны: фон совпадает с подложкой, пока нота не заиграет
                  background: isPlaying ? 'var(--accent)' : 'var(--bg-primary)', 
                  color: isPlaying ? '#000' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  padding: '0 4px', // Отступы обрезают линию струны под цифрой
                  zIndex: isPlaying ? 10 : 2,
                  border: 'none', // Никаких рамок, как в Songsterr
                  borderRadius: '2px',
                  transition: 'background 0.1s ease-out'
                }}>
                  {note.fret}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Tablature;