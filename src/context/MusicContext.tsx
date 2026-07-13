// src/context/MusicContext.tsx

import { createContext, useState, useContext, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export type Mode = 'major' | 'minor' | 'harmonic_minor' | 'melodic_minor' | 'pentatonic' | 'blues' | 'aeolian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian' | 'maj7_arp' | 'min7_arp' | 'dom7_arp' | 'dom9_arp' | 'altered';

export interface DiatonicChord {
  baseRoman: string;
  triad: string;
  seventhRoman: string;
  seventhChord: string;
  ninthRoman: string;
  ninthChord: string;
  eleventhRoman: string;
  eleventhChord: string;
}

export type VideoPlatform = 'youtube' | 'rutube' | 'vk';

export interface TrackInfo {
  platform: VideoPlatform;
  id: string;
  title: string;
}

// 🔥 ДОБАВЛЯЕМ ТИП ДЛЯ РАЗМЕРА
export interface TimeSignature {
  beats: number;     // числитель (4, 3, 6...)
  noteValue: number; // знаменатель (4, 8, 2...)
}

interface MusicContextType {
  keyNote: string;
  mode: Mode;
  bpm: number;
  isPlaying: boolean;
  activeStep: number;
  currentTrack: TrackInfo;
  timeSignature: TimeSignature;
  setKeyNote: (key: string) => void;
  setMode: (mode: Mode) => void;
  setBpm: (bpm: number) => void;
  setCurrentTrack: (track: TrackInfo) => void;
  setTimeSignature: (sig: TimeSignature) => void;
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
  maj7_arp: [0, 4, 7, 11],
  min7_arp: [0, 3, 7, 10],
  dom7_arp: [0, 4, 7, 10],
  dom9_arp: [0, 4, 7, 10, 2],
  altered: [0, 1, 3, 4, 8, 10] // Super Locrian
};

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [keyNote, setKeyNote] = useState<string>('E');
  const [mode, setMode] = useState<Mode>('aeolian');
  const [bpm, setBpm] = useState<number>(120);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>({ beats: 4, noteValue: 4 });
  
  const [currentTrack, setCurrentTrack] = useState<TrackInfo>({
    platform: 'youtube',
    id: 'HdsP-KYQZDQ',
    title: 'Liquid Groove Fusion Backing Track - Em'
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
      // Акцент на первой доле каждого такта
      const isAccent = current % timeSignature.beats === 0;
      playClick(nextNoteTime.current, isAccent);
      setActiveStep(current);
      // Шаг = 1/4 ноты (16-я) для точности визуализации
      nextNoteTime.current += (60.0 / bpm) / 4;
      stepRef.current = (current + 1) % 32;
    }
    timerID.current = requestAnimationFrame(scheduler);
  }, [bpm, timeSignature]);

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

  const getDiatonicChords = (): DiatonicChord[] => {
    const scale = getScaleNotes();
    if (scale.length < 7) return [];

    const chords: DiatonicChord[] = [];
    const romanMaj = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const romanMin = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];

    for (let i = 0; i < 7; i++) {
      const root = scale[i];
      const third = scale[(i + 2) % scale.length];
      const fifth = scale[(i + 4) % scale.length];
      const seventh = scale[(i + 6) % scale.length];
      const ninth = scale[(i + 1) % scale.length];
      const eleventh = scale[(i + 3) % scale.length];

      const rootIdx = ALL_NOTES.indexOf(root);
      const thirdIdx = ALL_NOTES.indexOf(third);
      const fifthIdx = ALL_NOTES.indexOf(fifth);
      const seventhIdx = ALL_NOTES.indexOf(seventh);
      const ninthIdx = ALL_NOTES.indexOf(ninth);
      const eleventhIdx = ALL_NOTES.indexOf(eleventh);

      const int3 = (thirdIdx - rootIdx + 12) % 12;
      const int5 = (fifthIdx - rootIdx + 12) % 12;
      const int7 = (seventhIdx - rootIdx + 12) % 12;
      const int9 = (ninthIdx - rootIdx + 12) % 12;
      const int11 = (eleventhIdx - rootIdx + 12) % 12;

      let triadQuality = '';
      let baseRoman = romanMaj[i];
      let isMinor = false;

      if (int3 === 4 && int5 === 7) { triadQuality = ''; baseRoman = romanMaj[i]; }
      else if (int3 === 3 && int5 === 7) { triadQuality = 'm'; baseRoman = romanMin[i]; isMinor = true; }
      else if (int3 === 3 && int5 === 6) { triadQuality = 'dim'; baseRoman = romanMin[i] + '°'; isMinor = true; }
      else if (int3 === 4 && int5 === 8) { triadQuality = 'aug'; baseRoman = romanMaj[i] + '+'; }
      else { triadQuality = '5'; baseRoman = romanMaj[i] + '5'; }

      const triad = root + triadQuality;

      let seventhQuality = triadQuality;
      let seventhRoman = baseRoman;

      if (int3 === 4 && int5 === 7 && int7 === 11) { seventhQuality = 'maj7'; seventhRoman = romanMaj[i] + 'maj7'; }
      else if (int3 === 4 && int5 === 7 && int7 === 10) { seventhQuality = '7'; seventhRoman = romanMaj[i] + '7'; }
      else if (int3 === 3 && int5 === 7 && int7 === 10) { seventhQuality = 'm7'; seventhRoman = romanMin[i] + '7'; }
      else if (int3 === 3 && int5 === 6 && int7 === 10) { seventhQuality = 'm7b5'; seventhRoman = romanMin[i] + '7b5'; }
      else if (int3 === 3 && int5 === 6 && int7 === 9) { seventhQuality = 'dim7'; seventhRoman = romanMin[i] + '°7'; }
      else { seventhQuality = triadQuality + '(add7)'; seventhRoman = baseRoman + '7'; }

      const seventhChord = root + seventhQuality;

      let ninthQuality = seventhQuality;
      let ninthRoman = seventhRoman;

      if (seventhQuality === 'maj7') {
         if (int9 === 2) { ninthQuality = 'maj9'; ninthRoman = romanMaj[i] + 'maj9'; }
         else if (int9 === 1) { ninthQuality = 'maj7b9'; ninthRoman = romanMaj[i] + 'maj7b9'; }
         else { ninthQuality = 'maj7'; ninthRoman = romanMaj[i] + 'maj7'; }
      } else if (seventhQuality === '7') {
         if (int9 === 2) { ninthQuality = '9'; ninthRoman = romanMaj[i] + '9'; }
         else if (int9 === 1) { ninthQuality = '7b9'; ninthRoman = romanMaj[i] + '7b9'; }
         else if (int9 === 3) { ninthQuality = '7#9'; ninthRoman = romanMaj[i] + '7#9'; }
         else { ninthQuality = '7'; ninthRoman = romanMaj[i] + '7'; }
      } else if (seventhQuality === 'm7') {
         if (int9 === 2) { ninthQuality = 'm9'; ninthRoman = romanMin[i] + '9'; }
         else if (int9 === 1) { ninthQuality = 'm7b9'; ninthRoman = romanMin[i] + '7b9'; }
         else { ninthQuality = 'm7'; ninthRoman = romanMin[i] + '7'; }
      } else if (seventhQuality === 'm7b5') {
         if (int9 === 2) { ninthQuality = 'm9b5'; ninthRoman = romanMin[i] + '9b5'; }
         else if (int9 === 1) { ninthQuality = 'm7b5b9'; ninthRoman = romanMin[i] + '7b5b9'; }
         else { ninthQuality = 'm7b5'; ninthRoman = romanMin[i] + '7b5'; }
      }

      const ninthChord = root + ninthQuality;

      let eleventhQuality = ninthQuality;
      let eleventhRoman = ninthRoman;

      if (ninthQuality.includes('maj9') || ninthQuality.includes('maj7')) {
         if (int11 === 6) { eleventhQuality = 'maj9#11'; eleventhRoman = romanMaj[i] + 'maj9#11'; }
         else if (int11 === 5) { eleventhQuality = 'maj11'; eleventhRoman = romanMaj[i] + 'maj11'; }
      } else if (ninthQuality.includes('m9') || ninthQuality.includes('m7')) {
         eleventhQuality = 'm11'; eleventhRoman = romanMin[i] + '11';
      } else if (ninthQuality.includes('9') && !isMinor) {
         eleventhQuality = '11'; eleventhRoman = romanMaj[i] + '11';
      } else if (seventhQuality.includes('m7b5')) {
         eleventhQuality = 'm11b5'; eleventhRoman = romanMin[i] + '11b5';
      }

      const eleventhChord = root + eleventhQuality;

      chords.push({
         baseRoman, triad,
         seventhRoman, seventhChord,
         ninthRoman, ninthChord,
         eleventhRoman, eleventhChord
      });
    }
    return chords;
  };

  return (
    <MusicContext.Provider value={{
      keyNote, mode, bpm, isPlaying, activeStep, currentTrack,
      timeSignature,
      setKeyNote, setMode, setBpm, setCurrentTrack, setTimeSignature,
      togglePlay, getScaleNotes, getDiatonicChords
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) throw new Error('useMusic must be used within a MusicProvider');
  return context;
};