// src/utils/tipsGenerator.ts

import { type Lick } from '../services/AIEngine';

export interface Tip {
  icon: string;
  title: string;
  description: string;
  category: 'harmony' | 'technique' | 'rhythm' | 'dynamics' | 'style' | 'practice' | 'touchgrass';
  actionable?: string;
  relatedArtists?: string[];
  berkleeTip?: string;
}

// ============================================================
<<<<<<< Updated upstream
// 🔥 БАЗА СОВЕТОВ — УНИВЕРСАЛЬНЫЕ ПРАКТИЧЕСКИЕ УПРАЖНЕНИЯ
=======
// 🔥 ДЕЛЬНЫЕ СОВЕТЫ — КОНКРЕТНЫЕ И ПРАКТИЧНЫЕ
>>>>>>> Stashed changes
// ============================================================

const TECHNIQUE_TIPS: Tip[] = [
  {
    icon: '🎸',
    title: 'Экономика движений',
    description: 'Не поднимай палец выше 1 см над грифом. Чем меньше движение — тем быстрее игра.',
    category: 'technique',
    actionable: 'Играй медленно (60 BPM) и следи за каждым пальцем. Запиши на видео.',
    berkleeTip: '"Efficiency of motion separates pros from amateurs." — Berklee Guitar Dept'
  },
  {
    icon: '👆',
    title: 'Альтернативный щипок',
    description: 'Вниз-вверх-вниз-вверх. На чётные доли — вверх. Это база скорости.',
    category: 'technique',
    actionable: '5 минут: ровные восьмые на одной ноте, strict alternate picking.',
    berkleeTip: '"Down-up is not a suggestion — it\'s a law." — Berklee Technique'
  },
  {
    icon: '🤘',
    title: 'Легато — равная громкость',
    description: 'Хаммер-оны и пул-оффы должны звучать так же громко, как ударные ноты.',
    category: 'technique',
    actionable: 'Играй 5-7-8-7-5 на одной струне. Все ноты одинаковой громкости.',
    berkleeTip: '"If you can hear the pick, your legato is not clean." — Joe Satriani'
  },
  {
    icon: '🌀',
    title: 'Бенд — контроль интервала',
    description: 'Бенд на 1/2 тона, 1 тон, 1.5 тона. Проверяй себя соседней струной.',
    category: 'technique',
    actionable: 'Бенд 5→7 лад, проверь 7 лад соседней струны. Совпадает?',
    berkleeTip: '"Bend to the pitch, not near it." — B.B. King'
  },
  {
    icon: '✋',
    title: 'Растяжка пальцев',
    description: '1 лад — указательный, 4 лад — мизинец. Растяни на 5 ладов.',
    category: 'technique',
    actionable: 'Хроматика 1-2-3-4, потом 1-2-3-5, потом 1-2-4-5, потом 1-3-4-5.',
    berkleeTip: '"Your reach is your range." — Steve Vai'
  }
];

const HARMONY_TIPS: Tip[] = [
  {
    icon: '🎹',
    title: 'Третья ступень — главная',
    description: 'В любом аккорде третья определяет мажор/минор. Знай её всегда.',
    category: 'harmony',
    actionable: 'На каждый аккорд находи 3-ю ступень за 1 секунду.',
    berkleeTip: '"When in doubt, play the third." — Berklee Harmony 101'
  },
  {
    icon: '🎯',
    title: 'Аккордовые тоны = якоря',
    description: '1-3-5-7 аккорда — безопасные ноты. Всё остальное — напряжение.',
    category: 'harmony',
    actionable: 'Импровизируй 2 такта только на аккордовых тонах, потом добавь проходные.',
    berkleeTip: '"Chord tones are home, everything else is a journey." — Pat Metheny'
  },
  {
    icon: '🔥',
    title: 'Тритоновая замена',
    description: 'В доминанте 7 замени 5-ю ступень на b5. Получится altered звук.',
    category: 'harmony',
    actionable: 'На G7 играй G-B-Db-F вместо G-B-D-F.',
    berkleeTip: '"The tritone is the gateway to outside playing." — John Coltrane'
  },
  {
    icon: '🌊',
    title: 'Проходные ноты',
    description: 'Хроматические проходки между аккордовыми тонами.',
    category: 'harmony',
    actionable: 'Cmaj7: C→C#→D→C (C# — проходная, D — 9-я).',
    berkleeTip: '"Chromatics are the glue between chord tones." — Joe Pass'
  }
];

