/**
 * 🔧 CompressorHQ AudioWorklet Processor
 * Классические топологии: Optical, FET, VCA, Tube, Brickwall
 * 
 * Фичи:
 * • Feed-forward / Feed-back detector topology
 * • Peak / RMS / Hybrid envelope detection
 * • Program-dependent release (opto-style)
 * • Saturation в gain reduction path (tube, FET)
 * • Look-ahead для brickwall limiting
 * • Sidechain HPF (для bass-heavy материала)
 * • Parallel mix (New York compression)
 * • GR metering output
 */

export interface CompressorWorkletParams {
  threshold: number;      // -60 .. 0 dB
  ratio: number;          // 1 .. 50
  attack: number;         // 0.01 .. 100 ms
  release: number;        // 1 .. 3000 ms
  knee: number;           // 0 .. 40 dB
  makeupGain: number;     // 0 .. 24 dB
  mix: number;            // 0 .. 1 (parallel)
  detectorType: number;   // 0=peak, 1=rms, 2=hybrid
  topology: number;       // 0=feed-forward, 1=feed-back
  saturation: number;     // 0 .. 1
  scHpf: number;          // 0 .. 1000 Hz (sidechain HPF)
  lookahead: number;      // 0 .. 10 ms
  active: number;         // 0 or 1
}

