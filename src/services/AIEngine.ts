// src/services/AIEngine.ts

export interface TrackOption {
  id: string;
  title: string;
  icon?: string;
  action?: { type: string; payload?: any };
  key?: string;
  mode?: string;
  bpm?: number;
}

export interface AIResponse {
  text: string;
  action?: { type: string; payload?: any };
  options?: TrackOption[];
}

export const processAIQuery = async (query: string): Promise<AIResponse> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  const lowerQuery = query.toLowerCase();

  const chordMatch = query.match(/\b([A-G][b#]?(?:maj7|m7|m9|m11|maj9|7|9|11|13|m|dim|aug|sus4|sus2)?)\b/i);
  
  if (lowerQuery.includes('chord') || lowerQuery.includes('show') || lowerQuery.includes('play')) {
    if (chordMatch && lowerQuery.includes('chord')) {
      const chordName = chordMatch[1];
      return {
        text: `Absolutely! I've loaded the detailed breakdown for the ${chordName} chord. Check the Dictionary module to explore its voicings on the fretboard!`,
        action: { type: 'OPEN_CHORD', payload: { chord: chordName } }
      };
    }
  }

  const isLookingForTrack = lowerQuery.includes('track') || lowerQuery.includes('jam') || lowerQuery.includes('find') || lowerQuery.includes('backing');
  
  if (isLookingForTrack) {
    const hasSpotify = lowerQuery.includes('spotify');
    const hasApple = lowerQuery.includes('apple') || lowerQuery.includes('apple music');
    const hasYoutube = lowerQuery.includes('youtube') || lowerQuery.includes('yt');

    if (hasSpotify) return { text: "Opening Spotify for you! 🎧", action: { type: 'SEARCH_SPOTIFY', payload: { query } } };
    if (hasApple) return { text: "Opening Apple Music for you! 🎵", action: { type: 'SEARCH_APPLE', payload: { query } } };
    if (hasYoutube) return { text: "Opening YouTube for you! 📺", action: { type: 'SEARCH_YOUTUBE', payload: { query } } };

    return {
      text: "I can find the perfect backing track for you! Where would you like to listen to it?",
      options: [
        { id: 'yt', title: 'Search on YouTube', icon: '📺', action: { type: 'SEARCH_YOUTUBE', payload: { query } } },
        { id: 'sp', title: 'Search on Spotify', icon: '🎧', action: { type: 'SEARCH_SPOTIFY', payload: { query } } },
        { id: 'am', title: 'Search on Apple Music', icon: '🎵', action: { type: 'SEARCH_APPLE', payload: { query } } }
      ]
    };
  }

  return {
    text: "I am TouchGrass AI, your local music assistant! 🤖\n\nTry asking me:\n- \"Find a rock backing track in C on Spotify\"\n- \"Show me the Bmaj7 chord\"\n- \"I need a blues jam track\""
  };
};

// ============================================================================
// 🔥 НОВЫЙ ГЕНЕРАТОР ФРАЗ (С РАЗНЫМИ ДЛИТЕЛЬНОСТЯМИ, ТЕХНИКАМИ, СМЕНОЙ СТРУН)
// ============================================================================

export type Technique = 'none' | 'hammer' | 'pull' | 'slide' | 'vibrato' | 'bend' | 'ghost' | 'choke';

export interface LickNote {
  string: number;
  fret: number | null;
  duration?: 'quarter' | 'eighth' | 'sixteenth' | 'dotted_eighth' | 'half';
  isRest?: boolean;
  articulation?: string;
  technique?: Technique;
  tiedToNext?: boolean;
}

export interface Lick {
  id: string;
  name: string;
  notes: LickNote[];
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STANDARD_TUNING = ['E', 'B', 'G', 'D', 'A', 'E'];

/**
 * 🔥 ПОИСК ЛАДА ДЛЯ НОТЫ
 */
const findFretForNote = (targetNote: string, targetStringIdx: number): number => {
  const openNote = STANDARD_TUNING[targetStringIdx];
  let baseDistance = (ALL_NOTES.indexOf(targetNote) - ALL_NOTES.indexOf(openNote) + 12) % 12;
  
  let bestFret = baseDistance;
  let bestDistance = Math.abs(baseDistance - 5);
  
  for (let octave = -1; octave <= 1; octave++) {
    const candidate = baseDistance + octave * 12;
    if (candidate >= 0 && candidate <= 15) {
      const dist = Math.abs(candidate - 5);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestFret = candidate;
      }
    }
  }
  
  return bestFret;
};

/**
 * 🔥 ГЕНЕРАЦИЯ ФРАЗЫ (ЧЕЛОВЕКОПОДОБНАЯ)
 */
export const generateSmartLick = (scaleNotes: string[], keyNote: string, mode: string): Lick => {
  const notes: LickNote[] = [];
  
  // Длина фразы: 8-16 нот
  const phraseLength = Math.floor(Math.random() * 8) + 8;
  
  // Начинаем с удобной позиции (2-4 струна)
  let currentString = Math.floor(Math.random() * 3) + 2;
  
  // Доступные длительности с весами (реалистичные пропорции)
  const durationTypes = [
    { dur: 'eighth', weight: 35 },
    { dur: 'sixteenth', weight: 25 },
    { dur: 'quarter', weight: 20 },
    { dur: 'dotted_eighth', weight: 12 },
    { dur: 'half', weight: 8 }
  ];
  
  // Техники с весами
  const techniqueWeights = [
    { tech: 'none', weight: 30 },
    { tech: 'hammer', weight: 18 },
    { tech: 'pull', weight: 18 },
    { tech: 'slide', weight: 15 },
    { tech: 'vibrato', weight: 10 },
    { tech: 'bend', weight: 5 },
    { tech: 'ghost', weight: 3 },
    { tech: 'choke', weight: 1 }
  ];
  
  // Выбор техники
  const pickTechnique = (): Technique => {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const item of techniqueWeights) {
      cumulative += item.weight;
      if (rand < cumulative) return item.tech as Technique;
    }
    return 'none';
  };
  
  // Выбор длительности
  const pickDuration = (): 'quarter' | 'eighth' | 'sixteenth' | 'dotted_eighth' | 'half' => {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const item of durationTypes) {
      cumulative += item.weight;
      if (rand < cumulative) return item.dur as any;
    }
    return 'eighth';
  };
  
  let stringChangeCounter = 0;
  
  for (let i = 0; i < phraseLength; i++) {
    // 1. Выбираем ноту из гаммы
    const randomNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
    
    // 2. Смена струны (каждые 2-4 ноты)
    stringChangeCounter++;
    let targetString = currentString;
    
    if (stringChangeCounter > 2 + Math.floor(Math.random() * 2) || 
        currentString <= 1 || currentString >= 5 ||
        Math.random() < 0.25) {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const step = Math.random() > 0.6 ? 2 : 1;
      let newString = currentString + direction * step;
      newString = Math.max(0, Math.min(5, newString));
      if (Math.abs(newString - currentString) > 2) {
        newString = currentString + (direction * 1);
        newString = Math.max(0, Math.min(5, newString));
      }
      targetString = newString;
      stringChangeCounter = 0;
    } else {
      targetString = currentString;
    }
    
    // 3. Находим лад
    let fret = findFretForNote(randomNote, targetString);
    
    // 4. Если лад слишком высокий/низкий — пробуем другую струну
    if (fret > 12 || fret < 0) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const altString = Math.floor(Math.random() * 4) + 1;
        const altFret = findFretForNote(randomNote, altString);
        if (altFret >= 2 && altFret <= 12) {
          targetString = altString;
          fret = altFret;
          break;
        }
      }
    }
    
    // 5. Длительность
    let duration = pickDuration();
    
    // Акценты на сильных долях
    if (i % 4 === 0) {
      duration = Math.random() > 0.5 ? 'quarter' : 'dotted_eighth';
    } else if (i === phraseLength - 1) {
      duration = Math.random() > 0.5 ? 'half' : 'quarter';
    }
    
    // 6. Техника
    let technique: Technique = 'none';
    
    if (i === 0) {
      technique = Math.random() > 0.7 ? 'vibrato' : 'none';
    } else if (i === phraseLength - 1) {
      const lastTech = Math.random();
      if (lastTech < 0.4) technique = 'vibrato';
      else if (lastTech < 0.7) technique = 'bend';
      else if (lastTech < 0.85) technique = 'choke';
      else technique = 'none';
    } else {
      technique = pickTechnique();
    }
    
    // 7. Связь с предыдущей нотой
    const tiedToNext = (i < phraseLength - 1 && 
                        Math.random() < 0.15 && 
                        notes.length > 0 && 
                        notes[notes.length - 1]?.string === targetString &&
                        Math.abs(notes[notes.length - 1]?.fret - fret) <= 2);
    
    // 8. Добавляем ноту
    notes.push({
      string: targetString,
      fret: Math.max(0, Math.min(24, fret)),
      duration,
      technique,
      tiedToNext
    });
    
    currentString = targetString;
  }
  
  // 9. Фильтрация дублей
  const filteredNotes: LickNote[] = [];
  for (let i = 0; i < notes.length; i++) {
    const prev = filteredNotes[filteredNotes.length - 1];
    const current = notes[i];
    
    if (prev && prev.string === current.string && prev.fret === current.fret) {
      if (current.technique === 'none' && Math.random() < 0.6) {
        filteredNotes.push({
          ...current,
          technique: Math.random() > 0.5 ? 'slide' : 'hammer',
          fret: current.fret + (Math.random() > 0.5 ? 1 : -1)
        });
        continue;
      }
      continue;
    }
    filteredNotes.push(current);
  }
  
  // 10. Название фразы
  const modeName = mode.replace(/_/g, ' ');
  const style = Math.random() > 0.5 ? 'Melodic' : 'Rhythmic';
  
  return {
    id: `lick-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: `${style} ${keyNote} ${modeName} Lick (${filteredNotes.length} notes)`,
    notes: filteredNotes
  };
};