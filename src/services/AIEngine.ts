// src/services/AIEngine.ts

export type VideoPlatform = 'youtube' | 'rutube' | 'vk';

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
  platformOptions?: { platform: VideoPlatform; label: string; icon: string }[];
  searchQuery?: string;
}

export const processAIQuery = async (query: string): Promise<AIResponse> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  const lowerQuery = query.toLowerCase();

  const playOverMatch = query.match(/(?:обыграть|обыгрывание|соло (?:под|на|в)|play over|scale for|arpeggio|арпеджио)\s+([A-G][b#]?(?:m|maj|dim|aug)?(?:2|4|5|6|7|9|11|13)?(?:alt)?)/i);
  if (playOverMatch) {
    const chordStr = playOverMatch[1];
    const keyMatch = chordStr.match(/[A-G][b#]?/i);
    let key = keyMatch ? keyMatch[0].toUpperCase() : 'C';
    let targetMode = 'major';
    const cLower = chordStr.toLowerCase();

    if (cLower.includes('alt')) targetMode = 'altered';
    else if (cLower.includes('maj7')) targetMode = 'maj7_arp';
    else if (cLower.includes('m7') || cLower.includes('min7')) targetMode = 'min7_arp';
    else if (cLower.includes('9')) targetMode = 'dom9_arp';
    else if (cLower.includes('7')) targetMode = 'dom7_arp';
    else if (cLower.includes('m')) targetMode = 'pentatonic';

    return {
      text: `🎸 Отличный выбор! Подсвечиваю аппликатуры для обыгрывания ${chordStr} на грифе.`,
      action: { type: 'SET_CONTEXT', payload: { key, mode: targetMode } }
    };
  }

  const isLookingForTrack = lowerQuery.includes('track') || lowerQuery.includes('jam') || 
                            lowerQuery.includes('find') || lowerQuery.includes('backing') ||
                            lowerQuery.includes('минус') || lowerQuery.includes('джем') ||
                            lowerQuery.includes('найди') || lowerQuery.includes('поищи') ||
                            lowerQuery.includes('подбери');
  
  if (isLookingForTrack) {
    const hasSpotify = lowerQuery.includes('spotify');
    const hasApple = lowerQuery.includes('apple') || lowerQuery.includes('apple music');
    const hasYoutube = lowerQuery.includes('youtube') || lowerQuery.includes('yt');
    const hasRutube = lowerQuery.includes('rutube');
    const hasVk = lowerQuery.includes('vk') || lowerQuery.includes('vkontakte');

    if (hasSpotify) return { text: "Открываю Spotify! 🎧", action: { type: 'SEARCH_SPOTIFY', payload: { query } } };
    if (hasApple) return { text: "Открываю Apple Music! 🎵", action: { type: 'SEARCH_APPLE', payload: { query } } };
    if (hasYoutube) return { text: "Открываю YouTube! 📺", action: { type: 'SEARCH_YOUTUBE', payload: { query } } };
    if (hasRutube) return { text: "Открываю RUTUBE! 📺", action: { type: 'SEARCH_RUTUBE', payload: { query } } };
    if (hasVk) return { text: "Открываю VK Видео! 📱", action: { type: 'SEARCH_VK', payload: { query } } };

    let searchQuery = query
      .replace(/backing|track|jam|минус|джем|найди|поищи|подбери|search|play|for|in|на|в|найди мне|подбери мне|пожалуйста/gi, '')
      .trim();
    
    if (!searchQuery || searchQuery.length < 2) {
      searchQuery = 'guitar backing track';
    } else {
      const lowerSearch = searchQuery.toLowerCase();
      const hasGuitar = lowerSearch.includes('guitar') || lowerSearch.includes('гитара');
      const hasBacking = lowerSearch.includes('backing') || lowerSearch.includes('минус') || lowerSearch.includes('джем');
      const hasIn = lowerSearch.includes('in') || lowerSearch.includes('в');
      
      if (searchQuery.match(/^[A-G][b#]?(?:m|maj|dim|aug|sus|7|9|11|13)?\d*$/i)) {
        searchQuery = `guitar backing track in ${searchQuery}`;
      }
      else if (!hasGuitar && !hasBacking && searchQuery.length < 30) {
        searchQuery = `guitar backing track ${searchQuery}`;
      }
      else if (!hasGuitar && (hasBacking || hasIn)) {
        searchQuery = `guitar ${searchQuery}`;
      }
      else if (hasBacking && !searchQuery.toLowerCase().includes('track')) {
        searchQuery = `${searchQuery} backing track`;
      }
    }

    return {
      text: `🎵 Где будем искать "${searchQuery}"? Выбери платформу:`,
      platformOptions: [
        { platform: 'youtube', label: 'YouTube', icon: '▶️' },
        { platform: 'rutube', label: 'RUTUBE', icon: '📺' },
        { platform: 'vk', label: 'VK Видео', icon: '📱' }
      ],
      searchQuery: searchQuery
    };
  }

  const chordMatch = query.match(/\b([A-G][b#]?(?:maj7|m7|m9|m11|maj9|7|9|11|13|m|dim|aug|sus4|sus2)?)\b/i);
  
  if (chordMatch && (lowerQuery.includes('chord') || lowerQuery.includes('show') || lowerQuery.includes('покажи') || lowerQuery.includes('аккорд'))) {
    const chordName = chordMatch[1];
    return {
      text: `📖 Нашел! Открываю подробный разбор аккорда ${chordName} в словаре.`,
      action: { type: 'OPEN_CHORD', payload: { chord: chordName } }
    };
  }

  const isTabIntent = lowerQuery.includes('соло') || lowerQuery.includes('таб') || 
                      lowerQuery.includes('tab') || lowerQuery.includes('lick') || 
                      lowerQuery.includes('фраза') || lowerQuery.includes('рифф') ||
                      lowerQuery.includes('riff') || lowerQuery.includes('generate');

  if (isTabIntent) {
    return { 
      text: "🎸 Открываю генератор соло-фраз! В какой тональности будем играть?", 
      action: { type: 'OPEN_TAB_GEN' } 
    };
  }

  const simpleChordMatch = query.match(/^[A-G][b#]?(?:m|maj|dim|aug|sus|7|9|11|13)?\d*$/i);
  
  if (simpleChordMatch && !lowerQuery.includes('chord') && !lowerQuery.includes('show') && 
      !lowerQuery.includes('покажи') && !lowerQuery.includes('аккорд') &&
      !lowerQuery.includes('обыграть') && !lowerQuery.includes('арпеджио') &&
      !lowerQuery.includes('минус') && !lowerQuery.includes('джем') &&
      !lowerQuery.includes('соло') && !lowerQuery.includes('таб') &&
      !lowerQuery.includes('найди') && !lowerQuery.includes('поищи')) {
    
    const chord = simpleChordMatch[0];
    const cleanKey = chord.replace(/[^A-G#b]/g, '');
    const isMinor = chord.includes('m');
    
    return {
      text: `🎸 Я нашел аккорд **${chord}**! Выбери действие:`,
      options: [
        { 
          id: 'show', 
          title: `📖 Показать аппликатуру ${chord}`, 
          action: { type: 'OPEN_CHORD', payload: { chord } }
        },
        { 
          id: 'backing', 
          title: `🎧 Найти минусовку ${chord}`, 
          action: { type: 'SEARCH_BACKING', payload: { query: `${chord} guitar backing track` } }
        },
        { 
          id: 'playover', 
          title: `🎯 Обыграть ${chord} (арпеджио)`, 
          action: { type: 'SET_CONTEXT', payload: { key: cleanKey, mode: isMinor ? 'pentatonic' : 'major' } }
        },
        { 
          id: 'lick', 
          title: `⚡ Сгенерировать фразу в ${chord}`, 
          action: { type: 'OPEN_TAB_GEN' } 
        }
      ]
    };
  }

  return {
    text: "🤖 Привет! Я TouchGrass AI — ваш музыкальный ассистент!\n\n" +
          "🎸 Что я умею:\n" +
          "• Находить минусовки: *«Найди блюз минус в Am»*\n" +
          "• Показывать аккорды: *«Покажи Cmaj7»*\n" +
          "• Подсвечивать лады: *«Как обыграть E7?»*\n" +
          "• Генерировать табы: *«Придумай фразу в Dorian»*"
  };
};

export type Technique = 
  | 'none' | 'hammer' | 'pull' | 'slide' | 'vibrato' | 'bend' | 'prebend'
  | 'unison_bend' | 'grace' | 'fall' | 'ghost' | 'choke' | 'mute';

export interface LickNote {
  string: number;
  fret: number | null;
  duration?: string;
  isRest?: boolean;
  articulation?: string;
  technique?: Technique;
  tiedToNext?: boolean;
  velocity?: number;
  accent?: boolean;
  graceNote?: { string: number; fret: number };
  bendAmount?: number;
  durationFactor?: number;
  legatoGroup?: number;
  isLegatoEnd?: boolean;
}

export interface Lick {
  id: string;
  name: string;
  notes: LickNote[];
  tempo?: number;
  swing?: number;
  feel?: 'straight' | 'shuffle' | 'half_time';
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STANDARD_TUNING = ['E', 'B', 'G', 'D', 'A', 'E'];
const ENHARMONIC_MAP: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

export const findFretForNote = (targetNote: string, targetStringIdx: number, minFret: number = 0, maxFret: number = 21): number => {
  const cleanNote = targetNote.replace(/[0-9]/g, '');
  const normalizedTarget = ENHARMONIC_MAP[cleanNote] || cleanNote;
  
  const openNote = STANDARD_TUNING[targetStringIdx];
  const targetIdx = ALL_NOTES.indexOf(normalizedTarget);
  if (targetIdx === -1) return 0;

  let baseDistance = (targetIdx - ALL_NOTES.indexOf(openNote) + 12) % 12;
  
  let bestFret = baseDistance;
  let bestDistance = Math.abs(baseDistance - 5);
  
  for (let octave = -1; octave <= 2; octave++) {
    const candidate = baseDistance + octave * 12;
    if (candidate >= minFret && candidate <= maxFret) {
      const dist = Math.abs(candidate - 5);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestFret = candidate;
      }
    }
  }
  return bestFret;
};

// ============================================================
// 🔥 РАСШИРЕННЫЕ РИТМИЧЕСКИЕ ПАТТЕРНЫ
// ============================================================

const RHYTHM_PATTERNS: Record<string, { name: string; durations: string[]; density: 'sparse' | 'medium' | 'dense' }> = {
  straight: {
    name: 'Straight 8ths',
    durations: ['8n', '8n', '8n', '8n', '8n', '8n', '8n', '8n'],
    density: 'medium'
  },
  straight_16ths: {
    name: 'Straight 16ths',
    durations: ['16n', '16n', '16n', '16n', '16n', '16n', '16n', '16n', '16n', '16n', '16n', '16n', '16n', '16n', '16n', '16n'],
    density: 'dense'
  },
  shuffle: {
    name: 'Shuffle 8ths',
    durations: ['8n.', '8n', '8n.', '8n', '8n.', '8n', '8n.', '8n'],
    density: 'medium'
  },
  shuffle_16ths: {
    name: 'Shuffle 16ths',
    durations: ['16n.', '16n', '16n.', '16n', '16n.', '16n', '16n.', '16n', '16n.', '16n', '16n.', '16n', '16n.', '16n', '16n.', '16n'],
    density: 'dense'
  },
  swing: {
    name: 'Swing 8ths',
    durations: ['8n.', '8n', '8n.', '8n', '8n.', '8n', '8n.', '8n'],
    density: 'medium'
  },
  syncopated: {
    name: 'Syncopated Groove',
    durations: ['8n', '8n.', '8n', '8n.', '16n', '8n', '8n.', '8n'],
    density: 'medium'
  },
  syncopated_dense: {
    name: 'Syncopated Dense',
    durations: ['16n', '16n.', '8n', '16n', '16n.', '8n', '16n', '16n.', '8n', '16n', '16n.', '8n'],
    density: 'dense'
  },
  dotted: {
    name: 'Dotted Rhythms',
    durations: ['4n.', '8n', '4n.', '8n', '4n.', '8n', '4n.', '8n'],
    density: 'sparse'
  },
  dotted_swing: {
    name: 'Dotted Swing',
    durations: ['4n.', '8n', '8n.', '16n', '4n.', '8n', '8n.', '16n'],
    density: 'medium'
  },
  triplet: {
    name: 'Triplet Feel',
    durations: ['8t', '8t', '8t', '8t', '8t', '8t', '8t', '8t', '8t', '8t', '8t', '8t'],
    density: 'medium'
  },
  triplet_swing: {
    name: 'Triplet Swing',
    durations: ['8t', '8t.', '8t', '8t.', '8t', '8t.', '8t', '8t.', '8t', '8t.', '8t', '8t.'],
    density: 'dense'
  },
  contrast: {
    name: 'Contrast Rhythms',
    durations: ['2n', '8n', '8n', '8n', '8n', '2n', '8n', '8n'],
    density: 'sparse'
  },
  bossa: {
    name: 'Bossa Nova',
    durations: ['8n', '16n', '8n', '16n', '8n', '16n', '8n', '16n', '8n', '16n', '8n', '16n', '8n', '16n', '8n', '16n'],
    density: 'dense'
  }
};

// ============================================================
// 🔥 РАСШИРЕННЫЕ МЕЛОДИЧЕСКИЕ ПАТТЕРНЫ
// ============================================================

const MELODY_PATTERNS: Record<string, { name: string; intervals: number[]; accentPositions: number[] }> = {
  diatonic: {
    name: 'Diatonic Steps',
    intervals: [0, 1, 2, 3, 2, 1, 0, -1, -2, -3, -2, -1],
    accentPositions: [0, 3, 6, 9]
  },
  diatonic_jump: {
    name: 'Diatonic Jumps',
    intervals: [0, 2, 1, 3, 2, 4, 3, 5, 4, 3, 2, 1],
    accentPositions: [0, 3, 6, 9]
  },
  arpeggio_major: {
    name: 'Major Arpeggio',
    intervals: [0, 2, 4, 7, 9, 11, 7, 4, 2, 0],
    accentPositions: [0, 3, 6, 9]
  },
  arpeggio_minor: {
    name: 'Minor Arpeggio',
    intervals: [0, 2, 3, 7, 10, 7, 3, 2, 0],
    accentPositions: [0, 3, 6, 9]
  },
  arpeggio_7th: {
    name: '7th Arpeggio',
    intervals: [0, 2, 4, 7, 10, 14, 10, 7, 4, 2, 0],
    accentPositions: [0, 3, 6, 9]
  },
  blues: {
    name: 'Blues Scale',
    intervals: [0, 1, 3, 5, 6, 7, 6, 5, 3, 1, 0],
    accentPositions: [0, 3, 6, 9]
  },
  blues_bend: {
    name: 'Blues Bends',
    intervals: [0, 1, 3, 5, 6, 5, 3, 1, 0],
    accentPositions: [0, 2, 4, 6]
  },
  pentatonic_major: {
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9, 7, 4, 2, 0],
    accentPositions: [0, 3, 6, 9]
  },
  pentatonic_minor: {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10, 7, 5, 3, 0],
    accentPositions: [0, 3, 6, 9]
  },
  chromatic_approach: {
    name: 'Chromatic Approach',
    intervals: [0, 1, 2, 1, 2, 3, 2, 3, 4, 3, 4, 5],
    accentPositions: [0, 3, 6, 9]
  },
  leaps: {
    name: 'Melodic Leaps',
    intervals: [0, 5, 2, 7, 4, 9, 5, 2, 0],
    accentPositions: [0, 3, 6, 9]
  },
  octave_pattern: {
    name: 'Octave Pattern',
    intervals: [0, 12, 0, 12, 0, 12, 0],
    accentPositions: [0, 2, 4, 6]
  },
  mixed: {
    name: 'Mixed Pattern',
    intervals: [0, 2, 3, 5, 3, 2, 0, 2, 4, 5, 4, 2],
    accentPositions: [0, 3, 6, 9]
  },
  modal: {
    name: 'Modal Pattern',
    intervals: [0, 2, 3, 2, 5, 2, 7, 5, 3, 2, 0],
    accentPositions: [0, 3, 6, 9]
  }
};

// ============================================================
// 🔥 ГЕНЕРАЦИЯ РАЗНООБРАЗНЫХ ФРАЗ (ДЛЯ TABLATURE)
// ============================================================

export const generateSmartLick = (
  scaleNotes: string[], 
  keyNote: string, 
  mode: string,
  bpm: number = 120,
  ..._extraArgs: any[]
): Lick => {
  const safeScaleNotes = (scaleNotes && scaleNotes.length > 0) ? scaleNotes : ['C', 'D', 'E', 'G', 'A'];
  
  const rhythmKeys = Object.keys(RHYTHM_PATTERNS);
  const selectedRhythmKey = rhythmKeys[Math.floor(Math.random() * rhythmKeys.length)];
  const rhythm = RHYTHM_PATTERNS[selectedRhythmKey];
  
  const melodyKeys = Object.keys(MELODY_PATTERNS);
  const selectedMelodyKey = melodyKeys[Math.floor(Math.random() * melodyKeys.length)];
  const melody = MELODY_PATTERNS[selectedMelodyKey];
  
  let intervals: number[] = [];
  let durations: string[] = [];
  let accentPositions: number[] = [];
  let techniques: Technique[] = [];
  
  const phraseLength = Math.floor(Math.random() * 8) + 8;
  
  for (let i = 0; i < phraseLength; i++) {
    const melodyIdx = i % melody.intervals.length;
    let interval = melody.intervals[melodyIdx];
    
    if (Math.random() > 0.7) {
      const variation = Math.floor(Math.random() * 3) - 1;
      interval = Math.max(0, Math.min(12, interval + variation));
    }
    
    intervals.push(interval);
  }
  
  for (let i = 0; i < phraseLength; i++) {
    const rhythmIdx = i % rhythm.durations.length;
    let duration = rhythm.durations[rhythmIdx];
    
    if (Math.random() > 0.85) {
      const alternatives = ['16n', '8n', '4n', '8n.', '16n.'];
      duration = alternatives[Math.floor(Math.random() * alternatives.length)];
    }
    
    durations.push(duration);
  }
  
  for (let i = 0; i < phraseLength; i++) {
    const isAccent = melody.accentPositions.includes(i % melody.accentPositions.length) ||
                    (i % 4 === 0 && Math.random() > 0.5);
    accentPositions.push(isAccent ? 1 : 0);
  }
  
  for (let i = 0; i < phraseLength; i++) {
    let tech: Technique = 'none';
    const rand = Math.random();
    
    if (durations[i] === '16n' || durations[i] === '16n.') {
      tech = rand > 0.6 ? 'hammer' : (rand > 0.3 ? 'pull' : 'none');
    } else if (durations[i] === '4n' || durations[i] === '4n.' || durations[i] === '2n') {
      tech = rand > 0.5 ? 'vibrato' : (rand > 0.25 ? 'bend' : 'none');
    } else if (durations[i] === '8n' || durations[i] === '8n.') {
      tech = rand > 0.7 ? 'slide' : 'none';
    } else if (durations[i] === '8t' || durations[i] === '16t') {
      tech = rand > 0.5 ? 'hammer' : 'pull';
    }
    
    techniques.push(tech);
  }
  
  const startFret = Math.floor(Math.random() * 5) + 3;
  let currentString = Math.floor(Math.random() * 3) + 2;
  let lastScaleIdx = Math.floor(safeScaleNotes.length / 2);
  
  const notes: LickNote[] = [];
  
  for (let i = 0; i < intervals.length; i++) {
    const degree = intervals[i];
    const noteIndex = (lastScaleIdx + degree + safeScaleNotes.length) % safeScaleNotes.length;
    const selectedNote = safeScaleNotes[noteIndex];
    
    let fret = findFretForNote(selectedNote, currentString, 0, 21);
    
    if (fret < startFret - 3 || fret > startFret + 5) {
      for (let s = 1; s <= 4; s++) {
        const altFret = findFretForNote(selectedNote, s, 0, 18);
        if (altFret >= startFret - 2 && altFret <= startFret + 4) {
          currentString = s;
          fret = altFret;
          break;
        }
      }
    }
    
    const isAccent = accentPositions[i] === 1;
    const isRest = Math.random() > 0.92;
    
    if (isRest) {
      notes.push({
        string: 0,
        fret: null,
        isRest: true,
        duration: durations[i],
        technique: 'none',
        velocity: 0,
        accent: false
      });
    } else {
      notes.push({
        string: currentString,
        fret: Math.max(0, fret),
        duration: durations[i],
        technique: techniques[i] || 'none',
        tiedToNext: false,
        velocity: isAccent ? 0.9 : 0.6,
        accent: isAccent,
        durationFactor: 1
      });
    }
    
    lastScaleIdx = noteIndex;
    
    if (Math.random() > 0.8) {
      const newString = Math.floor(Math.random() * 4) + 1;
      if (Math.abs(newString - currentString) <= 2) {
        currentString = newString;
      }
    }
  }
  
  if (notes.length > 0 && !notes[notes.length - 1].isRest) {
    const lastNote = notes[notes.length - 1];
    lastNote.duration = '2n';
    lastNote.technique = 'vibrato';
    lastNote.velocity = 0.9;
    lastNote.accent = true;
  }
  
  const feelNames: Record<string, string> = {
    straight: 'Straight',
    shuffle: 'Shuffle',
    swing: 'Swing',
    syncopated: 'Syncopated',
    dotted: 'Dotted',
    triplet: 'Triplet'
  };
  
  const rhythmName = feelNames[selectedRhythmKey.split('_')[0]] || selectedRhythmKey;
  
  return {
    id: `lick-${Date.now()}`,
    name: `${rhythmName} ${selectedMelodyKey.replace('_', ' ')} ${keyNote} ${mode.replace(/_/g, ' ')}`,
    notes,
    tempo: bpm,
    feel: 'straight'
  };
};

// ============================================================
// 🎯 ФАЗА 3: РАСШИРЕННАЯ ГЕНЕРАЦИЯ — 32+ ТАКТА, СТИЛИ, CALL-RESPONSE
// ============================================================

export type SoloStyle = 'blues' | 'jazz' | 'fusion' | 'metal' | 'funk' | 'country' | 'pop' | 'rock' | 'classical';

export interface ExtendedSoloConfig {
  bars: number;                // количество тактов (8, 16, 32, 64)
  style: SoloStyle;
  complexity: 1 | 2 | 3 | 4 | 5; // 1=просто, 5=сложно
  variation: number;           // 0-1, насколько сильно меняется каждая следующая фраза
}

/**
 * Генерация расширенного соло на 32+ такта
 */
export const generateExtendedSolo = (
  scaleNotes: string[],
  keyNote: string,
  mode: string,
  timeSignature: { beats: number; noteValue: number },
  progressionChords: { name: string; notes: string[] }[],
  config: ExtendedSoloConfig
): SyncSoloData => {
  const bars = Math.max(4, Math.min(config.bars, 64));
  const beatsPerBar = timeSignature.beats;
  const totalBeats = bars * beatsPerBar;
  const phraseLengthBars = Math.max(2, Math.min(4, Math.ceil(bars / 4)));
  const phraseCount = Math.max(1, Math.ceil(bars / phraseLengthBars));

  // Безопасная прогрессия
  const safeProgression: { name: string; notes: string[] }[] = [];
  const safeScale = scaleNotes.length > 0 ? scaleNotes : ['C', 'D', 'E', 'G', 'A'];
  const rootNote = keyNote || 'C';

  for (let i = 0; i < bars; i++) {
    if (progressionChords && progressionChords.length > 0) {
      const idx = i % progressionChords.length;
      const chord = progressionChords[idx];
      safeProgression.push({
        name: chord.name,
        notes: chord.notes && chord.notes.length > 0 ? chord.notes : getTriadNotes(chord.name, rootNote)
      });
    } else {
      safeProgression.push({
        name: rootNote,
        notes: getTriadNotes(rootNote, rootNote)
      });
    }
  }

  // Аккорды для данных
  const chords: SyncChord[] = safeProgression.map((ch, i) => ({
    name: ch.name,
    notes: ch.notes,
    beatStart: i * beatsPerBar,
    durationBeats: beatsPerBar
  }));

// === Генерация нот ===
  const allNotes: SyncNote[] = [];
  const motif = generateMotif(safeScale, mode, keyNote, config.style, config.complexity);
  let previousPhraseMotif = motif;

  for (let phraseIdx = 0; phraseIdx < phraseCount; phraseIdx++) {
    const phraseBarStart = phraseIdx * phraseLengthBars;
    const phraseBars = Math.min(phraseLengthBars, bars - phraseBarStart);
    
    if (phraseBars <= 0) break;

    // Простая вариация мотива — БЕЗ call-response и motif development
    let phraseMotif = motif;
    if (phraseIdx > 0) {
      phraseMotif = varyMotif(previousPhraseMotif, phraseIdx, config.variation * 0.6);
    }
    previousPhraseMotif = phraseMotif;

    // Стилевые модификации + контур фразы для более живой импровизации
    const styleAdjusted = applyStyleToPhrase(phraseMotif, config.style, phraseIdx);
    const phraseAnchorFret = phraseIdx > 0
      ? (allNotes[allNotes.length - 1]?.fret ?? motif[0]?.fret ?? 0)
      : (motif[0]?.fret ?? 0);
    const contourAdjusted = styleAdjusted.map((motifNote, i) => {
      const adjusted = { ...motifNote };
      const direction = phraseIdx % 2 === 0 ? 1 : -1;
      const step = 1 + (config.complexity >= 4 ? 2 : 0) + (phraseIdx % 2);

      if (phraseIdx > 0 && i === 0) {
        adjusted.fret = Math.max(0, Math.min(21, phraseAnchorFret + direction * (1 + (config.complexity > 3 ? 1 : 0))));
      } else if (phraseIdx > 0 && (i % 3 === 0 || i === styleAdjusted.length - 1)) {
        adjusted.fret = Math.max(0, Math.min(21, (adjusted.fret ?? 0) + direction * step));
        if (adjusted.technique === 'none') {
          adjusted.technique = i % 2 === 0 ? 'slide' : 'hammer';
        }
      } else if (phraseIdx > 0 && i % 2 === 0) {
        adjusted.fret = Math.max(0, Math.min(21, (adjusted.fret ?? 0) + direction * Math.max(1, step - 1)));
      }

      return adjusted;
    });

    // Генерируем ноты для фразы
    for (let bar = 0; bar < phraseBars; bar++) {
      const globalBarIdx = phraseBarStart + bar;
      const properties: SyncNote[] = [];
      const notesInBar = Math.max(2, Math.round((config.complexity + 1) * (beatsPerBar === 3 ? 2 : 2.5)));
      const beatStep = beatsPerBar / notesInBar;
      const densityBias = bars >= 16 ? 0.25 : 0.1;
      
      for (let slot = 0; slot < notesInBar; slot++) {
        const slotBeat = globalBarIdx * beatsPerBar + slot * beatStep;
        if (slotBeat >= totalBeats) break;
        
        const motifIdx = (slot + bar * 2 + phraseIdx * 8) % contourAdjusted.length;
        const motifNote = contourAdjusted[motifIdx];
        
        if (!motifNote) continue;

const noteName = getNoteFromFret(motifNote.fret ?? 0, motifNote.string);
        
        // Стилевое смещение ноты
        let targetFret = motifNote.fret ?? 0;
        let targetString = motifNote.string;
        
        if (noteName && !safeScale.includes(noteName)) {
          // Если нота вне гаммы — подправляем к ближайшей
          const nearest = findNearestScaleNote(noteName, safeScale);
          if (nearest) {
            targetFret = findFretForNote(nearest, targetString, 0, 21);
          }
        }

const isAccent = slot === 0 || (config.complexity >= 4 && slot % 3 === 0);
        const isLastNoteGlobal = globalBarIdx === bars - 1 && slot === notesInBar - 1;
        const shouldRest = Math.random() < densityBias * (config.complexity <= 2 ? 0.18 : 0.08);
        const durationPool = config.complexity >= 4 ? ['16n', '8n', '8n.'] : ['8n', '4n'];
        const phraseDuration = durationPool[(slot + phraseIdx + bar) % durationPool.length];

        if (shouldRest && !isLastNoteGlobal) {
          properties.push({
            string: targetString,
            fret: null,
            isRest: true,
            beatStart: slotBeat,
            beatDuration: beatStep * 0.9,
            duration: '8n',
            technique: 'none' as Technique,
            accent: false,
            velocity: 0.2
          });
          continue;
        }

        properties.push({
          string: targetString,
          fret: Math.max(0, Math.min(21, targetFret)),
          isRest: false,
          beatStart: slotBeat,
          beatDuration: isLastNoteGlobal ? 2 : (bars >= 16 ? beatStep * (slot % 2 === 0 ? 1.05 : 0.95) : beatStep * 0.95),
          duration: isLastNoteGlobal ? '2n' : phraseDuration,
          technique: isLastNoteGlobal ? 'vibrato' as Technique : (motifNote.technique || 'none' as Technique),
          accent: isAccent,
          velocity: isAccent ? 0.9 : (0.5 + Math.random() * 0.3)
        });
      }

      allNotes.push(...properties);
    }
  }

  return { bars, totalBeats, chords, notes: allNotes };
};

function generateMotif(
  scale: string[],
  mode: string,
  key: string,
  style: SoloStyle,
  complexity: number
): LickNote[] {
  const motifLength = 4 + complexity * 2;
  const notes: LickNote[] = [];
  
  for (let i = 0; i < motifLength; i++) {
    const scaleIdx = i % scale.length;
    const note = scale[scaleIdx];
    const string = Math.min(4, Math.max(1, Math.floor(i / 2) + 1));
    const fret = findFretForNote(note, string, 0, 21);
    
    let technique: Technique = 'none';
    const r = Math.random();
    if (r > 0.85) technique = 'bend';
    else if (r > 0.7) technique = complexity >= 3 ? 'hammer' : 'slide';
    else if (r > 0.6) technique = 'vibrato';
    
    notes.push({
      string,
      fret,
      duration: '8n',
      technique,
      velocity: i === 0 ? 0.95 : 0.6 + Math.random() * 0.3,
      accent: i === 0 || i % 4 === 0
    });
  }
  return notes;
}

/** Варьирует мотив для каждой следующей фразы — прогрессивное развитие */
function varyMotif(prevMotif: LickNote[], phraseIndex: number, variation: number): LickNote[] {
  // variation растёт с каждой фразой, чтобы музыка развивалась
  const progressiveVar = Math.min(1, variation * (1 + phraseIndex * 0.2));
  const durationPool = ['16n', '8n', '8n.', '4n'];

  return prevMotif.map((note, i) => {
    let modNote = { ...note };

    // Увеличиваем вероятность изменений с прогрессией
    if (Math.random() < progressiveVar) {
      // Более агрессивные сдвиги ладов: -4/+4
      const fretShift = Math.floor(Math.random() * 9) - 4;
      modNote.fret = Math.max(0, Math.min(21, (note.fret || 0) + fretShift));

      // Смена струны
      if (Math.random() > 0.6) {
        const stringShift = Math.random() > 0.5 ? 1 : -1;
        modNote.string = Math.max(0, Math.min(5, (note.string || 2) + stringShift));
      }

      // Ритмические вариации — смена длительности
      if (Math.random() > 0.5) {
        const newDur = durationPool[Math.floor(Math.random() * durationPool.length)];
        modNote.duration = newDur;
      }

      // Динамические изменения
      modNote.velocity = (note.velocity || 0.7) * (0.6 + Math.random() * 0.8);
      modNote.accent = Math.random() > 0.7 ? !note.accent : note.accent;

      // Технические вариации
      if (Math.random() > 0.6) {
        const techPool: Technique[] = ['hammer', 'pull', 'slide', 'bend', 'vibrato', 'none'];
        modNote.technique = techPool[Math.floor(Math.random() * techPool.length)];
      }
    }

    return modNote;
  });
}

/** Применяет стилевые модификации к фразе — с учётом номера фразы */
function applyStyleToPhrase(phrase: LickNote[], style: SoloStyle, phraseIdx: number): LickNote[] {
  return phrase.map((note, i) => {
    let modNote = { ...note };
    
    switch (style) {
      case 'blues':
        // Разные бенды в зависимости от позиции фразы
        if (phraseIdx % 2 === 0) {
          if (i % 3 === 0) modNote.technique = 'bend';
          if (i % 4 === 0) modNote.velocity = Math.min(1, (note.velocity || 0.7) + 0.2);
        } else {
          if (i % 2 === 0) modNote.technique = 'slide';
          if (i % 5 === 0) modNote.technique = 'vibrato';
        }
        break;
      case 'jazz':
        // С ростом phraseIdx увеличиваем сложность
        if (phraseIdx > 1 && i % 3 === 0) modNote.technique = 'bend';
        if (i % 2 === 0) modNote.technique = 'slide';
        modNote.velocity = (note.velocity || 0.7) * (0.85 - phraseIdx * 0.02);
        break;
      case 'metal':
        // Агрессивные акценты, palm mute (ghost)
        if (i % 2 === 0) modNote.technique = 'mute';
        if (i % 4 === 0) modNote.velocity = 1.0;
        break;
      case 'funk':
        // Стаккато, ритмические акценты
        modNote.duration = '16n';
        modNote.velocity = i % 2 === 0 ? 0.9 : 0.5;
        break;
      case 'country':
        // Быстрые арпеджио, четкий звук
        modNote.technique = 'none';
        modNote.velocity = 0.8;
        break;
      case 'fusion':
        // Смесь — сложные интервалы
        if (i % 5 === 0) modNote.technique = 'bend';
        if (i % 7 === 0) modNote.technique = 'slide';
        break;
      default:
        break;
    }
    
    return modNote;
  });
}

/** Находит ближайшую ноту в гамме */
function findNearestScaleNote(note: string, scale: string[]): string | null {
  const noteIdx = ALL_NOTES.indexOf(note);
  if (noteIdx === -1) return null;
  
  let best: string | null = null;
  let bestDist = 12;
  
  for (const sn of scale) {
    const snIdx = ALL_NOTES.indexOf(sn);
    if (snIdx === -1) continue;
    const dist = Math.min(Math.abs(noteIdx - snIdx), 12 - Math.abs(noteIdx - snIdx));
    if (dist < bestDist) {
      bestDist = dist;
      best = sn;
    }
  }
  
  return best;
}

/** Получает ноту из фрета */
function getNoteFromFret(fret: number, string: number): string {
  const openNotes = ['E', 'B', 'G', 'D', 'A', 'E'];
  const openIdx = ALL_NOTES.indexOf(openNotes[string] || 'E');
  if (openIdx === -1) return 'E';
  return ALL_NOTES[(openIdx + fret) % 12];
}

/** Получает триадные ноты для аккорда */
function getTriadNotes(chordName: string, fallbackRoot: string): string[] {
  const root = chordName.replace(/[^A-G#b]/g, '') || fallbackRoot;
  const rootIdx = ALL_NOTES.indexOf(root);
  if (rootIdx === -1) return [fallbackRoot];
  return [
    ALL_NOTES[rootIdx],
    ALL_NOTES[(rootIdx + 4) % 12],
    ALL_NOTES[(rootIdx + 7) % 12]
  ];
}

// ============================================================
// 🔥 ОРИГИНАЛЬНЫЙ ГЕНЕРАТОР СОЛО (4 такта)
// ============================================================

export interface SyncChord {
  name: string;
  notes: string[];
  beatStart: number;
  durationBeats: number;
}

export interface SyncNote extends LickNote {
  beatStart: number;
  beatDuration: number;
}

export interface SyncSoloData {
  bars: number;
  totalBeats: number;
  chords: SyncChord[];
  notes: SyncNote[];
}

// ============================================================
// 🎯 ФАЗА 2: ИНТЕРАКТИВНЫЙ РЕЖИМ — ПОДСКАЗКИ НОТ И ФРАЗ
// ============================================================

export interface SuggestionNote {
  note: string;
  fret: number;
  string: number;
  degree: number;
  isChordTone: boolean;
  isTension: boolean;
  isApproach: boolean;
  label: string;
}

/**
 * Возвращает рекомендуемые ноты для обыгрывания текущего аккорда
 */
export const getSuggestedNotesForChord = (
  chord: { name: string; notes: string[] },
  scaleNotes: string[],
  keyNote: string
): SuggestionNote[] => {
  const suggestions: SuggestionNote[] = [];
  const chordNotes = chord.notes || [];
  const chordRoot = chord.name.replace(/[^A-G#b]/g, '');

  // Аккордовые тоны (безопасные, якоря)
  chordNotes.forEach((note, idx) => {
    const degree = idx === 0 ? 1 : idx === 1 ? 3 : idx === 2 ? 5 : 7;
    const fret = findFretForNote(note, 2, 0, 21);
    suggestions.push({
      note,
      fret,
      string: 2,
      degree,
      isChordTone: true,
      isTension: false,
      isApproach: false,
      label: degree === 1 ? 'Tonic' : degree === 3 ? '3rd' : degree === 5 ? '5th' : '7th'
    });
  });

  // tension ноты (9, 11, 13) из гаммы
  const tensionIntervals = [1, 3, 5]; // 9th, 11th, 13th
  const rootIdx = ALL_NOTES.indexOf(chordRoot);
  tensionIntervals.forEach(interval => {
    const noteIdx = (rootIdx + interval) % 12;
    const note = ALL_NOTES[noteIdx];
    if (scaleNotes.includes(note) && !chordNotes.includes(note)) {
      const fret = findFretForNote(note, 2, 0, 21);
      suggestions.push({
        note,
        fret,
        string: 2,
        degree: interval + 1 + 7, // 9, 11, 13
        isChordTone: false,
        isTension: true,
        isApproach: false,
        label: `${interval + 1 + 7}th`
      });
    }
  });

  // Проходные ноты (chromatic approach)
  chordNotes.forEach(note => {
    const noteIdx = ALL_NOTES.indexOf(note);
    if (noteIdx > 0) {
      const approachNote = ALL_NOTES[(noteIdx - 1 + 12) % 12];
      if (!chordNotes.includes(approachNote)) {
        const fret = findFretForNote(approachNote, 2, 0, 21);
        suggestions.push({
          note: approachNote,
          fret,
          string: 2,
          degree: -1,
          isChordTone: false,
          isTension: false,
          isApproach: true,
          label: 'Approach'
        });
      }
    }
  });

  return suggestions;
};

export interface PhraseSuggestion {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  notes: LickNote[];
  chordTarget: string;
  style: string;
}

/**
 * Возвращает фразы для обыгрывания текущей гармонии
 */
export const getPhraseSuggestions = (
  chord: { name: string; notes: string[] },
  keyNote: string,
  mode: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): PhraseSuggestion[] => {
  const suggestions: PhraseSuggestion[] = [];
  const chordRoot = chord.name.replace(/[^A-G#b]/g, '');
  const scale = getScaleForChordInternal(chordRoot, mode);
  
  // Простая фраза 1: арпеджио вверх
  suggestions.push({
    id: `phrase-${Date.now()}-1`,
    name: 'Arpeggio Up',
    description: 'Play chord tones ascending',
    difficulty: 'beginner',
    notes: chord.notes.map((note, i) => ({
      string: 2,
      fret: findFretForNote(note, 2, 0, 21),
      duration: i === chord.notes.length - 1 ? '2n' : '8n',
      technique: 'none' as Technique,
      velocity: 0.8
    })),
    chordTarget: chord.name,
    style: 'arpeggio'
  });

  // Фраза 2: пентатоника вниз
  if (scale.length >= 5) {
    const pentatonicIndices = [0, 2, 4, 7, 9];
    const pentatonicNotes = pentatonicIndices.map(i => scale[i % scale.length]).filter(Boolean);
    suggestions.push({
      id: `phrase-${Date.now()}-2`,
      name: 'Pentatonic Run',
      description: 'Descending pentatonic pattern',
      difficulty: 'intermediate',
      notes: pentatonicNotes.reverse().map((note, i) => ({
        string: 2,
        fret: findFretForNote(note, 2, 0, 21),
        duration: i === 0 ? '2n' : '8n',
        technique: i % 2 === 0 ? 'hammer' as Technique : 'pull' as Technique,
        velocity: 0.75
      })),
      chordTarget: chord.name,
      style: 'pentatonic'
    });
  }

  // Фраза 3: 3-6-5-3 pattern (advanced)
  suggestions.push({
    id: `phrase-${Date.now()}-3`,
    name: '3-6-5-3 Pattern',
    description: 'Classic jazz/blues enclosure pattern',
    difficulty: 'advanced',
    notes: [
      { string: 2, fret: 5, duration: '16n', technique: 'none' as Technique, velocity: 0.9 },
      { string: 2, fret: 8, duration: '16n', technique: 'slide' as Technique, velocity: 0.85 },
      { string: 2, fret: 7, duration: '8n', technique: 'bend' as Technique, velocity: 0.95 },
      { string: 2, fret: 5, duration: '4n', technique: 'vibrato' as Technique, velocity: 0.9 },
    ],
    chordTarget: chord.name,
    style: 'jazz'
  });

  return suggestions;
};

/**
 * Внутренняя функция получения нот гаммы для аккорда
 */
function getScaleForChordInternal(root: string, mode: string): string[] {
  const rootIdx = ALL_NOTES.indexOf(root);
  if (rootIdx === -1) return ['C', 'D', 'E', 'G', 'A'];
  
  const modeIntervals: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
  };
  
  const intervals = modeIntervals[mode] || modeIntervals.major;
  return intervals.map(i => ALL_NOTES[(rootIdx + i) % 12]);
}

/**
 * Прогнозирование следующей ноты на основе контекста
 */
export const predictNextNote = (
  currentNotes: LickNote[],
  scaleNotes: string[],
  keyNote: string,
  mode: string,
  lastFret: number
): SuggestionNote[] => {
  const predictions: SuggestionNote[] = [];
  const safeScale = scaleNotes.length > 0 ? scaleNotes : ['C', 'D', 'E', 'G', 'A'];
  
  // Ближайшие ноты по гамме (в пределах 4 ладов от последней)
  const stringToUse = 2;
  safeScale.forEach(note => {
    const fret = findFretForNote(note, stringToUse, 0, 21);
    if (Math.abs(fret - lastFret) <= 4) {
      const degree = safeScale.indexOf(note) + 1;
      predictions.push({
        note,
        fret,
        string: stringToUse,
        degree,
        isChordTone: degree === 1 || degree === 3 || degree === 5,
        isTension: degree === 2 || degree === 4 || degree === 6,
        isApproach: false,
        label: `${degree}${degree === 1 ? 'st' : degree === 2 ? 'nd' : degree === 3 ? 'rd' : 'th'}`
      });
    }
  });
  
  return predictions.sort((a, b) => Math.abs(a.fret - lastFret) - Math.abs(b.fret - lastFret)).slice(0, 5);
};

// ============================================================
// 🔥 ОРИГИНАЛЬНЫЙ КОД generateSynchronizedSolo
// ============================================================

export const generateSynchronizedSolo = (
  scaleNotes: string[],
  keyNote: string,
  mode: string,
  timeSignature: { beats: number; noteValue: number },
  progressionChords: { name: string; notes: string[] }[],
  _forceAllChords: boolean
): SyncSoloData => {
  const bars = 4;
  const beatsPerBar = timeSignature.beats;
  const totalBeats = bars * beatsPerBar;
  
  // 🔥 FIX: Если progressionChords пустой — создаём фоллбэк из 4 тактов на I
  if (!progressionChords || progressionChords.length === 0) {
    const rootNote = keyNote || 'C';
    const rootIdx = ALL_NOTES.indexOf(rootNote);
    const fallbackNotes = rootIdx !== -1
      ? [ALL_NOTES[rootIdx], ALL_NOTES[(rootIdx + 4) % 12], ALL_NOTES[(rootIdx + 7) % 12]]
      : [rootNote];
    
    for (let i = 0; i < bars; i++) {
      progressionChords.push({
        name: rootNote,
        notes: fallbackNotes
      });
    }
  }
  
  // Формируем аккорды с проверкой нот
  const chords: SyncChord[] = [];
  
  for (let i = 0; i < bars; i++) {
    const safeIdx = i % progressionChords.length;
    const chordObj = progressionChords[safeIdx];
    if (!chordObj) {
      // Абсолютный фоллбэк если и это не сработало
      chords.push({
        name: keyNote || 'C',
        notes: [keyNote || 'C'],
        beatStart: i * beatsPerBar,
        durationBeats: beatsPerBar
      });
      continue;
    }
    let chordNotes = chordObj.notes;
    if (!chordNotes || chordNotes.length === 0) {
      const root = chordObj.name.replace(/[^A-G#b]/g, '');
      const rootIdx = ALL_NOTES.indexOf(root);
      if (rootIdx !== -1) {
        chordNotes = [
          ALL_NOTES[rootIdx],
          ALL_NOTES[(rootIdx + 4) % 12],
          ALL_NOTES[(rootIdx + 7) % 12]
        ];
      } else {
        chordNotes = [keyNote];
      }
    }
    chords.push({
      name: chordObj.name,
      notes: chordNotes,
      beatStart: i * beatsPerBar,
      durationBeats: beatsPerBar
    });
  }

  const notes: SyncNote[] = [];
  let currentBeat = 0;
  
  const safeScale = scaleNotes && scaleNotes.length > 0 ? scaleNotes : ['C', 'D', 'E', 'G', 'A'];
  
  let currentString = 2;
  const startFret = Math.floor(Math.random() * 5) + 3;
  let lastScaleIdx = Math.floor(safeScale.length / 2);

  // ОПРЕДЕЛЯЕМ РЕЖИМ
  const isArpeggioMode = mode.includes('_arp') || mode === 'arpeggio';
  const isAlteredMode = mode === 'altered';
  const isPentatonicMode = mode === 'pentatonic' || mode === 'blues';

  // ============================================================
  // 🔥 АРПЕДЖИО И АЛЬТЕРАЦИИ - УЛУЧШЕННЫЙ ГЕНЕРАТОР
  // ============================================================
  if (isArpeggioMode || isAlteredMode) {
    const isArp = isArpeggioMode;
    const stepDuration = isArp ? 0.25 : 0.375;
    const totalSteps = Math.min(Math.floor(totalBeats / stepDuration), 32);
    let stepCounter = 0;
    
    // Паттерны для альтераций
    const alteredPatterns = [
      [0, 1, 3, 4, 6, 8, 10, 6, 4, 3, 1, 0],
      [0, 1, 2, 1, 2, 3, 4, 3, 2, 1, 0],
      [0, 1, 3, 4, 6, 4, 3, 1, 0],
      [0, 1, 2, 1, 3, 4, 3, 1, 0, -1, -2, -1]
    ];
    const selectedAlteredPattern = alteredPatterns[Math.floor(Math.random() * alteredPatterns.length)];
    let alteredIdx = 0;
    
    while (currentBeat < totalBeats && stepCounter < totalSteps) {
      if (currentBeat > totalBeats - 0.1) break;
      
      const currentBarIndex = Math.floor(currentBeat / beatsPerBar);
      const chord = chords[currentBarIndex % chords.length];
      const chordNotes = chord?.notes || [keyNote];
      const rootNote = chord?.name?.replace(/[^A-G#b]/g, '') || keyNote;
      
      let noteStr = '';
      let useAccent = stepCounter % 4 === 0;
      
      if (isArp) {
        // Арпеджио - последовательно по аккордовым тонам
        const noteIdx = stepCounter % chordNotes.length;
        noteStr = chordNotes[noteIdx] || chordNotes[0] || keyNote;
        useAccent = stepCounter % 3 === 0;
      } else {
        // Альтерации - смешиваем аккордовые тона с хроматикой
        if (stepCounter % 3 === 0) {
          const noteIdx = Math.floor(Math.random() * chordNotes.length);
          noteStr = chordNotes[noteIdx] || chordNotes[0] || keyNote;
        } else if (stepCounter % 3 === 1) {
          const baseIdx = safeScale.indexOf(chordNotes[0] || keyNote);
          const offset = selectedAlteredPattern[alteredIdx % selectedAlteredPattern.length];
          alteredIdx++;
          const idx = (baseIdx + offset + safeScale.length) % safeScale.length;
          noteStr = safeScale[idx] || keyNote;
        } else {
          // Тритоновая замена
          const baseIdx = ALL_NOTES.indexOf(rootNote);
          const tritoneIdx = (baseIdx + 6) % 12;
          const tritoneNote = ALL_NOTES[tritoneIdx];
          if (safeScale.includes(tritoneNote)) {
            noteStr = tritoneNote;
          } else {
            const idx = (baseIdx + 1) % 12;
            noteStr = ALL_NOTES[idx];
          }
        }
      }
      
      if (!noteStr) noteStr = keyNote || 'C';
      
      let fret = findFretForNote(noteStr, currentString, 0, 21);
      
      if (fret < startFret - 2 || fret > startFret + 5) {
        for (let s = 1; s <= 4; s++) {
          const altFret = findFretForNote(noteStr, s, 0, 19);
          if (altFret >= startFret - 2 && altFret <= startFret + 5) {
            currentString = s;
            fret = altFret;
            break;
          }
        }
      }
      
      if (fret < 0 || fret > 21) {
        fret = 5;
        currentString = 2;
      }
      
      const durVal = stepDuration;
      const durType = isArp ? '16n' : '8n.';
      
      let technique: Technique = 'none';
      if (isArp && stepCounter > 0 && stepCounter % 2 === 0) {
        technique = Math.random() > 0.5 ? 'hammer' : 'pull';
      } else if (!isArp && stepCounter % 3 === 0) {
        technique = 'bend';
      } else if (!isArp && stepCounter % 5 === 0) {
        technique = 'vibrato';
      }
      
      notes.push({
        string: currentString,
        fret: Math.max(0, Math.min(21, fret)),
        isRest: false,
        beatStart: currentBeat,
        beatDuration: durVal,
        duration: durType,
        technique: technique,
        accent: useAccent,
        velocity: useAccent ? 0.95 : 0.6
      });
      
      currentBeat += durVal;
      stepCounter++;
      
      if (Math.random() > 0.7) {
        const newString = Math.floor(Math.random() * 4) + 1;
        if (Math.abs(newString - currentString) <= 2) {
          currentString = newString;
        }
      }
    }
    
    // Фолбэк - если нот нет
    if (notes.length === 0) {
      for (let i = 0; i < 8; i++) {
        const beat = i * 0.5;
        if (beat < totalBeats) {
          const idx = i % safeScale.length;
          const note = safeScale[idx] || keyNote;
          const fret = findFretForNote(note, 2, 3, 15);
          notes.push({
            string: 2,
            fret: Math.max(0, Math.min(21, fret)),
            isRest: false,
            beatStart: beat,
            beatDuration: 0.5,
            duration: '8n',
            technique: 'none',
            accent: i % 2 === 0,
            velocity: 0.7
          });
        }
      }
    }
    
    // Финальная нота
    if (notes.length > 0) {
      const lastNote = notes[notes.length - 1];
      const lastChordNotes = chords[bars - 1].notes;
      const resolveNote = lastChordNotes[0] || keyNote;
      const fret = findFretForNote(resolveNote, lastNote.string, startFret - 2, startFret + 5);
      lastNote.fret = Math.max(0, Math.min(21, fret));
      lastNote.technique = 'vibrato';
      lastNote.duration = '2n';
      lastNote.beatDuration = 2;
      lastNote.velocity = 0.9;
      lastNote.accent = true;
    }
    
    return { bars, totalBeats, chords, notes };
  }

  // ============================================================
  // 🔥 ДЛЯ ОСТАЛЬНЫХ РЕЖИМОВ (major, minor, pentatonic, blues, dorian, и т.д.)
  // ============================================================
  
  // Ставит цель: делать «фразу на каждый такт», а не ровный поток.
  // 1) Жёстко ограничиваем длительности (только 8n/16n и их точечные/триплетные).
  // 2) Добавляем контроль длины «фразы» внутри while: небольшие фрагменты чаще сменяются.
  const rhythmStyles = [
    { durations: ['16n', '16n', '8n', '16n'], density: 0.8 },
    { durations: ['16n', '16n.', '16n', '8n'], density: 0.85 },
    { durations: ['8n', '8n', '16n', '8n'], density: 0.7 },
    { durations: ['8n.', '8n', '16n', '8n.'], density: 0.75 },
    { durations: ['8n', '16n', '8n.', '16n', '8n'], density: 0.8 },
    { durations: ['8t', '8t', '16n'], density: 0.75 },
    { durations: ['8n', '16n', '16n.', '8n'], density: 0.85 },
    { durations: ['16n', '8n.', '16n', '8n'], density: 0.8 }
  ];
  
  const selectedStyle = rhythmStyles[Math.floor(Math.random() * rhythmStyles.length)];
  const durPool = selectedStyle.durations;
  
  const phraseSeed = Math.floor(Math.random() * 1000);
  let melodicPatterns: { steps: number[] }[];

  
  if (isPentatonicMode) {
    melodicPatterns = [
      { steps: [0, 2, 4, 7, 9, 7, 4, 2, 0] },
      { steps: [0, 3, 5, 7, 10, 7, 5, 3, 0] },
    ];
  } else {
    melodicPatterns = [
      { steps: [0, 1, 2, 1, 0, -1, -2, -1] },
      { steps: [0, 2, 4, 7, 9, 7, 4, 2] },
      { steps: [0, 1, 3, 5, 6, 5, 3, 1] },
      { steps: [0, 2, 4, 7, 9, 7, 4, 2] },
      { steps: [0, 1, 2, 1, 2, 3, 2, 3] },
      { steps: [0, 5, 2, 7, 4, 9, 5, 2] }
    ];
  }
  
  const selectedMelody = melodicPatterns[(phraseSeed + bars) % melodicPatterns.length];
  let patternIdx = 0;

  const durationMap: Record<string, number> = {
    '4n': 1.0, '4n.': 1.5,
    '8n': 0.5, '8n.': 0.75,
    '16n': 0.25, '16n.': 0.375,
    '8t': 0.333, '16t': 0.167,
    '2n': 2.0
  };

  // 🔥 ФИКС: Гарантируем ноты во всех 4 тактах — генерируем по-тактово
  const minNotesPerBar = 3;
  
  for (let barIdx = 0; barIdx < bars; barIdx++) {
    const barStart = barIdx * beatsPerBar;
    const barEnd = (barIdx + 1) * beatsPerBar;
    const activeChordNotes = chords[barIdx]?.notes || [keyNote];
    
    let barBeat = barStart;
    let notesInBar = 0;
    let maxNotesInBar = 8;
    
    // Генерируем минимум minNotesPerBar нот в каждом такте
    while (barBeat < barEnd - 0.1 && notesInBar < maxNotesInBar) {
      // Если это последний такт и последняя нота — делаем её длинной финальной
      const isLastBar = barIdx === bars - 1;
      const isLastNote = notesInBar >= minNotesPerBar - 1 && barBeat >= barEnd - 1.0;
      
      let durVal: number;
      let durType: string;
      
      if (isLastNote && isLastBar) {
        durVal = Math.min(2.0, barEnd - barBeat);
        durType = '2n';
      } else if (notesInBar < minNotesPerBar || barEnd - barBeat < 0.75) {
        // Нужно больше нот — используем 16n или 8n
        durVal = Math.min(0.5, (barEnd - barBeat) / 2);
        durType = '16n';
      } else {
        const durChoice = durPool[Math.floor(Math.random() * durPool.length)];
        durVal = Math.min(durationMap[durChoice] || 0.5, barEnd - barBeat);
        durType = durChoice;
      }
      
      if (durVal <= 0) break;
      
      // Сильная доля
      const isStrongBeat = (barBeat - barStart) % 1 === 0;
      
      // Выбираем ноту
      let noteStr = '';
      const useChordTone = isStrongBeat && Math.random() > 0.3;
      if (useChordTone) {
        noteStr = activeChordNotes[Math.floor(Math.random() * activeChordNotes.length)];
        const foundIdx = safeScale.indexOf(noteStr);
        if (foundIdx !== -1) lastScaleIdx = foundIdx;
      } else {
        const step = selectedMelody.steps[(patternIdx + barIdx + phraseSeed) % selectedMelody.steps.length];
        patternIdx++;
        
        let finalStep = step;
        const variation = ((phraseSeed + barIdx + notesInBar) % 3) - 1;
        finalStep += variation;
        
        lastScaleIdx = (lastScaleIdx + finalStep + safeScale.length) % safeScale.length;
        noteStr = safeScale[lastScaleIdx];
      }
      
      if (!noteStr) noteStr = keyNote || 'C';
      
      // Находим лад
      let fret = findFretForNote(noteStr, currentString, 0, 21);
      
      if (fret < startFret - 2 || fret > startFret + 5) {
        for (let s = 1; s <= 4; s++) {
          const altFret = findFretForNote(noteStr, s, 0, 19);
          if (altFret >= startFret - 2 && altFret <= startFret + 5) {
            currentString = s;
            fret = altFret;
            break;
          }
        }
      }
      
      // Техника
      let technique: Technique = 'none';
      const techRoll = (barIdx + patternIdx + phraseSeed) % 4;
      if (durVal >= 1.0) {
        technique = techRoll === 0 ? 'vibrato' : 'bend';
      } else if (durVal <= 0.25) {
        technique = techRoll === 2 ? 'hammer' : 'pull';
      }
      
      // Небольшая пауза иногда (но не в начале такта и не если мало нот)
      const canRest = notesInBar >= minNotesPerBar && barBeat - barStart > 0.5;
      if (canRest && Math.random() > 0.92 && notesInBar > 2) {
        notes.push({
          string: 0, fret: null, isRest: true,
          beatStart: barBeat, beatDuration: durVal * 0.5,
          duration: '16n', technique: 'none', velocity: 0, accent: false
        });
        barBeat += durVal * 0.5;
        continue;
      }
      
      notes.push({
        string: currentString,
        fret: Math.max(0, fret),
        isRest: false,
        beatStart: barBeat,
        beatDuration: durVal,
        duration: durType,
        technique: technique,
        accent: isStrongBeat,
        velocity: isStrongBeat ? 0.9 : 0.6
      });
      
      barBeat += durVal;
      notesInBar++;
    }
    
    currentBeat = barEnd; // синхронизируем для следующего такта
  }

  // ФИНАЛ — разрешение в тонику последнего аккорда
  if (notes.length > 0) {
    const lastNote = notes[notes.length - 1];
    if (!lastNote.isRest) {
      const resolveNote = chords[bars - 1].notes[0] || keyNote;
      const fret = findFretForNote(resolveNote, lastNote.string, startFret - 2, startFret + 5);
      lastNote.fret = Math.max(0, Math.min(21, fret));
      lastNote.technique = 'vibrato';
      lastNote.duration = '2n';
      lastNote.beatDuration = 2;
      lastNote.velocity = 0.9;
      lastNote.accent = true;
    }
  }

  return { bars, totalBeats, chords, notes };
};