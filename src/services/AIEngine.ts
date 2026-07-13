export type VideoPlatform = 'youtube' | 'rutube' | 'vk';
export interface TrackInfo { platform: VideoPlatform; id: string; title: string; }
export type AIActionType = 'SET_CONTEXT' | 'OPEN_CHORD' | 'OPEN_TAB_GEN' | 'OPEN_AUTOTAB' | 'SEARCH_YOUTUBE';
export interface TrackOption { title: string; id: string; key?: string; mode?: string; bpm?: number; }
export interface AIResponse { text: string; action?: { type: AIActionType; payload?: any; }; options?: TrackOption[]; }
export type Technique = 'none' | 'hammer' | 'pull' | 'slide' | 'vibrato' | 'bend';
export interface TabNote { string: number; fret: number; duration: 'quarter' | 'eighth' | 'sixteenth'; technique: Technique; tiedToNext?: boolean; }
export interface Lick { name: string; notes: TabNote[]; }

export const processAIQuery = async (query: string): Promise<AIResponse> => {
  const lowerQuery = query.toLowerCase();
  await new Promise((resolve) => setTimeout(resolve, 500));

  const ytVideoMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*embed\/|.*\/))([^&?\s]{11})/);
  const ytListMatch = query.match(/[?&]list=([^&?\s]+)/);
  if (ytVideoMatch || ytListMatch) {
    let trackId = ytVideoMatch && ytListMatch ? `${ytVideoMatch[1]}&list=${ytListMatch[1]}` : ytListMatch ? `videoseries?list=${ytListMatch[1]}` : ytVideoMatch![1];
    return { text: "TouchGrass 🎵: Ссылка принята! Загружаю в плеер...", action: { type: 'SET_CONTEXT', payload: { track: { platform: 'youtube', id: trackId, title: 'Custom Stream' } } } };
  }

  // 🔥 НОВЫЙ ИНТЕНТ: ОБЫГРЫВАНИЕ АККОРДОВ
  const playOverMatch = query.match(/(?:обыграть|обыгрывание|соло (?:под|на|в)|play over|scale for|arpeggio|арпеджио)\s+([A-G][b#]?(?:m|maj|dim|aug)?(?:2|4|5|6|7|9|11|13)?(?:alt)?)/i);
  if (playOverMatch) {
    const chordStr = playOverMatch[1];
    const keyMatch = chordStr.match(/[A-G][b#]?/i);
    let key = keyMatch ? keyMatch[0].toUpperCase() : 'C';
    let targetMode = 'major';
    const cLower = chordStr.toLowerCase();

    if (cLower.includes('alt')) targetMode = 'altered';
    else if (cLower.includes('maj7')) targetMode = 'maj7_arp';
    else if (cLower.includes('m7') || cLower.includes('min7')) targetMode = 'min7_arp';
    else if (cLower.includes('9')) targetMode = 'dom9_arp';
    else if (cLower.includes('7')) targetMode = 'dom7_arp';
    else if (cLower.includes('m')) targetMode = 'pentatonic';

    return {
      text: `TouchGrass 🎵: Отличный выбор! Подсвечиваю на грифе ступени для обыгрывания аккорда ${chordStr}.`,
      action: { type: 'SET_CONTEXT', payload: { key, mode: targetMode } }
    };
  }

  const isBackingIntent = lowerQuery.includes('backing') || lowerQuery.includes('jam') || lowerQuery.includes('play') || lowerQuery.includes('track') || lowerQuery.includes('минус') || lowerQuery.includes('джем');
  const isTabIntent = lowerQuery.includes('соло') || lowerQuery.includes('таб') || lowerQuery.includes('tab') || lowerQuery.includes('lick') || lowerQuery.includes('фраза');
  const chordMatch = query.match(/\b([A-G][b#]?(?:m|maj|dim|aug)?(?:2|4|5|6|7|9|11|13)?(?:sus2|sus4)?(?:alt)?)\b/i);

  if (isBackingIntent) {
    return {
      text: "TouchGrass 🎵: Понял, ищу минусовку! Выбери из списка:",
      options: [
        { title: '🎸 Heavy Rock Groove (A minor)', id: '8KpPab_M4t4', key: 'A', mode: 'aeolian', bpm: 120 },
        { title: '☕ Slow Blues Midnight Jam (A minor)', id: '3W1A142r-yE', key: 'A', mode: 'aeolian', bpm: 80 },
        { title: '🌌 Smooth Neo-Soul (G major)', id: '8KpPab_M4t4', key: 'G', mode: 'major', bpm: 90 }
      ]
    };
  }

  if (isTabIntent) return { text: "TouchGrass 🎵: Открываю генератор фраз. Какую тональность пробуем?", action: { type: 'OPEN_TAB_GEN' } };

  if (chordMatch && !isBackingIntent) {
    const chord = chordMatch[1].charAt(0).toUpperCase() + chordMatch[1].slice(1);
    return { text: `TouchGrass 🎵: Открываю аппликатуру ${chord} в Справочнике!`, action: { type: 'OPEN_CHORD', payload: { chord } } };
  }

  return { text: "TouchGrass 🎵: Привет! Напиши мне «найди рок минус», «покажи аккорд C7» или «обыграть C7 alt»!" };
};

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STANDARD_TUNING = ['E', 'B', 'G', 'D', 'A', 'E'];
const findFretForNote = (targetNote: string, targetStringIdx: number, basePosition: number = 5): number => {
  const openNote = STANDARD_TUNING[targetStringIdx];
  const distance = (ALL_NOTES.indexOf(targetNote) - ALL_NOTES.indexOf(openNote) + 12) % 12;
  return Math.abs(distance < basePosition - 2 ? distance + 12 : distance > basePosition + 5 ? distance - 12 : distance);
};

export const generateSmartLick = (scaleNotes: string[], keyNote: string, mode: string): Lick => {
  const notes: TabNote[] = [];
  const phraseLength = Math.floor(Math.random() * 3) + 6; 
  let currentString = Math.floor(Math.random() * 2) + 2; 
  for (let i = 0; i < phraseLength; i++) {
    const randomNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
    const fret = findFretForNote(randomNote, currentString, 5);
    let technique: Technique = 'none'; let tiedToNext = false; let durationObj: 'quarter'|'eighth'|'sixteenth' = 'eighth';
    if (i === phraseLength - 1) { technique = 'vibrato'; durationObj = 'quarter'; }
    notes.push({ string: currentString, fret: fret, duration: durationObj, technique, tiedToNext });
  }
  return { name: `AI Generated ${keyNote} ${mode} Lick`, notes };
};