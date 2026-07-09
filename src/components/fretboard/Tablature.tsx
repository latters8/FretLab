import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';

const TUNING = ['e', 'B', 'G', 'D', 'A', 'E']; // От 1-й к 6-й струне

interface TabNote {
  stringIdx: number; // 0 = e (1-я), 5 = E (6-я)
  fret: number;
  step: number;      // позиция во времени (колонка)
}

const Tablature: React.FC = () => {
  const { keyNote, mode } = useMusic();
  const [phrase, setPhrase] = useState<TabNote[]>([]);

  // Простой алгоритм генерации фразы-заглушки (в будущем подключим реальные ноты гаммы)
  const generateLick = () => {
    const newPhrase: TabNote[] = [];
    let currentStep = 2;
    
    // Генерируем 6-8 случайных нот для демонстрации визуального стиля
    const noteCount = Math.floor(Math.random() * 3) + 6;
    for (let i = 0; i < noteCount; i++) {
      newPhrase.push({
        stringIdx: Math.floor(Math.random() * 3), // Играем в основном на 1-3 струнах
        fret: Math.floor(Math.random() * 5) + 5,  // Лады с 5 по 9
        step: currentStep
      });
      currentStep += Math.floor(Math.random() * 2) + 2; // Шаг между нотами
    }
    setPhrase(newPhrase);
  };

  // Перегенерируем фразу при смене тональности
  useEffect(() => {
    generateLick();
  }, [keyNote, mode]);

  // Функция для отрисовки линии одной струны
  const renderStringLine = (stringIdx: number) => {
    let line = '';
    const TOTAL_STEPS = 32; // Длина табулатуры (колонок)

    for (let step = 0; step < TOTAL_STEPS; step++) {
      const noteHere = phrase.find(n => n.stringIdx === stringIdx && n.step === step);
      if (noteHere) {
        // Если есть нота, пишем лад (например, "5" или "12")
        const fretStr = noteHere.fret.toString();
        line += fretStr.padEnd(3, '-');
      } else {
        // Иначе рисуем линию струны
        line += '---';
      }
    }
    return line;
  };

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
          📝 Phrase Generator / Tablature
        </div>
        <button 
          onClick={generateLick}
          style={{ padding: '6px 14px', fontSize: '11px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🎲 Generate New Lick
        </button>
      </div>

      <div style={{ 
        background: '#0a0d12', padding: '20px', borderRadius: '6px', 
        overflowX: 'auto', border: '1px solid #222', 
        fontFamily: "'Courier New', Courier, monospace", fontSize: '14px', lineHeight: '1.8'
      }}>
        {TUNING.map((stringName, stringIdx) => (
          <div key={stringIdx} style={{ display: 'flex', alignItems: 'center', whiteSpace: 'pre' }}>
            {/* Название струны */}
            <div style={{ color: 'var(--text-muted)', fontWeight: 'bold', width: '24px', borderRight: '2px solid #333', marginRight: '12px' }}>
              {stringName}
            </div>
            {/* Сама табулатура */}
            <div style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}>
              {renderStringLine(stringIdx)}
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default Tablature;