import React, { createContext, useContext, useState } from 'react';

// Справочник нот (хроматика)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Логика интервалов для основных ладов
const MODES: Record<string, number[]> = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Minor': [0, 2, 3, 5, 7, 8, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10]
};

const MusicContext = createContext<any>(null);

export const MusicProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [keyNote, setKeyNote] = useState('E');
  const [mode, setMode] = useState('Minor');
  const [bpm, setBpm] = useState(120);

  // Функция для получения всех нот текущей гаммы
  const getScaleNotes = () => {
    const rootIdx = NOTES.indexOf(keyNote);
    return MODES[mode].map(interval => NOTES[(rootIdx + interval) % 12]);
  };

  return (
    <MusicContext.Provider value={{ keyNote, mode, bpm, setKeyNote, setMode, setBpm, getScaleNotes }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);