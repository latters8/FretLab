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
// 🔥 ГЕНЕРАТОР СОЛО ДЛЯ SOLOGENERATOR (С ПОДДЕРЖКОЙ ВСЕХ РЕЖИМОВ)
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
  
  // Формируем аккорды с проверкой нот
  const chords: SyncChord[] = [];
  
  for (let i = 0; i < bars; i++) {
    const chordObj = progressionChords[i % progressionChords.length];
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
  let consecutiveNotes = 0;

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
  
  // Соло сейчас иногда получает много «длинных» длительностей (4n/2n).
  // Пересобираем пул стилей так, чтобы чаще получались короткие 8n/16n.
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
  
  const selectedMelody = melodicPatterns[Math.floor(Math.random() * melodicPatterns.length)];
  let patternIdx = 0;

  const durationMap: Record<string, number> = {
    '4n': 1.0, '4n.': 1.5,
    '8n': 0.5, '8n.': 0.75,
    '16n': 0.25, '16n.': 0.375,
    '8t': 0.333, '16t': 0.167,
    '2n': 2.0
  };

  let maxSteps = totalBeats * 4;
  let steps = 0;

  while (currentBeat < totalBeats && steps < maxSteps) {
    if (currentBeat > totalBeats - 0.25) break;

    let durVal = 0.5;
    let durType = '8n';
    
    const durChoice = durPool[Math.floor(Math.random() * durPool.length)];
    durVal = durationMap[durChoice] || 0.5;
    durType = durChoice;
    
    // Режем вероятность «удлинения» в 4n, чтобы соло звучало более мелодично (меньше длинных нот).
    if (consecutiveNotes > 6 && Math.random() > 0.85) {
      durVal = 1.0;
      durType = '4n';
      consecutiveNotes = 0;
    }
    
    if (Math.random() > 0.92 && consecutiveNotes > 3) {
      notes.push({
        string: 0, fret: null, isRest: true,
        beatStart: currentBeat, beatDuration: durVal,
        duration: durType, technique: 'none', velocity: 0, accent: false
      });
      currentBeat += durVal;
      consecutiveNotes = 0;
      steps++;
      continue;
    }

    if (currentBeat + durVal > totalBeats) break;

    const isStrongBeat = currentBeat % 1 === 0 || currentBeat % 1 === 0.5;
    const currentBarIndex = Math.floor(currentBeat / beatsPerBar);
    const activeChordNotes = chords[currentBarIndex]?.notes || [keyNote];

    let noteStr = '';
    
    if (isStrongBeat && Math.random() > 0.5) {
      noteStr = activeChordNotes[Math.floor(Math.random() * activeChordNotes.length)];
      const foundIdx = safeScale.indexOf(noteStr);
      if (foundIdx !== -1) lastScaleIdx = foundIdx;
    } else {
      const step = selectedMelody.steps[patternIdx % selectedMelody.steps.length];
      patternIdx++;
      
      let finalStep = step;
      if (Math.random() > 0.8) {
        finalStep += (Math.random() > 0.5 ? 1 : -1);
      }
      
      lastScaleIdx = (lastScaleIdx + finalStep + safeScale.length) % safeScale.length;
      noteStr = safeScale[lastScaleIdx];
    }

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

    let technique: Technique = 'none';
    if (durVal >= 1.0) {
      technique = Math.random() > 0.5 ? 'vibrato' : 'bend';
    } else if (durVal <= 0.25) {
      technique = Math.random() > 0.5 ? 'hammer' : 'pull';
    } else if (durVal === 0.333 || durVal === 0.167) {
      technique = Math.random() > 0.6 ? 'hammer' : 'pull';
    } else if (durVal === 0.75 || durVal === 0.5) {
      technique = Math.random() > 0.8 ? 'slide' : 'none';
    }

    notes.push({
      string: currentString,
      fret: Math.max(0, fret),
      isRest: false,
      beatStart: currentBeat,
      beatDuration: durVal,
      duration: durType,
      technique: technique,
      accent: isStrongBeat,
      velocity: isStrongBeat ? 0.9 : 0.6
    });

    currentBeat += durVal;
    consecutiveNotes++;
    steps++;
  }

  // ФИНАЛ
  if (notes.length > 0) {
    const lastNote = notes[notes.length - 1];
    if (!lastNote.isRest) {
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
  }

  // Если нот слишком мало
  if (notes.length < 4) {
    const rootNote = keyNote || 'C';
    for (let i = 0; i < 8; i++) {
      const beat = i * 0.5;
      if (beat < totalBeats) {
        const fret = findFretForNote(rootNote, 2, 3, 15);
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

  return { bars, totalBeats, chords, notes };
};