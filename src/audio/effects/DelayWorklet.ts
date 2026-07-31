/**
 * 🔧 DelayHQ AudioWorklet Processor
 * Полный контроль над delay line: multi-tap, modulation, diffusion, ducking, reverse
 */

export interface DelayWorkletParams {
  delayTime: number;      // 0.02 - 3.0 sec
  feedback: number;       // 0 - 0.995
  mix: number;            // 0 - 1
  modDepth: number;       // 0 - 0.015 sec
  modRate: number;        // 0 - 8 Hz
  tilt: number;           // -1 (dark) .. 1 (bright)
  saturation: number;     // 0 - 1
  diffusion: number;      // 0 - 1
  duckingThreshold: number; // 0 - 1 (normalized RMS)
  duckingRelease: number;   // 0.99 - 0.9999 (coef)
  reverse: number;        // 0 or 1
  pingpong: number;       // 0 or 1
  numTaps: number;        // 1 - 4
  tapSpacing: number;     // 0.5 - 2.0 (rhythmic multiplier)
  stereoWidth: number;    // 0 - 1
  active: number;         // 0 or 1
}

// ─── Inline processor code (for Blob registration) ───
export const DELAY_HQ_PROCESSOR_CODE = `
class Biquad {
  x1 = 0; x2 = 0; y1 = 0; y2 = 0;
  b0 = 1; b1 = 0; b2 = 0; a0 = 1; a1 = 0; a2 = 0;

  setLowpass(freq, q, sr) {
    const w0 = 2 * Math.PI * freq / sr;
    const cosw0 = Math.cos(w0);
    const sinw0 = Math.sin(w0);
    const alpha = sinw0 / (2 * q);
    this.b0 = (1 - cosw0) / 2;
    this.b1 = 1 - cosw0;
    this.b2 = (1 - cosw0) / 2;
    this.a0 = 1 + alpha;
    this.a1 = -2 * cosw0;
    this.a2 = 1 - alpha;
  }

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

class Allpass {
  buffer;
  index = 0;
  constructor(size) {
    this.buffer = new Float32Array(size);
  }
  process(input, coeff) {
    const bufOut = this.buffer[this.index];
    const out = -input * coeff + bufOut;
    this.buffer[this.index] = input + bufOut * coeff;
    this.index = (this.index + 1) % this.buffer.length;
    return out;
  }
}

class DelayHQProcessor extends AudioWorkletProcessor {
  // Buffers
  bufL;
  bufR;
  revL;
  revR;
  bufSize;
  revSize;
  writeIdx = 0;
  revWriteIdx = 0;

  // State
  lfoPhase = 0;
  duckGainL = 1;
  duckGainR = 1;
  rmsL = 0;
  rmsR = 0;
  reverseReadIdx = 0;

  // Filters
  lpL = new Biquad();
  hpL = new Biquad();
  lpR = new Biquad();
  hpR = new Biquad();

  // Diffusion (all-pass chain)
  diffL = [];
  diffR = [];
  diffSizes = [0.008, 0.012, 0.017, 0.025]; // seconds

  // Tap pattern (default)
  tapPattern = [1.0, 1.5, 2.0, 2.75];
  tapPans = [0, -0.6, 0.6, 0];

  constructor() {
    super();
    const sr = sampleRate;
    this.bufSize = Math.ceil(4.0 * sr); // 4 sec max
    this.revSize = Math.ceil(2.0 * sr); // 2 sec for reverse
    this.bufL = new Float32Array(this.bufSize);
    this.bufR = new Float32Array(this.bufSize);
    this.revL = new Float32Array(this.revSize);
    this.revR = new Float32Array(this.revSize);

    for (let i = 0; i < 4; i++) {
      const size = Math.max(1, Math.round(this.diffSizes[i] * sr));
      this.diffL.push(new Allpass(size));
      this.diffR.push(new Allpass(size));
    }

    this.port.onmessage = (e) => {
      if (e.data.type === 'pattern') {
        this.tapPattern = e.data.pattern;
        this.tapPans = e.data.pans;
      }
    };
  }

  readDelay(buffer, delaySamples) {
    const idx = this.writeIdx - delaySamples;
    const i0 = Math.floor(idx);
    const frac = idx - i0;
    const s0 = buffer[(i0 + this.bufSize) % this.bufSize];
    const s1 = buffer[(i0 + 1 + this.bufSize) % this.bufSize];
    return s0 + (s1 - s0) * frac;
  }

  softClip(x, amount) {
    if (amount <= 0.001) return x;
    const drive = 1 + amount * 8;
    return Math.tanh(x * drive) / Math.tanh(drive);
  }

  process(inputs, outputs, parameters) {
    const inL = inputs[0]?.[0];
    const inR = inputs[0]?.[1];
    const outL = outputs[0][0];
    const outR = outputs[0][1];
    if (!inL || !outL) return true;

    const sr = sampleRate;
    const len = outL.length;

    // Parameter readers (handle both k-rate and a-rate)
    const p = (name, i) => {
      const arr = parameters[name];
      return arr.length > 1 ? arr[i] : arr[0];
    };

    for (let i = 0; i < len; i++) {
      const dryL = inL[i] || 0;
      const dryR = inR ? inR[i] : dryL;

      const delayTime = p('delayTime', i);
      const feedback = Math.min(p('feedback', i), 0.995);
      const mix = p('mix', i);
      const modDepth = p('modDepth', i);
      const modRate = p('modRate', i);
      const tilt = p('tilt', i);
      const sat = p('saturation', i);
      const diffAmt = p('diffusion', i);
      const duckThresh = p('duckingThreshold', i);
      const duckRel = p('duckingRelease', i);
      const reverse = p('reverse', i) > 0.5;
      const pingpong = p('pingpong', i) > 0.5;
      const numTaps = Math.max(1, Math.min(4, Math.round(p('numTaps', i))));
      const tapSpacing = p('tapSpacing', i);
      const width = p('stereoWidth', i);
      const active = p('active', i) > 0.5;

      // ── Update filters (tilt EQ) ──
      // tilt: -1=dark (LP 600Hz), 0=neutral, 1=bright (HP 800Hz)
      if (tilt < 0) {
        const lpFreq = 20000 * Math.pow(0.03, -tilt); // 20k -> ~600Hz
        this.lpL.setLowpass(Math.max(lpFreq, 200), 0.7, sr);
        this.lpR.setLowpass(Math.max(lpFreq, 200), 0.7, sr);
        this.hpL.setHighpass(20, 0.7, sr);
        this.hpR.setHighpass(20, 0.7, sr);
      } else {
        this.lpL.setLowpass(20000, 0.7, sr);
        this.lpR.setLowpass(20000, 0.7, sr);
        const hpFreq = 20 + tilt * tilt * 3000;
        this.hpL.setHighpass(Math.min(hpFreq, 8000), 0.7, sr);
        this.hpR.setHighpass(Math.min(hpFreq, 8000), 0.7, sr);
      }

      // ── LFO ──
      this.lfoPhase += 2 * Math.PI * modRate / sr;
      if (this.lfoPhase > 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;
      const lfo = Math.sin(this.lfoPhase);

      // ── Diffusion (pre-delay smear) ──
      let diffL = dryL;
      let diffR = dryR;
      const diffCoeff = 0.6 + diffAmt * 0.35;
      if (diffAmt > 0.01) {
        for (let d = 0; d < 4; d++) {
          diffL = this.diffL[d].process(diffL, diffCoeff);
          diffR = this.diffR[d].process(diffR, diffCoeff);
        }
      }

      // ── Multi-tap delay read ──
      let wetL = 0;
      let wetR = 0;
      const baseSamples = delayTime * sr;

      for (let t = 0; t < numTaps; t++) {
        const spacing = this.tapPattern[t] * tapSpacing;
        const mod = lfo * modDepth * sr * (1 + t * 0.3); // each tap modulated differently
        const tapDelay = Math.max(1, baseSamples * spacing + mod);

        const sL = this.readDelay(this.bufL, tapDelay);
        const sR = pingpong
          ? this.readDelay(this.bufR, tapDelay * 0.97) // slight offset for width
          : this.readDelay(this.bufR, tapDelay);

        const pan = this.tapPans[t];
        const gain = 1.0 / Math.sqrt(numTaps); // energy conservation

        if (pan <= 0) {
          wetL += sL * gain * (1 + pan); // pan -1..0
          wetR += sR * gain;
        } else {
          wetL += sL * gain;
          wetR += sR * gain * (1 - pan); // pan 0..1
        }
      }

      // ── Reverse mode ──
      if (reverse) {
        const revDelay = Math.min(1.5, delayTime * 2) * sr;
        const revIdx = (this.revWriteIdx - revDelay + this.revSize) % this.revSize;
        const rL = this.revL[Math.floor(revIdx)] || 0;
        const rR = this.revR[Math.floor(revIdx)] || 0;
        wetL = wetL * 0.3 + rL * 0.7;
        wetR = wetR * 0.3 + rR * 0.7;
      }

      // ── Ducking ──
      this.rmsL = this.rmsL * 0.9 + dryL * dryL * 0.1;
      this.rmsR = this.rmsR * 0.9 + dryR * dryR * 0.1;
      const rms = Math.sqrt((this.rmsL + this.rmsR) * 0.5);

      if (rms > duckThresh && duckThresh > 0.01) {
        this.duckGainL *= 0.95;
        this.duckGainR *= 0.95;
      } else {
        this.duckGainL = Math.min(this.duckGainL * duckRel, 1.0);
        this.duckGainR = Math.min(this.duckGainR * duckRel, 1.0);
      }
      wetL *= this.duckGainL;
      wetR *= this.duckGainR;

      // ── Stereo Width (Mid/Side) ──
      if (width < 1.0) {
        const mid = (wetL + wetR) * 0.5;
        const side = (wetL - wetR) * 0.5;
        wetL = mid + side * width;
        wetR = mid - side * width;
      }

      // ── Feedback loop (with EQ + saturation) ──
      let fbL = wetL * feedback;
      let fbR = wetR * feedback;

      fbL = this.lpL.process(fbL);
      fbL = this.hpL.process(fbL);
      fbR = this.lpR.process(fbR);
      fbR = this.hpR.process(fbR);

      fbL = this.softClip(fbL, sat);
      fbR = this.softClip(fbR, sat);

      // Ping-pong cross-feedback
      if (pingpong) {
        const cross = feedback * 0.65;
        const tmpL = fbL;
        fbL = fbL * 0.35 + fbR * cross;
        fbR = fbR * 0.35 + tmpL * cross;
      }

      // ── Write to buffers ──
      this.bufL[this.writeIdx] = diffL + fbL;
      this.bufR[this.writeIdx] = diffR + fbR;
      this.writeIdx = (this.writeIdx + 1) % this.bufSize;

      // Reverse buffer (write dry+fb for rolling reverse)
      this.revL[this.revWriteIdx] = diffL + fbL;
      this.revR[this.revWriteIdx] = diffR + fbR;
      this.revWriteIdx = (this.revWriteIdx + 1) % this.revSize;

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

registerProcessor('delay-hq-processor', DelayHQProcessor);
`;