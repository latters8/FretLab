export type VideoPlatform = 'youtube' | 'rutube' | 'vk';

export interface TrackInfo {
  platform: VideoPlatform;
  id: string;
  title: string;
}

// 🔥 ДОБАВЛЕН НОВЫЙ ТИП: SEARCH_YOUTUBE
export type AIActionType = 'SET_CONTEXT' | 'OPEN_CHORD' | 'OPEN_TAB_GEN' | 'OPEN_AUTOTAB' | 'SEARCH_YOUTUBE';

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
Return ONLY valid JSON matching: { "text": "...", "action": { "type": "OPEN_CHORD", "payload": { "chord": "Cmaj7" } } }`;

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

  // 1. ПАРСЕР ПРЯМЫХ ССЫЛОК YOUTUBE
  const ytVideoMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*embed\/|.*\/))([^&?\s]{11})/);
  const ytListMatch = query.match(/[?&]list=([^&?\s]+)/);

  if (ytVideoMatch || ytListMatch) {
    let trackId = '';
    if (ytVideoMatch && ytListMatch) {
      trackId = `${ytVideoMatch[1]}&list=${ytListMatch[1]}`;
    } else if (ytListMatch) {
      trackId = `videoseries?list=${ytListMatch[1]}`;
    } else if (ytVideoMatch) {
      trackId = ytVideoMatch[1];
    }
    return {
      text: "TouchGrass 🎵: Поймал ссылку! Трек/плейлист загружен в плеер, джем начинается!",
      action: { type: 'SET_CONTEXT', payload: { track: { platform: 'youtube', id: trackId, title: 'Custom YouTube Stream' } } }
    };
  }

  // 2. ДЕТЕКТОР ФРУСТРАЦИИ
  if (lowerQuery.includes('сложно') || lowerQuery.includes('болит') || lowerQuery.includes('бесит')) {
    return {
      text: "TouchGrass 🎵: Так, выдыхаем! Отложи гитару на пару минут. Я сбросил темп метронома до 70 BPM и включил легкий минус.",
      action: { type: 'SET_CONTEXT', payload: { key: 'A', mode: 'aeolian', bpm: 70, track: { platform: 'youtube', id: '3W1A142r-yE', title: 'Relaxed Practice Track' } } }
    };
  }

  // 3. ПОИСК АККОРДОВ (Высший приоритет над текстовым поиском)
  if (lowerQuery.includes('аккорд') || lowerQuery.includes('chord') || query.match(/\b[A-G][b#]?(?:m|maj|dim|aug)?(?:2|4|5|6|7|9|11|13)?\b/i)) {
    const match = query.match(/([A-G][b#]?(?:m|maj|dim|aug)?(?:2|4|5|6|7|9|11|13)?(?:sus2|sus4)?(?:[b#]5|[b#]9|[b#]11)?)/i);
    let targetChord = 'Cmaj7'; 
    if (match) targetChord = match[0].charAt(0).toUpperCase() + match[0].slice(1);
    return {
      text: `TouchGrass 🎵: Открываю аппликатуру ${targetChord} в Справочнике!`,
      action: { type: 'OPEN_CHORD', payload: { chord: targetChord } }
    };
  }

  // 4. 🔥 НОВАЯ КОМАНДА: ПОИСК НА YOUTUBE В НОВОЙ ВКЛАДКЕ
  if (lowerQuery.includes('ютуб') || lowerQuery.includes('youtube') || lowerQuery.includes('найди минус') || lowerQuery.includes('поиск')) {
    let searchQuery = query.replace(/(найди|поиск|на ютубе|в ютубе|youtube|search|for|мне|минус|трек)/gi, '').trim();
    if (!searchQuery) searchQuery = 'guitar backing track';
    
    return {
      text: `TouchGrass 🎵: Отличная идея! Я открыл новую вкладку с поиском YouTube по запросу "${searchQuery}". Выбери лучший минус, скопируй ссылку и вставь её в мой плеер!`,
      action: { type: 'SEARCH_YOUTUBE', payload: { query: searchQuery } }
    };
  }

  // 5. ГЕНЕРАТОР ТАБОВ
  if (lowerQuery.includes('соло') || lowerQuery.includes('таб') || lowerQuery.includes('lick') || lowerQuery.includes('фраз')) {
    return { text: "TouchGrass 🎵: Открываю панель генератора фраз. Выбери тональность и нажми 'Generate Lick'!", action: { type: 'OPEN_TAB_GEN' } };
  }

  // 6. AUTOTAB
  if (lowerQuery.includes('транскриб') || lowerQuery.includes('автотаб') || lowerQuery.includes('разбери')) {
    return { text: "TouchGrass 🎵: Переключаю на AutoTab транскрибатор. Загружай аудио!", action: { type: 'OPEN_AUTOTAB' } };
  }

  return {
    text: "TouchGrass 🎵: Привет! Напиши мне «найди блюзовый минус на ютубе», и я открою новую вкладку с поиском! Либо просто вставь ссылку на видео."
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
    
    if (i < phraseLength - 1 && Math.random() > 0.7) { technique = Math.random() > 0.5 ? 'hammer' : 'slide'; tiedToNext = true; }
    if (i === phraseLength - 1) { technique = 'vibrato'; durationObj = 'quarter'; }
    notes.push({ string: currentString, fret: fret, duration: durationObj, technique, tiedToNext });
    if (Math.random() > 0.6) { currentString += Math.random() > 0.5 ? 1 : -1; if (currentString > 5) currentString = 5; if (currentString < 0) currentString = 0; }
  }
  return { name: `AI Generated ${keyNote} ${mode} Lick`, notes };
};