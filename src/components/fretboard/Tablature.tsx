import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';

// От 1-й (самой тонкой) к 6-й (самой толстой)
const TUNING = ['e', 'B', 'G', 'D', 'A', 'E']; 

// Все ноты в хроматическом порядке
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface TabNote {
  stringIdx: number; // 0 = e (1-я струна), 5 = E (6-я струна)
  fret: number;
  step: number;      // Позиция на временной шкале (колонка)
}

interface TabProps {
  activeStep?: number; // Текущий шаг для подсветки
}

const Tablature: React.FC<TabProps> = ({ activeStep = -1 }) => {
  const { keyNote, mode } = useMusic();
  const [phrase, setPhrase] = useState<TabNote[]>([]);

  // Настройки сетки (масштаб табулатуры)
  const TOTAL_STEPS = 32;     // Длина "холста" в шагах
  const STEP_WIDTH = 32;      // Ширина одного шага (px)
  const STRING_HEIGHT = 24;   // Расстояние между струнами (px)

  const { getScaleNotes } = useMusic();

  const generateLick = () => {
    const scale = getScaleNotes(); // Массив нот текущей гаммы (например, ['E', 'G', 'A'...])
    const newPhrase: TabNote[] = [];
    let currentStep = 2;
    
    // Вспомогательная функция: найти лад для ноты на струне
    const findFret = (openNote: string, targetNote: string) => {
      const openIdx = ALL_NOTES.indexOf(openNote.charAt(0).toUpperCase() + openNote.slice(1));
      const targetIdx = ALL_NOTES.indexOf(targetNote);
      if (openIdx === -1 || targetIdx === -1) return 0;
      let fret = (targetIdx - openIdx + 12) % 12;
      return fret;
    };

    const noteCount = 10;
    for (let i = 0; i < noteCount; i++) {
      if (currentStep >= TOTAL_STEPS - 2) break;

      // 1. Выбираем случайную ноту из текущей гаммы
      const randomNote = scale[Math.floor(Math.random() * scale.length)];
      
      // 2. Выбираем случайную струну
      const stringIdx = Math.floor(Math.random() * 6);
      const openNote = TUNING[stringIdx]; // Получаем ноту открытой струны
      
      // 3. Вычисляем лад
      const fret = findFret(openNote, randomNote);
      
      newPhrase.push({
        stringIdx: stringIdx,
        fret: fret + (Math.random() > 0.5 ? 12 : 0), // Добавляем октаву для вариативности
        step: currentStep
      });
      
      currentStep += Math.floor(Math.random() * 2) + 3; 
    }
    setPhrase(newPhrase);
  };
      
  // Перегенерируем фразу при смене тональности
  useEffect(() => {
    generateLick();
  }, [keyNote, mode]);

  return (
    <div style={{ 
      background: 'var(--bg-panel)', 
      borderRadius: 'var(--radius)', 
      padding: '24px', 
      border: '1px solid var(--border-color)', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px', 
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)' 
    }}>
      
      {/* HEADER ТАБУЛАТУРЫ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ 
          fontSize: '11px', 
          textTransform: 'uppercase', 
          color: 'var(--text-muted)', 
          fontWeight: 800, 
          letterSpacing: '1px' 
        }}>
          📝 AI Phrase Generator (Guitar Pro Style)
        </div>
        <button 
          onClick={generateLick}
          style={{ 
            padding: '8px 16px', 
            fontSize: '11px', 
            background: 'var(--bg-hover)', 
            border: '1px solid var(--border-color)', 
            color: 'var(--accent)', 
            borderRadius: 'var(--radius-sm)', 
            cursor: 'pointer', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px', 
            transition: '0.2s' 
          }}
        >
          🎲 Generate Lick
        </button>
      </div>

      {/* ХОЛСТ С ТАБУЛАТУРОЙ */}
      <div style={{ 
        background: 'var(--bg-primary)', 
        padding: '20px 10px', 
        borderRadius: '6px', 
        overflowX: 'auto', 
        border: '1px solid var(--border-color)', 
        boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.4)' 
      }}>
        <div style={{ display: 'flex' }}>
          
          {/* Левая колонка: Названия струн */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            paddingRight: '16px', 
            borderRight: '2px solid var(--border-color)', 
            zIndex: 5, 
            background: 'var(--bg-primary)' 
          }}>
            {TUNING.map((stringName, i) => (
              <div key={`name-${i}`} style={{ 
                height: `${STRING_HEIGHT}px`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--text-secondary)', 
                fontWeight: 800, 
                fontSize: '13px' 
              }}>
                {stringName}
              </div>
            ))}
          </div>

          {/* Правая часть: Сетка струн и нот */}
          <div style={{ 
            position: 'relative', 
            width: `${TOTAL_STEPS * STEP_WIDTH}px`, 
            height: `${TUNING.length * STRING_HEIGHT}px`, 
            marginLeft: '16px' 
          }}>

            {/* 1. Линии струн */}
            {TUNING.map((_, i) => (
              <div key={`line-${i}`} style={{
                position: 'absolute', 
                left: 0, 
                right: 0, 
                top: `${(i * STRING_HEIGHT) + (STRING_HEIGHT / 2)}px`,
                height: '1px', 
                background: 'var(--border-color)', 
                zIndex: 1
              }} />
            ))}

            {/* 2. Вертикальные тактовые черты (barlines) каждые 8 шагов */}
            {Array.from({ length: Math.floor(TOTAL_STEPS / 8) + 1 }).map((_, i) => (
              <div key={`bar-${i}`} style={{
                position: 'absolute', 
                left: `${i * 8 * STEP_WIDTH}px`, 
                top: '4px', 
                bottom: '4px', 
                width: '2px', 
                background: 'var(--border-color)', 
                zIndex: 1, 
                opacity: 0.6
              }} />
            ))}

            {/* 3. Сами ноты (Цифры ладов) */}
            {phrase.map((note, i) => {
              const isActive = note.step === activeStep;
              return (
                <div key={`note-${i}`} style={{
                  position: 'absolute',
                  left: `${note.step * STEP_WIDTH}px`,
                  top: `${(note.stringIdx * STRING_HEIGHT) + (STRING_HEIGHT / 2)}px`,
                  transform: isActive 
                    ? 'translate(-50%, -50%) scale(1.15)' 
                    : 'translate(-50%, -50%)', // Исправлено: только одно свойство transform
                  background: isActive ? 'var(--accent-blue, #3498db)' : 'var(--bg-primary)',
                  color: isActive ? '#fff' : 'var(--accent)',
                  fontWeight: 800,
                  fontSize: '13px',
                  padding: '2px 6px',
                  zIndex: 2,
                  border: `2px solid ${isActive ? '#fff' : 'var(--accent)'}`,
                  borderRadius: '4px',
                  boxShadow: isActive 
                    ? '0 0 20px rgba(52, 152, 219, 0.6), 0 2px 6px rgba(0,0,0,0.6)' 
                    : '0 2px 6px rgba(0,0,0,0.6)',
                  transition: 'all 0.1s ease',
                  pointerEvents: 'none'
                }}>
                  {note.fret}
                </div>
              );
            })}

            {/* 4. Индикатор активного шага (бегунок) */}
            {activeStep >= 0 && activeStep < TOTAL_STEPS && (
              <div style={{
                position: 'absolute',
                left: `${activeStep * STEP_WIDTH}px`,
                top: 0,
                bottom: 0,
                width: '2px',
                background: 'var(--accent-blue, #3498db)',
                zIndex: 3,
                boxShadow: '0 0 20px rgba(52, 152, 219, 0.8)',
                transition: 'left 0.1s linear',
                pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '10px',
                  height: '10px',
                  background: 'var(--accent-blue, #3498db)',
                  borderRadius: '50%',
                  boxShadow: '0 0 20px rgba(52, 152, 219, 0.8)'
                }} />
              </div>
            )}

          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Tablature;