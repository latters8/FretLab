/**
 * 🔧 ReverbHQ AudioWorklet Processor
 * Стерео FDN (8 lines) + Early Reflections + Shimmer + Modulation
 * 
 * Архитектура:
 * 1. Early Reflections: 8 tap-delay с pan и gain
 * 2. Pre-delay → Diffusion (4 all-pass)
 * 3. FDN Core: 8 линий (4L/4R), Hadamard 8×8, one-pole damping, LFO
 * 4. Shimmer: 2-grain pitch-shifter в feedback loop
 * 5. Stereo Width (M/S) + Dry/Wet mix
 */

export interface ReverbWorkletParams {
  decay: number;          // 0.1 - 20 sec (RT60)
  preDelay: number;       // 0 - 0.2 sec
  damping: number;        // 0 - 1 → LP freq 500..16000
  mix: number;            // 0 - 1
  roomSize: number;       // 0.5 - 2.0 (delay time scale)
  modDepth: number;       // 0 - 0.005 sec
  modRate: number;        // 0.1 - 3.0 Hz
  earlyLevel: number;     // 0 - 1
  earlySize: number;      // 0.5 - 2.0
  shimmerAmount: number;  // 0 - 1
  shimmerPitch: number;   // 0.5 - 4.0 (ratio)
  stereoWidth: number;    // 0 - 2
  density: number;        // 0 - 1 (diffusion scale)
  active: number;         // 0 or 1
}

