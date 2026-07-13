export interface TrackOption {
  id: string;
  title: string;
  icon?: string;
  action?: { type: string; payload?: any };
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

  const isLookingForTrack = lowerQuery.includes('track') || lowerQuery.includes('jam') || lowerQuery.includes('find') || lowerQuery.includes('backing');
  
  if (isLookingForTrack) {
    const hasSpotify = lowerQuery.includes('spotify');
    const hasApple = lowerQuery.includes('apple') || lowerQuery.includes('apple music');
    const hasYoutube = lowerQuery.includes('youtube') || lowerQuery.includes('yt');

    if (hasSpotify) return { text: "Opening Spotify for you! 🎧", action: { type: 'SEARCH_SPOTIFY', payload: { query } } };
    if (hasApple) return { text: "Opening Apple Music for you! 🎵", action: { type: 'SEARCH_APPLE', payload: { query } } };
    if (hasYoutube) return { text: "Opening YouTube for you! 📺", action: { type: 'SEARCH_YOUTUBE', payload: { query } } };

    return {
      text: "I can find the perfect backing track for you! Where would you like to listen to it?",
      options: [
        { id: 'yt', title: 'Search on YouTube', icon: '📺', action: { type: 'SEARCH_YOUTUBE', payload: { query } } },
        { id: 'sp', title: 'Search on Spotify', icon: '🎧', action: { type: 'SEARCH_SPOTIFY', payload: { query } } },
        { id: 'am', title: 'Search on Apple Music', icon: '🎵', action: { type: 'SEARCH_APPLE', payload: { query } } }
      ]
    };
  }

  return {
    text: "I am TouchGrass AI, your local music assistant! 🤖\n\nTry asking me:\n- \"Find a rock backing track in C on Spotify\"\n- \"Show me the Bmaj7 chord\"\n- \"I need a blues jam track\""
  };
};

// ============================================================================
// 🔥 ИСПРАВЛЕННЫЕ ТИПЫ ДЛЯ СОВМЕСТИМОСТИ С TABLATURE.TSX
// ============================================================================

export interface LickNote {
  string: number;
  fret: number | null;
  duration?: string;
  isRest?: boolean;
  articulation?: string;
  technique?: 'none' | 'hammer' | 'pull' | 'slide' | 'vibrato' | 'bend';
  tiedToNext?: boolean;
}

export interface Lick {
  id: string;
  name: string;
  notes: LickNote[];
}

export const generateSmartLick = (..._args: any[]): Lick => {
  return {
    id: `lick-${Math.random()}`,
    name: "AI Smart Lick",
    notes: [
      { string: 2, fret: 14, duration: '8n', technique: 'none' },
      { string: 2, fret: 12, duration: '8n', technique: 'none' },
      { string: 3, fret: 14, duration: '4n', technique: 'vibrato' },
      { string: 3, fret: 12, duration: '8n', technique: 'none' },
      { string: 4, fret: 14, duration: '2n', technique: 'none' }
    ]
  };
};