// src/utils/tipsGenerator.ts

import { type Lick, type LickNote, type Technique } from '../services/AIEngine';

export interface Tip {
  icon: string;
  title: string;
  description: string;
  category: 'harmony' | 'technique' | 'rhythm' | 'dynamics' | 'style' | 'general';
  actionable?: string;
  relatedArtists?: string[];
}

export function generateTips(
  lick: Lick,
  keyNote: string,
  mode: string,
  chordProgression: string[],
  bpm: number = 120
): Tip[] {
  const tips: Tip[] = [];
  const notes = lick.notes;
  const techniqueCounts = countTechniques(notes);
  const intervals = analyzeIntervals(notes);
  const rhythmAnalysis = analyzeRhythm(notes);
  const harmonyAnalysis = analyzeHarmony(notes, chordProgression, keyNote, mode);
  const structureAnalysis = analyzeStructure(notes);
  const motifAnalysis = analyzeMotif(notes);

  // ===== 1. ТЕХНИКИ =====
  const bends = techniqueCounts.get('bend') ?? 0;
  if (bends > 3) {
    tips.push({
      icon: '🎸',
      title: 'Блюзовые бенды',
      description: `Ты используешь ${bends} бендов. Это характерно для стиля Стиви Рэя Вона и Би Би Кинга.`,
      category: 'technique',
      actionable: 'Попробуй добавить вибрато после бенда — это сделает звук более вокальным.',
      relatedArtists: ['Stevie Ray Vaughan', 'B.B. King', 'Eric Clapton']
    });
  }

  const hammers = techniqueCounts.get('hammer') ?? 0;
  const pulls = techniqueCounts.get('pull') ?? 0;
  if (hammers + pulls > 2) {
    tips.push({
      icon: '🔥',
      title: 'Легато как у Эдди Ван Халена',
      description: `В твоей фразе ${hammers + pulls} приёмов легато. Это делает линию плавной и быстрой.`,
      category: 'technique',
      actionable: 'Сыграй эту фразу с акцентом на первую ноту каждой группы — получится более драйвово.',
      relatedArtists: ['Eddie Van Halen', 'Joe Satriani', 'Allan Holdsworth']
    });
  }

  const vibratos = techniqueCounts.get('vibrato') ?? 0;
  if (vibratos > 2) {
    tips.push({
      icon: '🎵',
      title: 'Выразительное вибрато',
      description: `Ты используешь вибрато ${vibratos} раз. Это придаёт звуку человечность.`,
      category: 'technique',
      actionable: 'Попробуй изменять скорость вибрато: медленное для баллад, быстрое для рока.',
      relatedArtists: ['David Gilmour', 'Brian May', 'Santana']
    });
  }

  const slides = techniqueCounts.get('slide') ?? 0;
  if (slides > 2) {
    tips.push({
      icon: '🤘',
      title: 'Слайды для плавности',
      description: `Много слайдов (${slides}) — это как у гитаристов свинга и джаза.`,
      category: 'technique',
      actionable: 'Попробуй слайды не только вверх, но и вниз — это разнообразит фразу.',
      relatedArtists: ['Wes Montgomery', 'George Benson']
    });
  }

  // ===== 2. ГАРМОНИЯ =====
  const { outOfKeyNotes, rootNoteHits, chordTones } = harmonyAnalysis;
  if (outOfKeyNotes > 0 && outOfKeyNotes < 3) {
    tips.push({
      icon: '🎯',
      title: 'Игра на грани (Outside Playing)',
      description: `Ты используешь ${outOfKeyNotes} нот, которые не входят в тональность. Это создаёт напряжение, как у джазовых музыкантов.`,
      category: 'harmony',
      actionable: 'Попробуй разрешить эти ноты в ближайшую ступень — классический приём бибопа.',
      relatedArtists: ['John Coltrane', 'Charlie Parker']
    });
  }

  if (rootNoteHits > 3) {
    tips.push({
      icon: '🔴',
      title: 'Тоника как якорь',
      description: `Ты часто возвращаешься к тонике (${rootNoteHits} раз). Это даёт устойчивость, но может звучать предсказуемо.`,
      category: 'harmony',
      actionable: 'Играй вокруг тоники, не попадая в неё — это создаст ожидание.',
      relatedArtists: ['Jimi Hendrix', 'John Frusciante']
    });
  }

  if (chordTones > 4) {
    tips.push({
      icon: '🎹',
      title: 'Игра по аккордовым тонам',
      description: `Ты попадаешь в аккордовые тоны ${chordTones} раз. Это делает импровизацию гармонически богатой.`,
      category: 'harmony',
      actionable: 'Добавь аккордовые тоны с задержкой (sus4, add9) для более современного звука.',
      relatedArtists: ['Pat Metheny', 'John Scofield']
    });
  }

  // ===== 3. РИТМ =====
  if (rhythmAnalysis.syncopation > 0) {
    tips.push({
      icon: '🥁',
      title: 'Синкопированный ритм',
      description: `Ты используешь синкопу в ${rhythmAnalysis.syncopation} местах. Это придаёт фразе "качели".`,
      category: 'rhythm',
      actionable: 'Попробуй сместить акцент ещё на одну долю — получится неожиданный эффект.',
      relatedArtists: ['James Brown', 'Prince']
    });
  }

  if (rhythmAnalysis.noteDensity > 5) {
    tips.push({
      icon: '⚡',
      title: 'Высокая плотность нот',
      description: `В твоей фразе ${Math.round(rhythmAnalysis.noteDensity)} нот на такт. Это интенсивный соло-стиль.`,
      category: 'rhythm',
      actionable: 'Попробуй оставить больше воздуха — иногда тишина работает лучше.',
      relatedArtists: ['Yngwie Malmsteen', 'John Petrucci']
    });
  }

  // ===== 4. СТРУКТУРА И МОТИВНОЕ РАЗВИТИЕ =====
  if (structureAnalysis.hasIntro && structureAnalysis.hasClimax) {
    tips.push({
      icon: '📐',
      title: 'Структура соло как у профи',
      description: 'Твоё соло имеет чёткое вступление, развитие и кульминацию — это признак продуманной импровизации.',
      category: 'style',
      actionable: 'Попробуй добавить паузу перед кульминацией для усиления эффекта.',
      relatedArtists: ['David Gilmour', 'Eric Clapton']
    });
  }

  if (motifAnalysis.repetitionCount > 1) {
    tips.push({
      icon: '🔁',
      title: 'Мотивное развитие',
      description: `Ты повторяешь мотив ${motifAnalysis.repetitionCount} раз. Это создаёт узнаваемость и связность, как в классических соло.`,
      category: 'style',
      actionable: 'Попробуй менять ритм мотива при повторении — это добавит разнообразия.',
      relatedArtists: ['Jimi Hendrix', 'Jimmy Page']
    });
  }

  if (motifAnalysis.variationCount > 1) {
    tips.push({
      icon: '🎨',
      title: 'Вариации на тему',
      description: `Ты используешь ${motifAnalysis.variationCount} вариаций основного мотива — это делает соло интересным и непредсказуемым.`,
      category: 'style',
      actionable: 'Попробуй сыграть мотив в другой октаве для контраста.',
      relatedArtists: ['John Coltrane', 'Charlie Parker']
    });
  }

  if (structureAnalysis.hasRestBeforeClimax) {
    tips.push({
      icon: '⏸️',
      title: 'Стратегическая пауза',
      description: 'Ты используешь паузу перед кульминацией — это классический приём для создания напряжения.',
      category: 'rhythm',
      actionable: 'Увеличь длительность паузы для большего драматического эффекта.',
      relatedArtists: ['Jimi Hendrix', 'David Gilmour']
    });
  }

  if (structureAnalysis.noteRange > 12) {
    tips.push({
      icon: '📈',
      title: 'Широкий диапазон',
      description: `Твоё соло охватывает ${structureAnalysis.noteRange} полутонов — это придаёт ему масштаб и драматизм.`,
      category: 'dynamics',
      actionable: 'Попробуй начать в низком регистре и постепенно подниматься вверх.',
      relatedArtists: ['Steve Vai', 'Joe Satriani']
    });
  }

  // ===== 5. СТИЛЕВЫЕ СОВЕТЫ =====
  const styleTips = generateStyleTips(techniqueCounts, intervals, harmonyAnalysis);
  tips.push(...styleTips);

  // ===== 6. ОБЩИЙ СОВЕТ =====
  tips.push({
    icon: '💡',
    title: 'Совет дня',
    description: `Ты играешь в ${keyNote} ${mode} при темпе ${bpm} BPM. Попробуй поиграть эту фразу с разной динамикой — начни тихо, закончи громко.`,
    category: 'general',
    actionable: 'Используй технику "call-and-response" — раздели фразу на две части, где вторая отвечает первой.',
    relatedArtists: ['Miles Davis', 'Wes Montgomery']
  });

  return tips;
}

