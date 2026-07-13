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

  // ============================================================
  // 1. ОБЫГРЫВАНИЕ АККОРДОВ (play over / arpeggio)
  // ============================================================
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

  // ============================================================
  // 2. ПОИСК МИНУСОВКИ (backing / jam / track) 
  // ============================================================
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

  // ============================================================
  // 3. ПОКАЗ АККОРДА (show / chord)
  // ============================================================
  const chordMatch = query.match(/\b([A-G][b#]?(?:maj7|m7|m9|m11|maj9|7|9|11|13|m|dim|aug|sus4|sus2)?)\b/i);
  
  if (chordMatch && (lowerQuery.includes('chord') || lowerQuery.includes('show') || lowerQuery.includes('покажи') || lowerQuery.includes('аккорд'))) {
    const chordName = chordMatch[1];
    return {
      text: `📖 Нашел! Открываю подробный разбор аккорда ${chordName} в словаре.`,
      action: { type: 'OPEN_CHORD', payload: { chord: chordName } }
    };
  }

  // ============================================================
  // 4. ГЕНЕРАЦИЯ ФРАЗ (lick / solo / таб)
  // ============================================================
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

  // ============================================================
  // 5. УТОЧНЯЮЩИЙ ЗАПРОС (Просто аккорд)
  // ============================================================
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

  // ============================================================
  // 6. ДЕФОЛТНЫЙ ОТВЕТ
  // ============================================================
  return {
    text: "🤖 Привет! Я TouchGrass AI — ваш музыкальный ассистент!\n\n" +
          "🎸 Что я умею:\n" +
          "• Находить минусовки: *«Найди блюз минус в Am»*\n" +
          "• Показывать аккорды: *«Покажи Cmaj7»*\n" +
          "• Подсвечивать лады: *«Как обыграть E7?»*\n" +
          "• Генерировать табы: *«Придумай фразу в Dorian»*"
  };
};

// ============================================================
// 🎸 АЛГОРИТМЫ ГЕНЕРАЦИИ МЕЛОДИЧНЫХ ФРАЗ
// ============================================================

export type Technique = 
  | 'none' 
  | 'hammer' 
  | 'pull' 
  | 'slide' 
  | 'vibrato' 
  | 'bend' 
  | 'prebend'
  | 'unison_bend'
  | 'grace'
  | 'fall'
  | 'ghost' 
  | 'choke';

export interface LickNote {
  string: number;
  fret: number | null;
  duration?: string; // 🔥 ИСПРАВЛЕНО НА СОВМЕСТИМЫЙ ФОРМАТ ('8n', '4n' и т.д.)
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

const findFretForNote = (targetNote: string, targetStringIdx: number, minFret: number = 0, maxFret: number = 21): number => {
  const openNote = STANDARD_TUNING[targetStringIdx];
  let baseDistance = (ALL_NOTES.indexOf(targetNote) - ALL_NOTES.indexOf(openNote) + 12) % 12;
  
  let bestFret = baseDistance;
  let bestDistance = Math.abs(baseDistance - 5);
  
  for (let octave = -1; octave <= 1; octave++) {
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

type PhrasePattern = {
  name: string;
  intervals: number[]; // 🔥 Теперь это ступени лада (0=тоника, 1=вторая нота лада и т.д.)
  durations: string[]; // 🔥 Формат Tone.js ('4n', '8n')
  techniques: Technique[];
  accentPositions: number[];
  legatoGroups?: { start: number; end: number; type: 'hammer' | 'pull' }[];
};

const GUITAR_PHRASES: PhrasePattern[] = [
  {
    name: 'Classic Blues Lick',
    intervals: [0, 1, 2, 1, 0, 2, 3, 0],
    durations: ['4n', '8n', '4n', '8n', '4n', '8n', '4n', '2n'],
    techniques: ['none', 'none', 'vibrato', 'none', 'none', 'slide', 'vibrato', 'none'],
    accentPositions: [0, 2, 4, 7],
    legatoGroups: []
  },
  {
    name: 'Flowing Legato',
    intervals: [0, 1, 2, 3, 2, 1, 0, 2],
    durations: ['4n', '8n', '8n', '4n', '8n', '8n', '8n', '2n'],
    techniques: ['none', 'none', 'hammer', 'vibrato', 'none', 'pull', 'none', 'vibrato'],
    accentPositions: [0, 3, 7],
    legatoGroups: [
      { start: 2, end: 3, type: 'hammer' },
      { start: 5, end: 6, type: 'pull' }
    ]
  },
  {
    name: 'Syncopated Groove',
    intervals: [0, 2, 1, 0, 3, 2, 0, 0],
    durations: ['8n', '8n', '4n', '8n', '8n', '4n', '8n', '2n'],
    techniques: ['none', 'slide', 'none', 'none', 'bend', 'none', 'none', 'vibrato'],
    accentPositions: [1, 2, 4, 7],
    legatoGroups: []
  },
  {
    name: 'Fast Run',
    intervals: [0, 1, 2, 3, 4, 3, 2, 0],
    durations: ['16n', '16n', '16n', '16n', '8n', '8n', '4n', '2n'],
    techniques: ['none', 'hammer', 'hammer', 'none', 'slide', 'none', 'none', 'vibrato'],
    accentPositions: [0, 4, 6],
    legatoGroups: [
      { start: 0, end: 2, type: 'hammer' }
    ]
  }
];

export const generateSmartLick = (
  scaleNotes: string[], 
  keyNote: string, 
  mode: string,
  bpm: number = 120
): Lick => {
  // Страховка от пустых гамм
  const safeScaleNotes = (scaleNotes && scaleNotes.length > 0) ? scaleNotes : ['C', 'D', 'E', 'G', 'A'];
  
  const pattern = GUITAR_PHRASES[Math.floor(Math.random() * GUITAR_PHRASES.length)];
  const startFret = Math.floor(Math.random() * 5) + 3;
  let currentString = Math.floor(Math.random() * 3) + 2;
  
  // 🔥 Чтобы фразы не звучали одинаково, смещаем начало на случайную ступень гаммы
  const degreeOffset = Math.floor(Math.random() * safeScaleNotes.length);
  
  const notes: LickNote[] = [];
  let legatoGroupId = 0;
  
  for (let i = 0; i < pattern.intervals.length; i++) {
    // 🔥 Берем ноту строго по паттерну, но с учетом смещения
    const degree = pattern.intervals[i];
    const noteIndex = (degree + degreeOffset) % safeScaleNotes.length;
    const selectedNote = safeScaleNotes[noteIndex];
    
    let fret = findFretForNote(selectedNote, currentString, 0, 21);
    
    // Ищем удобный лад в позиции (чтобы не прыгать по грифу)
    if (fret < startFret - 3 || fret > startFret + 5) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const altString = Math.floor(Math.random() * 4) + 1;
        const altFret = findFretForNote(selectedNote, altString, 0, 18);
        if (altFret >= startFret - 2 && altFret <= startFret + 4) {
          currentString = altString;
          fret = altFret;
          break;
        }
      }
    }
    
    const duration = pattern.durations[i]; // Теперь это '8n', '4n' и плеер их отлично поймет!
    let technique = pattern.techniques[i] || 'none';
    
    let isLegatoEnd = false;
    let legatoGroup = undefined;
    
    if (pattern.legatoGroups) {
      for (const group of pattern.legatoGroups) {
        if (i >= group.start && i <= group.end) {
          legatoGroup = group;
          technique = i === group.start ? 'none' : group.type;
          if (i === group.end) isLegatoEnd = true;
          break;
        }
      }
    }
    
    const isAccent = pattern.accentPositions.includes(i);
    let velocity = isAccent ? 0.7 + Math.random() * 0.3 : 0.4 + Math.random() * 0.3;
    if (technique === 'hammer' || technique === 'pull') velocity *= 0.7;
    
    const tiedToNext = (i < pattern.intervals.length - 1 && 
                        Math.random() < 0.15 && 
                        notes.length > 0 && 
                        notes[notes.length - 1]?.string === currentString);
    
    notes.push({
      string: currentString,
      fret: Math.max(0, Math.min(24, fret)),
      duration,
      technique,
      tiedToNext,
      velocity,
      accent: isAccent,
      durationFactor: 0.9 + Math.random() * 0.2,
      legatoGroup: legatoGroup ? legatoGroupId : undefined,
      isLegatoEnd
    });
    
    if (legatoGroup && i === legatoGroup.end) legatoGroupId++;
  }
  
  const modeName = mode.replace(/_/g, ' ');
  const legatoLabel = pattern.legatoGroups && pattern.legatoGroups.length > 0 ? ' (Legato)' : '';
  
  return {
    id: `lick-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: `${pattern.name} ${keyNote} ${modeName}${legatoLabel}`,
    notes,
    tempo: bpm,
    swing: Math.random() * 0.2 + 0.05
  };
};