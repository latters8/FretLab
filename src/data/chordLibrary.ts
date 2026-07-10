// src/data/chordLibrary.ts

export interface ChordDefinition {
  name: string;
  notes: string[];        // Абсолютные ноты (например, ['C', 'E', 'G'])
  intervals: number[];    // Интервалы от корня в полутонах (например, [0, 4, 7])
  quality: 'major' | 'minor' | 'dominant' | 'diminished' | 'augmented' | 'suspended';
  aliases?: string[];     // Дополнительные имена (например, ['CMaj', 'C'])
}

/**
 * ПОЛНЫЙ СПРАВОЧНИК АККОРДОВ
 * Добавляй сюда любые аккорды, которые нужны в приложении
 */
export const CHORD_LIBRARY: Record<string, ChordDefinition> = {
  // ==========================================
  // МАЖОРНЫЕ ТРЕЗВУЧИЯ (Major Triads)
  // ==========================================
  "C": { name: "C", notes: ["C", "E", "G"], intervals: [0, 4, 7], quality: 'major' },
  "C#": { name: "C#", notes: ["C#", "F", "G#"], intervals: [0, 4, 7], quality: 'major' },
  "Db": { name: "Db", notes: ["Db", "F", "Ab"], intervals: [0, 4, 7], quality: 'major' },
  "D": { name: "D", notes: ["D", "F#", "A"], intervals: [0, 4, 7], quality: 'major' },
  "D#": { name: "D#", notes: ["D#", "G", "A#"], intervals: [0, 4, 7], quality: 'major' },
  "Eb": { name: "Eb", notes: ["Eb", "G", "Bb"], intervals: [0, 4, 7], quality: 'major' },
  "E": { name: "E", notes: ["E", "G#", "B"], intervals: [0, 4, 7], quality: 'major' },
  "F": { name: "F", notes: ["F", "A", "C"], intervals: [0, 4, 7], quality: 'major' },
  "F#": { name: "F#", notes: ["F#", "A#", "C#"], intervals: [0, 4, 7], quality: 'major' },
  "Gb": { name: "Gb", notes: ["Gb", "Bb", "Db"], intervals: [0, 4, 7], quality: 'major' },
  "G": { name: "G", notes: ["G", "B", "D"], intervals: [0, 4, 7], quality: 'major' },
  "G#": { name: "G#", notes: ["G#", "C", "D#"], intervals: [0, 4, 7], quality: 'major' },
  "Ab": { name: "Ab", notes: ["Ab", "C", "Eb"], intervals: [0, 4, 7], quality: 'major' },
  "A": { name: "A", notes: ["A", "C#", "E"], intervals: [0, 4, 7], quality: 'major' },
  "A#": { name: "A#", notes: ["A#", "D", "F"], intervals: [0, 4, 7], quality: 'major' },
  "Bb": { name: "Bb", notes: ["Bb", "D", "F"], intervals: [0, 4, 7], quality: 'major' },
  "B": { name: "B", notes: ["B", "D#", "F#"], intervals: [0, 4, 7], quality: 'major' },

  // ==========================================
  // МИНОРНЫЕ ТРЕЗВУЧИЯ (Minor Triads)
  // ==========================================
  "Cm": { name: "Cm", notes: ["C", "Eb", "G"], intervals: [0, 3, 7], quality: 'minor' },
  "C#m": { name: "C#m", notes: ["C#", "E", "G#"], intervals: [0, 3, 7], quality: 'minor' },
  "Dm": { name: "Dm", notes: ["D", "F", "A"], intervals: [0, 3, 7], quality: 'minor' },
  "D#m": { name: "D#m", notes: ["D#", "F#", "A#"], intervals: [0, 3, 7], quality: 'minor' },
  "Ebm": { name: "Ebm", notes: ["Eb", "Gb", "Bb"], intervals: [0, 3, 7], quality: 'minor' },
  "Em": { name: "Em", notes: ["E", "G", "B"], intervals: [0, 3, 7], quality: 'minor' },
  "Fm": { name: "Fm", notes: ["F", "Ab", "C"], intervals: [0, 3, 7], quality: 'minor' },
  "F#m": { name: "F#m", notes: ["F#", "A", "C#"], intervals: [0, 3, 7], quality: 'minor' },
  "Gm": { name: "Gm", notes: ["G", "Bb", "D"], intervals: [0, 3, 7], quality: 'minor' },
  "G#m": { name: "G#m", notes: ["G#", "B", "D#"], intervals: [0, 3, 7], quality: 'minor' },
  "Abm": { name: "Abm", notes: ["Ab", "Cb", "Eb"], intervals: [0, 3, 7], quality: 'minor' },
  "Am": { name: "Am", notes: ["A", "C", "E"], intervals: [0, 3, 7], quality: 'minor' },
  "A#m": { name: "A#m", notes: ["A#", "C#", "F"], intervals: [0, 3, 7], quality: 'minor' },
  "Bbm": { name: "Bbm", notes: ["Bb", "Db", "F"], intervals: [0, 3, 7], quality: 'minor' },
  "Bm": { name: "Bm", notes: ["B", "D", "F#"], intervals: [0, 3, 7], quality: 'minor' },

  // ==========================================
  // МАЖОРНЫЕ СЕПТАККОРДЫ (Major 7)
  // ==========================================
  "Cmaj7": { name: "Cmaj7", notes: ["C", "E", "G", "B"], intervals: [0, 4, 7, 11], quality: 'major' },
  "C#maj7": { name: "C#maj7", notes: ["C#", "F", "G#", "C"], intervals: [0, 4, 7, 11], quality: 'major' },
  "Dmaj7": { name: "Dmaj7", notes: ["D", "F#", "A", "C#"], intervals: [0, 4, 7, 11], quality: 'major' },
  "Ebmaj7": { name: "Ebmaj7", notes: ["Eb", "G", "Bb", "D"], intervals: [0, 4, 7, 11], quality: 'major' },
  "Emaj7": { name: "Emaj7", notes: ["E", "G#", "B", "D#"], intervals: [0, 4, 7, 11], quality: 'major' },
  "Fmaj7": { name: "Fmaj7", notes: ["F", "A", "C", "E"], intervals: [0, 4, 7, 11], quality: 'major' },
  "F#maj7": { name: "F#maj7", notes: ["F#", "A#", "C#", "F"], intervals: [0, 4, 7, 11], quality: 'major' },
  "Gmaj7": { name: "Gmaj7", notes: ["G", "B", "D", "F#"], intervals: [0, 4, 7, 11], quality: 'major' },
  "Abmaj7": { name: "Abmaj7", notes: ["Ab", "C", "Eb", "G"], intervals: [0, 4, 7, 11], quality: 'major' },
  "Amaj7": { name: "Amaj7", notes: ["A", "C#", "E", "G#"], intervals: [0, 4, 7, 11], quality: 'major' },
  "Bbmaj7": { name: "Bbmaj7", notes: ["Bb", "D", "F", "A"], intervals: [0, 4, 7, 11], quality: 'major' },
  "Bmaj7": { name: "Bmaj7", notes: ["B", "D#", "F#", "A#"], intervals: [0, 4, 7, 11], quality: 'major' },

  // ==========================================
  // ДОМИНАНТСЕПТАККОРДЫ (Dominant 7)
  // ==========================================
  "C7": { name: "C7", notes: ["C", "E", "G", "Bb"], intervals: [0, 4, 7, 10], quality: 'dominant' },
  "C#7": { name: "C#7", notes: ["C#", "F", "G#", "B"], intervals: [0, 4, 7, 10], quality: 'dominant' },
  "D7": { name: "D7", notes: ["D", "F#", "A", "C"], intervals: [0, 4, 7, 10], quality: 'dominant' },
  "Eb7": { name: "Eb7", notes: ["Eb", "G", "Bb", "Db"], intervals: [0, 4, 7, 10], quality: 'dominant' },
  "E7": { name: "E7", notes: ["E", "G#", "B", "D"], intervals: [0, 4, 7, 10], quality: 'dominant' },
  "F7": { name: "F7", notes: ["F", "A", "C", "Eb"], intervals: [0, 4, 7, 10], quality: 'dominant' },
  "F#7": { name: "F#7", notes: ["F#", "A#", "C#", "E"], intervals: [0, 4, 7, 10], quality: 'dominant' },
  "G7": { name: "G7", notes: ["G", "B", "D", "F"], intervals: [0, 4, 7, 10], quality: 'dominant' },
  "Ab7": { name: "Ab7", notes: ["Ab", "C", "Eb", "Gb"], intervals: [0, 4, 7, 10], quality: 'dominant' },
  "A7": { name: "A7", notes: ["A", "C#", "E", "G"], intervals: [0, 4, 7, 10], quality: 'dominant' },
  "Bb7": { name: "Bb7", notes: ["Bb", "D", "F", "Ab"], intervals: [0, 4, 7, 10], quality: 'dominant' },
  "B7": { name: "B7", notes: ["B", "D#", "F#", "A"], intervals: [0, 4, 7, 10], quality: 'dominant' },

  // ==========================================
  // МИНОРНЫЕ СЕПТАККОРДЫ (Minor 7)
  // ==========================================
  "Cm7": { name: "Cm7", notes: ["C", "Eb", "G", "Bb"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "C#m7": { name: "C#m7", notes: ["C#", "E", "G#", "B"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "Dm7": { name: "Dm7", notes: ["D", "F", "A", "C"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "D#m7": { name: "D#m7", notes: ["D#", "F#", "A#", "C#"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "Ebm7": { name: "Ebm7", notes: ["Eb", "Gb", "Bb", "Db"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "Em7": { name: "Em7", notes: ["E", "G", "B", "D"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "Fm7": { name: "Fm7", notes: ["F", "Ab", "C", "Eb"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "F#m7": { name: "F#m7", notes: ["F#", "A", "C#", "E"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "Gm7": { name: "Gm7", notes: ["G", "Bb", "D", "F"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "G#m7": { name: "G#m7", notes: ["G#", "B", "D#", "F#"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "Abm7": { name: "Abm7", notes: ["Ab", "Cb", "Eb", "Gb"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "Am7": { name: "Am7", notes: ["A", "C", "E", "G"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "A#m7": { name: "A#m7", notes: ["A#", "C#", "F", "G#"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "Bbm7": { name: "Bbm7", notes: ["Bb", "Db", "F", "Ab"], intervals: [0, 3, 7, 10], quality: 'minor' },
  "Bm7": { name: "Bm7", notes: ["B", "D", "F#", "A"], intervals: [0, 3, 7, 10], quality: 'minor' },

  // ==========================================
  // УМЕНЬШЕННЫЕ (Diminished)
  // ==========================================
  "Cdim": { name: "Cdim", notes: ["C", "Eb", "Gb"], intervals: [0, 3, 6], quality: 'diminished' },
  "C#dim": { name: "C#dim", notes: ["C#", "E", "G"], intervals: [0, 3, 6], quality: 'diminished' },
  "Ddim": { name: "Ddim", notes: ["D", "F", "Ab"], intervals: [0, 3, 6], quality: 'diminished' },
  "D#dim": { name: "D#dim", notes: ["D#", "F#", "A"], intervals: [0, 3, 6], quality: 'diminished' },
  "Ebdim": { name: "Ebdim", notes: ["Eb", "Gb", "A"], intervals: [0, 3, 6], quality: 'diminished' },
  "Edim": { name: "Edim", notes: ["E", "G", "Bb"], intervals: [0, 3, 6], quality: 'diminished' },
  "Fdim": { name: "Fdim", notes: ["F", "Ab", "B"], intervals: [0, 3, 6], quality: 'diminished' },
  "F#dim": { name: "F#dim", notes: ["F#", "A", "C"], intervals: [0, 3, 6], quality: 'diminished' },
  "Gdim": { name: "Gdim", notes: ["G", "Bb", "Db"], intervals: [0, 3, 6], quality: 'diminished' },
  "G#dim": { name: "G#dim", notes: ["G#", "B", "D"], intervals: [0, 3, 6], quality: 'diminished' },
  "Abdim": { name: "Abdim", notes: ["Ab", "B", "D"], intervals: [0, 3, 6], quality: 'diminished' },
  "Adim": { name: "Adim", notes: ["A", "C", "Eb"], intervals: [0, 3, 6], quality: 'diminished' },
  "A#dim": { name: "A#dim", notes: ["A#", "C#", "E"], intervals: [0, 3, 6], quality: 'diminished' },
  "Bbdim": { name: "Bbdim", notes: ["Bb", "Db", "E"], intervals: [0, 3, 6], quality: 'diminished' },
  "Bdim": { name: "Bdim", notes: ["B", "D", "F"], intervals: [0, 3, 6], quality: 'diminished' },

  // ==========================================
  // УВЕЛИЧЕННЫЕ (Augmented)
  // ==========================================
  "Caug": { name: "Caug", notes: ["C", "E", "G#"], intervals: [0, 4, 8], quality: 'augmented' },
  "Daug": { name: "Daug", notes: ["D", "F#", "A#"], intervals: [0, 4, 8], quality: 'augmented' },
  "Eaug": { name: "Eaug", notes: ["E", "G#", "C"], intervals: [0, 4, 8], quality: 'augmented' },
  "Faug": { name: "Faug", notes: ["F", "A", "C#"], intervals: [0, 4, 8], quality: 'augmented' },
  "Gaug": { name: "Gaug", notes: ["G", "B", "D#"], intervals: [0, 4, 8], quality: 'augmented' },
  "Aaug": { name: "Aaug", notes: ["A", "C#", "F"], intervals: [0, 4, 8], quality: 'augmented' },
  "Baug": { name: "Baug", notes: ["B", "D#", "G"], intervals: [0, 4, 8], quality: 'augmented' },

  // ==========================================
  // ЗАДЕРЖАННЫЕ (Suspended)
  // ==========================================
  "Csus2": { name: "Csus2", notes: ["C", "D", "G"], intervals: [0, 2, 7], quality: 'suspended' },
  "Csus4": { name: "Csus4", notes: ["C", "F", "G"], intervals: [0, 5, 7], quality: 'suspended' },
  "Dsus2": { name: "Dsus2", notes: ["D", "E", "A"], intervals: [0, 2, 7], quality: 'suspended' },
  "Dsus4": { name: "Dsus4", notes: ["D", "G", "A"], intervals: [0, 5, 7], quality: 'suspended' },
  "Esus2": { name: "Esus2", notes: ["E", "F#", "B"], intervals: [0, 2, 7], quality: 'suspended' },
  "Esus4": { name: "Esus4", notes: ["E", "A", "B"], intervals: [0, 5, 7], quality: 'suspended' },
  "Fsus2": { name: "Fsus2", notes: ["F", "G", "C"], intervals: [0, 2, 7], quality: 'suspended' },
  "Fsus4": { name: "Fsus4", notes: ["F", "Bb", "C"], intervals: [0, 5, 7], quality: 'suspended' },
  "Gsus2": { name: "Gsus2", notes: ["G", "A", "D"], intervals: [0, 2, 7], quality: 'suspended' },
  "Gsus4": { name: "Gsus4", notes: ["G", "C", "D"], intervals: [0, 5, 7], quality: 'suspended' },
  "Asus2": { name: "Asus2", notes: ["A", "B", "E"], intervals: [0, 2, 7], quality: 'suspended' },
  "Asus4": { name: "Asus4", notes: ["A", "D", "E"], intervals: [0, 5, 7], quality: 'suspended' },
  "Bsus2": { name: "Bsus2", notes: ["B", "C#", "F#"], intervals: [0, 2, 7], quality: 'suspended' },
  "Bsus4": { name: "Bsus4", notes: ["B", "E", "F#"], intervals: [0, 5, 7], quality: 'suspended' },

  // ==========================================
  // РАСШИРЕННЫЕ АККОРДЫ (Extended)
  // ==========================================
  "C9": { name: "C9", notes: ["C", "E", "G", "Bb", "D"], intervals: [0, 4, 7, 10, 14], quality: 'dominant' },
  "D9": { name: "D9", notes: ["D", "F#", "A", "C", "E"], intervals: [0, 4, 7, 10, 14], quality: 'dominant' },
  "E9": { name: "E9", notes: ["E", "G#", "B", "D", "F#"], intervals: [0, 4, 7, 10, 14], quality: 'dominant' },
  "F9": { name: "F9", notes: ["F", "A", "C", "Eb", "G"], intervals: [0, 4, 7, 10, 14], quality: 'dominant' },
  "G9": { name: "G9", notes: ["G", "B", "D", "F", "A"], intervals: [0, 4, 7, 10, 14], quality: 'dominant' },
  "A9": { name: "A9", notes: ["A", "C#", "E", "G", "B"], intervals: [0, 4, 7, 10, 14], quality: 'dominant' },
  "B9": { name: "B9", notes: ["B", "D#", "F#", "A", "C#"], intervals: [0, 4, 7, 10, 14], quality: 'dominant' },

  "C11": { name: "C11", notes: ["C", "E", "G", "Bb", "D", "F"], intervals: [0, 4, 7, 10, 14, 17], quality: 'dominant' },
  "G11": { name: "G11", notes: ["G", "B", "D", "F", "A", "C"], intervals: [0, 4, 7, 10, 14, 17], quality: 'dominant' },

  "C13": { name: "C13", notes: ["C", "E", "G", "Bb", "A"], intervals: [0, 4, 7, 10, 21], quality: 'dominant' },
  "G13": { name: "G13", notes: ["G", "B", "D", "F", "E"], intervals: [0, 4, 7, 10, 21], quality: 'dominant' },
  "E13": { name: "E13", notes: ["E", "G#", "B", "D", "C#"], intervals: [0, 4, 7, 10, 21], quality: 'dominant' },

  // ==========================================
  // АЛЬТЕРИРОВАННЫЕ (Altered)
  // ==========================================
  "C7b9": { name: "C7b9", notes: ["C", "E", "G", "Bb", "Db"], intervals: [0, 4, 7, 10, 13], quality: 'dominant' },
  "C7#9": { name: "C7#9", notes: ["C", "E", "G", "Bb", "D#"], intervals: [0, 4, 7, 10, 15], quality: 'dominant' },
  "C7b5": { name: "C7b5", notes: ["C", "E", "Gb", "Bb"], intervals: [0, 4, 6, 10], quality: 'dominant' },
  "C7#5": { name: "C7#5", notes: ["C", "E", "G#", "Bb"], intervals: [0, 4, 8, 10], quality: 'dominant' },
  "C7b13": { name: "C7b13", notes: ["C", "E", "G", "Bb", "Ab"], intervals: [0, 4, 7, 10, 20], quality: 'dominant' },

  "G7b9": { name: "G7b9", notes: ["G", "B", "D", "F", "Ab"], intervals: [0, 4, 7, 10, 13], quality: 'dominant' },
  "G7#9": { name: "G7#9", notes: ["G", "B", "D", "F", "A#"], intervals: [0, 4, 7, 10, 15], quality: 'dominant' },
  "G7b5": { name: "G7b5", notes: ["G", "B", "Db", "F"], intervals: [0, 4, 6, 10], quality: 'dominant' },
  "G7#5": { name: "G7#5", notes: ["G", "B", "D#", "F"], intervals: [0, 4, 8, 10], quality: 'dominant' },

  "E7b9": { name: "E7b9", notes: ["E", "G#", "B", "D", "F"], intervals: [0, 4, 7, 10, 13], quality: 'dominant' },
  "E7#9": { name: "E7#9", notes: ["E", "G#", "B", "D", "G"], intervals: [0, 4, 7, 10, 15], quality: 'dominant' },
  "E7b5": { name: "E7b5", notes: ["E", "G#", "Bb", "D"], intervals: [0, 4, 6, 10], quality: 'dominant' },
  "E7#5": { name: "E7#5", notes: ["E", "G#", "C", "D"], intervals: [0, 4, 8, 10], quality: 'dominant' },

  "A7b9": { name: "A7b9", notes: ["A", "C#", "E", "G", "Bb"], intervals: [0, 4, 7, 10, 13], quality: 'dominant' },
  "A7#9": { name: "A7#9", notes: ["A", "C#", "E", "G", "C"], intervals: [0, 4, 7, 10, 15], quality: 'dominant' },

  // ==========================================
  // ДИМАНИШНЕНЫЕ СЕПТАККОРДЫ (Diminished 7)
  // ==========================================
  "Cdim7": { name: "Cdim7", notes: ["C", "Eb", "Gb", "A"], intervals: [0, 3, 6, 9], quality: 'diminished' },
  "Ddim7": { name: "Ddim7", notes: ["D", "F", "Ab", "B"], intervals: [0, 3, 6, 9], quality: 'diminished' },
  "Edim7": { name: "Edim7", notes: ["E", "G", "Bb", "Db"], intervals: [0, 3, 6, 9], quality: 'diminished' },
  "Fdim7": { name: "Fdim7", notes: ["F", "Ab", "B", "D"], intervals: [0, 3, 6, 9], quality: 'diminished' },
  "Gdim7": { name: "Gdim7", notes: ["G", "Bb", "Db", "E"], intervals: [0, 3, 6, 9], quality: 'diminished' },
  "Adim7": { name: "Adim7", notes: ["A", "C", "Eb", "Gb"], intervals: [0, 3, 6, 9], quality: 'diminished' },
  "Bdim7": { name: "Bdim7", notes: ["B", "D", "F", "Ab"], intervals: [0, 3, 6, 9], quality: 'diminished' },
};

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

/**
 * Получить определение аккорда по имени
 */
export const getChord = (name: string): ChordDefinition | undefined => {
  return CHORD_LIBRARY[name];
};

/**
 * Проверить, существует ли аккорд в библиотеке
 */
export const hasChord = (name: string): boolean => {
  return name in CHORD_LIBRARY;
};

/**
 * Получить все аккорды для конкретной тоники
 */
export const getChordsByRoot = (root: string): ChordDefinition[] => {
  return Object.values(CHORD_LIBRARY).filter(chord => chord.notes[0] === root);
};

/**
 * Получить аккорд с фолбэком (если нет в библиотеке — построить по интервалам)
 */
export const getChordWithFallback = (name: string): ChordDefinition => {
  const existing = getChord(name);
  if (existing) return existing;

  // Парсим имя аккорда
  const match = name.match(/^([A-G][#b]?)(.*)$/);
  if (!match) {
    return { name, notes: [], intervals: [], quality: 'major' };
  }

  const [, root, suffix] = match;
  const baseNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIndex = baseNotes.indexOf(root);
  
  if (rootIndex === -1) {
    return { name, notes: [], intervals: [], quality: 'major' };
  }

  // Определяем интервалы по суффиксу
  let intervals: number[] = [0, 4, 7];
  let quality: ChordDefinition['quality'] = 'major';

  if (suffix === 'm' || suffix === 'min') {
    intervals = [0, 3, 7];
    quality = 'minor';
  } else if (suffix === 'm7' || suffix === 'min7') {
    intervals = [0, 3, 7, 10];
    quality = 'minor';
  } else if (suffix === '7' || suffix === 'dom7') {
    intervals = [0, 4, 7, 10];
    quality = 'dominant';
  } else if (suffix === 'maj7' || suffix === 'Δ' || suffix === 'M7') {
    intervals = [0, 4, 7, 11];
    quality = 'major';
  } else if (suffix === 'dim' || suffix === '°') {
    intervals = [0, 3, 6];
    quality = 'diminished';
  } else if (suffix === 'dim7' || suffix === '°7') {
    intervals = [0, 3, 6, 9];
    quality = 'diminished';
  } else if (suffix === 'aug' || suffix === '+') {
    intervals = [0, 4, 8];
    quality = 'augmented';
  } else if (suffix === 'sus2') {
    intervals = [0, 2, 7];
    quality = 'suspended';
  } else if (suffix === 'sus4') {
    intervals = [0, 5, 7];
    quality = 'suspended';
  } else if (suffix === '7b9') {
    intervals = [0, 4, 7, 10, 13];
    quality = 'dominant';
  } else if (suffix === '7#9') {
    intervals = [0, 4, 7, 10, 15];
    quality = 'dominant';
  } else if (suffix === '7b5') {
    intervals = [0, 4, 6, 10];
    quality = 'dominant';
  } else if (suffix === '7#5') {
    intervals = [0, 4, 8, 10];
    quality = 'dominant';
  } else if (suffix === '9') {
    intervals = [0, 4, 7, 10, 14];
    quality = 'dominant';
  } else if (suffix === '11') {
    intervals = [0, 4, 7, 10, 14, 17];
    quality = 'dominant';
  } else if (suffix === '13') {
    intervals = [0, 4, 7, 10, 21];
    quality = 'dominant';
  } else if (suffix === 'maj9') {
    intervals = [0, 4, 7, 11, 14];
    quality = 'major';
  } else if (suffix === 'm9') {
    intervals = [0, 3, 7, 10, 14];
    quality = 'minor';
  } else if (suffix === '6') {
    intervals = [0, 4, 7, 9];
    quality = 'major';
  } else if (suffix === 'm6') {
    intervals = [0, 3, 7, 9];
    quality = 'minor';
  }

  const notes = intervals.map(interval => {
    const idx = (rootIndex + interval) % 12;
    return baseNotes[idx];
  });

  return { name, notes, intervals, quality };
};

/**
 * Получить все имена аккордов для автокомплита
 */
export const getAllChordNames = (): string[] => {
  return Object.keys(CHORD_LIBRARY);
};

/**
 * Поиск аккордов по подстроке
 */
export const searchChords = (query: string): ChordDefinition[] => {
  const lowerQuery = query.toLowerCase();
  return Object.values(CHORD_LIBRARY).filter(chord =>
    chord.name.toLowerCase().includes(lowerQuery) ||
    chord.notes.some(note => note.toLowerCase().includes(lowerQuery))
  );
};