const RHYTHM_TIPS: Tip[] = [
  {
    icon: '🥁',
    title: 'Играй вместе с барабанщиком',
    description: 'Слушай хай-хэт — он отмечает время. Играй в паз с ним.',
    category: 'rhythm',
    actionable: 'Включи метроном и отстукивая пальцами на грифе под него.',
    berkleeTip: '"If you can\'t hear the drummer, you\'re not listening." — Berklee Rhythm'
  },
  {
    icon: '⚡',
    title: 'Синкопа на "и"',
    description: 'Акценты на "и" между долями — это фанк и джаз.',
    category: 'rhythm',
    actionable: '1-и-2-и-3-и-4-и. Акценты только на "и".',
    berkleeTip: '"The \'and\' is where the groove lives." — James Brown'
  },
  {
    icon: '🎯',
    title: 'Рубато — гибкость темпа',
    description: 'Замедляй на важных нотах, ускоряй на проходных.',
    category: 'rhythm',
    actionable: 'Сыграй мелодию: растяни долгие ноты, сожми короткие.',
    berkleeTip: '"Time is not a prison — it\'s a canvas." — Bill Evans'
  }
];

const PRACTICE_TIPS: Tip[] = [
  {
    icon: '📝',
    title: 'SMART-цели',
    description: 'Конкретная цель: не "учу соль", а "выучу первые 4 такта к 18:00".',
    category: 'practice',
    actionable: 'Запиши цель на сегодня. Проверь результат вечером.',
    berkleeTip: '"A goal without a deadline is just a wish." — Berklee Practice Dept'
  },
  {
    icon: '⏱️',
    title: 'Помидор-техника',
    description: '25 минут практики — 5 минут перерыв. 4 цикла = 2 часа.',
    category: 'practice',
    actionable: 'Поставь таймер на 25 минут. Только гитара, никаких телефонов.',
    berkleeTip: '"Focus is a muscle. Train it daily." — Berklee Neuroscience'
  },
  {
    icon: '🎧',
    title: 'Записывай себя',
    description: 'То, что ты слышишь во время игры ≠ то, что слышат другие.',
    category: 'practice',
    actionable: 'Запиши 1 минуту импровизации. Слушай критически.',
    berkleeTip: '"The tape doesn\'t lie." — Berklee Recording Dept'
  },
  {
    icon: '🧠',
    title: 'Ментальная практика',
    description: 'Визуализируй руки на грифе перед сном. Мозг не отличит от реальной игры.',
    category: 'practice',
    actionable: '5 минут перед сном: представь, как играешь scales.',
    berkleeTip: '"The mind practices when the hands are still." — Chick Corea'
  }
];

const STYLE_TIPS: Tip[] = [
  {
    icon: '🎩',
    title: 'Джаз: плавные линии',
    description: 'Соединяй аккордовые тона плавно. Минимум скачков.',
    category: 'style',
    actionable: 'Играй только по соседним струнам, максимум 3 лада разницы.',
    berkleeTip: '"Jazz is about connecting dots, not jumping between them." — Joe Pass'
  },
  {
    icon: '⚡',
    title: 'Рок: пауэр-аккорды',
    description: '5-я и 4-я струны — твой диапазон. Просто и мощно.',
    category: 'style',
    actionable: 'Играй рифф на 5-4 струнах, добавь пальм-мьют.',
    berkleeTip: '"Power chords are the foundation of rock." — Jimmy Page'
  },
  {
    icon: '🌿',
    title: 'Блюз: бенды и вибрато',
    description: 'b3 → 3 бендом. Это крик блюза.',
    category: 'style',
    actionable: 'На Am бенд C→C# (b3→3). Держи 3 секунды с вибрато.',
    berkleeTip: '"The blues is not about notes — it\'s about feeling." — B.B. King'
  }
];

