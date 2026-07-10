export interface Voicing {
  name: string;
  baseFret: number;
  frets: (number | 'x')[]; 
}

export const CHORD_DB: Record<string, Voicing[]> = {
  // --- ТРЕЗВУЧИЯ ---
  'C': [
    { name: 'Open', baseFret: 1, frets: ['x', 3, 2, 0, 1, 0] },
    { name: 'A-Shape', baseFret: 3, frets: ['x', 3, 5, 5, 5, 3] },
  ],
  'Am': [
    { name: 'Open', baseFret: 1, frets: ['x', 0, 2, 2, 1, 0] },
    { name: 'E-Shape', baseFret: 5, frets: [5, 7, 7, 5, 5, 5] }
  ],
  'G': [
    { name: 'Open', baseFret: 1, frets: [3, 2, 0, 0, 0, 3] },
    { name: 'E-Shape', baseFret: 3, frets: [3, 5, 5, 4, 3, 3] }
  ],
  'F': [
    { name: 'E-Shape', baseFret: 1, frets: [1, 3, 3, 2, 1, 1] },
    { name: 'A-Shape', baseFret: 8, frets: ['x', 8, 10, 10, 10, 8] }
  ],
  
  // --- МАЖОРНЫЕ СЕПТАККОРДЫ (maj7) ---
  'Cmaj7': [
    { name: 'Open', baseFret: 1, frets: ['x', 3, 2, 0, 0, 0] },
    { name: 'A-Shape', baseFret: 3, frets: ['x', 3, 5, 4, 5, 3] }
  ],
  'Fmaj7': [
    { name: 'Open', baseFret: 1, frets: ['x', 'x', 3, 2, 1, 0] },
    { name: 'A-Shape', baseFret: 8, frets: ['x', 8, 10, 9, 10, 8] }
  ],
  'Gmaj7': [
    { name: 'E-Shape', baseFret: 3, frets: [3, 'x', 4, 4, 3, 'x'] },
    { name: 'A-Shape', baseFret: 10, frets: ['x', 10, 12, 11, 12, 10] }
  ],

  // --- МИНОРНЫЕ СЕПТАККОРДЫ (m7) ---
  'Am7': [
    { name: 'Open', baseFret: 1, frets: ['x', 0, 2, 0, 1, 0] },
    { name: 'E-Shape', baseFret: 5, frets: [5, 7, 5, 5, 5, 5] }
  ],
  'Em7': [
    { name: 'Open', baseFret: 1, frets: [0, 2, 2, 0, 3, 0] },
    { name: 'A-Shape', baseFret: 7, frets: ['x', 7, 9, 7, 8, 7] }
  ],
  'Dm7': [
    { name: 'Open', baseFret: 1, frets: ['x', 'x', 0, 2, 1, 1] },
    { name: 'A-Shape', baseFret: 5, frets: ['x', 5, 7, 5, 6, 5] }
  ],
  'Bm7': [
    { name: 'A-Shape', baseFret: 2, frets: ['x', 2, 4, 2, 3, 2] },
    { name: 'E-Shape', baseFret: 7, frets: [7, 9, 7, 7, 7, 7] }
  ],

  // --- ДОМИНАНТОВЫЕ (7) ---
  'G7': [
    { name: 'Open', baseFret: 1, frets: [3, 2, 0, 0, 0, 1] },
    { name: 'E-Shape', baseFret: 3, frets: [3, 5, 3, 4, 3, 3] }
  ],
  'E7': [
    { name: 'Open', baseFret: 1, frets: [0, 2, 0, 1, 0, 0] },
    { name: 'A-Shape', baseFret: 7, frets: ['x', 7, 9, 7, 9, 7] }
  ],
  'A7': [
    { name: 'Open', baseFret: 1, frets: ['x', 0, 2, 0, 2, 0] },
    { name: 'E-Shape', baseFret: 5, frets: [5, 7, 5, 6, 5, 5] }
  ],
  
  // --- ПОЛУУМЕНЬШЕННЫЕ (m7b5) ---
  'Bm7b5': [
    { name: 'A-Shape', baseFret: 2, frets: ['x', 2, 3, 2, 3, 'x'] },
    { name: 'E-Shape', baseFret: 7, frets: [7, 'x', 7, 7, 6, 'x'] }
  ]
};

