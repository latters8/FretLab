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

const API_KEY = ""; 

const SYSTEM_PROMPT = `You are "TouchGrass 🎵", a FretLab guitar AI assistant.
Return ONLY valid JSON matching: { "text": "...", "action": { "type": "OPEN_CHORD", "payload": { "chord": "Cmaj7" } } }
Action types: OPEN_CHORD (requires chord like "Am", "Cmaj7"), OPEN_TAB_GEN, OPEN_AUTOTAB, SET_CONTEXT (requires key, mode, bpm, track).`;

export const processAIQuery = async (query: string): Promise<AIResponse> => {
  if (API_KEY) {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
          response_format: { type: 'json_object' }
        })
      });
      if (response.ok) {
         const jsonRes = await response.json();
         let aiMessage = jsonRes.choices[0].message.content;
         return JSON.parse(aiMessage.replace(/```json/g, "").replace(/```/g, "").trim()) as AIResponse;
      }
    } catch (e) {
      console.error("AI API Error:", e);
    }
  }

  const lowerQuery = query.toLowerCase();
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 1. ДЕТЕКТОР ФРУСТРАЦИИ (Высший приоритет эмпатии)
  if (lowerQuery.includes('сложно') || lowerQuery.includes('болит') || lowerQuery.includes('бесит')) {
    return {
      text: "TouchGrass 🎵: Так, выдыхаем! Отложи гитару на пару минут. Я сбросил темп метронома до спокойных 70 BPM и включил легкий минус, чтобы ты мог расслабиться.",
      action: { type: 'SET_CONTEXT', payload: { key: 'A', mode: 'aeolian', bpm: 70, track: { platform: 'youtube', id: '3W1A142r-yE', title: 'Relaxed Practice Track' } } }
    };
  }

  // 2. ГЕНЕРАТОР ТАБОВ И СОЛО (Приоритет над аккордами, чтобы "соло в Em" не открывало словарь)
  if (lowerQuery.includes('соло') || lowerQuery.includes('таб') || lowerQuery.includes('lick') || lowerQuery.includes('фраз')) {
    return { 
      text: "TouchGrass 🎵: Без проблем! Открываю панель генератора фраз. Выбери тональность на грифе, нажми 'Generate Lick', и я выдам свежую идею для соло!", 
      action: { type: 'OPEN_TAB_GEN' } 
    };
  }

  // 3. AUTOTAB
  if (lowerQuery.includes('транскриб') || lowerQuery.includes('автотаб') || lowerQuery.includes('разбери')) {
    return { text: "TouchGrass 🎵: Переключаю на мощный AutoTab транскрибатор. Загружай аудио, разберем по нотам!", action: { type: 'OPEN_AUTOTAB' } };
  }

  // 4. ПОИСК ТРЕКОВ
  if (lowerQuery.includes('рок') || lowerQuery.includes('rock') || lowerQuery.includes('метал')) {
    return { text: "TouchGrass 🎵: Запускаю Heavy Rock Jam (120 BPM, A minor)!", action: { type: 'SET_CONTEXT', payload: { key: 'A', mode: 'aeolian', bpm: 120, track: { platform: 'youtube', id: '8KpPab_M4t4', title: 'Heavy Rock Groove' } } } };
  }
  if (lowerQuery.includes('фанк') || lowerQuery.includes('funk')) {
    return { text: "TouchGrass 🎵: Запускаю C Dorian Funk (110 BPM)!", action: { type: 'SET_CONTEXT', payload: { key: 'C', mode: 'dorian', bpm: 110, track: { platform: 'youtube', id: 'X5X1i5H9m2s', title: 'C Dorian Funk' } } } };
  }
  if (lowerQuery.includes('блюз') || lowerQuery.includes('blues')) {
    return { text: "TouchGrass 🎵: Запускаю Slow Blues Jam (80 BPM, A minor)!", action: { type: 'SET_CONTEXT', payload: { key: 'A', mode: 'aeolian', bpm: 80, track: { platform: 'youtube', id: '3W1A142r-yE', title: 'Slow Blues Jam' } } } };
  }

  // 5. ПОИСК АККОРДОВ (Низкий приоритет, чтобы не перебивать сложные команды)
  if (lowerQuery.includes('аккорд') || lowerQuery.includes('chord') || query.match(/\b[A-G][b#]?(?:m|maj|dim|aug)?(?:2|4|5|6|7|9|11|13)?\b/i)) {
    const match = query.match(/([A-G][b#]?(?:m|maj|dim|aug)?(?:2|4|5|6|7|9|11|13)?(?:sus2|sus4)?(?:[b#]5|[b#]9|[b#]11)?)/i);
    let targetChord = 'Cmaj7'; 
    if (match) {
      targetChord = match[0].charAt(0).toUpperCase() + match[0].slice(1);
    }
    return {
      text: `TouchGrass 🎵: Открываю аппликатуру ${targetChord} в Справочнике! Там ты сможешь её послушать.`,
      action: { type: 'OPEN_CHORD', payload: { chord: targetChord } }
    };
  }

  // 6. БОГАТАЯ ПОДСКАЗКА (Fallback)
  return {
    text: "TouchGrass 🎵: Привет! Я твой ИИ-наставник. Вот что я умею:\n\n🎸 **Искать аккорды:** Напиши «покажи аккорд F#m7b5»\n🎶 **Сочинять соло:** Попроси «сгенерируй соло в Em»\n📻 **Включать джем-треки:** Скажи «включи фанк минус» или «рок джем»\n🎼 **Разбирать песни (AutoTab):** Напиши «хочу транскрибировать песню»\n🧘‍♂️ **Помогать при усталости:** Если не получается баррэ или болят пальцы — просто пожалуйся мне!"
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