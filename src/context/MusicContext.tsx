import React, { createContext, useState, useContext, type ReactNode } from 'react';

type Mode = 'major' | 'minor' | 'harmonic_minor' | 'melodic_minor' | 'pentatonic' | 'blues' | 'aeolian';

// Экспортируем тип, чтобы DiatonicChords.tsx его видел
export interface DiatonicChord {
  roman: string;
  chord: string;
}

interface MusicContextType {
  keyNote: string;
  mode: Mode;
  bpm: number;
  setKeyNote: (key: string) => void;
  setMode: (mode: Mode) => void;
  setBpm: (bpm: number) => void;
  getScaleNotes: () => string[];
  getDiatonicChords: () => DiatonicChord[];
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const INTERVALS: Record<Mode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
};

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [keyNote, setKeyNote] = useState<string>('E');
  const [mode, setMode] = useState<Mode>('aeolian');
  const [bpm, setBpm] = useState<number>(120);

  const getScaleNotes = () => {
    const rootIndex = ALL_NOTES.indexOf(keyNote);
    if (rootIndex === -1) return [];
    
    const modeIntervals = INTERVALS[mode] || INTERVALS.major;
    return modeIntervals.map(interval => ALL_NOTES[(rootIndex + interval) % 12]);
  };

  const getDiatonicChords = (): DiatonicChord[] => {
    const scale = getScaleNotes();
    if (scale.length < 7) return [];

    if (mode === 'major') {
      return [
        { roman: 'I', chord: scale[0] },
        { roman: 'ii', chord: scale[1] + 'm' },
        { roman: 'iii', chord: scale[2] + 'm' },
        { roman: 'IV', chord: scale[3] },
        { roman: 'V', chord: scale[4] },
        { roman: 'vi', chord: scale[5] + 'm' },
        { roman: 'vii°', chord: scale[6] + 'dim' }
      ];
    } else if (mode === 'minor' || mode === 'aeolian') {
      return [
        { roman: 'i', chord: scale[0] + 'm' },
        { roman: 'ii°', chord: scale[1] + 'dim' },
        { roman: 'III', chord: scale[2] },
        { roman: 'iv', chord: scale[3] + 'm' },
        { roman: 'v', chord: scale[4] + 'm' },
        { roman: 'VI', chord: scale[5] },
        { roman: 'VII', chord: scale[6] }
      ];
    }
    return [];
  };

  return (
    <MusicContext.Provider
      value={{
        keyNote, mode, bpm,
        setKeyNote, setMode, setBpm,
        getScaleNotes, getDiatonicChords,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) throw new Error('useMusic must be used within a MusicProvider');
  return context;
};