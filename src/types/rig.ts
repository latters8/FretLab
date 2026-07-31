export type CompressorHQType =
  | 'optical' | 'fet' | 'vca' | 'tube' | 'brickwall'
  | 'master-bus' | 'punch' | 'glue' | 'de-esser' | 'custom';

export type DelayHQType =
  | 'digital' | 'analog' | 'tape' | 'pingpong' | 'reverse'
  | 'ducked' | 'modulated' | 'multi-tap' | 'shimmer';

export type ReverbHQType =
  | 'room' | 'hall' | 'plate' | 'spring' | 'cathedral'
  | 'ambient' | 'shimmer' | 'modulated' | 'custom';

export interface RigParams {
  // Gate
  gateThreshold: number;
  gateAttack: number;
  gateRelease: number;

  // Preamp
  drive: number;
  tubeAmount: number;

  // EQ
  bass: number;
  mid: number;
  treble: number;
  presence: number;

  // Cabinet
  cabEnabled: boolean;
  cabIR: string;

  // CompressorHQ
  compEnabled: boolean;
  compType: CompressorHQType;
  compThreshold: number;   // dB
  compRatio: number;
  compAttack: number;      // ms
  compRelease: number;     // ms
  compKnee: number;        // dB
  compMakeup: number;      // dB
  compMix: number;         // 0..1
  compSaturation: number;  // 0..1

  // DelayHQ
  delayEnabled: boolean;
  delayType: DelayHQType;
  delayTime: number;       // ms, 20..3000
  delayFeedback: number;   // 0..100
  delayMix: number;        // 0..100
  delayModDepth: number;   // ms, 0..15
  delayModRate: number;    // Hz, 0..8
  delaySaturation: number; // 0..1
  delayDiffusion: number;  // 0..1

  // ReverbHQ
  reverbEnabled: boolean;
  reverbType: ReverbHQType;
  reverbDecay: number;      // sec, 0.1..20
  reverbPreDelay: number;   // ms, 0..200
  reverbDamping: number;    // 0..1
  reverbMix: number;        // 0..100
  reverbRoomSize: number;   // 0.5..2
  reverbModDepth: number;   // ms, 0..5
  reverbModRate: number;    // Hz, 0..3
  reverbEarlyLevel: number; // 0..1
  reverbShimmer: number;    // 0..1

  // Master
  masterVolume: number;
}

export const DEFAULT_PARAMS: RigParams = {
  gateThreshold: -50,
  gateAttack: 0.01,
  gateRelease: 0.1,

  drive: 0.2,
  tubeAmount: 0.3,

  bass: 0,
  mid: 0,
  treble: 0,
  presence: 0,

  cabEnabled: true,
  cabIR: '/ir/IR-meza.wav',

  compEnabled: true,
  compType: 'vca',
  compThreshold: -20,
  compRatio: 4,
  compAttack: 3,
  compRelease: 120,
  compKnee: 6,
  compMakeup: 4,
  compMix: 1,
  compSaturation: 0.05,

  delayEnabled: true,
  delayType: 'digital',
  delayTime: 300,
  delayFeedback: 35,
  delayMix: 25,
  delayModDepth: 0,
  delayModRate: 0,
  delaySaturation: 0,
  delayDiffusion: 0.05,

  reverbEnabled: true,
  reverbType: 'hall',
  reverbDecay: 2.2,
  reverbPreDelay: 30,
  reverbDamping: 0.4,
  reverbMix: 30,
  reverbRoomSize: 1.0,
  reverbModDepth: 1,
  reverbModRate: 0.5,
  reverbEarlyLevel: 0.6,
  reverbShimmer: 0,

  masterVolume: 1.0,
};

export type ParamKey = keyof RigParams;
export interface Preset {
  name: string;
  category: 'clean' | 'crunch' | 'high-gain' | 'ambient' | 'custom';
  params: Partial<RigParams>;
}

export type PresetCategory = Preset['category'];