export const REVERB_HQ_PROCESSOR_CODE = `
const NUM_LINES = 8;
const NUM_EARLY_TAPS = 8;

// ─── Helpers ───
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

class OnePole {
  z = 0;
  process(input, coeff) {
    this.z += coeff * (input - this.z);
    return this.z;
  }
}

class Allpass {
  buf; idx = 0;
  constructor(size) {
    this.buf = new Float32Array(Math.max(1, Math.round(size)));
  }
  process(input, g) {
    const out = this.buf[this.idx];
    this.buf[this.idx] = input + out * g;
    const y = out - g * input;
    this.idx = (this.idx + 1) % this.buf.length;
    return y;
  }
}

// Simple 2-grain pitch shifter for shimmer
class GrainShifter {
  buf; size; write = 0;
  grain1 = 0; grain2 = 0;
  constructor(size) {
    this.size = size;
    this.buf = new Float32Array(size);
    this.grain2 = size / 2;
  }
  process(input, ratio, amount) {
    if (amount < 0.001) return input;
    this.buf[this.write] = input;
    this.write = (this.write + 1) % this.size;

    this.grain1 += ratio;
    this.grain2 += ratio;
    if (this.grain1 >= this.size) this.grain1 -= this.size;
    if (this.grain2 >= this.size) this.grain2 -= this.size;

    const read = (pos) => {
      const i = Math.floor(pos);
      const f = pos - i;
      const a = this.buf[i % this.size];
      const b = this.buf[(i + 1) % this.size];
      return a + (b - a) * f;
    };

    const s1 = read(this.grain1);
    const s2 = read(this.grain2);

    // Hanning crossfade based on grain position within half-buffer
    const half = this.size / 2;
    const w1 = 0.5 * (1 - Math.cos(2 * Math.PI * ((this.write - this.grain1 + this.size) % half) / half));
    const w2 = 0.5 * (1 - Math.cos(2 * Math.PI * ((this.write - this.grain2 + this.size) % half) / half));
    const sum = w1 + w2 || 1;
    const shifted = (s1 * w1 + s2 * w2) / sum;

    return input * (1 - amount) + shifted * amount;
  }
}

// Hadamard 8×8 (Sylvester construction)
const H8 = [
  [1,1,1,1,1,1,1,1],
  [1,-1,1,-1,1,-1,1,-1],
  [1,1,-1,-1,1,1,-1,-1],
  [1,-1,-1,1,1,-1,-1,1],
  [1,1,1,1,-1,-1,-1,-1],
  [1,-1,1,-1,-1,1,-1,1],
  [1,1,-1,-1,-1,-1,1,1],
  [1,-1,-1,1,-1,1,1,-1],
];
const H8_SCALE = 1 / Math.sqrt(NUM_LINES);

class ReverbHQProcessor extends AudioWorkletProcessor {
  sr = sampleRate;

  // Early reflections
  earlyBufL; earlyBufR;
  earlySize = 0;
  earlyWrite = 0;

  // Pre-delay
  preDelayBufL; preDelayBufR;
  preDelaySize = 0;
  preDelayWrite = 0;

  // Diffusion (4 all-pass)
  diffusersL = [];
  diffusersR = [];
  diffDelays = [0.004771, 0.003575, 0.002219, 0.001359];
  diffCoeffs = [0.75, 0.7, 0.65, 0.6];

  // FDN lines
  fdnBufL = []; fdnBufR = [];
  fdnWrite = [];
  fdnDamp = [];
  fdnLfoPhase = [];
  fdnBaseDelays = [0.0297, 0.0371, 0.0413, 0.0437, 0.0479, 0.0533, 0.0599, 0.0617];
  fdnModRates = [0.13, 0.19, 0.17, 0.23, 0.11, 0.29, 0.21, 0.15];

  // Shimmer
  shimmerL; shimmerR;

  // Early tap config
  earlyTapTimes = [0.025, 0.035, 0.045, 0.055, 0.065, 0.075, 0.085, 0.095];
  earlyTapGains = [0.9, 0.75, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2];
  earlyTapPans = [-0.8, 0.7, -0.5, 0.9, -0.3, 0.6, -0.9, 0.4];

  constructor() {
    super();

    // Early reflection buffer (max 0.3 sec)
    this.earlySize = Math.ceil(0.3 * this.sr);
    this.earlyBufL = new Float32Array(this.earlySize);
    this.earlyBufR = new Float32Array(this.earlySize);

    // Pre-delay buffer (max 0.3 sec)
    this.preDelaySize = Math.ceil(0.3 * this.sr);
    this.preDelayBufL = new Float32Array(this.preDelaySize);
    this.preDelayBufR = new Float32Array(this.preDelaySize);

    // Diffusers
    for (let i = 0; i < 4; i++) {
      this.diffusersL.push(new Allpass(Math.ceil(this.diffDelays[i] * this.sr)));
      this.diffusersR.push(new Allpass(Math.ceil(this.diffDelays[i] * this.sr)));
    }

    // FDN buffers (max 0.5 sec per line)
    for (let i = 0; i < NUM_LINES; i++) {
      const sz = Math.ceil(0.5 * this.sr);
      this.fdnBufL.push(new Float32Array(sz));
      this.fdnBufR.push(new Float32Array(sz));
      this.fdnWrite.push(0);
      this.fdnDamp.push(new OnePole());
      this.fdnLfoPhase.push(Math.random() * Math.PI * 2);
    }

    // Shimmer
    const shimmerSize = Math.ceil(0.15 * this.sr);
    this.shimmerL = new GrainShifter(shimmerSize);
    this.shimmerR = new GrainShifter(shimmerSize);
  }

  readDelay(buf, writeIdx, delaySamples) {
    const idx = writeIdx - delaySamples;
    const i0 = Math.floor(idx);
    const frac = idx - i0;
    const s0 = buf[(i0 + buf.length) % buf.length];
    const s1 = buf[(i0 + 1 + buf.length) % buf.length];
    return s0 + (s1 - s0) * frac;
  }

  process(inputs, outputs, parameters) {
    const inL = inputs[0]?.[0];
    const inR = inputs[0]?.[1];
    const outL = outputs[0][0];
    const outR = outputs[0][1];
    if (!inL || !outL) return true;

    const len = outL.length;
    const stereo = !!inR;

    const p = (name, i) => {
      const arr = parameters[name];
      return arr.length > 1 ? arr[i] : arr[0];
    };

    for (let i = 0; i < len; i++) {
      const dryL = inL[i] || 0;
      const dryR = stereo ? (inR[i] || 0) : dryL;

      const decay = p('decay', i);
      const preDelay = p('preDelay', i);
      const damping = p('damping', i);
      const mix = p('mix', i);
      const roomSize = p('roomSize', i);
      const modDepth = p('modDepth', i);
      const modRate = p('modRate', i);
      const earlyLevel = p('earlyLevel', i);
      const earlySize = p('earlySize', i);
      const shimmerAmount = p('shimmerAmount', i);
      const shimmerPitch = p('shimmerPitch', i);
      const stereoWidth = p('stereoWidth', i);
      const density = p('density', i);
      const active = p('active', i) > 0.5;

      // ── Early Reflections ──
      this.earlyBufL[this.earlyWrite] = dryL;
      this.earlyBufR[this.earlyWrite] = dryR;
      this.earlyWrite = (this.earlyWrite + 1) % this.earlySize;

      let earlyL = 0, earlyR = 0;
      for (let t = 0; t < NUM_EARLY_TAPS; t++) {
        const dt = this.earlyTapTimes[t] * earlySize;
        const g = this.earlyTapGains[t];
        const pan = this.earlyTapPans[t];
        const sL = this.readDelay(this.earlyBufL, this.earlyWrite, dt * this.sr);
        const sR = this.readDelay(this.earlyBufR, this.earlyWrite, dt * this.sr);
        if (pan <= 0) {
          earlyL += sL * g * (1 + pan * 0.5);
          earlyR += sR * g;
        } else {
          earlyL += sL * g;
          earlyR += sR * g * (1 - pan * 0.5);
        }
      }
      earlyL *= earlyLevel * 0.5;
      earlyR *= earlyLevel * 0.5;

      // ── Pre-delay ──
      this.preDelayBufL[this.preDelayWrite] = dryL;
      this.preDelayBufR[this.preDelayWrite] = dryR;
      this.preDelayWrite = (this.preDelayWrite + 1) % this.preDelaySize;

      let preL = this.readDelay(this.preDelayBufL, this.preDelayWrite, preDelay * this.sr);
      let preR = this.readDelay(this.preDelayBufR, this.preDelayWrite, preDelay * this.sr);

      // ── Diffusion (all-pass chain) ──
      const diffScale = 0.3 + density * 0.7;
      for (let d = 0; d < 4; d++) {
        const g = this.diffCoeffs[d] * diffScale;
        preL = this.diffusersL[d].process(preL, g);
        preR = this.diffusersR[d].process(preR, g);
      }

      // ── FDN Core ──
      // Read from lines with modulation
      let lineOuts = new Float32Array(NUM_LINES);
      const dampFreq = 500 + damping * 15500;
      const dampCoeff = 1 - Math.exp(-2 * Math.PI * dampFreq / this.sr);

      for (let l = 0; l < NUM_LINES; l++) {
        this.fdnLfoPhase[l] += 2 * Math.PI * this.fdnModRates[l] * modRate / this.sr;
        if (this.fdnLfoPhase[l] > 2 * Math.PI) this.fdnLfoPhase[l] -= 2 * Math.PI;
        const lfo = Math.sin(this.fdnLfoPhase[l]);
        const delaySec = this.fdnBaseDelays[l] * roomSize + lfo * modDepth;
        const delaySamples = Math.max(1, delaySec * this.sr);

        const bufL = this.fdnBufL[l];
        const bufR = this.fdnBufR[l];
        const w = this.fdnWrite[l];

        const sL = this.readDelay(bufL, w, delaySamples);
        const sR = this.readDelay(bufR, w, delaySamples);

        // Damping (one-pole LP per line, stereo)
        const dampL = this.fdnDamp[l].process(sL, dampCoeff);
        // Reuse same filter state approximation for R (simpler)
        const dampR = sR * dampCoeff + (bufR[(w - 1 + bufR.length) % bufR.length] || 0) * (1 - dampCoeff);

        // Decay gain per line (RT60 formula)
        const g = Math.pow(10, (-3 * delaySec) / Math.max(decay, 0.05));
        const decayGain = Math.min(g, 0.98);

        lineOuts[l] = (dampL + dampR) * 0.5 * decayGain;
      }

      // Hadamard mixing: new inputs for each line = pre + mixed feedback
      const mixed = new Float32Array(NUM_LINES);
      for (let j = 0; j < NUM_LINES; j++) {
        let sum = 0;
        for (let k = 0; k < NUM_LINES; k++) {
          sum += H8[j][k] * lineOuts[k];
        }
        mixed[j] = sum * H8_SCALE;
      }

      // Inject pre-delayed signal into lines (stereo spread: odd=L, even=R)
      for (let l = 0; l < NUM_LINES; l++) {
        const isLeft = l % 2 === 0;
        const inj = isLeft ? preL : preR;
        const fb = mixed[l];

        // Shimmer: pitch-shifted feedback
        let shimmered = fb;
        if (shimmerAmount > 0.001) {
          const sh = isLeft
            ? this.shimmerL.process(fb, shimmerPitch, shimmerAmount)
            : this.shimmerR.process(fb, shimmerPitch, shimmerAmount);
          shimmered = fb * (1 - shimmerAmount) + sh * shimmerAmount;
        }

        const writeVal = inj * 0.15 + shimmered;

        this.fdnBufL[l][this.fdnWrite[l]] = writeVal;
        this.fdnBufR[l][this.fdnWrite[l]] = writeVal;
        this.fdnWrite[l] = (this.fdnWrite[l] + 1) % this.fdnBufL[l].length;
      }

      // FDN wet output (sum of line outputs, panned)
      let lateL = 0, lateR = 0;
      for (let l = 0; l < NUM_LINES; l++) {
        const pan = (l % 2 === 0) ? -0.5 : 0.5;
        const g = 1 / Math.sqrt(NUM_LINES);
        if (pan < 0) {
          lateL += lineOuts[l] * g * 1.2;
          lateR += lineOuts[l] * g * 0.8;
        } else {
          lateL += lineOuts[l] * g * 0.8;
          lateR += lineOuts[l] * g * 1.2;
        }
      }

      // ── Combine Early + Late ──
      let wetL = earlyL + lateL;
      let wetR = earlyR + lateR;

      // ── Stereo Width (M/S) ──
      if (stereoWidth !== 1.0) {
        const mid = (wetL + wetR) * 0.5;
        const side = (wetL - wetR) * 0.5;
        const w = clamp(stereoWidth, 0, 2);
        wetL = mid + side * w;
        wetR = mid - side * w;
      }

      // ── Output ──
      if (active) {
        outL[i] = dryL * (1 - mix) + wetL * mix;
        outR[i] = dryR * (1 - mix) + wetR * mix;
      } else {
        outL[i] = dryL;
        outR[i] = dryR;
      }
    }
    return true;
  }
}

registerProcessor('reverb-hq-processor', ReverbHQProcessor);
`;
