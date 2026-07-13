export interface BackingTrack {
  id: string;      // ID видео на YouTube
  title: string;   // Красивое название для интерфейса
  key: string;     // Тональность (C, D#, E и т.д.)
  mode: string;    // Лад для настройки грифа (minor, major, dorian, blues)
  bpm: number;     // Темп для синхронизации метронома
  tags: string[];  // Теги для умного поиска
}

export const TRACK_DB: BackingTrack[] = [
  { 
    id: 'cwX8t-Uq6m8', 
    title: 'A Minor Blues Slow Jam', 
    key: 'A', 
    mode: 'blues', 
    bpm: 60, 
    tags: ['blues', 'slow', 'minor', 'chill'] 
  },
  { 
    id: 'p6OqE1Z5oEE', 
    title: 'C Major Uplifting Rock', 
    key: 'C', 
    mode: 'major', 
    bpm: 110, 
    tags: ['rock', 'uplifting', 'major', 'pop'] 
  },
  { 
    id: '5w18KIf5GvM', 
    title: 'E Dorian Funk Groove', 
    key: 'E', 
    mode: 'dorian', 
    bpm: 100, 
    tags: ['funk', 'groove', 'dorian', 'upbeat'] 
  },
  { 
    id: 'ZcZ6X3_m1sY', 
    title: 'G Lydian Dreamy Backing', 
    key: 'G', 
    mode: 'lydian', 
    bpm: 85, 
    tags: ['ambient', 'dreamy', 'lydian', 'space'] 
  },
  { 
    id: 'K4DudkX_ZlA', 
    title: 'D Minor Heavy Metal Riff', 
    key: 'D', 
    mode: 'minor', 
    bpm: 140, 
    tags: ['metal', 'heavy', 'rock', 'minor', 'shred'] 
  }
];