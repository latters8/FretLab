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

type PhrasePattern = {
  name: string;
  intervals: number[]; 
  durations: string[]; 
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
    accentPositions: [0, 2, 4, 7]
  },
  {
    name: 'Syncopated Groove',
    intervals: [0, 2, 1, 0, 3, 2, 0, 0],
    durations: ['8n', '8n', '4n', '8n', '8n', '4n', '8n', '2n'],
    techniques: ['none', 'slide', 'none', 'none', 'bend', 'none', 'none', 'vibrato'],
    accentPositions: [1, 2, 4, 7]
  }
];

export const generateSmartLick = (
  scaleNotes: string[], 
  keyNote: string, 
  mode: string,
  bpm: number = 120,
  ..._extraArgs: any[]
): Lick => {
  const safeScaleNotes = (scaleNotes && scaleNotes.length > 0) ? scaleNotes : ['C', 'D', 'E', 'G', 'A'];
  const pattern = GUITAR_PHRASES[Math.floor(Math.random() * GUITAR_PHRASES.length)];
  const startFret = Math.floor(Math.random() * 5) + 3;
  let currentString = Math.floor(Math.random() * 3) + 2;
  
  const notes: LickNote[] = [];
  
  for (let i = 0; i < pattern.intervals.length; i++) {
    const degree = pattern.intervals[i];
    const noteIndex = degree % safeScaleNotes.length;
    const selectedNote = safeScaleNotes[noteIndex];
    
    let fret = findFretForNote(selectedNote, currentString, 0, 21);
    
    if (fret < startFret - 3 || fret > startFret + 5) {
      for (let s = 1; s <= 4; s++) {
        const altFret = findFretForNote(selectedNote, s, 0, 18);
        if (altFret >= startFret - 2 && altFret <= startFret + 4) {
          currentString = s; fret = altFret; break;
        }
      }
    }
    
    const isAccent = pattern.accentPositions.includes(i);
    notes.push({
      string: currentString,
      fret: Math.max(0, fret),
      duration: pattern.durations[i],
      technique: pattern.techniques[i] || 'none',
      tiedToNext: false,
      velocity: isAccent ? 0.9 : 0.6,
      accent: isAccent,
      durationFactor: 1
    });
  }
  
  return {
    id: `lick-${Date.now()}`,
    name: `${pattern.name} ${keyNote} ${mode.replace(/_/g, ' ')}`,
    notes, tempo: bpm
  };
};

// ============================================================
// 🎸 АЛГОРИТМ 2: 4-ТАКТНОЕ СОЛО (ДЛЯ SOLOGENERATOR.TSX)
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

// 🔥 ИСПРАВЛЕНО: Теперь генератор принимает массив аккордов (прогрессию), а не один аккорд-заглушку
export const generateSynchronizedSolo = (
  scaleNotes: string[],
  keyNote: string,
  _mode: string,
  timeSignature: { beats: number; noteValue: number },
  progressionChords: { name: string; notes: string[] }[], // Массив из 4 аккордов
  _forceAllChords: boolean
): SyncSoloData => {
  const bars = 4;
  const beatsPerBar = timeSignature.beats;
  const totalBeats = bars * beatsPerBar;
  
  const chords: SyncChord[] = [];
  
  // Распределяем переданные аккорды по 4 тактам
  for (let i = 0; i < bars; i++) {
    const chordObj = progressionChords[i % progressionChords.length]; // Если передали меньше 4, зациклим
    chords.push({
      name: chordObj.name,
      notes: chordObj.notes,
      beatStart: i * beatsPerBar,
      durationBeats: beatsPerBar
    });
  }

  const notes: SyncNote[] = [];
  let currentBeat = 0;
  
  const safeScale = scaleNotes && scaleNotes.length > 0 ? scaleNotes : ['C', 'D', 'E', 'G', 'A'];
  let currentString = 2; 
  const startFret = Math.floor(Math.random() * 5) + 3; 

  while (currentBeat < totalBeats) {
    if (currentBeat > totalBeats - 0.5) break;

    const durOpts = [
      { val: 0.25, type: '16n' },
      { val: 0.5, type: '8n' },
      { val: 0.5, type: '8n' },
      { val: 1.0, type: '4n' }
    ];
    const dur = durOpts[Math.floor(Math.random() * durOpts.length)];
    if (currentBeat + dur.val > totalBeats) break;

    if (currentBeat % 1 !== 0 && Math.random() < 0.15) {
      notes.push({
        string: 0, fret: null, isRest: true,
        beatStart: currentBeat, beatDuration: dur.val, duration: dur.type, technique: 'none'
      });
    } else {
      let noteStr = safeScale[Math.floor(Math.random() * safeScale.length)];
      const isStrongBeat = currentBeat % 1 === 0;
      
      // Определяем, в каком такте мы находимся, чтобы взять ноты ТЕКУЩЕГО аккорда
      const currentBarIndex = Math.floor(currentBeat / beatsPerBar);
      const activeChord = chords[currentBarIndex];
      const activeChordNotes = activeChord.notes;

      if (currentBeat === 0) {
        // Первая нота всего соло - тоника первого аккорда прогрессии
        noteStr = activeChordNotes[0] || keyNote; 
      } else if (isStrongBeat && activeChordNotes.length > 0 && Math.random() > 0.2) {
        // На сильную долю (1, 2, 3, 4) почти всегда играем ноту текущего диатонического аккорда
        noteStr = activeChordNotes[Math.floor(Math.random() * activeChordNotes.length)];
      }

      let fret = findFretForNote(noteStr, currentString, 0, 21);
      
      if (fret < startFret - 2 || fret > startFret + 5) {
        for (let s = 1; s <= 4; s++) {
          const altFret = findFretForNote(noteStr, s, 0, 19);
          if (altFret >= startFret - 2 && altFret <= startFret + 5) {
            currentString = s; fret = altFret; break;
          }
        }
      }

      notes.push({
        string: currentString,
        fret: Math.max(0, fret),
        isRest: false,
        beatStart: currentBeat,
        beatDuration: dur.val,
        duration: dur.type,
        technique: dur.val >= 1.0 ? 'vibrato' : 'none',
        accent: isStrongBeat,
        velocity: isStrongBeat ? 0.9 : 0.6
      });
    }
    currentBeat += dur.val;
  }

  // Концовка
  if (notes.length > 0) {
     const lastNote = notes[notes.length - 1];
     if (!lastNote.isRest) {
        const lastChordNotes = chords[bars - 1].notes;
        const resolveNote = lastChordNotes[0] || keyNote; // Разрешаемся в тонику последнего аккорда
        lastNote.fret = findFretForNote(resolveNote, lastNote.string, startFret - 2, startFret + 5);
        lastNote.technique = 'vibrato';
        lastNote.duration = '2n';
        lastNote.beatDuration = 2;
     }
  }

  return { bars, totalBeats, chords, notes };
};