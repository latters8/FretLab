// src/utils/equipmentTips.ts
// 🎯 ФАЗА 4: Генератор советов по оборудованию

// Note: equipment tips functions reference internal data only

export interface EquipmentTip {
  icon: string;
  title: string;
  description: string;
  category: 'amp' | 'pedal' | 'guitar' | 'mic' | 'general' | 'recording';
  priority: 1 | 2 | 3;
  relatedGenres: string[];
}

const GENERAL_TIPS: EquipmentTip[] = [
  {
    icon: '🔌',
    title: 'Always use a tuner pedal',
    description: 'A dedicated tuner pedal in your chain ensures you\'re always in tune. The TC Electronic PolyTune or Boss TU-3 are industry standards.',
    category: 'general',
    priority: 1,
    relatedGenres: ['All']
  },
  {
    icon: '🔊',
    title: 'Gain staging is everything',
    description: 'Keep your signal chain clean. Too much gain early = noise. Set your amp clean, then add pedals one at a time.',
    category: 'general',
    priority: 1,
    relatedGenres: ['All']
  },
  {
    icon: '⚡',
    title: 'Power supply matters',
    description: 'A isolated power supply (like Truetone CS12 or Strymon Zuma) eliminates hum and noise from daisy-chained pedals.',
    category: 'general',
    priority: 2,
    relatedGenres: ['All']
  },
  {
    icon: '🎛️',
    title: 'Less is more with effects',
    description: 'Great tone comes from great playing, not from 10 pedals. Start with 3-4 essential pedals and learn them deeply.',
    category: 'general',
    priority: 2,
    relatedGenres: ['All']
  },
  {
    icon: '🔋',
    title: 'Change your strings regularly',
    description: 'Dead strings = dead tone. Change strings every 20-30 hours of play. For recording, change them every session.',
    category: 'general',
    priority: 1,
    relatedGenres: ['All']
  },
  {
    icon: '🎚️',
    title: 'Buffer pedals for long cable runs',
    description: 'If you have more than 20ft of cable, use a buffer pedal (or one with a buffer built-in) to preserve high-end frequencies.',
    category: 'general',
    priority: 3,
    relatedGenres: ['All']
  },
];

const AMP_TIPS: EquipmentTip[] = [
  {
    icon: '🔊',
    title: 'Tube amps: warm up properly',
    description: 'Let your tube amp warm up for 15-30 seconds before playing, and 30 minutes before recording. Tube bias affects tone.',
    category: 'amp',
    priority: 1,
    relatedGenres: ['Rock', 'Blues', 'Metal', 'Jazz']
  },
  {
    icon: '🎛️',
    title: 'Master volume trick',
    description: 'For power tube distortion at low volumes: crank the master, lower the channel volume. Or use an attenuator like the Two Notes Torpedo.',
    category: 'amp',
    priority: 2,
    relatedGenres: ['Rock', 'Blues']
  },
  {
    icon: '🔥',
    title: 'BIAS your amp correctly',
    description: 'Proper bias = longer tube life and better tone. If you don\'t know how, take your amp to a tech. Cold bias = thin, hot bias = short tube life.',
    category: 'amp',
    priority: 2,
    relatedGenres: ['All']
  },
  {
    icon: '⚡',
    title: 'Speaker impedance matching',
    description: 'Always match speaker impedance (Ω) to your amp head. 8Ω head → 8Ω cab. Mismatch can damage your amp.',
    category: 'amp',
    priority: 1,
    relatedGenres: ['All']
  },
  {
    icon: '🎚️',
    title: 'The "Presence" control',
    description: 'Presence is a negative feedback control that affects high frequencies. Higher presence = more "cut" and shimmer. Lower = smoother, warmer.',
    category: 'amp',
    priority: 3,
    relatedGenres: ['Rock', 'Metal']
  },
];

const PEDAL_TIPS: EquipmentTip[] = [
  {
    icon: '🔲',
    title: 'Pedal order: tuner > wah > comp > dirt > mod > delay > reverb',
    description: 'Standard pedal chain: Tuner → Wah/Filter → Compressor → Overdrive/Distortion → Modulation (Chorus/Flanger) → Delay → Reverb → Amp.',
    category: 'pedal',
    priority: 1,
    relatedGenres: ['All']
  },
  {
    icon: '🎛️',
    title: 'Overdrive before distortion',
    description: 'Placing an overdrive (like a Tube Screamer) before a distortion pedal tightens the low end and adds mid-range punch. A classic trick.',
    category: 'pedal',
    priority: 1,
    relatedGenres: ['Rock', 'Metal', 'Blues']
  },
  {
    icon: '🌀',
    title: 'Delay in the FX loop',
    description: 'For the cleanest delay/echo sound, put time-based effects (delay, reverb) in the amp\'s effects loop, not in front of the amp.',
    category: 'pedal',
    priority: 2,
    relatedGenres: ['Rock', 'Blues', 'Ambient']
  },
  {
    icon: '🔊',
    title: 'Compressor at the start of chain',
    description: 'Compressor first (after tuner) evens out your picking dynamics before any dirt pedals. This gives you sustain and consistent attack.',
    category: 'pedal',
    priority: 2,
    relatedGenres: ['Country', 'Blues', 'Funk']
  },
  {
    icon: '🎸',
    title: 'True bypass vs buffered',
    description: 'True bypass = signal passes through unaffected when off. Buffered = always has a buffer (good for long cable runs). Mix both for best results.',
    category: 'pedal',
    priority: 3,
    relatedGenres: ['All']
  },
];

