// src/data/equipmentGuide.ts
// 📚 База знаний: настройки усилителей, педалей, гитар, микрофонов

export interface AmpSetting {
  name: string;
  gain: number;       // 0-10
  bass: number;       // 0-10
  mid: number;        // 0-10
  treble: number;     // 0-10
  presence: number;   // 0-10
  reverb: number;     // 0-10
  master: number;     // 0-10
}

export interface PedalSetting {
  name: string;
  type: 'overdrive' | 'distortion' | 'fuzz' | 'delay' | 'reverb' | 'chorus' | 'phaser' | 'flanger' | 'wah' | 'compressor' | 'tremolo';
  setting1: string; // knob/switch description
  setting2: string;
  setting3: string;
  notes: string;
}

export interface GuitarSetup {
  name: string;
  pickup: 'single' | 'humbucker' | 'p90' | 'active';
  pickupPosition: 'neck' | 'middle' | 'bridge' | 'neck+middle' | 'middle+bridge' | 'all';
  tone: number;     // 0-10
  volume: number;   // 0-10
  notes: string;
}

export interface GenrePreset {
  genre: string;
  description: string;
  amp: AmpSetting;
  pedals: PedalSetting[];
  guitar: GuitarSetup;
  eqAdvice: string;
  tips: string[];
}

export const GENRE_PRESETS: GenrePreset[] = [
  {
    genre: 'Blues',
    description: 'Classic blues tone — warm, dynamic, slightly overdriven',
    amp: { name: 'Fender Blues Jr', gain: 4, bass: 5, mid: 7, treble: 6, presence: 4, reverb: 3, master: 4 },
    pedals: [
      { name: 'Tube Screamer', type: 'overdrive', setting1: 'Drive: 3', setting2: 'Tone: 6', setting3: 'Level: 7', notes: 'Low gain, just pushing the amp' },
      { name: 'Spring Reverb', type: 'reverb', setting1: 'Mix: 3', setting2: 'Decay: 4', setting3: '-', notes: 'Subtle room ambiance' },
    ],
    guitar: { name: 'Fender Stratocaster', pickup: 'single', pickupPosition: 'neck', tone: 7, volume: 8, notes: 'Neck pickup for warm blues' },
    eqAdvice: 'Cut bass slightly, boost mids for presence, keep treble smooth',
    tips: [
      'Use finger vibrato for expressive bends',
      'Roll off volume for clean tones, dime for crunch',
      'Try neck + middle pickup position for SRV tone'
    ]
  },
  {
    genre: 'Rock',
    description: 'Classic rock crunch — punchy mids, tight low end',
    amp: { name: 'Marshall Plexi', gain: 6, bass: 6, mid: 8, treble: 7, presence: 5, reverb: 2, master: 6 },
    pedals: [
      { name: 'Distortion', type: 'distortion', setting1: 'Dist: 5', setting2: 'Tone: 6', setting3: 'Level: 7', notes: 'Rhythm crunch' },
      { name: 'Analog Delay', type: 'delay', setting1: 'Time: 350ms', setting2: 'Feedback: 3', setting3: 'Mix: 2', notes: 'Slapback for solos' },
    ],
    guitar: { name: 'Gibson Les Paul', pickup: 'humbucker', pickupPosition: 'bridge', tone: 8, volume: 7, notes: 'Bridge humbucker for punch' },
    eqAdvice: 'Boost mids, moderate bass, roll off treble slightly',
    tips: [
      'Palm mute on low strings for chug',
      'Use bridge pickup for rhythm, neck for leads',
      'Try adding a wah pedal for expressive solos'
    ]
  },
  {
    genre: 'Metal',
    description: 'High-gain metal — tight, aggressive, scooped mids',
    amp: { name: 'Mesa Boogie Dual Rectifier', gain: 8, bass: 7, mid: 3, treble: 8, presence: 7, reverb: 1, master: 5 },
    pedals: [
      { name: 'Tube Screamer (boost)', type: 'overdrive', setting1: 'Drive: 2', setting2: 'Tone: 7', setting3: 'Level: 10', notes: 'Tighten the low end, boost mids' },
      { name: 'Noise Gate', type: 'compressor', setting1: 'Threshold: -50dB', setting2: 'Decay: 100ms', setting3: '-', notes: 'Essential for high gain' },
    ],
    guitar: { name: 'ESP LTD EC-1000', pickup: 'active', pickupPosition: 'bridge', tone: 10, volume: 10, notes: 'Active pickups for clarity' },
    eqAdvice: 'Scoop mids heavily, boost bass and treble, add presence',
    tips: [
      'Use downpicking for tight rhythm',
      'Set noise gate threshold just above noise floor',
      'Try EMG 81/85 pickup combo for maximum aggression'
    ]
  },
  {
    genre: 'Jazz',
    description: 'Warm, clean jazz tone — round, smooth, articulate',
    amp: { name: 'Roland JC-120', gain: 3, bass: 5, mid: 6, treble: 4, presence: 3, reverb: 4, master: 4 },
    pedals: [
      { name: 'Compressor', type: 'compressor', setting1: 'Ratio: 4:1', setting2: 'Attack: 20ms', setting3: 'Release: 100ms', notes: 'Smooth dynamics' },
      { name: 'Chorus', type: 'chorus', setting1: 'Rate: 0.5Hz', setting2: 'Depth: 30%', setting3: 'Mix: 20%', notes: 'Subtle stereo spread' },
    ],
    guitar: { name: 'Ibanez GB10', pickup: 'humbucker', pickupPosition: 'neck', tone: 6, volume: 6, notes: 'Neck humbucker, warm tone' },
    eqAdvice: 'Roll off treble slightly, boost mids, keep bass moderate',
    tips: [
      'Use fingerstyle for warm tone',
      'Play behind the beat for laid-back feel',
      'Try flatwound strings for warmer sound'
    ]
  },
  {
    genre: 'Funk',
    description: 'Tight, percussive funk — clean with punch',
    amp: { name: 'Fender Twin Reverb', gain: 2, bass: 4, mid: 7, treble: 8, presence: 6, reverb: 3, master: 5 },
    pedals: [
      { name: 'Compressor', type: 'compressor', setting1: 'Ratio: 8:1', setting2: 'Attack: 5ms', setting3: 'Release: 50ms', notes: 'Sustain with punch' },
      { name: 'Wah', type: 'wah', setting1: 'Q: 5', setting2: '-', setting3: '-', notes: 'Cocked wah for filter' },
    ],
    guitar: { name: 'Fender Stratocaster', pickup: 'single', pickupPosition: 'middle', tone: 8, volume: 9, notes: 'Middle pickup quack' },
    eqAdvice: 'Boost treble and upper mids, cut low end for percussive attack',
    tips: [
      'Mute strings with palm for staccato',
      'Use 16th note strumming patterns',
      'Try the "in-between" pickup positions'
    ]
  },
  {
    genre: 'Country',
    description: 'Twangy, bright country — clean with spank',
    amp: { name: 'Fender Telecaster into Deluxe Reverb', gain: 3, bass: 3, mid: 5, treble: 8, presence: 7, reverb: 4, master: 5 },
    pedals: [
      { name: 'Compressor', type: 'compressor', setting1: 'Ratio: 6:1', setting2: 'Attack: 10ms', setting3: 'Release: 80ms', notes: 'Squish for chicken pickin' },
      { name: 'Slapback Delay', type: 'delay', setting1: 'Time: 100ms', setting2: 'Feedback: 1', setting3: 'Mix: 3', notes: 'Classic country slap' },
    ],
    guitar: { name: 'Fender Telecaster', pickup: 'single', pickupPosition: 'bridge', tone: 7, volume: 8, notes: 'Bridge pickup twang' },
    eqAdvice: 'Boost treble, cut mids slightly, keep bass tight',
    tips: [
      'Use hybrid picking (pick + fingers)',
      'Practice chicken pickin technique',
      'Try banjo rolls on guitar'
    ]
  }
];