// 🔥 УМНЫЙ АВТОГЕНЕРАТОР: Если аккорда нет в базе, собираем его по CAGED формам
export const generateFallbackVoicing = (chord: string): Voicing[] => {
  const rootMatch = chord.match(/^[A-G][#b]?/);
  if (!rootMatch) return [];
  const root = rootMatch[0];
  const quality = chord.replace(root, '');

  const eStringNotes = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'];
  const aStringNotes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
  
  const rootIndex6 = eStringNotes.indexOf(root);
  const rootIndex5 = aStringNotes.indexOf(root);

  const fret6 = rootIndex6 === 0 ? 12 : rootIndex6; // E на 12 ладу
  const fret5 = rootIndex5 === 0 ? 12 : rootIndex5; // A на 12 ладу

  const voicings: Voicing[] = [];

  if (quality === '' || quality === 'maj') {
    if (fret6 >= 0) voicings.push({ name: 'E-Shape', baseFret: fret6, frets: [fret6, fret6+2, fret6+2, fret6+1, fret6, fret6] });
    if (fret5 >= 0) voicings.push({ name: 'A-Shape', baseFret: fret5, frets: ['x', fret5, fret5+2, fret5+2, fret5+2, fret5] });
  } else if (quality === 'm') {
    if (fret6 >= 0) voicings.push({ name: 'Em-Shape', baseFret: fret6, frets: [fret6, fret6+2, fret6+2, fret6, fret6, fret6] });
    if (fret5 >= 0) voicings.push({ name: 'Am-Shape', baseFret: fret5, frets: ['x', fret5, fret5+2, fret5+2, fret5+1, fret5] });
  } else if (quality === 'maj7') {
    if (fret6 >= 0) voicings.push({ name: 'E-Shape', baseFret: fret6, frets: [fret6, 'x', fret6+1, fret6+1, fret6, 'x'] });
    if (fret5 >= 0) voicings.push({ name: 'A-Shape', baseFret: fret5, frets: ['x', fret5, fret5+2, fret5+1, fret5+2, fret5] });
  } else if (quality === 'm7') {
    if (fret6 >= 0) voicings.push({ name: 'Em-Shape', baseFret: fret6, frets: [fret6, fret6+2, fret6, fret6, fret6, fret6] });
    if (fret5 >= 0) voicings.push({ name: 'Am-Shape', baseFret: fret5, frets: ['x', fret5, fret5+2, fret5, fret5+1, fret5] });
  } else if (quality === '7') {
    if (fret6 >= 0) voicings.push({ name: 'E-Shape', baseFret: fret6, frets: [fret6, fret6+2, fret6, fret6+1, fret6, fret6] });
    if (fret5 >= 0) voicings.push({ name: 'A-Shape', baseFret: fret5, frets: ['x', fret5, fret5+2, fret5, fret5+2, fret5] });
  } else if (quality === 'm7b5') {
    if (fret5 >= 0) voicings.push({ name: 'A-Shape', baseFret: fret5, frets: ['x', fret5, fret5+1, fret5, fret5+1, 'x'] });
  } else if (quality === 'dim' || quality === '°') {
    if (fret5 >= 0) voicings.push({ name: 'Dim-Shape', baseFret: fret5, frets: ['x', fret5, fret5+1, fret5+2, fret5+1, 'x'] });
  } else if (quality === 'dim7' || quality === '°7') {
    if (fret5 >= 0) voicings.push({ name: 'Dim7-Shape', baseFret: fret5, frets: ['x', fret5, fret5+1, fret5, fret5+1, 'x'] });
  }

  return voicings;
};