export interface ChordEvent {
  chord: string;          // Например: "Am7", "D9", "Gmaj7"
  duration_beats: number; // Длительность в долях (обычно 4 доли = 1 такт)
}

export interface SongSection {
  name: string;           // "Intro", "Verse", "Chorus"
  bars: number;           // Количество тактов в секции
  chords: ChordEvent[];   // Массив аккордов в этой секции
}

export interface SongBlueprint {
  title: string;
  genre: string;
  bpm: number;
  key: string;            // Тональность (например, "C minor")
  time_signature: string; // Обычно "4/4"
  structure: SongSection[];
}