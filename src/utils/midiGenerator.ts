import fs from 'node:fs';
import path from 'node:path';
import MidiWriter from 'midi-writer-js';

const MIDI_DIR = path.join(process.cwd(), 'midi');
const TICKS_PER_QUARTER = 128;
const TICKS_PER_16TH = TICKS_PER_QUARTER / 4;
const TICKS_PER_8TH = TICKS_PER_QUARTER / 2;

// ============================================
// ТИПЫ И КОНФИГУРАЦИЯ
// ============================================

export interface TrackBlueprint {
  instrument: string;
  midiFile: string;
  position: number;
  length: number; // в тактах (барах)
  transpose?: number;
  chord?: string;
  style?: 'rock' | 'metal' | 'funk' | 'blues' | 'pop' | 'jazz';
}

interface ChordDef {
  name: string;
  notes: string[];
  bass: string;
}

type PatternFn = (track: any, bars: number, chord: ChordDef, style: string, barOffset: number) => void;

// ============================================
// ТЕОРИЯ МУЗЫКИ — АККОРДЫ И ПРОГРЕССИИ
// ============================================

const CHORD_LIBRARY: Record<string, ChordDef> = {
  'C':  { name: 'C',  notes: ['C4','E4','G4'], bass: 'C2' },
  'Cm': { name: 'Cm', notes: ['C4','D#4','G4'], bass: 'C2' },
  'D':  { name: 'D',  notes: ['D4','F#4','A4'], bass: 'D2' },
  'Dm': { name: 'Dm', notes: ['D4','F4','A4'],  bass: 'D2' },
  'E':  { name: 'E',  notes: ['E4','G#4','B4'], bass: 'E2' },
  'Em': { name: 'Em', notes: ['E4','G4','B4'],  bass: 'E2' },
  'F':  { name: 'F',  notes: ['F4','A4','C5'],  bass: 'F2' },
  'Fm': { name: 'Fm', notes: ['F4','G#4','C5'], bass: 'F2' },
  'G':  { name: 'G',  notes: ['G4','B4','D5'],  bass: 'G2' },
  'Gm': { name: 'Gm', notes: ['G4','A#4','D5'], bass: 'G2' },
  'A':  { name: 'A',  notes: ['A4','C#5','E5'], bass: 'A2' },
  'Am': { name: 'Am', notes: ['A4','C5','E5'],  bass: 'A2' },
  'B':  { name: 'B',  notes: ['B4','D#5','F#5'],bass: 'B2' },
  'Bm': { name: 'Bm', notes: ['B4','D5','F#5'], bass: 'B2' },
};

// Популярные прогрессии (в тактах)
const PROGRESSIONS: Record<string, string[]> = {
  'pop_rock': ['C','G','Am','F'],
  'classic':  ['C','Am','F','G'],
  'metal':    ['E','C','D','E'],
  'blues':    ['E','E','A','E','B','A','E','B'],
  'funk':     ['E7','E7','A7','E7','B7','A7','E7','B7'], // упрощённо
  'jazz':     ['Dm7','G7','C','C'],
};

