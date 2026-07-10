import { createContext, useState, useContext, useRef, useEffect, useCallback, type ReactNode } from 'react';

export type Mode = 'major' | 'minor' | 'harmonic_minor' | 'melodic_minor' | 'pentatonic' | 'blues' | 'aeolian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian';

export interface DiatonicChord {
  roman: string;
  chord: string;
}

export type VideoPlatform = 'youtube' | 'rutube' | 'vk';

export interface TrackInfo {
  platform: VideoPlatform;
  id: string;
  title: string;
}

interface MusicContextType {
  keyNote: string;
  mode: Mode;
  bpm: number;
  isPlaying: boolean;
  activeStep: number;
  currentTrack: TrackInfo;
  setKeyNote: (key: string) => void;
  setMode: (mode: Mode) => void;
  setBpm: (bpm: number) => void;
  setCurrentTrack: (track: TrackInfo) => void;
  togglePlay: () => void;
  getScaleNotes: () => string[];
  getDiatonicChords: () => DiatonicChord[];
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const INTERVALS: Record<Mode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  minor: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
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
  
  const [currentTrack, setCurrentTrack] = useState<TrackInfo>({
    platform: 'youtube',
    id: 'OebA4GfO8wU', 
    title: 'Fusion Backing Track (E Minor)'
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number>(0);
  const stepRef = useRef(0);

  const playClick = (time: number, isAccent: boolean) => {
    const osc = audioContext.current!.createOscillator();
    const gain = audioContext.current!.createGain();
    osc.frequency.value = isAccent ? 1200 : 800;
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(gain);
    gain.connect(audioContext.current!.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  };

  const scheduler = useCallback(() => {
    while (nextNoteTime.current < audioContext.current!.currentTime + 0.1) {
      const current = stepRef.current;
      if (current % 4 === 0) playClick(nextNoteTime.current, current % 16 === 0);
      setActiveStep(current);
      nextNoteTime.current += (60.0 / bpm) / 4;
      stepRef.current = (current + 1) % 32;
    }
    timerID.current = requestAnimationFrame(scheduler);
  }, [bpm]);

  useEffect(() => {
    if (isPlaying) {
      if (!audioContext.current) audioContext.current = new AudioContext();
      if (audioContext.current.state === 'suspended') audioContext.current.resume();
      nextNoteTime.current = audioContext.current.currentTime + 0.1;
      stepRef.current = 0;
      scheduler();
    } else {
      cancelAnimationFrame(timerID.current);
      setActiveStep(-1);
    }
    return () => cancelAnimationFrame(timerID.current);
  }, [isPlaying, scheduler]);

  const togglePlay = () => setIsPlaying(prev => !prev);

  const getScaleNotes = () => {
    const rootIndex = ALL_NOTES.indexOf(keyNote);
    if (rootIndex === -1) return [];
    const modeIntervals = INTERVALS[mode] || INTERVALS.major;
    return modeIntervals.map(interval => ALL_NOTES[(rootIndex + interval) % 12]);
  };

  // 🔥 ОБНОВЛЕННЫЙ АЛГОРИТМ ДИАТОНИКИ С СЕПТАККОРДАМИ
  const getDiatonicChords = (): DiatonicChord[] => {
    const scale = getScaleNotes();
    if (scale.length < 7) return [];

    const chords: DiatonicChord[] = [];
    const romanMaj = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const romanMin = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];

    for (let i = 0; i < 7; i++) {
      const root = scale[i];
      const third = scale[(i + 2) % 7];
      const fifth = scale[(i + 4) % 7];
      const seventh = scale[(i + 6) % 7]; // Вычисляем 7-ю ступень

      const rootIdx = ALL_NOTES.indexOf(root);
      const thirdIdx = ALL_NOTES.indexOf(third);
      const fifthIdx = ALL_NOTES.indexOf(fifth);
      const seventhIdx = ALL_NOTES.indexOf(seventh);

      const int3 = (thirdIdx - rootIdx + 12) % 12;
      const int5 = (fifthIdx - rootIdx + 12) % 12;
      const int7 = (seventhIdx - rootIdx + 12) % 12;

      let quality = '';
      let roman = '';

      // Логика распознавания септаккордов:
      if (int3 === 4 && int5 === 7 && int7 === 11) { quality = 'maj7'; roman = romanMaj[i] + 'maj7'; }
      else if (int3 === 4 && int5 === 7 && int7 === 10) { quality = '7'; roman = romanMaj[i] + '7'; }
      else if (int3 === 3 && int5 === 7 && int7 === 10) { quality = 'm7'; roman = romanMin[i] + '7'; }
      else if (int3 === 3 && int5 === 6 && int7 === 10) { quality = 'm7b5'; roman = romanMin[i] + '7b5'; }
      else if (int3 === 3 && int5 === 6 && int7 === 9) { quality = 'dim7'; roman = romanMin[i] + '°7'; }
      // Фолбэк на трезвучия, если лад нестандартный (например, блюзовый)
      else if (int3 === 4 && int5 === 7) { quality = ''; roman = romanMaj[i]; }
      else if (int3 === 3 && int5 === 7) { quality = 'm'; roman = romanMin[i]; }
      else if (int3 === 3 && int5 === 6) { quality = 'dim'; roman = romanMin[i] + '°'; }
      else if (int3 === 4 && int5 === 8) { quality = 'aug'; roman = romanMaj[i] + '+'; }
      else { quality = '5'; roman = romanMaj[i] + '5'; }

      chords.push({ roman, chord: root + quality });
    }
    return chords;
  };

  return (
    <MusicContext.Provider value={{ keyNote, mode, bpm, isPlaying, activeStep, currentTrack, setKeyNote, setMode, setBpm, setCurrentTrack, togglePlay, getScaleNotes, getDiatonicChords }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) throw new Error('useMusic must be used within a MusicProvider');
  return context;
};