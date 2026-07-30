// src/services/TrackDatabase.ts
// 🧠 ФАЗА 5: База референсных треков/кейсов для обучения и AI-рекомендаций

export interface ReferenceTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  key: string;
  bpm: number;
  timeSignature: string;
  year: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  techniques: string[];
  scales: string[];
  chords: string[];
  learnings: string[];
  youtubeUrl?: string;
  tabsUrl?: string;
}

export interface StyleCaseStudy {
  id: string;
  style: string;
  artist: string;
  title: string;
  keyElements: string[];
  analysis: string;
  practiceTips: string[];
}

export const REFERENCE_TRACKS: ReferenceTrack[] = [
  {
    id: 'rt-001',
    title: 'Little Wing',
    artist: 'Jimi Hendrix',
    genre: 'Blues Rock',
    key: 'Em',
    bpm: 80,
    timeSignature: '4/4',
    year: 1967,
    difficulty: 4,
    description: 'Masterclass in chord-melody playing. Hendrix combines rhythm and lead seamlessly.',
    techniques: ['double stops', 'thumb fretting', 'vibrato', 'bend', 'chord-melody'],
    scales: ['E minor pentatonic', 'E blues', 'E dorian'],
    chords: ['Em', 'G', 'Am', 'C', 'D', 'Fmaj7'],
    learnings: [
      'Practice chord-melody approach — combine bass notes with melody on top strings',
      'Use thumb-over fretboard for bass notes (Fretting hand)',
      'Focus on feel and dynamics, not just notes'
    ],
    youtubeUrl: 'https://youtube.com/watch?v=hendrix-little-wing',
  },
  {
    id: 'rt-002',
    title: 'Eruption',
    artist: 'Van Halen',
    genre: 'Hard Rock',
    key: 'E',
    bpm: 140,
    timeSignature: '4/4',
    year: 1978,
    difficulty: 5,
    description: 'Revolutionary tapping technique that changed guitar playing forever.',
    techniques: ['tapping', 'two-hand tapping', 'whammy bar', 'harmonic', 'legato'],
    scales: ['E minor pentatonic', 'E blues', 'E harmonic minor'],
    chords: ['E5', 'A5', 'B5'],
    learnings: [
      'Start tapping slowly — accuracy over speed',
      'Use right hand index finger for tapping, keep left hand relaxed',
      'Practice the "pull-off to open string" technique'
    ],
    youtubeUrl: 'https://youtube.com/watch?v=van-halen-eruption',
  },
  {
    id: 'rt-003',
    title: 'Sultans of Swing',
    artist: 'Dire Straits',
    genre: 'Rock',
    key: 'Dm',
    bpm: 110,
    timeSignature: '4/4',
    year: 1978,
    difficulty: 4,
    description: 'Mark Knopfler\'s fingerstyle mastery. Clean, articulate, melodic.',
    techniques: ['fingerstyle', 'hybrid picking', 'slide', 'vibrato', 'volume swells'],
    scales: ['D minor pentatonic', 'D blues', 'D dorian'],
    chords: ['Dm', 'Bb', 'C', 'F', 'Am'],
    learnings: [
      'Develop fingerstyle technique — use thumb for bass, fingers for melody',
      'Practice volume swells for violin-like sustain',
      'Focus on clean articulation between notes'
    ],
    youtubeUrl: 'https://youtube.com/watch?v=knopfler-sultans',
  },
  {
    id: 'rt-004',
    title: 'Johnny B. Goode',
    artist: 'Chuck Berry',
    genre: 'Rock & Roll',
    key: 'B',
    bpm: 160,
    timeSignature: '4/4',
    year: 1958,
    difficulty: 3,
    description: 'The quintessential rock guitar intro. Double stops and rhythm.',
    techniques: ['double stops', 'chuck rhythm', 'bend', 'pentatonic runs'],
    scales: ['B minor pentatonic', 'B blues', 'B major'],
    chords: ['B', 'E', 'F#'],
    learnings: [
      'Master the "Chuck Berry" double stop rhythm',
      'Practice open string licks for country-rock flavor',
      'Focus on rhythmic precision — every note has a place'
    ],
    youtubeUrl: 'https://youtube.com/watch?v=chuck-berry-johnny',
  },
  {
    id: 'rt-005',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    genre: 'Classic Rock',
    key: 'Am',
    bpm: 80,
    timeSignature: '4/4',
    year: 1971,
    difficulty: 4,
    description: 'Iconic building solo. From melodic to aggressive.',
    techniques: ['bend', 'vibrato', 'pull-off', 'pentatonic', 'whammy'],
    scales: ['A minor pentatonic', 'A blues', 'A natural minor'],
    chords: ['Am', 'C', 'D', 'F', 'G'],
    learnings: [
      'Build dynamics — start soft, end aggressive',
      'Practice the famous "three note per string" pattern',
      'Focus on bending accuracy — Jimmy Page bends are precise'
    ],
    youtubeUrl: 'https://youtube.com/watch?v=led-zeppelin-stairway',
  },
  {
    id: 'rt-006',
    title: 'Pride and Joy',
    artist: 'Stevie Ray Vaughan',
    genre: 'Blues',
    key: 'E',
    bpm: 130,
    timeSignature: '4/4',
    year: 1983,
    difficulty: 4,
    description: 'Texas blues shuffle. SRV\'s signature style — powerful, soulful, aggressive.',
    techniques: ['shuffle rhythm', 'double stops', 'bend', 'vibrato', 'hybrid picking'],
    scales: ['E minor pentatonic', 'E blues', 'E mixolydian'],
    chords: ['E7', 'A7', 'B7'],
    learnings: [
      'Master the Texas shuffle rhythm — bass note + chuck on 2 and 4',
      'Use thick strings (.013-.056) for big tone',
      'Practice SRV\'s signature double stop bends'
    ],
    youtubeUrl: 'https://youtube.com/watch?v=srv-pride-and-joy',
  },
  {
    id: 'rt-007',
    title: 'Hotel California',
    artist: 'Eagles',
    genre: 'Classic Rock',
    key: 'Bm',
    bpm: 75,
    timeSignature: '4/4',
    year: 1976,
    difficulty: 3,
    description: 'Harmonized guitar solos. Dual lead guitar mastery.',
    techniques: ['harmonized leads', 'bend', 'vibrato', 'legato', 'double stops'],
    scales: ['B minor pentatonic', 'B blues', 'B natural minor'],
    chords: ['Bm', 'F#', 'A', 'E', 'G', 'D'],
    learnings: [
      'Practice harmonized scales with another guitarist',
      'Focus on melodic phrasing — every note serves the song',
      'Study the trade-off between the two guitarists'
    ],
    youtubeUrl: 'https://youtube.com/watch?v=eagles-hotel-california',
  },
  {
    id: 'rt-008',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    genre: 'Progressive Rock',
    key: 'Bb',
    bpm: 72,
    timeSignature: '4/4',
    year: 1975,
    difficulty: 4,
    description: 'Brian May\'s unique tone and melodic approach. Rock opera guitar.',
    techniques: ['tremolo picking', 'bend', 'vibrato', 'slide', 'harmony'],
    scales: ['Bb major', 'Bb minor pentatonic', 'Bb blues'],
    chords: ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm'],
    learnings: [
      'Brian May uses a coin as a pick — try different pick materials',
      'Practice the "Brighton Rock" style harmonized solo',
      'Focus on dynamic range — from whisper to scream'
    ],
    youtubeUrl: 'https://youtube.com/watch?v=queen-bohemian',
  },
];