const TOUCHGRASS_TIPS: Tip[] = [
  {
    icon: '🌿',
    title: 'TouchGrass — играй на улице',
    description: 'Акустика на свежем воздухе. Другой звук, другой вайб.',
    category: 'touchgrass',
    actionable: 'Выйди с гитарой во двор/парк. Сыграй 3 песни.',
    berkleeTip: '"The best practice room has no walls." — TouchGrass'
  },
  {
    icon: '🎵',
    title: 'Слушай новый альбом',
    description: 'Каждую неделю — новый жанр. Расширяй слух.',
    category: 'touchgrass',
    actionable: 'Сегодня: Miles Davis "Kind of Blue". Завтра: Metallica "Master of Puppets".',
    berkleeTip: '"Your playing is the average of what you listen to." — TouchGrass'
  }
];

// ============================================================
// 🔥 КАРУСЕЛЬ — ОДИН СОВЕТ ЗА РАЗ
// ============================================================

let tipCache: Tip[] | null = null;

function getAllTips(): Tip[] {
  if (tipCache) return tipCache;
  
  tipCache = [
    ...TECHNIQUE_TIPS,
    ...HARMONY_TIPS,
    ...RHYTHM_TIPS,
    ...PRACTICE_TIPS,
    ...STYLE_TIPS,
    ...TOUCHGRASS_TIPS
  ];
  
  return tipCache;
}

export function getTipByIndex(index: number): Tip {
  const tips = getAllTips();
  const safeIndex = ((index % tips.length) + tips.length) % tips.length;
  return tips[safeIndex];
}

export function getTipCount(): number {
  return getAllTips().length;
}

export function getRandomTip(): Tip {
  const tips = getAllTips();
  return tips[Math.floor(Math.random() * tips.length)];
}

export function getTipsByCategory(category: Tip['category']): Tip[] {
  return getAllTips().filter(t => t.category === category);
}

// ============================================================
// 🔥 ОБРАТНАЯ СОВМЕСТИМОСТЬ (для старых вызовов)
// ============================================================

