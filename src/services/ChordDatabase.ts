export interface Voicing {
  name: string;
  baseFret: number;
  frets: (number | 'x')[]; 
}

// 📚 БАЗА ОТКРЫТЫХ АККОРДОВ (Оставляем для красоты 0-х ладов)
export const CHORD_DB: Record<string, Voicing[]> = {
  'C': [{ name: 'Open', baseFret: 1, frets: ['x', 3, 2, 0, 1, 0] }],
  'Am': [{ name: 'Open', baseFret: 1, frets: ['x', 0, 2, 2, 1, 0] }],
  'G': [{ name: 'Open', baseFret: 1, frets: [3, 2, 0, 0, 0, 3] }],
  'F': [{ name: 'E-Shape', baseFret: 1, frets: [1, 3, 3, 2, 1, 1] }],
  'D': [{ name: 'Open', baseFret: 1, frets: ['x', 'x', 0, 2, 3, 2] }],
  'E': [{ name: 'Open', baseFret: 1, frets: [0, 2, 2, 1, 0, 0] }],
  'A': [{ name: 'Open', baseFret: 1, frets: ['x', 0, 2, 2, 2, 0] }],
  'Dm': [{ name: 'Open', baseFret: 1, frets: ['x', 'x', 0, 2, 3, 1] }],
  'Em': [{ name: 'Open', baseFret: 1, frets: [0, 2, 2, 0, 0, 0] }]
};