// ===== АНАЛИЗ СТРУКТУРЫ И МОТИВОВ =====

function analyzeStructure(notes: LickNote[]): {
  hasIntro: boolean;
  hasClimax: boolean;
  hasRestBeforeClimax: boolean;
  noteRange: number;
} {
  const nonRestNotes = notes.filter(n => !n.isRest && n.fret !== null);
  if (nonRestNotes.length < 4) {
    return { hasIntro: false, hasClimax: false, hasRestBeforeClimax: false, noteRange: 0 };
  }

  // Безопасно извлекаем fret (они точно не null благодаря фильтру)
  const frets = nonRestNotes.map(n => n.fret as number).sort((a, b) => a - b);
  const noteRange = frets[frets.length - 1] - frets[0];

  const maxFret = Math.max(...frets);
  const maxFretIndex = nonRestNotes.findIndex(n => n.fret === maxFret);
  const hasClimax = maxFretIndex > 1 && maxFretIndex < nonRestNotes.length - 1;

  let hasRestBeforeClimax = false;
  if (hasClimax) {
    const climaxNoteIndex = notes.indexOf(nonRestNotes[maxFretIndex]);
    for (let i = climaxNoteIndex - 1; i >= 0; i--) {
      if (notes[i].isRest) {
        hasRestBeforeClimax = true;
        break;
      }
    }
  }

  const firstAccent = nonRestNotes.findIndex(n => n.accent);
  const hasIntro = firstAccent > 1;

  return { hasIntro, hasClimax, hasRestBeforeClimax, noteRange };
}

