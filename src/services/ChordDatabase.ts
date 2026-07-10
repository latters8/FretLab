export interface Voicing {
  name: string;
  baseFret: number;
  frets: (number | 'x')[]; 
}

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

// 🔥 УМНЫЙ АВТОГЕНЕРАТОР: Сам вычисляет любые диатонические надстройки
export const generateFallbackVoicing = (chord: string): Voicing[] => {
  const rootMatch = chord.match(/^[A-G][#b]?/);
  if (!rootMatch) return [];
  const root = rootMatch[0];
  const q = chord.substring(root.length);

  const eStringNotes = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'];
  const aStringNotes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
  
  const r6 = eStringNotes.indexOf(root);
  const r5 = aStringNotes.indexOf(root);

  const F6 = r6 <= 0 ? 12 : r6;
  const F5 = r5 <= 0 ? 12 : r5;

  const voicings: Voicing[] = [];
  const add = (name: string, frets: (number|'x')[]) => {
     const validFrets = frets.filter(f => typeof f === 'number' && f > 0) as number[];
     const base = validFrets.length > 0 ? Math.min(...validFrets) : 1;
     voicings.push({ name, baseFret: base, frets });
  };

  if (q === '' || q === 'maj') {
    add('E-Shape', [F6, F6+2, F6+2, F6+1, F6, F6]);
    add('A-Shape', ['x', F5, F5+2, F5+2, F5+2, F5]);
  } else if (q === 'm' || q === 'min') {
    add('Em-Shape', [F6, F6+2, F6+2, F6, F6, F6]);
    add('Am-Shape', ['x', F5, F5+2, F5+2, F5+1, F5]);
  } else if (q.includes('maj11') || q.includes('maj9#11') || q.includes('maj9')) {
    add('A-Shape (maj9)', ['x', F5, F5-1, F5+1, F5, 'x']);
    add('E-Shape (maj9)', [F6, 'x', F6-1, F6+1, F6, 'x']);
  } else if (q.includes('m11')) {
    add('E-Shape (m11)', [F6, 'x', F6, F6, F6-2, 'x']);
    add('A-Shape (m11)', ['x', F5, F5, F5, F5-2, 'x']);
  } else if (q.includes('11') && !q.includes('m') && !q.includes('maj')) {
    add('A-Shape (11)', ['x', F5, F5, F5, F5, 'x']);
    add('E-Shape (11)', [F6, 'x', F6, F6-1, F6-2, 'x']);
  } else if (q.includes('m9')) {
    add('A-Shape (m9)', ['x', F5, F5-2, F5, F5, 'x']);
    add('E-Shape (m9)', [F6, 'x', F6, F6, F6+2, 'x']);
  } else if (q.includes('7#9')) {
    add('Hendrix 7#9', ['x', F5, F5-1, F5, F5+1, 'x']);
  } else if (q.includes('7b9')) {
    add('A-Shape (7b9)', ['x', F5, F5-1, F5, F5-1, 'x']);
  } else if (q.includes('9') && !q.includes('m') && !q.includes('maj')) {
    add('A-Shape (9)', ['x', F5, F5-1, F5, F5, 'x']);
    add('E-Shape (9)', [F6, 'x', F6-1, F6, F6, 'x']);
  } else if (q.includes('maj7')) {
    add('E-Shape', [F6, 'x', F6+1, F6+1, F6, 'x']);
    add('A-Shape', ['x', F5, F5+2, F5+1, F5+2, F5]);
  } else if (q.includes('m7b5') || q.includes('9b5') || q.includes('11b5')) {
    add('E-Shape', [F6, 'x', F6, F6, F6-1, 'x']);
    add('A-Shape', ['x', F5, F5+1, F5, F5+1, 'x']);
  } else if (q.includes('m7')) {
    add('Em-Shape', [F6, 'x', F6, F6, F6, 'x']);
    add('Am-Shape', ['x', F5, F5+2, F5, F5+1, F5]);
  } else if (q.includes('dim7') || q.includes('°7')) {
    add('E-Shape', [F6, 'x', F6-1, F6, F6-1, 'x']);
    add('A-Shape', ['x', F5, F5+1, F5-1, F5+1, 'x']);
  } else if (q.includes('dim') || q.includes('°')) {
    add('A-Shape', ['x', F5, F5+1, F5+2, F5+1, 'x']);
  } else if (q.includes('7') && !q.includes('m') && !q.includes('maj')) {
    add('E-Shape', [F6, 'x', F6, F6+1, F6, 'x']);
    add('A-Shape', ['x', F5, F5+2, F5, F5+2, F5]);
  }

  if (voicings.length === 0) {
     add('Root Only', [F6, 'x', 'x', 'x', 'x', 'x']);
  }

  return voicings;
};