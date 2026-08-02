/**
 * 🎛️ FretLab Unified Rig — AudioWorklet processor source
 *
 * Single AudioWorklet processor replacing all previous guitar processors:
 * NoiseGate → TubeDrive → AmpEQ → CabinetIR → Delay → Reverb → Master
 *
 * Exported as a string so it can be loaded via Blob + audioWorklet.addModule
 * (works in both Vite dev and static build without bundler hacks).
 */
export const GUITAR_RIG_PROCESSOR_CODE = `
class Biquad {
  constructor(type, freq, q, gain, sr) {
    this.sr = sr; this.type = type; this.z1 = 0; this.z2 = 0;
    this.set(freq, q, gain);
  }
  set(freq, q, gain) {
    const w0 = 2 * Math.PI * freq / this.sr;
    const cosw0 = Math.cos(w0), sinw0 = Math.sin(w0);
    const A = Math.pow(10, gain / 40);
    const alpha = sinw0 / (2 * q);
    let b0,b1,b2,a0,a1,a2;
    if (this.type === 'lowshelf') {
      const s = 2 * Math.sqrt(A) * alpha;
      b0=A*((A+1)-(A-1)*cosw0+s); b1=2*A*((A-1)-(A+1)*cosw0); b2=A*((A+1)-(A-1)*cosw0-s);
      a0=(A+1)+(A-1)*cosw0+s; a1=-2*((A-1)+(A+1)*cosw0); a2=(A+1)+(A-1)*cosw0-s;
    } else if (this.type === 'highshelf') {
      const s = 2 * Math.sqrt(A) * alpha;
      b0=A*((A+1)+(A-1)*cosw0+s); b1=-2*A*((A-1)+(A+1)*cosw0); b2=A*((A+1)+(A-1)*cosw0-s);
      a0=(A+1)-(A-1)*cosw0+s; a1=2*((A-1)-(A+1)*cosw0); a2=(A+1)-(A-1)*cosw0-s;
    } else {
      const aa=alpha*A, ad=alpha/A;
      b0=1+aa; b1=-2*cosw0; b2=1-aa; a0=1+ad; a1=-2*cosw0; a2=1-ad;
    }
    this.b0=b0/a0; this.b1=b1/a0; this.b2=b2/a0; this.a1=a1/a0; this.a2=a2/a0;
  }
  process(x) { const y=this.b0*x+this.b1*this.z1+this.b2*this.z2-this.a1*this.z1-this.a2*this.z2; this.z2=this.z1; this.z1=y; return y; }
}

class GuitarProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {name:'gateEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'gateThreshold',defaultValue:-50,minValue:-80,maxValue:-20},
      {name:'driveEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'drive',defaultValue:20,minValue:0,maxValue:100},
      {name:'tubeAmount',defaultValue:30,minValue:0,maxValue:100},
      {name:'eqEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'bass',defaultValue:0,minValue:-12,maxValue:12},
      {name:'mid',defaultValue:0,minValue:-12,maxValue:12},
      {name:'treble',defaultValue:0,minValue:-12,maxValue:12},
      {name:'cabEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'delayEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'delayTime',defaultValue:30,minValue:0,maxValue:100},
      {name:'delayFeedback',defaultValue:30,minValue:0,maxValue:90},
      {name:'delayMix',defaultValue:20,minValue:0,maxValue:100},
      {name:'reverbEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'reverbDecay',defaultValue:20,minValue:0,maxValue:100},
      {name:'reverbMix',defaultValue:15,minValue:0,maxValue:100},
      {name:'masterGain',defaultValue:100,minValue:0,maxValue:200},
    ];
  }
  constructor() {
    super();
    this.sr = sampleRate;
    this.eqLow = new Biquad('lowshelf',150,0.7,0,this.sr);
    this.eqMid = new Biquad('peaking',800,1.0,0,this.sr);
    this.eqHigh = new Biquad('highshelf',4000,0.7,0,this.sr);
    this.delayBuf = new Float32Array(Math.ceil(this.sr*1.5));
    this.delayIdx = 0;
    this.comb = [
      {buf:new Float32Array(Math.ceil(this.sr*0.0297)),idx:0,fb:0.84},
      {buf:new Float32Array(Math.ceil(this.sr*0.0371)),idx:0,fb:0.88},
      {buf:new Float32Array(Math.ceil(this.sr*0.0411)),idx:0,fb:0.90},
      {buf:new Float32Array(Math.ceil(this.sr*0.0437)),idx:0,fb:0.92},
    ];
    this.allpass = [
      {buf:new Float32Array(Math.ceil(this.sr*0.005)),idx:0,g:0.5},
      {buf:new Float32Array(Math.ceil(this.sr*0.0168)),idx:0,g:0.5},
    ];
    this.irBuf = null;
    this.irLen = 0;
    this.irState = null;
    this.port.onmessage = (e) => {
      if (e.data.type === 'ir') {
        this.irBuf = new Float32Array(e.data.buffer);
        this.irLen = this.irBuf.length;
        this.irState = new Float32Array(this.irLen);
      }
    };
  }
  process(inputs,outputs,p) {
    const inCh=inputs[0][0], outCh=outputs[0][0];
    if (!inCh||!outCh) return true;
    const gateOn=p.gateEnabled[0], gateTh=p.gateThreshold[0];
    const driveOn=p.driveEnabled[0], drive=p.drive[0]/100, tube=p.tubeAmount[0]/100;
    const eqOn=p.eqEnabled[0], bass=p.bass[0], mid=p.mid[0], treble=p.treble[0];
    const cabOn=p.cabEnabled[0];
    const delayOn=p.delayEnabled[0], dTime=p.delayTime[0]/100, dFb=p.delayFeedback[0]/100, dMix=p.delayMix[0]/100;
    const reverbOn=p.reverbEnabled[0], rDecay=p.reverbDecay[0]/100, rMix=p.reverbMix[0]/100;
    const master=p.masterGain[0]/100;
    const dSamples=Math.max(1,Math.floor(dTime*this.sr*1.5));
    if (eqOn) { this.eqLow.set(150,0.7,bass,this.sr); this.eqMid.set(800,1.0,mid,this.sr); this.eqHigh.set(4000,0.7,treble,this.sr); }
    for (let c of this.comb) c.fb = 0.7 + rDecay * 0.28;
    for (let i=0;i<inCh.length;i++) {
      let x=inCh[i];
      if (gateOn) { const db=20*Math.log10(Math.abs(x)+1e-10); if (db<gateTh) x=0; }
      if (driveOn) {
        const gain=1+drive*20;
        x=Math.tanh(x*gain)+tube*0.3*Math.sin(x*gain*Math.PI*0.5)+tube*0.05*Math.sin(x*Math.PI);
        x*=1-tube*0.15;
      }
      if (eqOn) { x=this.eqLow.process(x); x=this.eqMid.process(x); x=this.eqHigh.process(x); }
      let amp=x;
      if (cabOn && this.irBuf) {
        this.irState[this.irLen-1]=x;
        let c=0; for(let k=0;k<this.irLen;k++) c+=this.irBuf[k]*this.irState[this.irLen-1-k];
        for(let k=this.irLen-1;k>0;k--) this.irState[k]=this.irState[k-1];
        amp=c;
      }
      const dRead=this.delayBuf[(this.delayIdx-dSamples+this.delayBuf.length)%this.delayBuf.length];
      this.delayBuf[this.delayIdx]=amp+dRead*dFb; this.delayIdx=(this.delayIdx+1)%this.delayBuf.length;
      let wet=amp*(1-dMix)+dRead*dMix;
      if (reverbOn) {
        let rev=amp;
        for (let c of this.comb) { const r=c.buf[c.idx]; c.buf[c.idx]=rev+r*c.fb; c.idx=(c.idx+1)%c.buf.length; rev=r; }
        let ap=rev;
        for (let a of this.allpass) { const r=a.buf[a.idx]; const o=-a.g*ap+r; a.buf[a.idx]=ap+a.g*o; a.idx=(a.idx+1)%a.buf.length; ap=o; }
        wet=wet*(1-rMix)+ap*rMix;
      }
      outCh[i]=wet*master;
    }
    return true;
  }
}
registerProcessor('guitar-processor',GuitarProcessor);
`;

