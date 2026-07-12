export type VideoPlatform = 'youtube' | 'rutube' | 'vk';

export interface TrackInfo {
  platform: VideoPlatform;
  id: string;
  title: string;
}

// 🔥 Расширяем возможности TouchGrass: он умеет открывать окна
export type AIActionType = 'SET_CONTEXT' | 'OPEN_CHORD' | 'OPEN_TAB_GEN' | 'OPEN_AUTOTAB';

export interface AIResponse {
  text: string;
  action?: {
    type: AIActionType;
    payload?: any;
  };
}

// --- Типы для генератора табов ---
export type Technique = 'none' | 'hammer' | 'pull' | 'slide' | 'vibrato' | 'bend';

export interface TabNote {
  string: number; 
  fret: number;
  duration: 'quarter' | 'eighth' | 'sixteenth';
  technique: Technique;
  tiedToNext?: boolean;
}

export interface Lick {
  name: string;
  notes: TabNote[];
}

// 🔥 ПОЛНОСТЬЮ АВТОНОМНЫЙ TOUCHGRASS (Без API ключей)
export const processAIQuery = async (query: string): Promise<AIResponse> => {
  const lowerQuery = query.toLowerCase();
  
  // Имитация "думания" нейросети
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 1. Команды транскрипции треков (AutoTab)
  if (lowerQuery.includes('минусовк') || lowerQuery.includes('транскриб') || lowerQuery.includes('youtube')) {
    return {
      text: "TouchGrass 🎵: Отличная идея! Я открыл для тебя модуль AutoTab. Просто закинь туда аудиофайл или вставь ссылку, и ИИ разберет его на табы!",
      action: { type: 'OPEN_AUTOTAB', payload: {} }
    };
  }

  // 2. Команды поиска аккордов
  if (lowerQuery.includes('аккорд') || lowerQuery.includes('chord') || lowerQuery.match(/[a-g]#?m?(maj)?7?(b5)?(#9)?/)) {
    // Пытаемся выцепить название аккорда из текста
    const match = query.match(/([A-G][b#]?(?:m|maj|dim|aug)?(?:2|4|5|6|7|9|11|13)?(?:sus2|sus4)?(?:[b#]5|[b#]9|[b#]11)?)/i);
    const targetChord = match ? match[0] : 'Cmaj7';
    
    return {
      text: `TouchGrass 🎵: Без проблем! Я нашел аппликатуру для ${targetChord}. Открываю интерактивный Справочник, чтобы ты мог послушать и посмотреть сетку!`,
      action: { type: 'OPEN_CHORD', payload: { chord: targetChord } }
    };
  }

  // 3. Команды генерации фраз (Licks)
  if (lowerQuery.includes('соло') || lowerQuery.includes('таб') || lowerQuery.includes('lick')) {
    return {
      text: "TouchGrass 🎵: С удовольствием! Я активировал генератор фраз под грифом. Выбери тональность, и я создам для тебя вкусный лик с легато и слайдами.",
      action: { type: 'OPEN_TAB_GEN', payload: {} }
    };
  }

  // 4. Детектор фрустрации (Эмпатия)
  if (lowerQuery.includes('сложно') || lowerQuery.includes('болит') || lowerQuery.includes('бесит') || lowerQuery.includes('не получается')) {
    return {
      text: "TouchGrass 🎵: Эй, притормози! Пальцы горят, а аккорды кажутся стеной? Это абсолютно нормально. Каждый крутой гитарист проходил через это. Давай сделаем глубокий вдох, расслабим кисти и снизим темп до 70 BPM в простом Ля-миноре.",
      action: { type: 'SET_CONTEXT', payload: { key: 'A', mode: 'aeolian', bpm: 70 } }
    };
  }

  // 5. Базовый Fallback
  return {
    text: "TouchGrass 🎵: Привет! Я встроенный ИИ-помощник. Скажи мне 'покажи аккорд F#m7', 'сочини соло', или загрузи трек для транскрипции в табы!"
  };
};

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STANDARD_TUNING = ['E', 'B', 'G', 'D', 'A', 'E'];

const findFretForNote = (targetNote: string, targetStringIdx: number, basePosition: number = 5): number => {
  const openNote = STANDARD_TUNING[targetStringIdx];
  const openIndex = ALL_NOTES.indexOf(openNote);
  const targetIndex = ALL_NOTES.indexOf(targetNote);
  let distance = (targetIndex - openIndex + 12) % 12;
  if (distance < basePosition - 2) distance += 12;
  if (distance > basePosition + 5) distance -= 12;
  return Math.abs(distance);
};

export const generateSmartLick = (scaleNotes: string[], keyNote: string, mode: string): Lick => {
  const notes: TabNote[] = [];
  const phraseLength = Math.floor(Math.random() * 3) + 6; 
  const basePosition = Math.random() > 0.5 ? 5 : 7;
  let currentString = Math.floor(Math.random() * 2) + 2; 
  
  for (let i = 0; i < phraseLength; i++) {
    const randomNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
    const fret = findFretForNote(randomNote, currentString, basePosition);
    let durationObj: 'quarter' | 'eighth' | 'sixteenth' = Math.random() > 0.6 ? 'eighth' : 'sixteenth';
    let technique: Technique = 'none';
    let tiedToNext = false;
    
    if (i < phraseLength - 1 && Math.random() > 0.7) {
       technique = Math.random() > 0.5 ? 'hammer' : 'slide';
       tiedToNext = true;
    }
    if (i === phraseLength - 1) {
       technique = 'vibrato';
       durationObj = 'quarter';
    }
    notes.push({ string: currentString, fret: fret, duration: durationObj, technique, tiedToNext });
    if (Math.random() > 0.6) {
       currentString += Math.random() > 0.5 ? 1 : -1;
       if (currentString > 5) currentString = 5;
       if (currentString < 0) currentString = 0;
    }
  }
  return { name: `AI Generated ${keyNote} ${mode} Lick`, notes };
};