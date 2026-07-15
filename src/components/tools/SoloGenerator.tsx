// src/components/tools/SoloGenerator.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { generateSynchronizedSolo, type SyncSoloData } from '../../services/AIEngine';
import { generateTips, type Tip } from '../../utils/tipsGenerator';
import TablatureDisplay from '../fretboard/TablatureDisplay';
import * as Tone from 'tone';
import { audioManager } from '../../services/AudioManager';
import { 
  DrumPatterns, 
  getRandomPattern, 
  mutatePattern, 
  type DrumPattern,
  PatternGenerator 
} from '../../utils/drumPatterns';

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SoloGenerator: React.FC = () => {
  const { keyNote, mode, bpm, timeSignature, getScaleNotes, getDiatonicChords, setKeyNote, setMode, setBpm } = useMusic();

  const [soloData, setSoloData] = useState<SyncSoloData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoopOn, setIsLoopOn] = useState(false);
  const [isChordsOn, setIsChordsOn] = useState(true);
  const [isSoloOn, setIsSoloOn] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [tips, setTips] = useState<Tip[]>([]);
  const [diatonicChords, setDiatonicChords] = useState<any[]>([]);
  const [progression, setProgression] = useState<{ name: string; notes: string[] }[]>([]);
  const [editingBarIndex, setEditingBarIndex] = useState<number | null>(null);

  const [isDrumOn, setIsDrumOn] = useState(true);
  const [drumPatternName, setDrumPatternName] = useState<string>('ROCK');
  const [drumPattern, setDrumPattern] = useState<DrumPattern>(DrumPatterns.ROCK);
  const [drumVelocity, setDrumVelocity] = useState<number>(0.8);
  const [drumPatternNames, setDrumPatternNames] = useState<string[]>(Object.keys(DrumPatterns));

  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomHistory, setRandomHistory] = useState<DrumPattern[]>([]);

  const sequencePartRef = useRef<Tone.Part | null>(null);
  const playheadAnimRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ============================================
  // 🔥 АВТОСКРОЛЛ
  // ============================================
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (!isPlaying || !containerRef.current) return;
    const container = containerRef.current;
    const scrollWidth = container.scrollWidth - container.clientWidth;
    const targetScroll = playbackProgress * scrollWidth;
    setScrollPosition(targetScroll);
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
  }, [playbackProgress, isPlaying]);

  const getChordNotesLocal = (chordName: string, key: string): string[] => {
    let normalizedName = chordName;
    if (chordName.includes('mm')) {
      normalizedName = chordName.replace(/mm/g, 'm');
    }
    
    const rootMatch = normalizedName.match(/^[A-G][b#]?/);
    const root = rootMatch ? rootMatch[0] : key;
    const quality = normalizedName.substring(root.length);
    
    const map: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    const normalizedRoot = map[root] || root;
    const rootIdx = ALL_NOTES.indexOf(normalizedRoot);
    
    if (rootIdx === -1) {
      const idx = ALL_NOTES.indexOf(key);
      return [key, ALL_NOTES[(idx + 4) % 12], ALL_NOTES[(idx + 7) % 12]];
    }

    let intervals: number[] = [0, 4, 7];
    
    if (quality === '' || quality === 'M' || quality === 'maj' || quality === 'maj7' || quality === 'M7') {
      intervals = [0, 4, 7, 11];
    } else if (quality === 'm' || quality === 'min' || quality === 'm7' || quality === 'min7') {
      intervals = [0, 3, 7, 10];
    } else if (quality === '7' || quality === 'dom7') {
      intervals = [0, 4, 7, 10];
    } else if (quality === 'maj9') {
      intervals = [0, 4, 7, 11, 14];
    } else if (quality === 'm9') {
      intervals = [0, 3, 7, 10, 14];
    } else if (quality === '9') {
      intervals = [0, 4, 7, 10, 14];
    } else if (quality === 'm7b5' || quality === 'ø') {
      intervals = [0, 3, 6, 10];
    } else if (quality === 'dim' || quality === 'o') {
      intervals = [0, 3, 6];
    } else if (quality === 'dim7' || quality === 'o7') {
      intervals = [0, 3, 6, 9];
    } else if (quality === 'aug' || quality === '+') {
      intervals = [0, 4, 8];
    } else if (quality === '7#9') {
      intervals = [0, 4, 7, 10, 15];
    } else if (quality === '7b9') {
      intervals = [0, 4, 7, 10, 13];
    } else if (quality === 'sus4') {
      intervals = [0, 5, 7];
    } else if (quality === 'sus2') {
      intervals = [0, 2, 7];
    } else if (quality === '6') {
      intervals = [0, 4, 7, 9];
    } else if (quality === 'm6') {
      intervals = [0, 3, 7, 9];
    } else {
      intervals = [0, 4, 7];
    }

    return intervals.map(i => ALL_NOTES[(rootIdx + i) % 12]);
  };

  // ============================================
  // ГЕНЕРАЦИЯ ПРОГРЕССИИ
  // ============================================
  const generateProgression = () => {
    const chords = getDiatonicChords();
    setDiatonicChords(chords);
    
    if (chords.length > 0) {
      const root = keyNote || 'C';
      
      let chordSuffix = '';
      let useChordType: 'triad' | 'seventh' | 'ninth' | 'altered' = 'triad';
      
      if (mode === 'maj7_arp') {
        useChordType = 'seventh';
        chordSuffix = 'maj7';
      } else if (mode === 'min7_arp') {
        useChordType = 'seventh';
        chordSuffix = 'm7';
      } else if (mode === 'dom7_arp') {
        useChordType = 'seventh';
        chordSuffix = '7';
      } else if (mode === 'dom9_arp') {
        useChordType = 'ninth';
        chordSuffix = '9';
      } else if (mode === 'altered') {
        useChordType = 'altered';
        chordSuffix = '7#9';
      }
      
      const getChordName = (chord: any, index: number): string => {
        const rootNote = chord?.triad?.replace(/[^A-G#b]/g, '') || root;
        
        if (useChordType === 'altered') {
          if (index === 2) {
            return rootNote + '7#9';
          }
          return rootNote + '7';
        }
        
        if (useChordType === 'triad') {
          return chord?.triad || root;
        }
        
        if (useChordType === 'seventh' || useChordType === 'ninth') {
          return rootNote + chordSuffix;
        }
        
        return chord?.triad || root;
      };
      
      const chordIndexes = [0, 3, 4, 0];
      
      const newProg = chordIndexes.map((idx, pos) => {
        const chord = chords[idx % chords.length];
        const name = getChordName(chord, pos);
        
        return {
          name: name,
          notes: getChordNotesLocal(name, root)
        };
      });
      
      setProgression(newProg);
      stopPlayback();
      setTimeout(() => { executeGeneration(newProg); }, 50);
    }
  };

  useEffect(() => {
    generateProgression();
  }, [keyNote, mode]);

  // ============================================
  // 🎲 ГЕНЕРАЦИЯ СЛУЧАЙНОГО ПАТТЕРНА
  // ============================================
  const generateRandomPattern = () => {
    setIsRandomizing(true);
    
    try {
      const styles: ('rock' | 'funk' | 'jazz' | 'electronic' | 'experimental')[] = 
        ['rock', 'funk', 'jazz', 'electronic', 'experimental'];
      const densities: ('sparse' | 'medium' | 'dense')[] = ['sparse', 'medium', 'dense'];
      
      const options = {
        length: Math.random() > 0.5 ? 16 : 8 as 8 | 16,
        density: densities[Math.floor(Math.random() * densities.length)],
        style: styles[Math.floor(Math.random() * styles.length)],
        swing: Math.random() * 0.3,
        complexity: Math.floor(Math.random() * 5) + 1 as 1 | 2 | 3 | 4 | 5
      };

      const newPattern = getRandomPattern(options);
      
      setRandomHistory(prev => [...prev, newPattern].slice(-10));
      
      const randomName = `RANDOM_${Date.now()}`;
      (DrumPatterns as any)[randomName] = newPattern;
      
      const newNames = Object.keys(DrumPatterns);
      setDrumPatternNames(newNames);
      
      setDrumPatternName(randomName);
      setDrumPattern(newPattern);
      
    } catch (error) {
      console.error('Error generating random pattern:', error);
    } finally {
      setIsRandomizing(false);
    }
  };

  // ============================================
  // 🔄 МУТАЦИЯ
  // ============================================
  const mutateCurrentPattern = () => {
    if (!drumPattern) return;
    
    try {
      const mutated = mutatePattern(drumPattern, 0.15);
      const randomName = `MUTATED_${Date.now()}`;
      (DrumPatterns as any)[randomName] = mutated;
      
      const newNames = Object.keys(DrumPatterns);
      setDrumPatternNames(newNames);
      
      setDrumPatternName(randomName);
      setDrumPattern(mutated);
      
      setRandomHistory(prev => [...prev, mutated].slice(-10));
      
    } catch (error) {
      console.error('Error mutating pattern:', error);
    }
  };

  // ============================================
  // 🎲 ГЕНЕРАЦИЯ НЕСКОЛЬКИХ ПАТТЕРНОВ
  // ============================================
  const generateMultiplePatterns = (count: number = 5) => {
    setIsRandomizing(true);
    
    try {
      const patterns: DrumPattern[] = PatternGenerator.generateMultiple(count);
      
      setRandomHistory(prev => [...prev, ...patterns].slice(-20));
      
      patterns.forEach((pattern, index) => {
        const name = `RANDOM_${Date.now()}_${index}`;
        (DrumPatterns as any)[name] = pattern;
      });
      
      const newNames = Object.keys(DrumPatterns);
      setDrumPatternNames(newNames);
      
      const selected = patterns[Math.floor(Math.random() * patterns.length)];
      const selectedName = Object.keys(DrumPatterns).find(
        name => DrumPatterns[name] === selected
      );
      
      if (selectedName) {
        setDrumPatternName(selectedName);
        setDrumPattern(selected);
      }
      
    } catch (error) {
      console.error('Error generating multiple patterns:', error);
    } finally {
      setIsRandomizing(false);
    }
  };

  // ============================================
  // ↩️ ВОССТАНОВЛЕНИЕ ИЗ ИСТОРИИ
  // ============================================
  const restoreFromHistory = (index: number) => {
    if (index >= randomHistory.length) return;
    const pattern = randomHistory[index];
    const name = `HISTORY_${Date.now()}`;
    (DrumPatterns as any)[name] = pattern;
    
    const newNames = Object.keys(DrumPatterns);
    setDrumPatternNames(newNames);
    
    setDrumPatternName(name);
    setDrumPattern(pattern);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
        e.preventDefault();
        
        setIsPlaying(prev => {
          if (prev) {
            stopPlayback();
            return false;
          } else {
            if (soloData) playScore(soloData);
            return true;
          }
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [soloData, isChordsOn, isSoloOn, bpm, isLoopOn, isDrumOn, drumPattern]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setEditingBarIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stopPlayback = () => {
    if (sequencePartRef.current) {
      sequencePartRef.current.stop();
      sequencePartRef.current.dispose();
      sequencePartRef.current = null;
    }

    Tone.Transport.stop();
    Tone.Transport.cancel(0);
    
    audioManager.stopAll();

    cancelAnimationFrame(playheadAnimRef.current);
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  const executeGeneration = (targetProgression: { name: string; notes: string[] }[]) => {
    setIsGenerating(true);
    setSoloData(null);
    setPlaybackProgress(0);
    setTips([]);

    const scale = getScaleNotes();
    const safeScale = scale && scale.length > 0 ? scale : ['C', 'D', 'E', 'G', 'A'];

    const chordsForGeneration = targetProgression.map(chord => {
      if (!chord.notes || chord.notes.length === 0) {
        const notes = getChordNotesLocal(chord.name, keyNote || 'C');
        return { ...chord, notes };
      }
      return chord;
    });

    const newSolo = generateSynchronizedSolo(
      safeScale, 
      keyNote || 'C', 
      mode || 'major', 
      timeSignature || { beats: 4, noteValue: 4 }, 
      chordsForGeneration,
      false
    );

    setSoloData(newSolo);
    try {
      const chordNames = newSolo.chords.map(c => c.name);
      setTips(generateTips(newSolo as any, keyNote || 'C', mode || 'major', chordNames, bpm || 120));
    } catch (err) {}
    setIsGenerating(false);
  };

  const handleGenerateClick = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLButtonElement).blur();
    stopPlayback();
    executeGeneration(progression);
  };

  const playScore = async (data: SyncSoloData) => {
    if (!data.notes || data.notes.length === 0) {
      console.warn('⚠️ Нет нот для воспроизведения!');
      return;
    }
    
    await audioManager.init();
    await Tone.start();
    
    Tone.Transport.bpm.value = bpm;
    
    const quarterDuration = 60 / bpm;
    const totalDurationSec = data.totalBeats * quarterDuration;
    
    const events: any[] = [];

    if (isChordsOn) {
      data.chords.forEach(chord => {
        const time = chord.beatStart * quarterDuration;
        const notes = (chord.notes && chord.notes.length > 0 ? chord.notes : [keyNote])
          .map(n => `${n.replace(/[0-9]/g, '')}3`);
        events.push({ 
          time, 
          type: 'chord', 
          notes, 
          duration: chord.durationBeats * quarterDuration * 0.95 
        });
      });
    }

    if (isSoloOn) {
      const stringToFreq = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
      
      data.notes.forEach(note => {
        if (!note.isRest && note.fret !== null) {
          const time = note.beatStart * quarterDuration;
          const freq = stringToFreq[note.string] * Math.pow(2, note.fret / 12);
          const duration = note.beatDuration * quarterDuration;
          const velocity = note.accent ? 0.9 : 0.6;
          
          events.push({ 
            time, 
            type: 'solo_web_audio',
            freq,
            duration,
            velocity 
          });
        }
      });
    }

    if (isDrumOn && drumPattern) {
      const pattern = drumPattern;
      const patternLength = pattern.kick.length;
      const subdivision = quarterDuration / (patternLength / 4);
      const totalSteps = Math.ceil(data.totalBeats * (patternLength / 4));
      
      for (let i = 0; i < totalSteps; i++) {
        const time = i * subdivision;
        const patternIndex = i % patternLength;
        const humanize = () => 0.85 + Math.random() * 0.3;
        
        if (pattern.kick[patternIndex]) {
          events.push({ time, type: 'drum', drum: 'kick', velocity: drumVelocity * 0.9 * humanize() });
        }
        if (pattern.snare[patternIndex]) {
          events.push({ time, type: 'drum', drum: 'snare', velocity: drumVelocity * 0.95 * humanize() });
        }
        if (pattern.hihat[patternIndex]) {
          events.push({ time, type: 'drum', drum: 'hihat', velocity: drumVelocity * 0.6 * humanize() });
        }
        if (pattern.ride && pattern.ride[patternIndex]) {
          events.push({ time, type: 'drum', drum: 'ride', velocity: drumVelocity * 0.7 * humanize() });
        }
        if (pattern.crash && pattern.crash[patternIndex]) {
          events.push({ time, type: 'drum', drum: 'crash', velocity: drumVelocity * 0.8 * humanize() });
        }
        if (pattern.tom && pattern.tom[patternIndex]) {
          events.push({ time, type: 'drum', drum: 'tom', velocity: drumVelocity * 0.75 * humanize() });
        }
      }
    }

    sequencePartRef.current = new Tone.Part((time, value) => {
      if (value.type === 'chord') {
        audioManager.chordSynth.triggerAttackRelease(value.notes, value.duration, time);
      } else if (value.type === 'solo_web_audio') {
        audioManager.playWebAudioGuitarNote(
          value.freq,
          value.duration,
          time + 0.05,
          value.velocity
        );
      } else if (value.type === 'drum') {
        audioManager.playDrumHit(value.drum, time, value.velocity);
      }
    }, events).start(0);

    sequencePartRef.current.loop = isLoopOn;
    sequencePartRef.current.loopEnd = totalDurationSec;

    Tone.Transport.start();
    startTimeRef.current = Tone.now();

    const drawPlayhead = () => {
      if (Tone.Transport.state !== 'started') return;
      
      const elapsed = Tone.now() - startTimeRef.current;
      let progress = elapsed / totalDurationSec;
      
      if (isLoopOn) {
        progress = progress % 1;
      } else if (progress >= 1) {
        stopPlayback();
        return;
      }

      setPlaybackProgress(progress);
      playheadAnimRef.current = requestAnimationFrame(drawPlayhead);
    };

    playheadAnimRef.current = requestAnimationFrame(drawPlayhead);
  };

  const togglePlayBtn = async (e: React.MouseEvent) => {
    (e.currentTarget as HTMLButtonElement).blur();
    if (!soloData) return;
    
    if (isPlaying) {
      stopPlayback();
    } else {
      await audioManager.init();
      setIsPlaying(true);
      playScore(soloData);
    }
  };

  const SVG_WIDTH = 1400; // 🔥 ФИКСИРОВАННАЯ ШИРИНА
  const SVG_HEIGHT = 520; // 🔥 УВЕЛИЧЕННАЯ ВЫСОТА
  const TRACK_MARGIN_X = 20;
  const BAR_WIDTH = (SVG_WIDTH - TRACK_MARGIN_X * 2) / 4;
  const BEAT_WIDTH = BAR_WIDTH / (timeSignature?.beats || 4);
  const CHORD_Y = 25;
  const TAB_Y = 140;

  const getNoteSpacing = () => {
    if (!soloData) return 95; // 🔥 ФИКСИРОВАННЫЙ ШАГ
    const totalNotes = soloData.notes.filter(n => !n.isRest).length;
    const totalBeats = soloData.totalBeats || 16;
    const idealNotes = totalBeats * 2;
    const baseSpacing = 95;
    const minSpacing = 45;
    const maxSpacing = 130;
    if (totalNotes === 0) return baseSpacing;
    const ratio = totalNotes / idealNotes;
    let spacing = baseSpacing / ratio;
    return Math.max(minSpacing, Math.min(maxSpacing, spacing));
  };

  const noteSpacing = getNoteSpacing();

  const getSuggestedChords = (currentChord: string): string[] => {
    const rootMatch = currentChord.match(/^[A-G][b#]?/);
    const root = rootMatch ? rootMatch[0] : keyNote;
    const suggestions: string[] = [];
    
    const types = ['', 'm', '7', 'maj7', '9', 'm7', 'm7b5', 'dim', 'aug', 'sus4'];
    types.forEach(type => {
      const name = root + type;
      if (name !== currentChord) {
        suggestions.push(name);
      }
    });
    
    diatonicChords.forEach(chord => {
      const name = chord?.triad || '';
      if (name && name !== currentChord && !suggestions.includes(name)) {
        suggestions.push(name);
      }
    });
    
    return suggestions.slice(0, 8);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: '12px 0' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>🎼 AI Studio Progress Composer</h2>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Тональность: <strong style={{ color: 'var(--accent)' }}>{keyNote} {mode.replace(/_/g, ' ')}</strong></span>
            <span>Размер: <strong>{timeSignature.beats}/{timeSignature.noteValue}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={keyNote} onChange={e => setKeyNote(e.target.value)} style={{ background: '#111216', color: '#fff', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontWeight: 700 }}>
            {ALL_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={mode} onChange={e => setMode(e.target.value as any)} style={{ background: '#111216', color: '#fff', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, textTransform: 'capitalize' }}>
            <option value="major">Major (Ionian)</option>
            <option value="minor">Minor (Aeolian)</option>
            <option value="harmonic_minor">Harmonic Minor</option>
            <option value="melodic_minor">Melodic Minor</option>
            <option value="pentatonic">Pentatonic</option>
            <option value="blues">Blues</option>
            <option value="dorian">Dorian</option>
            <option value="phrygian">Phrygian</option>
            <option value="lydian">Lydian</option>
            <option value="mixolydian">Mixolydian</option>
            <option value="locrian">Locrian</option>
            <option value="maj7_arp">Maj7 Arpeggio</option>
            <option value="min7_arp">Min7 Arpeggio</option>
            <option value="dom7_arp">Dom7 Arpeggio</option>
            <option value="dom9_arp">Dom9 Arpeggio</option>
            <option value="altered">Altered</option>
          </select>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={togglePlayBtn} disabled={!soloData || isGenerating} style={{ background: isPlaying ? '#ff4444' : 'var(--accent)', color: isPlaying ? '#fff' : '#000', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', transition: '0.2s' }}>
              {isPlaying ? '⏹ STOP' : '▶ PLAY'}
            </button>
            <button onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); setIsLoopOn(!isLoopOn); }} style={{ background: isLoopOn ? 'var(--accent)' : 'transparent', color: isLoopOn ? '#000' : 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>
              🔁 LOOP: {isLoopOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <button onClick={handleGenerateClick} disabled={isGenerating || isPlaying} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 20px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>
            {isGenerating ? '⏳ RENDERING...' : '🎲 GENERATE'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-root)', padding: '10px 16px', borderRadius: '8px', flexWrap: 'wrap', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800 }}>TEMPO</span>
          <input type="number" value={bpm} onChange={e => setBpm(Number(e.target.value))} style={{ width: '60px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', textAlign: 'center', fontWeight: 900 }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={isChordsOn} onChange={e => setIsChordsOn(e.target.checked)} /> Chords Backing
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={isSoloOn} onChange={e => setIsSoloOn(e.target.checked)} /> Lead Solo
        </label>
      </div>

      {/* Секция барабанов */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'center', 
        background: 'var(--bg-root)', 
        padding: '8px 16px', 
        borderRadius: '8px', 
        flexWrap: 'wrap', 
        width: '100%',
        border: '1px solid var(--border-color)'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={isDrumOn} onChange={e => setIsDrumOn(e.target.checked)} />
          🥁 Drums
        </label>
        
        <select 
          value={drumPatternName} 
          onChange={e => {
            const name = e.target.value;
            setDrumPatternName(name);
            setDrumPattern(DrumPatterns[name]);
          }}
          style={{ 
            background: '#111216', 
            color: '#fff', 
            border: '1px solid var(--border-color)', 
            padding: '4px 12px', 
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            minWidth: '140px',
            maxWidth: '200px'
          }}
        >
          {drumPatternNames.map(name => {
            const pattern = DrumPatterns[name];
            if (!pattern) return null;
            const stars = pattern.complexity ? '★'.repeat(Math.min(pattern.complexity, 5)) : '';
            const isRandom = pattern.isRandom ? '🎲' : '';
            return (
              <option key={name} value={name}>
                {isRandom} {pattern.name} {stars ? `⭐${stars}` : ''}
              </option>
            );
          })}
        </select>

        <button onClick={generateRandomPattern} disabled={isRandomizing} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--accent)', background: isRandomizing ? 'var(--bg-secondary)' : 'var(--accent)', color: isRandomizing ? 'var(--text-muted)' : '#000', cursor: isRandomizing ? 'default' : 'pointer', fontWeight: 800, fontSize: '12px', transition: '0.2s', whiteSpace: 'nowrap' }}>
          {isRandomizing ? '⏳ ...' : '🎲 Random'}
        </button>

        <button onClick={mutateCurrentPattern} disabled={!drumPattern || isRandomizing} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: drumPattern && !isRandomizing ? 'var(--text-primary)' : 'var(--text-muted)', cursor: drumPattern && !isRandomizing ? 'pointer' : 'default', fontWeight: 600, fontSize: '12px', transition: '0.2s', whiteSpace: 'nowrap' }}>
          🔄 Mutate
        </button>

        <button onClick={() => generateMultiplePatterns(5)} disabled={isRandomizing} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: isRandomizing ? 'var(--text-muted)' : 'var(--text-primary)', cursor: isRandomizing ? 'default' : 'pointer', fontWeight: 600, fontSize: '12px', transition: '0.2s', whiteSpace: 'nowrap' }}>
          🎲 5x
        </button>

        {randomHistory.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>↺</span>
            {randomHistory.slice(-5).map((_, index) => (
              <button key={index} onClick={() => restoreFromHistory(randomHistory.length - 1 - index)} style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '10px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} title={`Restore pattern #${randomHistory.length - index}`} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                {index + 1}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>VOL</span>
          <input type="range" min="0" max="1" step="0.05" value={drumVelocity} onChange={e => setDrumVelocity(Number(e.target.value))} style={{ width: '80px', accentColor: 'var(--accent)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '35px' }}>{Math.round(drumVelocity * 100)}%</span>
        </div>

        <div style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '200px', textAlign: 'right' }}>
          {drumPattern.isRandom ? '🎲 Random' : drumPattern.description?.substring(0, 30) + (drumPattern.description?.length > 30 ? '...' : '')}
        </div>
      </div>

      {/* 🔥 Основной плеер SVG с ФИКСИРОВАННОЙ шириной */}
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          background: '#090a0e', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)', 
          overflowX: 'auto', 
          overflowY: 'hidden',
          position: 'relative', 
          minHeight: `${SVG_HEIGHT}px`,
          scrollBehavior: 'smooth'
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 8px', background: 'rgba(0,0,0,0.5)', borderRadius: '0 0 0 4px', fontSize: '9px', color: 'var(--text-muted)', zIndex: 10, pointerEvents: 'none', opacity: 0.5 }}>
          {Math.round((scrollPosition / (containerRef.current?.scrollWidth || 1)) * 100)}%
        </div>

        {soloData ? (
          <>
            <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ display: 'block', minWidth: '100%' }}>
              
              {progression.map((chord, idx) => {
                const x = TRACK_MARGIN_X + idx * BAR_WIDTH;
                return (
                  <g key={`bg-${idx}`}>
                    <rect x={x} y={CHORD_Y} width={BAR_WIDTH} height="40" fill={idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)"} />
                    
                    <rect 
                      x={x} y={CHORD_Y} 
                      width={BAR_WIDTH} height="40" 
                      fill="transparent" 
                      stroke={editingBarIndex === idx ? "var(--accent)" : "rgba(0,255,157,0.2)"} 
                      strokeWidth={editingBarIndex === idx ? 2 : 0}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingBarIndex(editingBarIndex === idx ? null : idx);
                      }}
                    />
                    <text 
                      x={x + BAR_WIDTH / 2} y={CHORD_Y + 26} 
                      fill="var(--accent)" 
                      fontSize="22" fontWeight="900" textAnchor="middle" 
                      style={{ cursor: 'pointer', pointerEvents: 'none' }}
                    >
                      {chord.name} ▾
                    </text>

                    <line x1={x} y1={CHORD_Y} x2={x} y2={SVG_HEIGHT} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                    
                    {Array.from({ length: timeSignature?.beats || 4 }).map((__, beatIdx) => {
                      if (beatIdx === 0) return null;
                      const beatX = x + beatIdx * BEAT_WIDTH;
                      return <line key={`beat-${idx}-${beatIdx}`} x1={beatX} y1={CHORD_Y + 40} x2={beatX} y2={SVG_HEIGHT} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />;
                    })}
                  </g>
                );
              })}
              
              <line x1={SVG_WIDTH - TRACK_MARGIN_X} y1={CHORD_Y} x2={SVG_WIDTH - TRACK_MARGIN_X} y2={SVG_HEIGHT} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

              {/* 🔥 ТАБУЛАТУРА С ФИКСИРОВАННЫМИ РАЗМЕРАМИ */}
              <foreignObject x={TRACK_MARGIN_X} y={TAB_Y} width={SVG_WIDTH - TRACK_MARGIN_X * 2} height={350}>
                <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                  <TablatureDisplay 
                    notes={soloData.notes} 
                    activeStep={isPlaying && isSoloOn ? Math.floor(playbackProgress * soloData.notes.length) : -1} 
                    height={340}
                    noteSpacing={noteSpacing}
                    showFretNumbers={true}
                  />
                </div>
              </foreignObject>

              {isPlaying && (
                <line x1={TRACK_MARGIN_X + playbackProgress * (SVG_WIDTH - TRACK_MARGIN_X * 2)} y1={CHORD_Y} x2={TRACK_MARGIN_X + playbackProgress * (SVG_WIDTH - TRACK_MARGIN_X * 2)} y2={SVG_HEIGHT} stroke="var(--accent)" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }} />
              )}
            </svg>

            {editingBarIndex !== null && (
              <div 
                ref={menuRef}
                style={{ 
                  position: 'absolute', 
                  top: `${CHORD_Y + 42}px`, 
                  left: `${TRACK_MARGIN_X + editingBarIndex * BAR_WIDTH}px`, 
                  width: `${BAR_WIDTH}px`, 
                  background: 'var(--bg-panel)', 
                  border: '1px solid var(--accent)', 
                  borderRadius: '0 0 8px 8px', 
                  zIndex: 999, 
                  overflow: 'hidden', 
                  boxShadow: '0 12px 32px rgba(0,0,0,0.9)',
                  maxHeight: '260px', 
                  overflowY: 'auto'
                }}
              >
                <div style={{ 
                  padding: '8px 12px', 
                  background: 'var(--bg-secondary)', 
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  🎸 Choose chord
                </div>
                
                {diatonicChords.map((opt, oIdx) => {
                  const name = opt.triad || keyNote;
                  const isActive = progression[editingBarIndex]?.name === name;
                  return (
                    <div 
                      key={`diatonic-${oIdx}`} 
                      onClick={() => {
                        const nextProg = [...progression];
                        nextProg[editingBarIndex] = { 
                          name: name, 
                          notes: getChordNotesLocal(name, keyNote || 'C') 
                        };
                        setProgression(nextProg);
                        setEditingBarIndex(null);
                        setTimeout(() => executeGeneration(nextProg), 40);
                      }}
                      style={{ 
                        padding: '8px 14px', 
                        cursor: 'pointer', 
                        fontSize: '13px', 
                        fontWeight: isActive ? 900 : 600,
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                        background: isActive ? 'rgba(0,255,157,0.08)' : 'transparent',
                        transition: '0.1s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={e => { 
                        e.currentTarget.style.background = 'rgba(0,255,157,0.12)';
                      }}
                      onMouseLeave={e => { 
                        e.currentTarget.style.background = isActive ? 'rgba(0,255,157,0.08)' : 'transparent';
                      }}
                    >
                      <span>{opt.baseRoman}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{name}</span>
                    </div>
                  );
                })}
                
                <div style={{ 
                  padding: '4px 12px', 
                  background: 'var(--bg-secondary)', 
                  borderTop: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  ✨ Suggested
                </div>
                
                {getSuggestedChords(progression[editingBarIndex]?.name || '').map((suggestion, sIdx) => {
                  const isActive = progression[editingBarIndex]?.name === suggestion;
                  return (
                    <div 
                      key={`suggested-${sIdx}`} 
                      onClick={() => {
                        const nextProg = [...progression];
                        nextProg[editingBarIndex] = { 
                          name: suggestion, 
                          notes: getChordNotesLocal(suggestion, keyNote || 'C') 
                        };
                        setProgression(nextProg);
                        setEditingBarIndex(null);
                        setTimeout(() => executeGeneration(nextProg), 40);
                      }}
                      style={{ 
                        padding: '8px 14px', 
                        cursor: 'pointer', 
                        fontSize: '13px', 
                        fontWeight: isActive ? 900 : 600,
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                        background: isActive ? 'rgba(0,255,157,0.08)' : 'transparent',
                        transition: '0.1s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={e => { 
                        e.currentTarget.style.background = 'rgba(0,255,157,0.12)';
                      }}
                      onMouseLeave={e => { 
                        e.currentTarget.style.background = isActive ? 'rgba(0,255,157,0.08)' : 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>→</span>
                      <span>{suggestion}</span>
                    </div>
                  );
                })}
                
                <div 
                  onClick={() => setEditingBarIndex(null)}
                  style={{ 
                    padding: '6px', 
                    textAlign: 'center', 
                    cursor: 'pointer', 
                    fontSize: '11px', 
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    fontWeight: 600
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                >
                  ✕ Close
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)', fontWeight: 800, fontSize: '13px' }}>
            {isGenerating ? '⏳ ВЫЧИСЛЕНИЕ ПРОГРЕССИИ И ГЕНЕРАЦИЯ ФРАЗ...' : '🎸 СЕТКА ПУСТА. НАЖМИТЕ GENERATE ДЛЯ СОЗДАНИЯ 4-ТАКТНОГО СОЛО'}
          </div>
        )}
      </div>

      {tips.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
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