export const STYLE_CASE_STUDIES: StyleCaseStudy[] = [
  {
    id: 'style-001',
    style: 'Blues',
    artist: 'B.B. King',
    title: 'The Thrill is Gone',
    keyElements: ['Single note bends', 'Vibrato', 'Call and response', 'Economy of notes'],
    analysis: 'B.B. King proves that one perfectly bent note is worth more than a thousand fast ones. His vibrato is legendary — wide, slow, and vocal. Every phrase tells a story.',
    practiceTips: [
      'Practice bending to pitch — use a tuner to verify',
      'Develop a wide, slow vibrato (like a singer)',
      'Play fewer notes, but make each one count',
      'Use call and response: play a phrase, then "answer" it'
    ]
  },
  {
    id: 'style-002',
    style: 'Jazz',
    artist: 'Joe Pass',
    title: 'Virtuoso',
    keyElements: ['Chord melody', 'Walking bass', 'Comping', 'Improvisation'],
    analysis: 'Joe Pass could play solo guitar like a full band. His chord-melody approach combines bass lines, chords, and melody simultaneously — a complete orchestra in 6 strings.',
    practiceTips: [
      'Learn drop 2 and drop 3 voicings in all positions',
      'Practice walking bass lines on low strings while comping',
      'Study chord substitution — tritone, diminished, altered',
      'Transcribe Joe Pass solos to understand his voice leading'
    ]
  },
  {
    id: 'style-003',
    style: 'Metal',
    artist: 'Dimebag Darrell',
    title: 'Cowboys from Hell',
    keyElements: ['Pinch harmonics', 'Fast alternate picking', 'Groove riffs', 'Whammy bar'],
    analysis: 'Dimebag\'s style is all about aggression and groove. His pinch harmonics are signature — squealing, controlled, and perfectly placed in the rhythm.',
    practiceTips: [
      'Practice pinch harmonics at different pick angles',
      'Develop fast alternate picking with a metronome',
      'Write riffs that groove — pocket is more important than speed',
      'Use the Floyd Rose tremolo for dramatic dives'
    ]
  },
  {
    id: 'style-004',
    style: 'Funk',
    artist: 'Nile Rodgers',
    title: 'Le Freak / Good Times',
    keyElements: ['Staccato rhythm', 'Muted strings', '16th note feel', 'Hendrix chord voicings'],
    analysis: 'Nile Rodgers defines funk guitar. His "chucking" technique — muting strings with the fretting hand while strumming percussive 16th notes — is the foundation of disco and funk.',
    practiceTips: [
      'Practice 16th note strumming with strict muting',
      'Use Hendrix-style thumb-over chords for extended voicings',
      'Focus on the "off" beat — funk lives in the space between',
      'Keep the high E string ringing for the "disco" sound'
    ]
  },
  {
    id: 'style-005',
    style: 'Fusion',
    artist: 'John McLaughlin',
    title: 'Mahavishnu Orchestra',
    keyElements: ['Odd time signatures', 'Fast alternate picking', 'Eastern scales', 'Complex harmony'],
    analysis: 'McLaughlin brought Eastern philosophy to Western electric guitar. His use of odd time signatures (5/4, 7/8, 19/16) and lightning-fast precision redefined guitar virtuosity.',
    practiceTips: [
      'Practice with a metronome on odd time signatures',
      'Learn the double harmonic (Byzantine) scale',
      'Develop cross-picking patterns across strings',
      'Study Indian classical music for phrasing ideas'
    ]
  },
];