function analyzeMotif(notes: LickNote[]): {
  repetitionCount: number;
  variationCount: number;
} {
  const nonRestNotes = notes.filter(n => !n.isRest && n.fret !== null);
  if (nonRestNotes.length < 4) {
    return { repetitionCount: 0, variationCount: 0 };
  }

  let repetitionCount = 0;
  let variationCount = 0;

  for (let i = 0; i < nonRestNotes.length - 2; i++) {
    const f1 = nonRestNotes[i].fret;
    const f2 = nonRestNotes[i+1].fret;
    const f3 = nonRestNotes[i+2].fret;
    if (f1 === null || f2 === null || f3 === null) continue;
    const pattern1 = [f1, f2, f3];
    for (let j = i + 2; j < nonRestNotes.length - 2; j++) {
      const g1 = nonRestNotes[j].fret;
      const g2 = nonRestNotes[j+1].fret;
      const g3 = nonRestNotes[j+2].fret;
      if (g1 === null || g2 === null || g3 === null) continue;
      const pattern2 = [g1, g2, g3];
      const isSimilar = pattern1.every((f, idx) => Math.abs(f - pattern2[idx]) <= 1);
      if (isSimilar) {
        if (pattern1.every((f, idx) => f === pattern2[idx])) {
          repetitionCount++;
        } else {
          variationCount++;
        }
      }
    }
  }

  return { repetitionCount, variationCount };
}

// ===== ОСТАЛЬНЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (БЕЗ ИЗМЕНЕНИЙ) =====

function countTechniques(notes: LickNote[]): Map<Technique, number> {
  const map = new Map<Technique, number>();
  notes.forEach(n => {
    if (n.technique && n.technique !== 'none') {
      map.set(n.technique, (map.get(n.technique) || 0) + 1);
    }
  });
  return map;
}

function analyzeIntervals(notes: LickNote[]): { jumps: number; stepwise: number } {
  let jumps = 0, stepwise = 0;
  for (let i = 1; i < notes.length; i++) {
    const prev = notes[i-1].fret;
    const curr = notes[i].fret;
    if (prev !== null && curr !== null) {
      const diff = Math.abs(curr - prev);
      if (diff > 3) jumps++;
      else if (diff <= 2) stepwise++;
    }
  }
  return { jumps, stepwise };
}

function analyzeRhythm(notes: LickNote[]) {
  let syncopation = 0;
  const noteDensity = notes.length / 4;
  notes.forEach(n => {
    if (n.duration === 'dotted_eighth' || n.duration === 'sixteenth') {
      syncopation++;
    }
  });
  return { syncopation, noteDensity };
}

