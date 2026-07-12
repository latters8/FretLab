export type VideoPlatform = 'youtube' | 'rutube' | 'vk';

export interface TrackInfo {
  platform: VideoPlatform;
  id: string;
  title: string;
}

export type AIActionType = 'SET_CONTEXT' | 'OPEN_CHORD' | 'OPEN_TAB_GEN' | 'OPEN_AUTOTAB';

export interface AIResponse {
  text: string;
  action?: {
    type: AIActionType;
    payload?: any;
  };
}

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

// 🔥 УМНЫЙ АВТОНОМНЫЙ МЕДИА-МАРШРУТИЗАТОР TOUCHGRASS
export const processAIQuery = async (query: string): Promise<AIResponse> => {
  const lowerQuery = query.toLowerCase();
  
  // Имитируем глубокий анализ музыкального запроса
  await new Promise((resolve) => setTimeout(resolve, 700));

  // 1. Поиск и загрузка рок-минусовок через TouchGrass
  if (lowerQuery.includes('рок') || lowerQuery.includes('rock') || lowerQuery.includes('метал')) {
    return {
      text: "TouchGrass 🎵: Рок-драйв активирован! Я подключился к YouTube и загрузил мощный Heavy Rock Backing Track в тональности Ля-минор (A Minor). Скорость — 120 BPM, гриф перестроен под скоростные проходы!",
      action: {
        type: 'SET_CONTEXT',
        payload: {
          key: 'A',
          mode: 'aeolian',
          bpm: 120,
          track: { platform: 'youtube', id: '8KpPab_M4t4', title: 'Heavy Rock Groove Backing Track' }
        }
      }
    };
  }

  // 2. Поиск и загрузка нео-соул / джаз минусовок
  if (lowerQuery.includes('соул') || lowerQuery.includes('soul') || lowerQuery.includes('джаз') || lowerQuery.includes('jazz')) {
    return {
      text: "TouchGrass 🎵: Настраиваюсь на мягкую волну. Загружаю Smooth Neo-Soul / Jazz Jam в тональности Соль-мажор (G Major). Темп снижен до комфортных 90 BPM для проработки красивых джазовых ступеней.",
      action: {
        type: 'SET_CONTEXT',
        payload: {
          key: 'G',
          mode: 'major',
          bpm: 90,
          track: { platform: 'youtube', id: '8KpPab_M4t4', title: 'Smooth Neo-Soul / Jazz Backing Track' }
        }
      }
    };
  }

  // 3. Стандартный поиск фанка
  if (lowerQuery.includes('фанк') || lowerQuery.includes('funk') || lowerQuery.includes('до')) {
    return {
      text: "TouchGrass 🎵: Закачиваем плотный фанковый грув! Включаю C Dorian Funk Power Groove на 110 BPM. Обрати внимание на дорийский лад на грифе!",
      action: {
        type: 'SET_CONTEXT',
        payload: {
          key: 'C',
          mode: 'dorian',
          bpm: 110,
          track: { platform: 'youtube', id: 'X5X1i5H9m2s', title: 'C Dorian Funk Power Groove' }
        }
      }
    };
  }

  // 4. Стандартный поиск блюза
  if (lowerQuery.includes('блюз') || lowerQuery.includes('blues') || lowerQuery.includes('ля минор')) {
    return {
      text: "TouchGrass 🎵: Ламповый вечерний вайб. Загружаю Slow Blues Midnight Jam в Ля-миноре (80 BPM). Включай овердрайв, время для блюзовой пентатоники.",
      action: {
        type: 'SET_CONTEXT',
        payload: {
          key: 'A',
          mode: 'aeolian',
          bpm: 80,
          track: { platform: 'youtube', id: '3W1A142r-yE', title: 'Slow Blues Midnight Jam' }
        }
      }
    };
  }

  // 5. Запрос на открытие AutoTab модулей
  if (lowerQuery.includes('транскриб') || lowerQuery.includes(' songsterr') || lowerQuery.includes('автотаб')) {
    return {
      text: "TouchGrass 🎵: Понял задачу! Переключаю тебя в модуль полной транскрипции AutoTab. Загружай трек, и нейросеть разберет его по нотам.",
      action: { type: 'OPEN_AUTOTAB', payload: {} }
    };
  }

  // 6. Запрос на поиск аккордов
  if (lowerQuery.includes('аккорд') || lowerQuery.includes('chord')) {
    const match = query.match(/([A-G][b#]?(?:m|maj|dim|aug)?(?:2|4|5|6|7|9|11|13)?)/i);
    const targetChord = match ? match[0] : 'Cmaj7';
    return {
      text: `TouchGrass 🎵: Ищу аккорд ${targetChord} в базе данных. Перевожу интерфейс в интерактивный Справочник!`,
      action: { type: 'OPEN_CHORD', payload: { chord: targetChord } }
    };
  }

  // Fallback эмпатии (Фрустрация)
  if (lowerQuery.includes('сложно') || lowerQuery.includes('болит') || lowerQuery.includes('бесит')) {
    return {
      text: "TouchGrass 🎵: Так, выдыхаем! Отложи гитару на пару минут. Я сбросил темп метронома до спокойных 70 BPM и включил легкий минус, чтобы ты мог расслабиться.",
      action: {
        type: 'SET_CONTEXT',
        payload: { key: 'A', mode: 'aeolian', bpm: 70, track: { platform: 'youtube', id: '3W1A142r-yE', title: 'Relaxed Practice Track' } }
      }
    };
  }

  return {
    text: "TouchGrass 🎵: Привет! Я твой медиа-проводник. Напиши мне, например: 'найди рок минус на youtube', 'включи джаз' или 'покажи аккорд Dm9' — и я полностью перестрою плеер и гриф под твой запрос!"
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