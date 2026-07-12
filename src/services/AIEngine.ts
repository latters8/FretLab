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

const SYSTEM_PROMPT = `You are the AI Conductor of FretLab, an operating system for guitarists.
Your task is to analyze user requests and return a valid JSON object. Do not include any markdown formatting or extra text outside the JSON block.

The JSON structure MUST strictly follow the AIResponse interface:
{
  "text": "Your helpful and musically accurate textual response here.",
  "action": {
    "type": "SET_CONTEXT",
    "payload": {
      "key": "C", // Must be one of: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
      "mode": "dorian", // Must be one of: major, minor, dorian, phrygian, lydian, mixolydian, aeolian, locrian
      "bpm": 110,
      "track": {
        "platform": "youtube",
        "id": "X5X1i5H9m2s",
        "title": "Descriptive backing track title"
      }
    }
  }
}

If the user asks to play a certain style, key, or jam, find a suitable musical setting, write a concise explanation, and provide the correct payload to change the app state.`;

export const processAIQuery = async (query: string): Promise<AIResponse> => {
  const savedApiKey = localStorage.getItem('fretlab_api_key');

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
          temperature: 0.2
        })
      });

      // 🔥 ВЫВОДИМ ОШИБКИ СЕРВЕРА НА ЭКРАН (Неверный ключ, нет денег на балансе)
      if (!response.ok) {
        const errBody = await response.text().catch(() => 'No error body');
        return {
          text: `🔴 Ошибка DeepSeek API (Статус ${response.status}). Возможно, неверный токен, закончились средства на балансе DeepSeek или сбоит сервер. Ответ API: ${errBody.substring(0, 120)}`
        };
      }

      const jsonRes = await response.json();
      let aiMessage = jsonRes.choices[0].message.content;

      aiMessage = aiMessage.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(aiMessage) as AIResponse;

    } catch (error: any) {
      console.error('DeepSeek API Network/CORS Error:', error);
      // 🔥 ВЫВОДИМ ОШИБКИ СЕТИ И CORS НА ЭКРАН
      return {
        text: `🔴 Блокировка CORS или ошибка сети: "${error?.message || 'Failed to fetch'}". Прямые запросы к API из браузера часто блокируются DeepSeek для безопасности. Открой консоль браузера (F12 -> Вкладка Console), чтобы увидеть системный лог блокировки.`
      };
    }
  }

  // --- ОБЫЧНЫЙ ЛОКАЛЬНЫЙ FALLBACK (Сработает ТОЛЬКО если ключа физически НЕТ в localStorage) ---
  const lowerQuery = query.toLowerCase();
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (lowerQuery.includes('ля минор') || lowerQuery.includes('a minor') || lowerQuery.includes('блюз')) {
    return {
      text: "[Offline Mode] Я переключил тональность в Ля-минор (A Aeolian) и подгрузил классический блюзовый джем.",
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
      text: "[Offline Mode] Фанк в До-дорийском ладу (C Dorian). Движок перестроен под грув ритм-секции.",
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
    text: "Я работаю в автономном режиме. Чтобы раскрыть весь потенциал ИИ-дирижера, введи свой API-ключ в настройках панели 🎛 Tone Setup!"
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