export const getTrackById = (id: string): ReferenceTrack | undefined => {
  return REFERENCE_TRACKS.find(t => t.id === id);
};

export const getTracksByGenre = (genre: string): ReferenceTrack[] => {
  const lower = genre.toLowerCase();
  return REFERENCE_TRACKS.filter(t => t.genre.toLowerCase().includes(lower));
};

export const getTracksByDifficulty = (level: 1 | 2 | 3 | 4 | 5): ReferenceTrack[] => {
  return REFERENCE_TRACKS.filter(t => t.difficulty === level);
};

export const getCaseStudyByStyle = (style: string): StyleCaseStudy | undefined => {
  return STYLE_CASE_STUDIES.find(s => s.style.toLowerCase() === style.toLowerCase());
};

export const getRecommendedTracksForScale = (scaleName: string): ReferenceTrack[] => {
  const lower = scaleName.toLowerCase();
  return REFERENCE_TRACKS.filter(t => 
    t.scales.some(s => s.toLowerCase().includes(lower))
  );
};

export const getRecommendedTracksForTechnique = (technique: string): ReferenceTrack[] => {
  const lower = technique.toLowerCase();
  return REFERENCE_TRACKS.filter(t => 
    t.techniques.some(tech => tech.toLowerCase().includes(lower))
  );
};
