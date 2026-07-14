// src/components/tools/SoloGenerator.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { generateSynchronizedSolo, type SyncSoloData } from '../../services/AIEngine';
import { generateTips, type Tip } from '../../utils/tipsGenerator';
import TablatureDisplay from '../fretboard/TablatureDisplay';
import * as Tone from 'tone';

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SoloGenerator: React.FC = () => {
  const { 
    keyNote, 
    mode, 
    bpm, 
    timeSignature, 
    getScaleNotes,
    getDiatonicChords,
    setKeyNote,
    setMode,
    setBpm
  } = useMusic();

  const [soloData, setSoloData] = useState<SyncSoloData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoopOn, setIsLoopOn] = useState(false);
  const [isMetronomeOn, setIsMetronomeOn] = useState(true);
  const [isChordsOn, setIsChordsOn] = useState(true);
  const [isSoloOn, setIsSoloOn] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [tips, setTips] = useState<Tip[]>([]);
  const [diatonicChords, setDiatonicChords] = useState<any[]>([]);
  //const [currentChord, setCurrentChord] = useState<string>('E');
  const [selectedChordIndex, setSelectedChordIndex] = useState<number>(0);

  const chordSynthRef = useRef<Tone.PolySynth | null>(null);
  const soloSynthRef = useRef<Tone.PolySynth | null>(null);
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const playheadAnimRef = useRef<number>(0);
  const scheduledEventsRef = useRef<any[]>([]);
  const loopIntervalRef = useRef<any>(null);
  const metronomeIntervalRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const chords = getDiatonicChords();
    setDiatonicChords(chords);
    if (chords.length > 0) {
      const firstChord = chords[0];
      if (firstChord) {
        //const chordName = firstChord.triad || firstChord.seventhChord || keyNote || 'C';
        //setCurrentChord(chordName);
      }
      setSelectedChordIndex(0);
    }
    stopPlayback();
  }, [keyNote, mode, getDiatonicChords]);

  const playMetronomeClick = (time: number, isAccent: boolean) => {
    if (!isMetronomeOn) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.value = isAccent ? 1400 : 900;
      
      gain.gain.setValueAtTime(isAccent ? 0.6 : 0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.05);
    } catch (e) {}
  };

  const startMetronome = () => {
    if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    const currentBpm = bpm || 120;
    const intervalMs = (60 / currentBpm) * 1000;
    let beatCount = 0;
    const beatsPerBar = timeSignature.beats;

    playMetronomeClick(Tone.now(), true);

    metronomeIntervalRef.current = setInterval(() => {
      if (!isPlaying) {
        if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
        return;
      }
      beatCount = (beatCount + 1) % 32;
      const isAccent = beatCount % beatsPerBar === 0;
      playMetronomeClick(Tone.now(), isAccent);
    }, intervalMs);
  };

  useEffect(() => {
    chordSynthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 1.5 }
    }).toDestination();
    chordSynthRef.current.volume.value = -14;

    soloSynthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.8 }
    }).toDestination();
    soloSynthRef.current.volume.value = -6;

    const guitarSampler = new Tone.Sampler({
      urls: { "E2": "E2.mp3", "A2": "A2.mp3", "D3": "D3.mp3", "G3": "G3.mp3", "B3": "B3.mp3", "E4": "E4.mp3" },
      baseUrl: "/samples/guitar/",
    }).toDestination();
    samplerRef.current = guitarSampler;

    return () => {
      stopPlayback();
      chordSynthRef.current?.dispose();
      soloSynthRef.current?.dispose();
      guitarSampler.dispose();
    };
  }, []);

  const stopPlayback = () => {
    scheduledEventsRef.current.forEach(event => { try { event.cancel(); } catch (err) {} });
    scheduledEventsRef.current = [];

    Tone.Transport.stop();
    Tone.Transport.cancel();

    if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
    if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);

    chordSynthRef.current?.releaseAll();
    soloSynthRef.current?.releaseAll();
    samplerRef.current?.releaseAll();

    setIsPlaying(false);
    setPlaybackProgress(0);
    cancelAnimationFrame(playheadAnimRef.current);
  };

  const getChordNotes = (chordName: string, key: string): string[] => {
    const root = chordName.replace(/[^A-G#b]/g, '');
    const quality = chordName.replace(/[A-G#b]/g, '');
    const map: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    const normalizedRoot = map[root] || root;
    const rootIdx = ALL_NOTES.indexOf(normalizedRoot);
    if (rootIdx === -1) return [key, ALL_NOTES[(ALL_NOTES.indexOf(key) + 4) % 12], ALL_NOTES[(ALL_NOTES.indexOf(key) + 7) % 12]];
    
    let intervals: number[] = [0, 4, 7];
    if (quality.includes('m')) intervals = quality.includes('7') ? [0, 3, 7, 10] : [0, 3, 7];
    if (quality === '7') intervals = [0, 4, 7, 10];
    if (quality === 'maj7') intervals = [0, 4, 7, 11];
    
    return intervals.map(i => ALL_NOTES[(rootIdx + i) % 12]);
  };

  const handleBarHeaderClick = (barIdx: number) => {
    if (diatonicChords.length === 0) return;
    const nextIdx = (selectedChordIndex + barIdx + 1) % diatonicChords.length;
    setSelectedChordIndex(nextIdx);
    const chordObj = diatonicChords[nextIdx];
    if (chordObj) (chordObj.triad || chordObj.seventhChord || keyNote);
    setTimeout(() => handleGenerate(), 50);
  };

  const openChordInDictionary = (chord: string) => {
    if (chord) window.dispatchEvent(new CustomEvent('openChord', { detail: { chord } }));
  };

  const handleGenerate = (e?: React.MouseEvent) => {
    if (e) (e.currentTarget as HTMLElement).blur();
    if (isPlaying) stopPlayback();
    
    setIsGenerating(true);
    setSoloData(null);
    setPlaybackProgress(0);
    setTips([]);

    setTimeout(() => {
      const currentKeyNote = keyNote || 'E';
      const currentMode = mode || 'major';
      const scale = getScaleNotes();
      const safeScale = scale && scale.length > 0 ? scale : ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'];
      
      const progression: { name: string; notes: string[] }[] = [];
      for (let i = 0; i < 4; i++) {
        const chordObj = diatonicChords[(selectedChordIndex + i) % diatonicChords.length] || diatonicChords[0];
        if (chordObj) {
          const name = chordObj.triad || chordObj.seventhChord || currentKeyNote;
          progression.push({ name, notes: chordObj.notes || getChordNotes(name, currentKeyNote) });
        } else {
          progression.push({ name: currentKeyNote, notes: [currentKeyNote] });
        }
      }

      // 🔥 Строгий вызов: 6 аргументов
      const newSolo = generateSynchronizedSolo(
        safeScale, 
        currentKeyNote, 
        currentMode, 
        timeSignature || { beats: 4, noteValue: 4 },
        progression, 
        false
      );
      
      setSoloData(newSolo);
      try {
        const chordNames = newSolo.chords.map(c => c.name);
        setTips(generateTips(newSolo as any, currentKeyNote, currentMode, chordNames, bpm || 120));
      } catch (err) {}
      setIsGenerating(false);
    }, 400);
  };

  const togglePlay = async (e?: React.MouseEvent) => {
    if (e) (e.currentTarget as HTMLElement).blur();
    if (!soloData) return;
    if (isPlaying) { stopPlayback(); return; }

    await Tone.start();
    setIsPlaying(true);
    
    const currentBpm = bpm || 120;
    Tone.Transport.bpm.value = currentBpm;
    const quarterDuration = 60 / currentBpm;
    const totalDurationSec = soloData.totalBeats * quarterDuration;

    if (isMetronomeOn) startMetronome();

    const startPlayback = (startTime: number) => {
      scheduledEventsRef.current.forEach(ev => { try { ev.cancel(); } catch(err){} });
      scheduledEventsRef.current = [];

      if (isChordsOn) {
        soloData.chords.forEach(chord => {
          const time = startTime + chord.beatStart * quarterDuration;
          const duration = chord.durationBeats * quarterDuration;
          const freqs = (chord.notes && chord.notes.length > 0 ? chord.notes : [keyNote]).map(n => {
             const clean = n.replace(/[0-9]/g, '');
             return `${clean}3`;
          });
          chordSynthRef.current?.triggerAttackRelease(freqs, duration * 0.95, time);
        });
      }

      if (isSoloOn) {
        const OPEN_FREQS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
        const activeInst = samplerRef.current?.loaded ? samplerRef.current : soloSynthRef.current;
        
        soloData.notes.forEach(note => {
          if (!note.isRest && note.fret !== null) {
            const time = startTime + note.beatStart * quarterDuration;
            const duration = note.beatDuration * quarterDuration * (note.durationFactor || 1);
            const freq = OPEN_FREQS[note.string] * Math.pow(2, note.fret / 12);
            const velocity = note.accent ? 0.9 : 0.6;
            activeInst?.triggerAttackRelease(freq, duration, time, velocity);
          }
        });
      }
    };

    const startTime = Tone.now() + 0.05;
    startPlayback(startTime);

    if (isLoopOn) {
      loopIntervalRef.current = setInterval(() => {
        if (!isPlaying) { clearInterval(loopIntervalRef.current); return; }
        startPlayback(Tone.now() + 0.05);
      }, totalDurationSec * 1000);
    }

    const drawPlayhead = () => {
      const now = Tone.now();
      let progress = (now - startTime) / totalDurationSec;
      if (isLoopOn) progress = Math.max(0, progress % 1);
      
      if (progress >= 1 && !isLoopOn) {
        setPlaybackProgress(1);
        stopPlayback();
        setTimeout(() => setPlaybackProgress(0), 400);
      } else {
        setPlaybackProgress(progress);
        playheadAnimRef.current = requestAnimationFrame(drawPlayhead);
      }
    };
    playheadAnimRef.current = requestAnimationFrame(drawPlayhead);
  };

  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 440;
  const TRACK_MARGIN_X = 30;
  const BAR_WIDTH = (SVG_WIDTH - TRACK_MARGIN_X * 2) / (soloData?.bars || 4);
  const BEAT_WIDTH = BAR_WIDTH / (timeSignature?.beats || 4);
  const CHORD_Y = 35;
  const TAB_Y = 120;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>🎼 AI Studio Progress Composer</h2>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Тональность: <strong style={{ color: 'var(--accent)' }}>{keyNote} {mode.replace(/_/g, ' ')}</strong></span>
            <span>Размер: <strong>{timeSignature.beats}/{timeSignature.noteValue}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={keyNote} onChange={e => setKeyNote(e.target.value)} style={{ background: '#111216', color: '#fff', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontWeight: 700 }}>
            {ALL_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={mode} onChange={e => setMode(e.target.value as any)} style={{ background: '#111216', color: '#fff', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, textTransform: 'capitalize' }}>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
            <option value="pentatonic">Pentatonic</option>
            <option value="blues">Blues</option>
          </select>

          <div style={{ display: 'flex', gap: '6px' }}>
            {!isPlaying ? (
              <button onClick={togglePlay} disabled={!soloData || isGenerating} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 900, cursor: 'pointer' }}>▶ PLAY</button>
            ) : (
              <button onClick={(e) => { (e.currentTarget as HTMLElement).blur(); stopPlayback(); }} style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 900, cursor: 'pointer' }}>⏹ STOP</button>
            )}
            <button onClick={(e) => { (e.currentTarget as HTMLElement).blur(); setIsLoopOn(!isLoopOn); }} style={{ background: isLoopOn ? 'var(--accent)' : 'transparent', color: isLoopOn ? '#000' : 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>🔁 LOOP</button>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating || isPlaying} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 20px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>
            {isGenerating ? '⏳ RENDERING...' : '🎲 GENERATE'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-root)', padding: '10px 16px', borderRadius: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800 }}>TEMPO</span>
          <input type="number" value={bpm} onChange={e => setBpm(Number(e.target.value))} style={{ width: '60px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', textAlign: 'center', fontWeight: 900 }} />
        </div>
        <button onClick={(e) => { (e.currentTarget as HTMLElement).blur(); setIsMetronomeOn(!isMetronomeOn); }} style={{ background: isMetronomeOn ? 'var(--accent)' : 'transparent', color: isMetronomeOn ? '#000' : 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
          🥁 Метроном: {isMetronomeOn ? 'ON' : 'OFF'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={isChordsOn} onChange={e => setIsChordsOn(e.target.checked)} /> Аккорды
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={isSoloOn} onChange={e => setIsSoloOn(e.target.checked)} /> Соло-Лид
        </label>
      </div>

      <div style={{ background: '#090a0e', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto', position: 'relative', minHeight: '320px' }}>
        {soloData ? (
          <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ display: 'block' }}>
            {Array.from({ length: soloData.bars }).map((_, barIdx) => {
              const x = TRACK_MARGIN_X + barIdx * BAR_WIDTH;
              return (
                <g key={barIdx}>
                  <line x1={x} y1={0} x2={x} y2={SVG_HEIGHT} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <rect x={x + 4} y={6} width={BAR_WIDTH - 8} height={22} fill="rgba(255,255,255,0.02)" rx="4" style={{ cursor: 'pointer' }} onClick={() => handleBarHeaderClick(barIdx)} />
                  <text x={x + BAR_WIDTH/2} y={21} fill="var(--text-muted)" fontSize="11" fontWeight="900" textAnchor="middle" style={{ cursor: 'pointer' }} onClick={() => handleBarHeaderClick(barIdx)}>
                    Bar {barIdx + 1} ✎
                  </text>
                </g>
              );
            })}
            <line x1={SVG_WIDTH - TRACK_MARGIN_X} y1={0} x2={SVG_WIDTH - TRACK_MARGIN_X} y2={SVG_HEIGHT} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

            {soloData.chords.map((chord, idx) => {
              const x = TRACK_MARGIN_X + chord.beatStart * BEAT_WIDTH;
              const w = chord.durationBeats * BEAT_WIDTH;
              return (
                <g key={idx}>
                  <rect x={x + 4} y={CHORD_Y} width={w - 8} height={36} fill="rgba(0,255,157,0.03)" stroke="rgba(0,255,157,0.1)" rx="6" />
                  <text x={x + w/2} y={CHORD_Y + 24} fill="var(--accent)" fontSize="16" fontWeight="900" textAnchor="middle" style={{ cursor: 'pointer' }} onClick={() => openChordInDictionary(chord.name)}>{chord.name}</text>
                </g>
              );
            })}

            <foreignObject x={TRACK_MARGIN_X} y={TAB_Y} width={SVG_WIDTH - TRACK_MARGIN_X*2} height={280}>
              <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <TablatureDisplay 
                  notes={soloData.notes} 
                  activeStep={isPlaying && isSoloOn ? Math.floor(playbackProgress * soloData.notes.length) : -1} 
                  height={260} 
                  noteSpacing={80} 
                />
              </div>
            </foreignObject>

            {isPlaying && (
              <line x1={TRACK_MARGIN_X + playbackProgress * (SVG_WIDTH - TRACK_MARGIN_X*2)} y1={CHORD_Y} x2={TRACK_MARGIN_X + playbackProgress * (SVG_WIDTH - TRACK_MARGIN_X*2)} y2={SVG_HEIGHT} stroke="var(--accent)" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 6px var(--accent))' }} />
            )}
          </svg>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)', fontWeight: 800, fontSize: '13px' }}>
            {isGenerating ? 'ВЫЧИСЛЕНИЕ ПРОГРЕССИИ И ГЕНЕРАЦИЯ ФРАЗ...' : 'СЕТКА ПУСТА. НАЖМИТЕ GENERATE ДЛЯ СОЗДАНИЯ 4-ТАКТНОГО СОЛО'}
          </div>
        )}
      </div>

      {tips.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>💡 Аналитический разбор ИИ:</span>
          {tips.map((tip, i) => (
            <div key={i} style={{ fontSize: '12px', background: 'rgba(0,255,157,0.04)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid var(--accent)', color: 'var(--text-primary)' }}>
              <strong>{tip.title}:</strong> {tip.description}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default SoloGenerator;