function analyzeHarmony(
  notes: LickNote[],
  chordProgression: string[],
  keyNote: string,
  mode: string
) {
  const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const keyIndex = allNotes.indexOf(keyNote);
  const modeIntervals = getModeIntervals(mode);
  const scaleNotes = modeIntervals.map(i => allNotes[(keyIndex + i) % 12]);

  let outOfKeyNotes = 0;
  let rootNoteHits = 0;
  let chordTones = 0;

  const progressionString = chordProgression.join(' ');

  notes.forEach(n => {
    if (n.fret === null || n.isRest) return;
    const openNote = ['E','B','G','D','A','E'][n.string] || 'E';
    const noteIndex = (allNotes.indexOf(openNote) + n.fret) % 12;
    const note = allNotes[noteIndex];

    if (!scaleNotes.includes(note)) outOfKeyNotes++;
    if (note === keyNote) rootNoteHits++;
    
    if (n.fret % 4 === 0 || n.fret % 3 === 0 || progressionString.includes(note)) {
      chordTones++;
    }
  });

  return { outOfKeyNotes, rootNoteHits, chordTones };
}

function getModeIntervals(mode: string): number[] {
  const map: Record<string, number[]> = {
    major: [0,2,4,5,7,9,11],
    minor: [0,2,3,5,7,8,10],
    dorian: [0,2,3,5,7,9,10],
    phrygian: [0,1,3,5,7,8,10],
    lydian: [0,2,4,6,7,9,11],
    mixolydian: [0,2,4,5,7,9,10],
    aeolian: [0,2,3,5,7,8,10],
    locrian: [0,1,3,5,6,8,10],
    blues: [0,3,5,6,7,10],
    pentatonic: [0,2,4,7,9],
    maj7_arp: [0,4,7,11],
    min7_arp: [0,3,7,10],
    dom7_arp: [0,4,7,10],
    dom9_arp: [0,4,7,10,14],
    altered: [0,1,3,4,8,10],
    harmonic_minor: [0,2,3,5,7,8,11],
    melodic_minor: [0,2,3,5,7,9,11]
  };
  return map[mode] || map.major;
}

function generateStyleTips(
  techniqueCounts: Map<Technique, number>,
  intervals: { jumps: number; stepwise: number },
  harmony: any
): Tip[] {
  const tips: Tip[] = [];
  const bends = techniqueCounts.get('bend') ?? 0;
  const hammers = techniqueCounts.get('hammer') ?? 0;
  const slides = techniqueCounts.get('slide') ?? 0;
  const vibratos = techniqueCounts.get('vibrato') ?? 0;

  if (intervals.stepwise > 6 && harmony.chordTones > 3) {
    tips.push({
      icon: '🎩',
      title: 'Джазовый подход как у Джо Пасса',
      description: 'Твоя фраза построена на плавном движении и аккордовых тонах — это фирменный стиль джазовых гитаристов.',
      category: 'style',
      actionable: 'Попробуй добавить хроматические проходы между нотами.',
      relatedArtists: ['Joe Pass', 'Wes Montgomery']
    });
  }

  if (intervals.jumps > 4 && bends > 2) {
    tips.push({
      icon: '⚡',
      title: 'Техника шреда как у Стива Вая',
      description: 'Скачки на большие интервалы и бенды — это фирменный стиль гитар-героев 80-х.',
      category: 'style',
      actionable: 'Играй с метрономом и постепенно увеличивай темп.',
      relatedArtists: ['Steve Vai', 'Joe Satriani', 'Yngwie Malmsteen']
    });
  }

  if (bends > 3 && vibratos > 2) {
    tips.push({
      icon: '🎸',
      title: 'Блюзовый гигант — как Би Би Кинг',
      description: 'Бенды и вибрато — это душа блюза. Твоя фраза звучит как у мастера.',
      category: 'style',
      actionable: 'Добавь пару «кричащих» нот (бенд на 1,5 тона) для максимальной экспрессии.',
      relatedArtists: ['B.B. King', 'Albert King', 'Eric Clapton']
    });
  }

  if (hammers > 2 && slides > 2) {
    tips.push({
      icon: '🌊',
      title: 'Фьюжн-легато как у Скотта Хендерсона',
      description: 'Связная игра с хаммерами и слайдами — это признак современного фьюжн-гитариста.',
      category: 'style',
      actionable: 'Попробуй использовать открытые струны как «якоря» для более широкого звука.',
      relatedArtists: ['Scott Henderson', 'Frank Gambale']
    });
  }

  return tips;
}