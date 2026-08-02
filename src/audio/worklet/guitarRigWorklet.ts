/**
 * 🎛️ FretLab Unified Rig — AudioWorklet processor source
 *
 * Single AudioWorklet processor replacing all previous guitar processors:
 * NoiseGate → TubeDrive → AmpEQ → CabinetIR → Modulation → Delay → Reverb → Master
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

class OnePole {
  constructor(sr) { this.sr = sr; this.a = 1; this.z = 0; }
  setLP(freq) {
    const w = 2 * Math.PI * Math.max(20, Math.min(20000, freq)) / this.sr;
    this.a = 1 - Math.exp(-w);
  }
  process(x) { this.z += this.a * (x - this.z); return this.z; }
}

class Allpass {
  constructor(sr) { this.sr = sr; this.a = 0; this.x1 = 0; this.y1 = 0; }
  setFreq(f) {
    const w = 2 * Math.PI * Math.max(20, Math.min(12000, f)) / this.sr;
    const t = Math.tan(w / 2);
    this.a = (1 - t) / (1 + t);
  }
  process(x) { const y = this.a * x + this.x1 - this.a * this.y1; this.x1 = x; this.y1 = y; return y; }
}

class GuitarProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {name:'gateEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'gateThreshold',defaultValue:-50,minValue:-80,maxValue:-20},
      {name:'gateAttack',defaultValue:2,minValue:0.5,maxValue:20},
      {name:'gateRelease',defaultValue:40,minValue:5,maxValue:200},
      {name:'gateDepth',defaultValue:100,minValue:0,maxValue:100},
      {name:'driveEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'drive',defaultValue:20,minValue:0,maxValue:100},
      {name:'tubeAmount',defaultValue:30,minValue:0,maxValue:100},
      {name:'driveTone',defaultValue:100,minValue:0,maxValue:100},
      {name:'driveLevel',defaultValue:100,minValue:0,maxValue:100},
      {name:'eqEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'bass',defaultValue:0,minValue:-12,maxValue:12},
      {name:'mid',defaultValue:0,minValue:-12,maxValue:12},
      {name:'treble',defaultValue:0,minValue:-12,maxValue:12},
      {name:'presence',defaultValue:0,minValue:-12,maxValue:12},
      {name:'cabEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'cabLevel',defaultValue:100,minValue:0,maxValue:100},
      {name:'cabMix',defaultValue:100,minValue:0,maxValue:100},
      {name:'cabTone',defaultValue:100,minValue:0,maxValue:100},
      {name:'cabAir',defaultValue:0,minValue:0,maxValue:100},
      {name:'modEnabled',defaultValue:0,minValue:0,maxValue:1},
      {name:'modType',defaultValue:0,minValue:0,maxValue:4},
      {name:'modRate',defaultValue:20,minValue:0,maxValue:100},
      {name:'modDepth',defaultValue:30,minValue:0,maxValue:100},
      {name:'modFeedback',defaultValue:20,minValue:0,maxValue:90},
      {name:'modMix',defaultValue:50,minValue:0,maxValue:100},
      {name:'delayEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'delayTime',defaultValue:30,minValue:0,maxValue:100},
      {name:'delayFeedback',defaultValue:30,minValue:0,maxValue:90},
      {name:'delayMix',defaultValue:20,minValue:0,maxValue:100},
      {name:'delayTone',defaultValue:100,minValue:0,maxValue:100},
      {name:'reverbEnabled',defaultValue:1,minValue:0,maxValue:1},
      {name:'reverbDecay',defaultValue:20,minValue:0,maxValue:100},
      {name:'reverbMix',defaultValue:15,minValue:0,maxValue:100},
      {name:'reverbPreDelay',defaultValue:0,minValue:0,maxValue:100},
      {name:'reverbDamping',defaultValue:0,minValue:0,maxValue:100},
      {name:'masterGain',defaultValue:100,minValue:0,maxValue:200},
      {name:'masterTone',defaultValue:50,minValue:0,maxValue:100},
      {name:'masterDrive',defaultValue:0,minValue:0,maxValue:100},
      {name:'masterLimit',defaultValue:0,minValue:0,maxValue:100},
    ];
  }
  constructor() {
    super();
    this.sr = sampleRate;
    this.eqLow = new Biquad('lowshelf',150,0.7,0,this.sr);
    this.eqMid = new Biquad('peaking',800,1.0,0,this.sr);
    this.eqHigh = new Biquad('highshelf',4000,0.7,0,this.sr);
    this.eqPres = new Biquad('highshelf',6000,0.7,0,this.sr);
    this.driveLP = new OnePole(this.sr);
    this.cabLP = new OnePole(this.sr);
    this.cabAirEq = new Biquad('highshelf',8000,0.7,0,this.sr);
    this.delayLP = new OnePole(this.sr);
    this.masterLo = new Biquad('lowshelf',250,0.7,0,this.sr);
    this.masterHi = new Biquad('highshelf',4000,0.7,0,this.sr);
    this.gateEnv = 1;
    this.delayBuf = new Float32Array(Math.ceil(this.sr*1.5));
    this.delayIdx = 0;
    this.comb = [
      {buf:new Float32Array(Math.ceil(this.sr*0.0297)),idx:0,fb:0.84,lp:new OnePole(this.sr)},
      {buf:new Float32Array(Math.ceil(this.sr*0.0371)),idx:0,fb:0.88,lp:new OnePole(this.sr)},
      {buf:new Float32Array(Math.ceil(this.sr*0.0411)),idx:0,fb:0.90,lp:new OnePole(this.sr)},
      {buf:new Float32Array(Math.ceil(this.sr*0.0437)),idx:0,fb:0.92,lp:new OnePole(this.sr)},
    ];
    this.allpass = [
      {buf:new Float32Array(Math.ceil(this.sr*0.005)),idx:0,g:0.5},
      {buf:new Float32Array(Math.ceil(this.sr*0.0168)),idx:0,g:0.5},
    ];
    this.preBuf = new Float32Array(Math.ceil(this.sr*0.2));
    this.preIdx = 0;
    this.modBuf = new Float32Array(Math.ceil(this.sr*0.06));
    this.modIdx = 0;
    this.lfoPhase = 0;
    this.phaserAllpass = [
      new Allpass(this.sr), new Allpass(this.sr), new Allpass(this.sr),
      new Allpass(this.sr), new Allpass(this.sr), new Allpass(this.sr),
    ];
    this.phaserFb = 0;
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

    const gateOn=p.gateEnabled[0]>0.5, gateTh=p.gateThreshold[0];
    const gateAtt=Math.max(0.5,p.gateAttack[0])/1000, gateRel=Math.max(2,p.gateRelease[0])/1000;
    const gateDepth=p.gateDepth[0]/100;
    const attCoeff=1-Math.exp(-1/(gateAtt*this.sr)), relCoeff=1-Math.exp(-1/(gateRel*this.sr));

    const driveOn=p.driveEnabled[0]>0.5, drive=p.drive[0]/100, tube=p.tubeAmount[0]/100;
    const driveToneFreq=800*Math.pow(20,Math.max(0,Math.min(1,p.driveTone[0]/100)));
    const driveLevel=0.2+(p.driveLevel[0]/100)*0.8;

    const eqOn=p.eqEnabled[0]>0.5, bass=p.bass[0], mid=p.mid[0], treble=p.treble[0], presence=p.presence[0];

    const cabOn=p.cabEnabled[0]>0.5;
    const cabGain=p.cabLevel[0]/100;
    const cabMix=p.cabMix[0]/100;
    const cabToneFreq=2000*Math.pow(10,Math.max(0,Math.min(1,p.cabTone[0]/100)));
    const cabAir=p.cabAir[0]/100;

    const modOn=p.modEnabled[0]>0.5;
    const mType=Math.max(0,Math.min(4,Math.round(p.modType[0])));
    const mRate=0.05+(p.modRate[0]/100)*9.95;
    const mDepth=p.modDepth[0]/100;
    const mFb=p.modFeedback[0]/100;
    const mMix=p.modMix[0]/100;
    const lfoInc=mRate/this.sr;

    const delayOn=p.delayEnabled[0]>0.5, dTime=p.delayTime[0]/100, dFb=p.delayFeedback[0]/100, dMix=p.delayMix[0]/100;
    const dToneFreq=800*Math.pow(20,Math.max(0,Math.min(1,p.delayTone[0]/100)));
    const dSamples=Math.max(1,Math.floor(dTime*this.sr*1.5));

    const reverbOn=p.reverbEnabled[0]>0.5, rDecay=p.reverbDecay[0]/100, rMix=p.reverbMix[0]/100;
    const preSamples=Math.floor((p.reverbPreDelay[0]/100)*0.1*this.sr);
    const dampFreq=20000-18000*Math.max(0,Math.min(1,p.reverbDamping[0]/100));

    const master=p.masterGain[0]/100;
    const mTone=p.masterTone[0]/100;
    const mDrv=p.masterDrive[0]/100;
    const mLim=p.masterLimit[0]/100;
    const loGain=(0.5-mTone)*6, hiGain=(mTone-0.5)*12;
    const lim=1-mLim*0.5;

    if (eqOn) { this.eqLow.set(150,0.7,bass,this.sr); this.eqMid.set(800,1.0,mid,this.sr); this.eqHigh.set(4000,0.7,treble,this.sr); this.eqPres.set(6000,0.7,presence,this.sr); }
    for (let c of this.comb) { c.fb = 0.7 + rDecay * 0.28; c.lp.setLP(dampFreq); }
    if (cabOn) { this.cabLP.setLP(cabToneFreq); this.cabAirEq.set(8000,0.7,cabAir*6,this.sr); }
    if (driveOn) this.driveLP.setLP(driveToneFreq);
    this.delayLP.setLP(dToneFreq);
    this.masterLo.set(250,0.7,loGain,this.sr);
    this.masterHi.set(4000,0.7,hiGain,this.sr);

    for (let i=0;i<inCh.length;i++) {
      let x=inCh[i];

      // ─── NOISE GATE (envelope, attack/release/depth) ───
      if (gateOn) {
        const db=20*Math.log10(Math.abs(x)+1e-10);
        const target=db<gateTh?0:1;
        const coeff=target>this.gateEnv?attCoeff:relCoeff;
        this.gateEnv+=coeff*(target-this.gateEnv);
        x*=(1-gateDepth*(1-this.gateEnv));
      }

      // ─── TUBE DRIVE (tone lowpass + level) ───
      if (driveOn) {
        const gain=1+drive*20;
        let d=Math.tanh(x*gain)+tube*0.3*Math.sin(x*gain*Math.PI*0.5)+tube*0.05*Math.sin(x*Math.PI);
        d*=1-tube*0.15;
        d=this.driveLP.process(d);
        d*=driveLevel;
        x=d;
      }

      // ─── AMP EQ (bass/mid/treble/presence) ───
      if (eqOn) { x=this.eqLow.process(x); x=this.eqMid.process(x); x=this.eqHigh.process(x); x=this.eqPres.process(x); }

      // ─── CABINET IR (wet/dry + level + tone + air) ───
      let amp=x;
      if (cabOn && this.irBuf) {
        this.irState[this.irLen-1]=x;
        let c=0; for(let k=0;k<this.irLen;k++) c+=this.irBuf[k]*this.irState[this.irLen-1-k];
        for(let k=this.irLen-1;k>0;k--) this.irState[k]=this.irState[k-1];
        let wet=c*cabGain;
        wet=this.cabLP.process(wet);
        wet=this.cabAirEq.process(wet);
        amp=amp*(1-cabMix)+wet*cabMix;
      }

      // ─── MODULATION (chorus/flanger/phaser/tremolo/vibrato) ───
      if (modOn) {
        this.lfoPhase+=lfoInc;
        if (this.lfoPhase>=1) this.lfoPhase-=1;
        const lfo=Math.sin(2*Math.PI*this.lfoPhase);

        if (mType===0||mType===1||mType===4) {
          let base, depth;
          if (mType===0){base=0.020;depth=0.009*mDepth;}
          else if (mType===1){base=0.0025;depth=0.004*mDepth;}
          else {base=0.005;depth=0.006*mDepth;}
          const del=base+depth*(lfo*0.5+0.5);
          const dSamp=del*this.sr;
          let rp=this.modIdx-dSamp;
          rp=((rp%this.modBuf.length)+this.modBuf.length)%this.modBuf.length;
          const i0=Math.floor(rp), frac=rp-i0;
          const i1=(i0+1)%this.modBuf.length;
          const mRead=this.modBuf[i0]*(1-frac)+this.modBuf[i1]*frac;
          this.modBuf[this.modIdx]=amp+mRead*mFb;
          this.modIdx=(this.modIdx+1)%this.modBuf.length;
          if (mType===4) amp=mRead;
          else amp=amp*(1-mMix)+mRead*mMix;
        } else if (mType===2) {
          let p2=amp+this.phaserFb*mFb;
          for(let s=0;s<6;s++){
            const ph=(this.lfoPhase+s/6)%1;
            const lfoS=Math.sin(2*Math.PI*ph);
            const f=300+(1800+2700*mDepth)*(0.5+0.5*lfoS);
            this.phaserAllpass[s].setFreq(f);
            p2=this.phaserAllpass[s].process(p2);
          }
          this.phaserFb=p2;
          amp=amp*(1-mMix)+p2*mMix;
        } else if (mType===3) {
          const trem=1-mDepth*0.5*(1+lfo);
          amp*=trem;
        }
      }

      // ─── DELAY (tone on feedback) ───
      const dRead=this.delayBuf[(this.delayIdx-dSamples+this.delayBuf.length)%this.delayBuf.length];
      const dToned=this.delayLP.process(dRead);
      this.delayBuf[this.delayIdx]=amp+dToned*dFb;
      this.delayIdx=(this.delayIdx+1)%this.delayBuf.length;
      let wet=amp*(1-dMix)+dToned*dMix;

      // ─── REVERB (predelay + damping) ───
      if (reverbOn) {
        this.preBuf[this.preIdx]=amp;
        const preRead=this.preBuf[(this.preIdx-preSamples+this.preBuf.length)%this.preBuf.length];
        this.preIdx=(this.preIdx+1)%this.preBuf.length;
        let rev=preRead;
        for(let c of this.comb){
          const r=c.buf[c.idx];
          c.buf[c.idx]=rev+c.lp.process(r)*c.fb;
          c.idx=(c.idx+1)%c.buf.length;
          rev=r;
        }
        let ap=rev;
        for(let a of this.allpass){
          const r=a.buf[a.idx];
          const o=-a.g*ap+r;
          a.buf[a.idx]=ap+a.g*o;
          a.idx=(a.idx+1)%a.buf.length;
          ap=o;
        }
        wet=wet*(1-rMix)+ap*rMix;
      }

      // ─── MASTER (tone + drive + limit + gain) ───
      let out=wet;
      out=this.masterLo.process(out);
      out=this.masterHi.process(out);
      if (mDrv>0.001) out=out*(1+mDrv*0.6*Math.tanh(out*4));
      if (mLim>0.001) out=Math.tanh(out/lim)*lim;
      outCh[i]=out*master;
    }
    return true;
  }
}
registerProcessor('guitar-processor',GuitarProcessor);
`;

