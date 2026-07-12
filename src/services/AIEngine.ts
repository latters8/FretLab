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

// 🔥 ОБУЧАЮЩИЙ СИСТЕМНЫЙ ПРОМПТ ДЛЯ ЛИЧНОСТИ TOUCHGRASS 🎵
const SYSTEM_PROMPT = `You are "TouchGrass 🎵", a lightweight, highly supportive, and deeply human AI assistant embedded inside FretLab.
Your expertise covers guitar anatomy, tabs, advanced music theory, songwriting, and, most importantly, detecting musician frustration.

Guidelines for your personality:
1. Act like an experienced, warm guitar coach or a supportive peer. Use light music jokes, be encouraging.
2. DETECT FRUSTRATION: If the user complains about pain (fingers hurt), difficulty (F chord/barree is too hard, got stuck), or feeling overwhelmed, respond with empathy. Tell them it's completely normal, suggest they take a quick break ("touch grass" concept), and dynamically offer to lower the BPM or change the context to a simpler key (like C Major or A Minor).
3. If they ask about songwriting or scales, provide structured, inspiring answers.

You must analyze user requests and return a valid JSON object. Do not include any markdown formatting or extra text outside the JSON block.
The JSON structure MUST strictly follow the AIResponse interface:
{
  "text": "Your human-like, encouraging response with TouchGrass 🎵 branding.",
  "action": {
    "type": "SET_CONTEXT",
    "payload": {
      "key": "A", 
      "mode": "minor",
      "bpm": 70
    }
  }
}`;

export const processAIQuery = async (query: string): Promise<AIResponse> => {
  const savedApiKey = localStorage.getItem('fretlab_api_key');
  const lowerQuery = query.toLowerCase();

  // 1. ЕСЛИ КЛЮЧ ЕСТЬ: Запускаем живую нейросеть с характером TouchGrass
  if (savedApiKey) {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: query }
          ],
          response_format: { type: 'json_object' }, 
          temperature: 0.4 // Чуть выше для более живой и человечной речи
        })
      });

      if (!response.ok) throw new Error(`API Status ${response.status}`);
      const jsonRes = await response.json();
      let aiMessage = jsonRes.choices[0].message.content;

      aiMessage = aiMessage.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(aiMessage) as AIResponse;

    } catch (error: any) {
      console.error('TouchGrass Online Error, falling to local empathy:', error);
    }
  }

  // 2. 🔥 АВТОНОМНЫЙ РЕЖИМ С АНАЛИЗОМ ЭМОЦИЙ И ФРУСТРАЦИИ (Без ключа API)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Проверка триггеров фрустрации и усталости музыканта
  if (
    lowerQuery.includes('сложно') || 
    lowerQuery.includes('болит') || 
    lowerQuery.includes('бесит') || 
    lowerQuery.includes('не получается') || 
    lowerQuery.includes('устал') ||
    lowerQuery.includes('hard') ||
    lowerQuery.includes('hurt')
  ) {
    return {
      text: "TouchGrass 🎵: Эй, притормози! Пальцы горят, а аккорды кажутся стеной? Это абсолютно нормально. Каждый крутой гитарист проходил через это. Давай сделаем глубокий вдох, опустим руки, расслабим кисти и снизим темп до спокойных 70 BPM в простом Ля-миноре. Попробуй поиграть медленно, без спешки. Ты со всем справишься!",
      action: {
        type: 'SET_CONTEXT',
        payload: {
          key: 'A',
          mode: 'aeolian',
          bpm: 70
        }
      }
    };
  }

  // Стандартные музыкальные команды для оффлайн-режима
  if (lowerQuery.includes('ля минор') || lowerQuery.includes('a minor') || lowerQuery.includes('блюз')) {
    return {
      text: "TouchGrass 🎵: Поймал! Настраиваю теплый ламповый блюз в Ля-миноре (A Aeolian). Пентатоника уже ждет тебя на грифе, погнали джемить!",
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
      text: "TouchGrass 🎵: Закачиваем плотный фанковый грув в До-дорийском ладу (C Dorian). Включай фейзер, качаем этот ритм!",
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
    text: "TouchGrass 🎵: Привет! Я твой гитарный наставник. Напиши мне, что ты хочешь сыграть (например, 'хочу блюз в ля миноре'), или пожалуйся, если упражнение дается слишком тяжело — я помогу упростить задачу!"
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

    notes.push({
      string: currentString,
      fret: fret,
      duration: durationObj,
      technique,
      tiedToNext
    });
    
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