const GUITAR_TIPS: EquipmentTip[] = [
  {
    icon: '🎸',
    title: 'Pickup height affects tone',
    description: 'Pickups too close to strings = loud but muddy with less sustain. Too far = weak signal. Start at 3/32" on bass side, 2/32" on treble.',
    category: 'guitar',
    priority: 1,
    relatedGenres: ['All']
  },
  {
    icon: '🎛️',
    title: 'Volume knob cleaning trick',
    description: 'Rolling back your guitar volume to 7-8 cleans up gain while keeping character. This is how players like Hendrix got clean/dirty tones from one amp.',
    category: 'guitar',
    priority: 1,
    relatedGenres: ['Rock', 'Blues']
  },
  {
    icon: '🔧',
    title: 'Intonation: the secret to in-tune chords',
    description: 'If your chords sound out of tune even when the open strings are tuned, you need intonation. Adjust saddle position until the 12th fret harmonic matches the fretted note.',
    category: 'guitar',
    priority: 1,
    relatedGenres: ['All']
  },
  {
    icon: '📏',
    title: 'Action height (string height)',
    description: 'Lower action = easier to play but more fret buzz. Higher action = better sustain and cleaner sound. Find your sweet spot.',
    category: 'guitar',
    priority: 2,
    relatedGenres: ['All']
  },
  {
    icon: '🎵',
    title: 'Pick thickness matters',
    description: 'Thin picks (0.46-0.60mm) = flexible, bright. Medium (0.60-0.80mm) = versatile. Thick (0.80-1.5mm) = precise, darker tone. Try different ones!',
    category: 'guitar',
    priority: 2,
    relatedGenres: ['All']
  },
];

const RECORDING_TIPS: EquipmentTip[] = [
  {
    icon: '🎤',
    title: 'The 3:1 microphone rule',
    description: 'When using two mics on the same source, place them 3x farther apart than the distance from each mic to the source. This prevents phase cancellation.',
    category: 'recording',
    priority: 1,
    relatedGenres: ['All']
  },
  {
    icon: '🎛️',
    title: 'Record at 24-bit/48kHz',
    description: '24-bit gives you more dynamic range than 16-bit. 48kHz is standard for video and streaming. Higher sample rates (96kHz) use more CPU with minimal benefit.',
    category: 'recording',
    priority: 1,
    relatedGenres: ['All']
  },
  {
    icon: '🎚️',
    title: 'Leave headroom (-6dB is safe)',
    description: 'Record so your loudest peak hits -6dB. This gives you headroom for mixing and prevents digital clipping. Don\'t record in the red!',
    category: 'recording',
    priority: 1,
    relatedGenres: ['All']
  },
  {
    icon: '🔇',
    title: 'Noise floor matters',
    description: 'Turn off everything in the room: AC, fridge, computer fans. Record at a quiet time. Even a silent room has a noise floor of ~20dB.',
    category: 'recording',
    priority: 2,
    relatedGenres: ['All']
  },
  {
    icon: '🎧',
    title: 'Use reference tracks',
    description: 'Compare your mix to professional tracks in the same genre. Listen on headphones, speakers, phone, car — if it sounds good everywhere, it\'s a good mix.',
    category: 'recording',
    priority: 2,
    relatedGenres: ['All']
  },
];

const ALL_TIPS: EquipmentTip[] = [
  ...GENERAL_TIPS,
  ...AMP_TIPS,
  ...PEDAL_TIPS,
  ...GUITAR_TIPS,
  ...RECORDING_TIPS,
];

export function getAllEquipmentTips(): EquipmentTip[] {
  return ALL_TIPS;
}

export function getEquipmentTipsByCategory(category: EquipmentTip['category']): EquipmentTip[] {
  return ALL_TIPS.filter(t => t.category === category);
}

export function getEquipmentTipsByGenre(genre: string): EquipmentTip[] {
  return ALL_TIPS.filter(t => 
    t.relatedGenres.includes('All') || 
    t.relatedGenres.some(g => g.toLowerCase() === genre.toLowerCase())
  );
}

export function getRandomEquipmentTip(): EquipmentTip {
  return ALL_TIPS[Math.floor(Math.random() * ALL_TIPS.length)];
}

export function getEquipmentTipsForCurrentPreset(presetGenre: string): EquipmentTip[] {
  const genreTips = getEquipmentTipsByGenre(presetGenre);
  const generalTips = getEquipmentTipsByCategory('general');
  const ampTips = getEquipmentTipsByCategory('amp');
  
  const selected = [
    ...genreTips.slice(0, 2),
    ...generalTips.slice(0, 2),
    ...ampTips.slice(0, 1),
  ].filter(Boolean);
  
  return selected.sort(() => Math.random() - 0.5);
}

export function getEquipmentTipSummary(): string {
  const tip = getRandomEquipmentTip();
  return `${tip.icon} ${tip.title}: ${tip.description.slice(0, 100)}...`;
}
