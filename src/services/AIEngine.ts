import { type TrackInfo, type Mode } from '../context/MusicContext';

export interface AIAction {
  type: 'SET_CONTEXT';
  payload: {
    key?: string;
    mode?: Mode;
    bpm?: number;
    track?: TrackInfo;
  };
}

export interface AIResponse {
  text: string;
  action?: AIAction;
}

// 🔥 ПРОМПТ ДЛЯ НЕЙРОСЕТИ: Обучаем ИИ управлять нашим интерфейсом
const SYSTEM_PROMPT = `
You are the AI brain of 'FretLab' - a professional guitar workstation.
The user will ask you for musical advice, backing tracks, theory, or to change settings.

Your GOAL is to answer their question AND control the UI by sending specific parameters.
You MUST ALWAYS respond with a VALID JSON object in this exact format:

{
  "text": "Your helpful response explaining theory, chord suggestions, or introducing the backing track.",
  "action": {
    "type": "SET_CONTEXT",
    "payload": {
      "key": "A", // The root note (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
      "mode": "dorian", // The scale mode (major, minor, dorian, phrygian, lydian, mixolydian, aeolian, locrian, blues, pentatonic)
      "bpm": 110, // Suggested BPM
      "track": { // (Optional) ONLY if the user wants to jam.
        "platform": "youtube",
        "id": "YOUR_SUGGESTED_YOUTUBE_VIDEO_ID",
        "title": "Title of the backing track"
      }
    }
  }
}
Do NOT use markdown code blocks like \`\`\`json. Return ONLY raw JSON.
`;

export const processAIQuery = async (query: string): Promise<AIResponse> => {
  const apiKey = import.meta.env.VITE_AI_API_KEY;

  // 🧠 СЦЕНАРИЙ 1: Если у нас есть API-ключ (Реальный ИИ)
  if (apiKey && apiKey.length > 10) {
    try {
      // Можно использовать 'https://api.deepseek.com/v1/chat/completions' для DeepSeek
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // или "deepseek-chat"
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: query }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      let content = data.choices[0].message.content;
      
      // Очищаем от возможных маркдаун-блоков (```json)
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(content) as AIResponse;
    } catch (error) {
      console.error("AI API Error:", error);
      // Если API упал, мягко переходим к локальному анализатору (Сценарий 2)
    }
  }

  // ⚡ СЦЕНАРИЙ 2: Локальный анализатор (Если ключа нет)
  await new Promise(resolve => setTimeout(resolve, 600)); // Имитация задержки сети
  const lowerQuery = query.toLowerCase();

  // Локальный умный парсер тональностей
  let detectedKey = 'E';
  if (lowerQuery.match(/\b(a|ля)\b/)) detectedKey = 'A';
  if (lowerQuery.match(/\b(c|до)\b/)) detectedKey = 'C';
  if (lowerQuery.match(/\b(d|ре)\b/)) detectedKey = 'D';
  if (lowerQuery.match(/\b(g|соль)\b/)) detectedKey = 'G';
  if (lowerQuery.match(/\b(f|фа)\b/)) detectedKey = 'F';

  // Локальный парсер стилей
  if (lowerQuery.includes('блюз') || lowerQuery.includes('blues')) {
    return {
      text: `Я нашел отличный блюзовый минус в тональности ${detectedKey} и переключил интерфейс на блюзовую пентатонику. Обрати внимание на 'Suggested Chords' справа — там отличные доминантсептаккорды для обыгрыша!`,
      action: { type: 'SET_CONTEXT', payload: { key: detectedKey, mode: 'blues', bpm: 90, track: { platform: 'youtube', id: 'OebA4GfO8wU', title: `${detectedKey} Blues Jam` } } }
    };
  }

  if (lowerQuery.includes('фанк') || lowerQuery.includes('funk')) {
    return {
      text: `Фанк — это ритм! Я включил фанк-минус в ${detectedKey} Дорийском (Dorian) ладу. Попробуй использовать обращения из панели справа, чтобы звучать как Нил Роджерс.`,
      action: { type: 'SET_CONTEXT', payload: { key: detectedKey, mode: 'dorian', bpm: 110, track: { platform: 'youtube', id: 'fX1D_S2YkXo', title: `${detectedKey} Dorian Funk` } } }
    };
  }

  if (lowerQuery.includes('метал') || lowerQuery.includes('metal')) {
    return {
      text: `Врубаем дисторшн! Тяжелый метал-минус в ${detectedKey} Фригийском (Phrygian) ладу. Гриф и диатоника уже перестроены под этот мрачный лад.`,
      action: { type: 'SET_CONTEXT', payload: { key: detectedKey, mode: 'phrygian', bpm: 140, track: { platform: 'youtube', id: '1a2b3c4d5e', title: `${detectedKey} Dark Metal Jam` } } }
    };
  }

  // Дефолтный ответ
  return {
    text: "Пока я работаю в локальном режиме без API-ключа. Но я уже умею распознавать стили! Напиши мне, например: 'Включи фанк в до' или 'Давай поиграем блюз в ля', и я всё настрою."
  };
};