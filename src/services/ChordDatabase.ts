export interface Voicing {
  name: string;
  baseFret: number;
  frets: (number | 'x')[]; 
}

export const CHORD_DB: Record<string, Voicing[]> = {
  // Базовые открытые аккорды оставляем для красоты на нулевых ладах
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

// 🔥 УМНЫЙ АВТОГЕНЕРАТОР: Сам вычисляет любые надстройки!
export const generateFallbackVoicing = (chord: string): Voicing[] => {
  const rootMatch = chord.match(/^[A-G][#b]?/);
  if (!rootMatch) return [];
  const root = rootMatch[0];
  const quality = chord.substring(root.length);

  const eStringNotes = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'];
  const aStringNotes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
  
  const r6 = eStringNotes.indexOf(root);
  const r5 = aStringNotes.indexOf(root);

  // Находим корень на 6-й и 5-й струне (если открытая - берем 12-й лад для красивых закрытых форм)
  const F6 = r6 <= 0 ? 12 : r6;
  const F5 = r5 <= 0 ? 12 : r5;

  const voicings: Voicing[] = [];

  // Вспомогательная функция для автоматического расчета базового лада
  const add = (name: string, frets: (number|'x')[]) => {
     const validFrets = frets.filter(f => typeof f === 'number' && f > 0) as number[];
     const base = validFrets.length > 0 ? Math.min(...validFrets) : 1;
     voicings.push({ name, baseFret: base, frets });
  };

  // ТРЕЗВУЧИЯ И СЕПТАККОРДЫ
  if (quality === '' || quality === 'maj') {
    add('E-Shape', [F6, F6+2, F6+2, F6+1, F6, F6]);
    add('A-Shape', ['x', F5, F5+2, F5+2, F5+2, F5]);
  } else if (quality === 'm' || quality === 'min') {
    add('Em-Shape', [F6, F6+2, F6+2, F6, F6, F6]);
    add('Am-Shape', ['x', F5, F5+2, F5+2, F5+1, F5]);
  } else if (quality === 'maj7') {
    add('E-Shape', [F6, 'x', F6+1, F6+1, F6, 'x']);
    add('A-Shape', ['x', F5, F5+2, F5+1, F5+2, F5]);
  } else if (quality === 'm7') {
    add('Em-Shape', [F6, 'x', F6, F6, F6, 'x']);
    add('Am-Shape', ['x', F5, F5+2, F5, F5+1, F5]);
  } else if (quality === '7') {
    add('E-Shape', [F6, 'x', F6, F6+1, F6, 'x']);
    add('A-Shape', ['x', F5, F5+2, F5, F5+2, F5]);
  } else if (quality === 'm7b5') {
    add('E-Shape', [F6, 'x', F6, F6, F6-1, 'x']);
    add('A-Shape', ['x', F5, F5+1, F5, F5+1, 'x']);
  } else if (quality === 'dim' || quality === '°') {
    add('A-Shape', ['x', F5, F5+1, F5+2, F5+1, 'x']);
  } else if (quality === 'dim7' || quality === '°7') {
    add('E-Shape', [F6, 'x', F6-1, F6, F6-1, 'x']);
    add('A-Shape', ['x', F5, F5+1, F5-1, F5+1, 'x']);
  } 
  // 🔥 ПРОДВИНУТЫЕ ДЖАЗОВЫЕ НАДСТРОЙКИ (ALT, 9, 11)
  else if (quality === '9') {
    add('A-Shape', ['x', F5, F5-1, F5, F5, 'x']);
    add('E-Shape', [F6, 'x', F6-1, F6, F6, 'x']);
  } else if (quality === 'm9') {
    add('A-Shape', ['x', F5, F5-2, F5, F5, 'x']);
  } else if (quality === 'maj9') {
    add('A-Shape', ['x', F5, F5-1, F5+1, F5, 'x']);
  } else if (quality === '11') {
    add('A-Shape (sus4)', ['x', F5, F5, F5, F5, 'x']); // Часто играется как 9sus4
  } else if (quality === 'm11') {
    add('E-Shape', [F6, 'x', F6, F6, F6-2, 'x']);
  } else if (quality === '7#9') {
    add('Hendrix Chord', ['x', F5, F5-1, F5, F5+1, 'x']); // Легендарный 7#9
  }

  // Если аккорд совсем экзотический - даем хотя бы тонику
  if (voicings.length === 0) {
     add('Root Only', [F6, 'x', 'x', 'x', 'x', 'x']);
  }

  return voicings;
};