export type VideoPlatform = 'youtube' | 'rutube' | 'vk';

export interface TrackInfo {
  platform: VideoPlatform;
  id: string;
  title: string;
}

// 🔥 НОВЫЕ ТИПЫ КОМАНД ДЛЯ УПРАВЛЕНИЯ ИНТЕРФЕЙСОМ
export type AIActionType = 'SET_CONTEXT' | 'OPEN_CHORD' | 'OPEN_TAB_GEN';

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

// 🔥 ПРОМПТ ДИРИЖЕРА: Теперь TouchGrass умеет открывать окна приложения
const SYSTEM_PROMPT = `You are "TouchGrass 🎵", a lightweight, highly supportive AI assistant embedded inside FretLab.
Your expertise covers guitar anatomy, tabs, music theory, and detecting musician frustration.

Guidelines for your personality & capabilities:
1. Act like a warm guitar coach. Be encouraging.
2. DETECT FRUSTRATION: If the user complains about pain or difficulty, suggest they take a break, and use SET_CONTEXT to lower BPM and switch to a simple key like A minor.
3. BE THE CONDUCTOR (CRITICAL): You control the app UI. 
   - If the user asks to see or learn a specific chord (e.g., "how to play Cmaj7" or "show me G minor"), you MUST return action type "OPEN_CHORD" with payload { "chord": "Cmaj7" } (use standard notation like C, Cm, Cmaj7).
   - If the user asks for a solo, lick, or tab (e.g., "write me a jazz solo"), you MUST return action type "OPEN_TAB_GEN".
   - If they ask to jam, use "SET_CONTEXT" with key, mode, and bpm.

You must return a valid JSON object ONLY. No markdown, no extra text.
JSON structure:
{
  "text": "Your human-like response here.",
  "action": {
    "type": "OPEN_CHORD",
    "payload": { "chord": "Cmaj7" }
  }
}`;

export const processAIQuery = async (query: string): Promise<AIResponse> => {
  const savedApiKey = localStorage.getItem('fretlab_api_key');
  const lowerQuery = query.toLowerCase();

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
          temperature: 0.4 
        })
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => 'No error body');
        return {
          text: `🔴 Ошибка DeepSeek API (Статус ${response.status}). Проверь ключ или баланс. Ответ API: ${errBody.substring(0, 120)}`
        };
      }

      const jsonRes = await response.json();
      let aiMessage = jsonRes.choices[0].message.content;

      aiMessage = aiMessage.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(aiMessage) as AIResponse;

    } catch (error: any) {
      console.error('TouchGrass Online Error:', error);
      return {
        text: `🔴 Блокировка CORS или ошибка сети: "${error?.message}".`
      };
    }
  }

  // АВТОНОМНЫЙ РЕЖИМ
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (lowerQuery.includes('покажи') && (lowerQuery.includes('аккорд') || lowerQuery.includes('chord'))) {
    return {
      text: "TouchGrass 🎵: Конечно! Открываю Справочник. В автономном режиме я покажу тебе базовый Cmaj7, но если введешь API-ключ, я найду абсолютно любой аккорд!",
      action: { type: 'OPEN_CHORD', payload: { chord: 'Cmaj7' } }
    };
  }

  if (lowerQuery.includes('соло') || lowerQuery.includes('табы') || lowerQuery.includes('lick')) {
    return {
      text: "TouchGrass 🎵: Без проблем! Открываю панель генерации табов для тебя.",
      action: { type: 'OPEN_TAB_GEN', payload: {} }
    };
  }

  if (lowerQuery.includes('сложно') || lowerQuery.includes('болит') || lowerQuery.includes('бесит')) {
    return {
      text: "TouchGrass 🎵: Эй, притормози! Пальцы горят? Давай расслабим кисти и снизим темп до 70 BPM в простом Ля-миноре. Попробуй поиграть без спешки.",
      action: { type: 'SET_CONTEXT', payload: { key: 'A', mode: 'aeolian', bpm: 70 } }
    };
  }

  return {
    text: "TouchGrass 🎵: Привет! Я твой гитарный наставник. Попроси меня 'показать аккорд Am9', 'сгенерировать соло' или пожалуйся на боль в пальцах!"
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