export type VideoPlatform = 'youtube' | 'rutube' | 'vk';

export interface TrackInfo {
  platform: VideoPlatform;
  id: string;
  title: string;
}

export interface AIResponse {
  text: string;
  action?: {
    type: 'SET_CONTEXT';
    payload: {
      key?: string;
      mode?: any;
      bpm?: number;
      track?: TrackInfo;
    };
  };
}

// --- Типы для генератора табов ---
export type Technique = 'none' | 'hammer' | 'pull' | 'slide' | 'vibrato' | 'bend';

export interface TabNote {
  string: number; // 0 (e) to 5 (E)
  fret: number;
  duration: 'quarter' | 'eighth' | 'sixteenth';
  technique: Technique;
  tiedToNext?: boolean;
}

export interface Lick {
  name: string;
  notes: TabNote[];
}

// Эмулятор текстовых запросов (наш мозг)
export const processAIQuery = async (query: string): Promise<AIResponse> => {
  const lowerQuery = query.toLowerCase();

  // Имитация задержки сети для реалистичности
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (lowerQuery.includes('ля минор') || lowerQuery.includes('a minor') || lowerQuery.includes('блюз')) {
    return {
      text: "Отличный выбор! Я переключил тональность в Ля-минор (A Aeolian) и нашел классический блюзовый джем. Обрати внимание на пентатонику в 5-й позиции!",
      action: {
        type: 'SET_CONTEXT',
        payload: {
          key: 'A',
          mode: 'aeolian',
          bpm: 90,
          track: { platform: 'youtube', id: '3W1A142r-yE', title: 'Slow Blues Backing Track in A Minor' }
        }
      }
    };
  }

  if (lowerQuery.includes('фанк') || lowerQuery.includes('до') || lowerQuery.includes('c ')) {
    return {
      text: "Фанк в До-дорийском ладу (C Dorian) — это классика грува. Я подгрузил мощный минус и настроил гриф.",
      action: {
        type: 'SET_CONTEXT',
        payload: {
          key: 'C',
          mode: 'dorian',
          bpm: 110,
          track: { platform: 'youtube', id: 'X5X1i5H9m2s', title: 'C Dorian Funk Jam' }
        }
      }
    };
  }

  return {
    text: "Я пока в режиме обучения и понимаю только команды вроде 'блюз в ля миноре' или 'фанк в до'. В будущем я буду подключен к полноценной нейросети!"
  };
};

// --- ИНТЕРАКТИВНЫЙ AI-ГЕНЕРАТОР ТАБОВ ---
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STANDARD_TUNING = ['E', 'B', 'G', 'D', 'A', 'E']; // от 1-й к 6-й

// Функция поиска лада для ноты вокруг целевой позиции (например, 5-7 лад)
const findFretForNote = (targetNote: string, targetStringIdx: number, basePosition: number = 5): number => {
  const openNote = STANDARD_TUNING[targetStringIdx];
  const openIndex = ALL_NOTES.indexOf(openNote);
  const targetIndex = ALL_NOTES.indexOf(targetNote);
  
  let distance = (targetIndex - openIndex + 12) % 12;
  // Ищем лад в нужной октаве, чтобы было удобно играть
  if (distance < basePosition - 2) distance += 12;
  if (distance > basePosition + 5) distance -= 12;
  
  return Math.abs(distance);
};

export const generateSmartLick = (scaleNotes: string[], keyNote: string, mode: string): Lick => {
  const notes: TabNote[] = [];
  const phraseLength = Math.floor(Math.random() * 3) + 6; // 6-8 нот в фразе
  
  // Выбираем стартовую позицию на грифе случайным образом (позиция 5 или 7)
  const basePosition = Math.random() > 0.5 ? 5 : 7;
  let currentString = Math.floor(Math.random() * 2) + 2; // Начнем с 3-й (G) или 4-й (D) струны
  
  for (let i = 0; i < phraseLength; i++) {
    // 1. Выбираем случайную ноту из текущей гаммы
    const randomNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
    
    // 2. Ищем для нее удобный лад на текущей или соседней струне
    const fret = findFretForNote(randomNote, currentString, basePosition);
    
    // 3. 🔥 ИСПРАВЛЕНО: Изменено с const на let для возможности переназначать длительность ноты
    let durationObj: 'quarter' | 'eighth' | 'sixteenth' = Math.random() > 0.6 ? 'eighth' : 'sixteenth';
    
    // 4. Добавляем "гитарную физику" (слайды и легато)
    let technique: Technique = 'none';
    let tiedToNext = false;
    
    if (i < phraseLength - 1 && Math.random() > 0.7) {
       technique = Math.random() > 0.5 ? 'hammer' : 'slide';
       tiedToNext = true;
    }
    
    // Последняя нота часто играется с вибрато и тянется дольше
    if (i === phraseLength - 1) {
       technique = 'vibrato';
       durationObj = 'quarter';
    }

    notes.push({
      string: currentString,
      fret: fret,
      duration: durationObj,
      technique,
      tiedToNext
    });
    
    // Слегка смещаемся по струнам вверх или вниз (чтобы соло звучало натурально)
    if (Math.random() > 0.6) {
       currentString += Math.random() > 0.5 ? 1 : -1;
       if (currentString > 5) currentString = 5;
       if (currentString < 0) currentString = 0;
    }
  }

  return {
    name: `AI Generated ${keyNote} ${mode} Lick`,
    notes
  };
};