export const EQ_TIPS: { freq: string; range: string; description: string; instrument: string }[] = [
  { freq: '80-200 Hz', range: 'Low Bass', description: 'Fundamental of bass guitar, kick drum. Too much = muddy', instrument: 'guitar' },
  { freq: '200-500 Hz', range: 'Low Mids', description: 'Guitar body, low end punch. Too much = boxy', instrument: 'guitar' },
  { freq: '500-1000 Hz', range: 'Mid Mids', description: 'Guitar presence, vocal clarity. Cut for metal scoop', instrument: 'guitar' },
  { freq: '1-3 kHz', range: 'High Mids', description: 'Guitar bite, pick attack. Boost for solos', instrument: 'guitar' },
  { freq: '3-6 kHz', range: 'Presence', description: 'String noise, articulation. Too much = harsh', instrument: 'guitar' },
  { freq: '6-12 kHz', range: 'Treble/Air', description: 'Cymbals, shimmer. Boost for open sound', instrument: 'guitar' },
  { freq: '40-80 Hz', range: 'Sub Bass', description: 'Kick sub, synth bass. Cut for clarity', instrument: 'bass' },
  { freq: '2-5 kHz', range: 'Bass Attack', description: 'Finger/pick noise on bass. Boost for aggression', instrument: 'bass' },
];

export const MICROPHONE_TIPS: { mic: string; placement: string; genre: string; notes: string }[] = [
  { mic: 'SM57', placement: 'On-axis, 1" from grill, edge of cone', genre: 'Rock/Metal', notes: 'Industry standard. Aggressive mid-forward sound' },
  { mic: 'SM57 + R121', placement: '57 on-axis, R121 6" back, blend', genre: 'Blues/Rock', notes: 'Classic blend. R121 adds warmth' },
  { mic: 'MD421', placement: '2" from grill, slightly off-axis', genre: 'Jazz/Clean', notes: 'Smoother than 57, more low end' },
  { mic: 'Condenser (AKG C414)', placement: '6-12" from grill, omni pattern', genre: 'Acoustic/Classical', notes: 'Captures room ambience, detailed' },
  { mic: 'E609', placement: 'Flat against grill, hangs well', genre: 'Live/Rock', notes: 'Great for live, easy placement' },
];

export const getPresetForGenre = (genre: string): GenrePreset | undefined => {
  return GENRE_PRESETS.find(p => p.genre.toLowerCase() === genre.toLowerCase());
};

export const getAllGenres = (): string[] => {
  return GENRE_PRESETS.map(p => p.genre);
};