// 🔥 УМНЫЙ АВТОГЕНЕРАТОР: Профессиональные аппликатуры для сложных гармоний
export const generateFallbackVoicing = (chord: string): Voicing[] => {
  const rootMatch = chord.match(/^[A-G][#b]?/);
  if (!rootMatch) return [];
  const root = rootMatch[0];
  const q = chord.substring(root.length);

  const eStringNotes = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'];
  const aStringNotes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
  
  const r6 = eStringNotes.indexOf(root);
  const r5 = aStringNotes.indexOf(root);

  // Находим корни. Если нота открытая (0), берем 12 лад для удобства построения закрытых форм
  let F6 = r6 <= 0 ? 12 : r6;
  let F5 = r5 <= 0 ? 12 : r5;

  // Защита от отрицательных ладов (для сложных джазовых аккордов, где есть F5 - 2)
  if (F5 < 2) F5 += 12;
  if (F6 < 2) F6 += 12;

  const voicings: Voicing[] = [];

  const add = (name: string, frets: (number|'x')[]) => {
     const validFrets = frets.filter(f => typeof f === 'number' && f > 0) as number[];
     const base = validFrets.length > 0 ? Math.min(...validFrets) : 1;
     voicings.push({ name, baseFret: base, frets });
  };

  // --- 1. МАЖОРНАЯ ГРУППА ---
  if (q === '' || q === 'maj') {
    add('E-Shape', [F6, F6+2, F6+2, F6+1, F6, F6]);
    add('A-Shape', ['x', F5, F5+2, F5+2, F5+2, F5]);
  } else if (q === 'maj7') {
    add('E-Shape (Drop 2)', [F6, 'x', F6+1, F6+1, F6, 'x']);
    add('A-Shape (Drop 2)', ['x', F5, F5+2, F5+1, F5+2, 'x']);
  } else if (q === 'maj9') {
    add('A-Shape (maj9)', ['x', F5, F5-1, F5+1, F5, 'x']);
    add('E-Shape (maj9)', [F6, 'x', F6-1, F6+1, F6, 'x']);
  } else if (q === 'maj11') {
    add('A-Shape (maj11)', ['x', F5, F5-1, F5+1, F5-2, 'x']);
  } else if (q === 'maj9#11') {
    add('A-Shape (Lydian)', ['x', F5, F5-1, F5+1, F5, F5-1]);
  } else if (q === 'maj7b9') {
    add('A-Shape (maj7b9)', ['x', F5, F5-1, F5+1, F5-1, 'x']);
  } 
  
  // --- 2. МИНОРНАЯ ГРУППА ---
  else if (q === 'm' || q === 'min') {
    add('Em-Shape', [F6, F6+2, F6+2, F6, F6, F6]);
    add('Am-Shape', ['x', F5, F5+2, F5+2, F5+1, F5]);
  } else if (q === 'm7') {
    add('Em-Shape (Drop 2)', [F6, 'x', F6, F6, F6, 'x']);
    add('Am-Shape (Drop 2)', ['x', F5, F5+2, F5, F5+1, 'x']);
  } else if (q === 'm9') {
    add('A-Shape (m9)', ['x', F5, F5-2, F5, F5, 'x']);
    add('E-Shape (m9)', [F6, 'x', F6, F6, F6+2, 'x']);
  } else if (q === 'm11') {
    add('E-Shape (m11)', [F6, 'x', F6, F6, F6-2, 'x']);
    add('A-Shape (m11)', ['x', F5, F5, F5, F5-2, 'x']);
  } else if (q === 'm7b9') {
    add('A-Shape (m7b9)', ['x', F5, F5-2, F5, F5-2, 'x']);
  }

  // --- 3. ДОМИНАНТНАЯ ГРУППА ---
  else if (q === '7') {
    add('E-Shape (Drop 2)', [F6, 'x', F6, F6+1, F6, 'x']);
    add('A-Shape (Drop 2)', ['x', F5, F5+2, F5, F5+2, 'x']);
  } else if (q === '9') {
    add('A-Shape (9)', ['x', F5, F5-1, F5, F5, 'x']);
    add('E-Shape (9)', [F6, 'x', F6-1, F6, F6, 'x']);
  } else if (q === '11') {
    add('A-Shape (11)', ['x', F5, F5, F5, F5, 'x']);
    add('E-Shape (11)', [F6, 'x', F6, F6-1, F6-2, 'x']);
  } else if (q === '7b9') {
    add('A-Shape (7b9)', ['x', F5, F5-1, F5, F5-1, 'x']);
    add('E-Shape (7b9)', [F6, 'x', F6, F6-1, F6-2, 'x']); // Diminished shape overlay
  } else if (q === '7#9') {
    add('A-Shape (Hendrix)', ['x', F5, F5-1, F5, F5+1, 'x']);
  }

  // --- 4. ПОЛУУМЕНЬШЕННЫЕ И УМЕНЬШЕННЫЕ ГРУППЫ (m7b5 / dim) ---
  else if (q === 'm7b5') {
    add('E-Shape (m7b5)', [F6, 'x', F6, F6, F6-1, 'x']);
    add('A-Shape (m7b5)', ['x', F5, F5+1, F5, F5+1, 'x']);
  } else if (q === 'm9b5') {
    add('A-Shape (m9b5)', ['x', F5, F5-2, F5+1, F5, 'x']); // Rare Locrian 9
  } else if (q === 'm7b5b9') {
    add('E-Shape (Locrian)', [F6, 'x', F6+1, F6, F6+1, 'x']);
  } else if (q === 'm11b5') {
    add('E-Shape (m11b5)', [F6, 'x', F6, F6+2, F6-1, 'x']);
  } else if (q === 'dim7' || q === '°7') {
    add('E-Shape (dim7)', [F6, 'x', F6-1, F6, F6-1, 'x']);
    add('A-Shape (dim7)', ['x', F5, F5+1, F5-1, F5+1, 'x']);
  } else if (q === 'dim' || q === '°') {
    add('A-Shape (dim)', ['x', F5, F5+1, F5+2, F5+1, 'x']);
  }

  // Если аккорд совсем экзотический и не попал ни под один паттерн - даем только тонику и квинту (Power Chord)
  if (voicings.length === 0) {
     add('Power Chord', [F6, F6+2, F6+2, 'x', 'x', 'x']);
  }

  return voicings;
};