function parseChord(chordStr: string): ChordDef {
  const clean = chordStr.replace(/7|9|maj|min|m(?=a)/g, '');
  const minor = chordStr.includes('m') && !chordStr.includes('maj');
  const base = clean.replace(/[^A-G#b]/g, '');
  const key = base + (minor ? 'm' : '');
  return CHORD_LIBRARY[key] || CHORD_LIBRARY['C'];
}

function getProgression(style: string, lengthBars: number): ChordDef[] {
  const progName = Object.keys(PROGRESSIONS).find(p => style.includes(p.replace(/_.*/, ''))) || 'pop_rock';
  const prog = PROGRESSIONS[progName] || PROGRESSIONS['pop_rock'];
  const chords: ChordDef[] = [];
  for (let i = 0; i < lengthBars; i++) {
    chords.push(parseChord(prog[i % prog.length]));
  }
  return chords;
}

// ============================================
// 🎵 ФАЗА 3: MIDI EXPORT ДЛЯ СОЛО (Browser-side)
// ============================================

// Типы для MIDI export (чтобы не зависеть от Node.js типов SyncSoloData)
interface MidiExportNote {
  isRest?: boolean;
  fret: number | null;
  string: number;
  beatStart: number;
  beatDuration?: number;
  duration?: string;
  velocity?: number;
}

interface MidiExportChord {
  name: string;
  notes: string[];
  beatStart: number;
  durationBeats: number;
}

interface MidiExportData {
  bars: number;
  totalBeats: number;
  chords: MidiExportChord[];
  notes: MidiExportNote[];
}

/**
 * Экспорт сгенерированного соло в MIDI файл (browser)
 */
export function exportSoloToMidi(
  soloData: MidiExportData,
  _keyNote: string,
  bpm: number
): Uint8Array {
  const track = new MidiWriter.Track();
  
  // Патч для гитары (Overdrive - 29)
  track.addEvent(new (MidiWriter as any).ProgramChangeEvent({ instrument: 29 }));

  soloData.notes.forEach((note: MidiExportNote) => {
    if (note.isRest || note.fret === null) return;
    
    // Конвертируем fret+string в MIDI pitch
    const stringOpen = [64, 59, 55, 50, 45, 40]; // E4, B3, G3, D3, A3, E2
    const midiPitch = stringOpen[note.string] + (note.fret || 0);
    
    // Конвертируем beatStart в ticks
    const startTick = Math.round(note.beatStart * 128);
    
    // MIDI velocity from our velocity (0-1 → 0-127)
    const velocity = Math.round((note.velocity || 0.7) * 127);
    
    // Определяем MIDI длительность
    let midiDuration = '8';
    if (note.duration) {
      const durMap: Record<string, string> = {
        '2n': 'half', '4n': 'quarter', '8n': 'eighth', '16n': '16th',
        '4n.': 'dotted-quarter', '8n.': 'dotted-eighth',
        '2': 'half', '4': 'quarter', '8': 'eighth', '16': '16th',
      };
      midiDuration = durMap[note.duration] || 'eighth';
    }

    track.addEvent(new MidiWriter.NoteEvent({
      pitch: [String(midiPitch)],
      duration: midiDuration,
      startTick: startTick,
      velocity: velocity,
    }));
  });

  const writer = new MidiWriter.Writer(track);
  return writer.buildFile() as Uint8Array;
}

/**
 * Экспорт прогрессии аккордов в MIDI
 */
export function exportChordsToMidi(
  soloData: MidiExportData,
  bpm: number
): Uint8Array {
  const track = new MidiWriter.Track();
  
  // Патч для аккордов (Piano - 1)
  track.addEvent(new (MidiWriter as any).ProgramChangeEvent({ instrument: 1 }));

  const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  soloData.chords.forEach(chord => {
    const startTick = Math.round(chord.beatStart * 128);
    
    const midiPitches = chord.notes
      .filter((n: string) => n)
      .map((n: string) => {
        const idx = ALL_NOTES.indexOf(n.replace(/[0-9]/g, ''));
        return String(idx >= 0 ? idx + 60 : 60); // C4 base
      });

    if (midiPitches.length > 0) {
      track.addEvent(new MidiWriter.NoteEvent({
        pitch: midiPitches,
        duration: 'whole',
        startTick: startTick,
        velocity: 80,
      }));
    }
  });

  const writer = new MidiWriter.Writer(track);
  return writer.buildFile() as Uint8Array;
}

/**
 * Скачивание MIDI файла
 */
export function downloadMidiFile(uint8Array: Uint8Array, filename: string): void {
  const blob = new Blob([uint8Array as unknown as BlobPart], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// УТИЛИТЫ
// ============================================

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function chance(p: number): boolean { return Math.random() < p; }
function hv(base: number, spread = 12): number {
  return Math.max(15, Math.min(127, Math.round(base + (Math.random() - 0.5) * spread)));
}
function add16th(t: any, pitch: string | string[], tick: number, vel: number, dur = '16') {
  t.addEvent(new MidiWriter.NoteEvent({ pitch: Array.isArray(pitch) ? pitch : [pitch], duration: dur, startTick: tick, velocity: vel }));
}

// ============================================
// 🥁 DRUMS — МУЛЬТИ-БАРОВЫЕ ПАТТЕРНЫ С ЗАПОЛНЕНИЯМИ
// ============================================

function generateDrums(track: any, bars: number, _chord: ChordDef, style: string, _off: number) {
  const isMetal = style === 'metal';
  const isFunk = style === 'funk';
  
  for (let bar = 0; bar < bars; bar++) {
    const isLastBar = bar === bars - 1;
    const isFillBar = isLastBar || (bars > 4 && bar % 4 === 3);
    
    if (isFunk) {
      // Funk: шестнадцатые хэты с акцентами, синкопированная бочка
      for (let s = 0; s < 16; s++) {
        const tick = s * TICKS_PER_16TH;
        const accent = s % 4 === 0;
        add16th(track, '42', tick, hv(accent ? 90 : 55, 15));
        if (s === 0 || s === 6 || s === 10) add16th(track, '36', tick, hv(100, 8), '8');
        if (s === 4 || s === 12) add16th(track, '38', tick, hv(95, 8), '8');
      }
    } else if (isMetal) {
      // Metal: двойная педаль, быстрые хэты
      for (let s = 0; s < 16; s++) {
        const tick = s * TICKS_PER_16TH;
        add16th(track, '42', tick, hv(85, 10));
        if (s % 2 === 0) add16th(track, '36', tick, hv(110, 5), '16');
        if (s === 4 || s === 12) add16th(track, '38', tick, hv(105, 5), '16');
      }
    } else {
      // Rock: стандартный бит с вариациями
      for (let beat = 0; beat < 4; beat++) {
        const beatTick = beat * TICKS_PER_QUARTER;
        // Хэты
        track.addEvent(new MidiWriter.NoteEvent({ pitch: ['42'], duration: '8', velocity: hv(75), startTick: beatTick }));
        track.addEvent(new MidiWriter.NoteEvent({ pitch: ['42'], duration: '8', velocity: hv(60), startTick: beatTick + TICKS_PER_8TH }));
        
        // Бочка и малый
        if (beat === 0 || (beat === 2 && chance(0.3))) {
          add16th(track, '36', beatTick, hv(105, 6), '4');
        }
        if (beat === 1 || beat === 3) {
          if (isFillBar && beat === 3) {
            // Заполнение (fill): томы
            add16th(track, '47', beatTick, hv(100), '16');
            add16th(track, '45', beatTick + TICKS_PER_16TH, hv(105), '16');
            add16th(track, '43', beatTick + TICKS_PER_16TH * 2, hv(110), '16');
            add16th(track, '49', beatTick + TICKS_PER_16TH * 3, hv(115), '4');
          } else {
            add16th(track, '38', beatTick, hv(100, 6), '4');
          }
        }
      }
    }
  }
}

// ============================================
// 🎸 BASS — МЕЛОДИЧНЫЕ ЛИНИИ ПО АККОРДАМ
// ============================================

function generateBass(track: any, bars: number, chord: ChordDef, style: string, barOffset: number) {
  const isWalking = style === 'jazz' || chance(0.25);
  const isFunky = style === 'funk' || chance(0.2);
  
  for (let bar = 0; bar < bars; bar++) {
    const currentChord = chord;
    const root = currentChord.bass;
    const fifth = transposeNote(root, 7);
    const octave = transposeNote(root, 12);
    
    if (isWalking) {
      // Walking bass: 4 ноты в такт с подходящими тонами
      const walk = generateWalkingLine(root);
      walk.forEach((note, i) => {
        const tick = i * TICKS_PER_QUARTER;
        track.addEvent(new MidiWriter.NoteEvent({ 
          pitch: [note], duration: '4', velocity: hv(88, 10), startTick: tick + barOffset * TICKS_PER_QUARTER * 4 
        }));
      });
    } else if (isFunky) {
      // Фанк: синкопа, короткие ноты
      [0, 3, 6, 10, 12].forEach((sixteenth, i) => {
        const tick = sixteenth * TICKS_PER_16TH + bar * TICKS_PER_QUARTER * 4;
        const note = i % 2 === 0 ? root : (chance(0.5) ? fifth : octave);
        track.addEvent(new MidiWriter.NoteEvent({ 
          pitch: [note], duration: '16', velocity: hv(95, 15), startTick: tick 
        }));
      });
    } else {
      // Рок/поп: root-fifth-octave с ритмическими вариациями
      for (let beat = 0; beat < 4; beat++) {
        const tick = beat * TICKS_PER_QUARTER + bar * TICKS_PER_QUARTER * 4;
        const note = beat % 2 === 0 ? root : fifth;
        track.addEvent(new MidiWriter.NoteEvent({ 
          pitch: [note], duration: '8', velocity: hv(92, 12), startTick: tick 
        }));
        if (chance(0.3)) {
          track.addEvent(new MidiWriter.NoteEvent({ 
            pitch: [beat === 3 ? octave : root], duration: '8', velocity: hv(80), startTick: tick + TICKS_PER_8TH 
          }));
        }
      }
    }
  }
}

function generateWalkingLine(rootNote: string): string[] {
  const semitone = noteToSemitone(rootNote);
  // Простая логика: корень, подход, подход, корень/пятая
  const scale = [0, 2, 4, 5, 7, 9, 11]; // мажор
  const rootIdx = scale.indexOf(semitone % 12);
  if (rootIdx === -1) return [rootNote, rootNote, rootNote, rootNote];
  
  const n1 = rootNote;
  const n2 = semitoneToNote(semitone + (chance(0.5) ? 2 : 4)); // 2 или 3
  const n3 = semitoneToNote(semitone + (chance(0.5) ? 4 : 5)); // 3 или 4
  const n4 = semitoneToNote(semitone + 7); // 5
  return [n1, n2, n3, n4];
}

// ============================================
// 🎸 RHYTHM GUITAR — АРПЕДЖИО, ПАУЭРЧОРДЫ, БОЙ
// ============================================

function generateRhythmGuitar(track: any, bars: number, chord: ChordDef, style: string, _off: number) {
  const isMetal = style === 'metal';
  
  for (let bar = 0; bar < bars; bar++) {
    const notes = chord.notes;
    
    if (isMetal) {
      // Пауэрчорды + пальм-мьютинг (имитация через короткие ноты)
      for (let beat = 0; beat < 4; beat++) {
        for (let sub = 0; sub < 4; sub++) { // шестнадцатые
          const tick = beat * TICKS_PER_QUARTER + sub * TICKS_PER_16TH + bar * TICKS_PER_QUARTER * 4;
          const vel = sub === 0 ? 110 : 75;
          const powerChord = [notes[0], transposeNote(notes[0], 7)];
          track.addEvent(new MidiWriter.NoteEvent({ 
            pitch: powerChord, duration: '16', velocity: hv(vel, 10), startTick: tick 
          }));
        }
      }
    } else if (chance(0.4)) {
      // Арпеджио
      const arp = [...notes, notes[1], notes[2], notes[0]];
      arp.forEach((note, i) => {
        const tick = i * TICKS_PER_8TH + bar * TICKS_PER_QUARTER * 4;
        track.addEvent(new MidiWriter.NoteEvent({ 
          pitch: [note], duration: '8', velocity: hv(78, 10), startTick: tick 
        }));
      });
    } else {
      // Стандартный бой: аккорд на 1 и 3, акцент на 2 и 4
      for (let beat = 0; beat < 4; beat++) {
        const tick = beat * TICKS_PER_QUARTER + bar * TICKS_PER_QUARTER * 4;
        const isAccent = beat === 1 || beat === 3;
        track.addEvent(new MidiWriter.NoteEvent({ 
          pitch: notes, duration: '4', velocity: hv(isAccent ? 95 : 80, 8), startTick: tick 
        }));
        if (chance(0.5) && !isAccent) {
          // Добавим восьмую для движения
          track.addEvent(new MidiWriter.NoteEvent({ 
            pitch: [notes[0]], duration: '8', velocity: hv(65), startTick: tick + TICKS_PER_8TH 
          }));
        }
      }
    }
  }
}

// ============================================
// 🎸 LEAD GUITAR — МЕЛОДИЧЕСКИЕ ФРАЗЫ И МАСШТАБЫ
// ============================================

function generateLeadGuitar(track: any, bars: number, chord: ChordDef, _style: string, _off: number) {
  const scale = getScaleForChord(chord);
  
  for (let bar = 0; bar < bars; bar++) {
    if (chance(0.15)) {
      // Пауза — «воздух» в мелодии
      continue;
    }
    
    const phraseLength = pick([3, 4, 5, 6]);
    const startBeat = pick([0, 0.5, 1]);
    const startTick = (bar * 4 + startBeat) * TICKS_PER_QUARTER;
    
    for (let i = 0; i < phraseLength; i++) {
      const note = pick(scale);
      const dur = pick(['8', '8', '8', '4', '16']);
      const tick = startTick + i * (dur === '16' ? TICKS_PER_16TH : TICKS_PER_8TH);
      const vel = i === 0 ? 100 : hv(88, 15);
      
      track.addEvent(new MidiWriter.NoteEvent({ 
        pitch: [note], duration: dur, velocity: vel, startTick: tick 
      }));
      
      // Иногда добавляем слайд (две ноты подряд)
      if (chance(0.2)) {
        const nextNote = pick(scale.filter(n => n !== note));
        track.addEvent(new MidiWriter.NoteEvent({ 
          pitch: [nextNote], duration: '16', velocity: hv(85), startTick: tick + TICKS_PER_16TH 
        }));
      }
    }
  }
}

function getScaleForChord(chord: ChordDef): string[] {
  // Упрощённо: пентатоника от корня + октавы
  const root = chord.bass.replace(/\d/, '');
  const octave = parseInt(chord.bass.match(/\d/)?.[0] || '4') + 2;
  const pentatonic = [0, 3, 5, 7, 10]; // минорная пентатоника
  const baseSemitone = noteToSemitone(root + octave);
  
  return pentatonic.map(interval => semitoneToNote(baseSemitone + interval));
}

// ============================================
// МАТЕМАТИКА НОТ
// ============================================

function noteToSemitone(note: string): number {
  const name = note.slice(0, -1).toUpperCase();
  const octave = parseInt(note.slice(-1));
  const semis: Record<string, number> = { 'C':0,'C#':1,'DB':1,'D':2,'D#':3,'EB':3,'E':4,'F':5,'F#':6,'GB':6,'G':7,'G#':8,'AB':8,'A':9,'A#':10,'BB':10,'B':11 };
  return (octave + 1) * 12 + (semis[name] || 0);
}

function semitoneToNote(semitone: number): string {
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const octave = Math.floor(semitone / 12) - 1;
  const name = names[semitone % 12];
  return `${name}${octave}`;
}

function transposeNote(note: string, semitones: number): string {
  return semitoneToNote(noteToSemitone(note) + semitones);
}

// ============================================
// ДИСПЕТЧЕР ГЕНЕРАЦИИ
// ============================================

const GENERATORS: Record<string, PatternFn> = {
  'Drums': generateDrums,
  'Bass': generateBass,
  'RhythmGuitar': generateRhythmGuitar,
  'LeadGuitar': generateLeadGuitar,
};

export function ensureMidiFilesExist(tracks: TrackBlueprint[]) {
  if (!fs.existsSync(MIDI_DIR)) {
    fs.mkdirSync(MIDI_DIR, { recursive: true });
    console.log(`📁 Создана папка для MIDI: ${MIDI_DIR}`);
  }

  tracks.forEach((track) => {
    try {
      const filePath = path.join(MIDI_DIR, track.midiFile);
      console.log(`🎵 Генерация: ${track.midiFile} (${track.instrument}, ${track.length} тактов)`);

      const midiTrack = new MidiWriter.Track();
      const style = track.style || 'rock';
      const bars = track.length || 4;
      
      // Получаем прогрессию для всей длины
      const progression = getProgression(style, bars);
      
      // Генерируем по тактам
      for (let bar = 0; bar < bars; bar++) {
        const chord = progression[bar];
        const generator = GENERATORS[track.instrument];
        if (generator) {
          generator(midiTrack, 1, chord, style, bar);
        }
      }

      const writer = new MidiWriter.Writer(midiTrack);
      const uint8 = writer.buildFile();
      const buffer = Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteLength);
      fs.writeFileSync(filePath, buffer);
      console.log(`✅ Сохранён: ${filePath}`);
      
    } catch (err) {
      console.error(`❌ Ошибка генерации ${track.midiFile}:`, err);
    }
  });
}