export function generateTips(
  _lick: Lick,
  keyNote: string,
  mode: string,
  _chordProgression: string[],
  _bpm: number = 120
): Tip[] {
<<<<<<< Updated upstream
  const tips: Tip[] = [];
  
  // 1. Добавляем 2-3 случайных совета из базы
  const shuffled = [...PRACTICE_TIPS].sort(() => Math.random() - 0.5);
  const selectedTips = shuffled.slice(0, 3);
  tips.push(...selectedTips);
  
  // 2. Добавляем контекстный совет (связанный с тональностью/режимом)
  const contextTip = getContextTip(keyNote, mode);
  if (contextTip) {
    tips.push(contextTip);
  }
  
  // 3. Добавляем совет по темпу
  const tempoTip = getTempoTip(bpm);
  if (tempoTip) {
    tips.push(tempoTip);
  }
  
  // 4. Всегда добавляем один TouchGrass совет
  const touchGrassTips = PRACTICE_TIPS.filter(t => t.category === 'touchgrass');
  const randomTouchGrass = touchGrassTips[Math.floor(Math.random() * touchGrassTips.length)];
  if (randomTouchGrass) {
    tips.push(randomTouchGrass);
  }
  
  // 5. Добавляем совет "Слушай музыку"
  const listeningTip = PRACTICE_TIPS.find(t => t.category === 'touchgrass' && t.title.includes('слушай больше'));
  if (listeningTip && !tips.some(t => t.title === listeningTip.title)) {
    tips.push(listeningTip);
  }
  
  // 6. Добавляем совет "Дневник практики"
  const journalTip = PRACTICE_TIPS.find(t => t.category === 'practice' && t.title.includes('Practice Journal'));
  if (journalTip && !tips.some(t => t.title === journalTip.title)) {
    tips.push(journalTip);
  }
  
  // Уникализация — убираем дубли по заголовкам
  const seen = new Set();
  const uniqueTips = tips.filter(tip => {
    const key = tip.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Ограничиваем до 6 советов
  // Поддержка старых анализаторов (чтобы убрать TS6133 и не менять поведение генерации)
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  void countTechniques;
  void analyzeIntervals;
  void analyzeRhythm;
  void analyzeHarmony;
  void analyzeStructure;
  void analyzeMotif;
  void getModeIntervals;
  void generateStyleTips;

  return uniqueTips.slice(0, 6);
=======
  // Возвращаем 1 случайный совет вместо стопки
  return [getContextTip(keyNote, mode) || getRandomTip()];
>>>>>>> Stashed changes
}

function getContextTip(keyNote: string, mode: string): Tip | null {
  const modeMap: Record<string, { tip: string; artists: string[] }> = {
    'major': {
      tip: `Практикуй мажорную пентатонику в ${keyNote}. Играй на I-IV-V аккордах.`,
      artists: ['Allman Brothers', 'Jerry Garcia']
    },
    'minor': {
      tip: `Минорная пентатоника в ${keyNote} — основа рока. Добавь блюзовую ноту (b5).`,
      artists: ['Jimi Hendrix', 'Jimmy Page']
    },
    'dorian': {
      tip: `Дорийский лад в ${keyNote} — фанк/фьюжн. Акцент на натуральную 6-ю.`,
      artists: ['Santana', 'Stevie Wonder']
    },
    'mixolydian': {
      tip: `Миксолидийский в ${keyNote} — рок с b7. Играй над доминантами.`,
      artists: ['Jimi Hendrix', 'John Scofield']
    },
    'lydian': {
      tip: `Лидийский в ${keyNote} — космический звук. Акцент на #11.`,
      artists: ['Steve Vai', 'Joe Satriani']
    },
    'phrygian': {
      tip: `Фригийский в ${keyNote} — испанская страсть. b2 ступень.`,
      artists: ['Paco de Lucía', 'Al Di Meola']
    },
    'locrian': {
      tip: `Локрийский в ${keyNote} — тёмный. Используй для напряжения.`,
      artists: ['John Coltrane', 'Allan Holdsworth']
    },
    'blues': {
      tip: `Блюз в ${keyNote} — b3, b5, b7. Бенды и вибрато.`,
      artists: ['B.B. King', 'Albert King']
    },
    'pentatonic': {
      tip: `Пентатоника в ${keyNote} — универсальна. 5 нот = бесконечность.`,
      artists: ['Jimmy Page', 'David Gilmour']
    },
    'harmonic_minor': {
      tip: `Гармонический минор в ${keyNote} — повышенная 7-я.`,
      artists: ['Django Reinhardt', 'John McLaughlin']
    },
    'melodic_minor': {
      tip: `Мелодический минор в ${keyNote} — джаз/фьюжн.`,
      artists: ['Pat Metheny', 'Allan Holdsworth']
    },
    'maj7_arp': {
      tip: `Мажор7 арпеджио в ${keyNote} — 1-3-5-7.`,
      artists: ['Wes Montgomery', 'Joe Pass']
    },
    'min7_arp': {
      tip: `Минор7 арпеджио в ${keyNote} — 1-b3-5-b7.`,
      artists: ['Pat Metheny', 'John Scofield']
    },
    'dom7_arp': {
      tip: `Доминант7 арпеджио в ${keyNote} — 1-3-5-b7.`,
      artists: ['B.B. King', 'Jimi Hendrix']
    },
    'dom9_arp': {
      tip: `Доминант9 арпеджио в ${keyNote} — добавь 9-ю.`,
      artists: ['Joe Pass', 'Wes Montgomery']
    },
    'altered': {
      tip: `Альтерированная в ${keyNote} — b9, #9, b5, #5.`,
      artists: ['John Coltrane', 'Allan Holdsworth']
    }
  };

  const context = modeMap[mode] || modeMap['major'];
  if (!context) return null;
  
  return {
    icon: '🎯',
    title: `${mode.replace('_', ' ')} в ${keyNote}`,
    description: context.tip,
    category: 'harmony',
    actionable: 'Практикуй 5 минут без остановки',
    relatedArtists: context.artists,
    berkleeTip: '"The key to improvisation is knowing your scale and forgetting it." — Berklee'
  };
}

// ============================================================
// 🔥 СТАРЫЕ ФУНКЦИИ (для совместимости)
// ============================================================