export const COMPRESSOR_HQ_PROCESSOR_CODE = `
const DB_TO_LINEAR = (db) => Math.pow(10, db / 20);
const LINEAR_TO_DB = (lin) => 20 * Math.log10(Math.max(1e-10, lin));
const CLAMP = (v, min, max) => Math.max(min, Math.min(max, v));

class OnePole {
  z = 0;
  process(input, coeff) {
    this.z += coeff * (input - this.z);
    return this.z;
  }
  reset(v = 0) { this.z = v; }
}

class Biquad {
  x1 = 0; x2 = 0; y1 = 0; y2 = 0;
  b0 = 1; b1 = 0; b2 = 0; a0 = 1; a1 = 0; a2 = 0;

  setHighpass(freq, q, sr) {
    const w0 = 2 * Math.PI * freq / sr;
    const cosw0 = Math.cos(w0);
    const sinw0 = Math.sin(w0);
    const alpha = sinw0 / (2 * q);
    this.b0 = (1 + cosw0) / 2;
    this.b1 = -(1 + cosw0);
    this.b2 = (1 + cosw0) / 2;
    this.a0 = 1 + alpha;
    this.a1 = -2 * cosw0;
    this.a2 = 1 - alpha;
  }

  process(input) {
    const out = (this.b0 * input + this.b1 * this.x1 + this.b2 * this.x2
               - this.a1 * this.y1 - this.a2 * this.y2) / this.a0;
    this.x2 = this.x1; this.x1 = input;
    this.y2 = this.y1; this.y1 = out;
    return out;
  }
}

class CompressorHQProcessor extends AudioWorkletProcessor {
  // Envelope followers
  envL = new OnePole();
  envR = new OnePole();
  rmsL = new OnePole();
  rmsR = new OnePole();

  // Sidechain HPF
  scHpfL = new Biquad();
  scHpfR = new Biquad();

  // Look-ahead buffer
  laBufL;
  laBufR;
  laSize = 0;
  laRead = 0;
  laWrite = 0;

  // GR metering
  grDb = 0;
  grSmooth = 0;

  // Feed-back state
  fbGain = 1;

  constructor() {
    super();
    const maxLa = Math.ceil(0.01 * sampleRate); // 10ms max
    this.laBufL = new Float32Array(maxLa);
    this.laBufR = new Float32Array(maxLa);
  }

  process(inputs, outputs, parameters) {
    const inL = inputs[0]?.[0];
    const inR = inputs[0]?.[1];
    const outL = outputs[0][0];
    const outR = outputs[0][1];
    if (!inL || !outL) return true;

    const sr = sampleRate;
    const len = outL.length;
    const stereo = !!inR;

    const p = (name, i) => {
      const arr = parameters[name];
      return arr.length > 1 ? arr[i] : arr[0];
    };

    for (let i = 0; i < len; i++) {
      const dryL = inL[i] || 0;
      const dryR = stereo ? (inR[i] || 0) : dryL;

      const threshold = p('threshold', i);
      const ratio = Math.max(1, p('ratio', i));
      const attackMs = p('attack', i);
      const releaseMs = p('release', i);
      const kneeDb = p('knee', i);
      const makeupDb = p('makeupGain', i);
      const mix = p('mix', i);
      const detector = Math.round(p('detectorType', i));
      const topology = Math.round(p('topology', i));
      const sat = p('saturation', i);
      const scHpfFreq = p('scHpf', i);
      const lookaheadMs = p('lookahead', i);
      const active = p('active', i) > 0.5;

      // ── Look-ahead buffer ──
      const laSamples = Math.round(lookaheadMs / 1000 * sr);
      this.laSize = Math.min(this.laBufL.length, Math.max(0, laSamples));

      // ── Sidechain HPF ──
      let scL = dryL;
      let scR = dryR;
      if (scHpfFreq > 20) {
        this.scHpfL.setHighpass(scHpfFreq, 0.7, sr);
        this.scHpfR.setHighpass(scHpfFreq, 0.7, sr);
        scL = this.scHpfL.process(dryL);
        scR = this.scHpfR.process(dryR);
      }

      // ── Detector ──
      let detectorLevel;
      const absL = Math.abs(scL);
      const absR = Math.abs(scR);

      if (detector === 0) {
        // Peak
        detectorLevel = Math.max(absL, absR);
      } else if (detector === 1) {
        // RMS
        const rms = Math.sqrt((scL * scL + scR * scR) * 0.5);
        detectorLevel = rms;
      } else {
        // Hybrid: peak for transients, RMS for sustain
        const peak = Math.max(absL, absR);
        const rms = Math.sqrt((scL * scL + scR * scR) * 0.5);
        detectorLevel = peak * 0.7 + rms * 0.3;
      }

      // ── Envelope follower ──
      // Attack/release coefficients
      const attackCoeff = 1 - Math.exp(-1 / (sr * attackMs / 1000));
      // Program-dependent release: faster for short peaks, slower for sustained
      const progRelease = releaseMs * (1 + detectorLevel * 2); // opto-style
      const releaseCoeff = 1 - Math.exp(-1 / (sr * progRelease / 1000));

      const env = this.envL.process(detectorLevel, detectorLevel > this.envL.z ? attackCoeff : releaseCoeff);

      // ── Gain computation (dB) ──
      const envDb = LINEAR_TO_DB(env);
      let grDb = 0;

      if (envDb > threshold + kneeDb * 0.5) {
        // Above knee
        grDb = (threshold - envDb) * (1 - 1 / ratio);
      } else if (envDb > threshold - kneeDb * 0.5) {
        // Inside knee (soft knee)
        const t = (envDb - (threshold - kneeDb * 0.5)) / kneeDb;
        const softRatio = 1 + (ratio - 1) * t * t;
        grDb = (threshold - envDb) * (1 - 1 / softRatio);
      }

      // ── Topology: feed-back ──
      if (topology === 1) {
        // Feed-back: detector sees output of GR
        // Approximate: apply previous GR to detector level
        const fbEnvDb = envDb + LINEAR_TO_DB(this.fbGain);
        let fbGr = 0;
        if (fbEnvDb > threshold + kneeDb * 0.5) {
          fbGr = (threshold - fbEnvDb) * (1 - 1 / ratio);
        } else if (fbEnvDb > threshold - kneeDb * 0.5) {
          const t = (fbEnvDb - (threshold - kneeDb * 0.5)) / kneeDb;
          const softRatio = 1 + (ratio - 1) * t * t;
          fbGr = (threshold - fbEnvDb) * (1 - 1 / softRatio);
        }
        grDb = fbGr;
      }

      // ── Smooth GR (de-click) ──
      const grSmoothCoeff = 1 - Math.exp(-1 / (sr * 0.001)); // 1ms smoothing
      this.grSmooth += grSmoothCoeff * (grDb - this.grSmooth);
      grDb = this.grSmooth;

      // ── Convert to linear gain ──
      let gain = DB_TO_LINEAR(grDb);

      // ── Saturation in GR path (tube/FET warmth) ──
      if (sat > 0.001) {
        const drive = 1 + sat * 4;
        gain = Math.tanh(gain * drive) / Math.tanh(drive);
        // Add harmonic distortion to signal
        const harmonics = Math.tanh(dryL * sat * 2) * sat * 0.1;
        // Applied later
      }

      this.fbGain = gain;

      // ── Look-ahead delay ──
      let procL = dryL;
      let procR = dryR;
      if (this.laSize > 1) {
        this.laBufL[this.laWrite] = dryL;
        this.laBufR[this.laWrite] = dryR;
        this.laWrite = (this.laWrite + 1) % this.laSize;
        procL = this.laBufL[this.laRead];
        procR = this.laBufR[this.laRead];
        this.laRead = (this.laRead + 1) % this.laSize;
      }

      // ── Apply gain + makeup ──
      const makeup = DB_TO_LINEAR(makeupDb);
      let wetL = procL * gain * makeup;
      let wetR = procR * gain * makeup;

      // ── Saturation harmonics ──
      if (sat > 0.001) {
        const harmL = Math.tanh(procL * sat * 3) * sat * 0.08;
        const harmR = Math.tanh(procR * sat * 3) * sat * 0.08;
        wetL += harmL;
        wetR += harmR;
      }

      // ── Parallel mix ──
      if (active) {
        outL[i] = dryL * (1 - mix) + wetL * mix;
        outR[i] = dryR * (1 - mix) + wetR * mix;
      } else {
        outL[i] = dryL;
        outR[i] = dryR;
      }

      // ── GR metering (average) ──
      this.grDb = this.grDb * 0.99 + grDb * 0.01;
    }

    // Send GR to main thread every ~10ms
    if (this.grDb !== undefined) {
      // Simple throttling
      if (Math.random() < 0.01) {
        this.port.postMessage({ type: 'gr', value: this.grDb });
      }
    }

    return true;
  }
}

registerProcessor('compressor-hq-processor', CompressorHQProcessor);
`;
