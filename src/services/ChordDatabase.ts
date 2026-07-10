export interface Voicing {
  name: string;
  baseFret: number;
  frets: (number | 'x')[]; 
}

export const CHORD_DB: Record<string, Voicing[]> = {
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
    { name: 'Barre', baseFret: 1, frets: [1, 3, 3, 2, 1, 1] },
    { name: 'A-Shape', baseFret: 8, frets: ['x', 8, 10, 10, 10, 8] }
  ]
};

export const generateFallbackVoicing = (chord: string): Voicing[] => {
  const root = chord.replace(/m|dim|aug|7|maj7|\+/g, '');
  const quality = chord.replace(root, '');

  const eStringNotes = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'];
  const aStringNotes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
  
  const fret6 = eStringNotes.indexOf(root);
  const fret5 = aStringNotes.indexOf(root);

  const voicings: Voicing[] = [];

  if (quality === '' || quality === '7' || quality === 'maj7') {
    if (fret6 >= 0) voicings.push({ name: 'E-Shape', baseFret: fret6 || 1, frets: [fret6, fret6+2, fret6+2, fret6+1, fret6, fret6] });
    if (fret5 >= 0) voicings.push({ name: 'A-Shape', baseFret: fret5 || 1, frets: ['x', fret5, fret5+2, fret5+2, fret5+2, fret5] });
  } else if (quality === 'm' || quality === 'm7') {
    if (fret6 >= 0) voicings.push({ name: 'Em-Shape', baseFret: fret6 || 1, frets: [fret6, fret6+2, fret6+2, fret6, fret6, fret6] });
    if (fret5 >= 0) voicings.push({ name: 'Am-Shape', baseFret: fret5 || 1, frets: ['x', fret5, fret5+2, fret5+2, fret5+1, fret5] });
  } else if (quality === 'dim' || quality === '°') {
    if (fret5 >= 0) voicings.push({ name: 'Dim-Shape', baseFret: fret5 || 1, frets: ['x', fret5, fret5+1, fret5+2, fret5+1, 'x'] });
  }

  return voicings;
};