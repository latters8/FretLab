// src/utils/tipsGenerator.ts

import { type Lick, type LickNote, type Technique } from '../services/AIEngine';

export interface Tip {
  icon: string;
  title: string;
  description: string;
  category: 'harmony' | 'technique' | 'rhythm' | 'dynamics' | 'style' | 'practice' | 'touchgrass';
  actionable?: string;
  relatedArtists?: string[];
  berkleeTip?: string; // 🔥 Специальный блок "Berklee Says"
}

// ============================================================
// 🔥 НОВАЯ БАЗА СОВЕТОВ — УНИВЕРСАЛЬНЫЕ ПРАКТИЧЕСКИЕ УПРАЖНЕНИЯ
// ============================================================

const PRACTICE_TIPS: Tip[] = [
  // ===== ТЕХНИКА =====
  {
    icon: '🎸',
    title: 'Хроматическая разминка пальцев',
    description: 'Играй хроматическую гамму по всем струнам: 1-2-3-4 на каждом ладу. Начинай медленно, постепенно увеличивая темп. Это основа чистой игры.',
    category: 'technique',
    actionable: '5 минут перед каждой практикой. Используй метроном!',
    relatedArtists: ['Steve Vai', 'John Petrucci'],
    berkleeTip: '"The chromatic scale is your daily dental floss for fingers." — Joe Stump'
  },
  {
    icon: '🤘',
    title: 'Легато для скорости',
    description: 'Практикуй хаммер-оны и пул-оффы на одной струне: 5-7-8-7-5. Добейся равной громкости всех нот без дополнительного щипка.',
    category: 'technique',
    actionable: 'Играй группы по 3 ноты с акцентом на первую.',
    relatedArtists: ['Allan Holdsworth', 'Frank Gambale'],
    berkleeTip: '"Legato is not just about speed — it\'s about singing through the guitar." — Joe Satriani'
  },
  {
    icon: '🎵',
    title: 'Вибрато как у вокалиста',
    description: 'Сыграй ноту и качай струну вверх-вниз от 6 до 12 раз в секунду. Начинай медленно, потом ускоряй. Вибрато должно быть ритмичным.',
    category: 'technique',
    actionable: 'Практикуй вибрато на каждом пальце на разных струнах.',
    relatedArtists: ['David Gilmour', 'B.B. King', 'Eric Clapton'],
    berkleeTip: '"Vibrato is the singer\'s breath. If your vibrato is bad, everything is bad." — John Petrucci'
  },
  {
    icon: '🌀',
    title: 'Бенды с контролем',
    description: 'Играй бенд на 1/2 тона, 1 тон и 1.5 тона. Контролируй интонацию — бенд должен звучать чисто. Проверяй себя, сравнивая с открытой струной.',
    category: 'technique',
    actionable: 'Практикуй бенды с метрономом: на каждую долю — бенд.',
    relatedArtists: ['B.B. King', 'Albert King', 'Gary Moore'],
    berkleeTip: '"Bending is the heart of blues. Feel it, don\'t just play it." — Joe Bonamassa'
  },

  // ===== ГАРМОНИЯ =====
  {
    icon: '🎹',
    title: 'Арпеджио — ключ к импровизации',
    description: 'Играй арпеджио мажорных и минорных трезвучий по всем струнам. Это фундамент джазовой и рок-импровизации.',
    category: 'harmony',
    actionable: 'Играй арпеджио по кругу квинт в разных позициях.',
    relatedArtists: ['Pat Metheny', 'Wes Montgomery'],
    berkleeTip: '"You don\'t need a thousand licks — just know your arpeggios." — Pat Metheny'
  },
  {
    icon: '🎯',
    title: 'Аккордовые тоны — твои якоря',
    description: 'Всегда знай, какие ноты в текущем аккорде. Играй мимо аккордовых тонов, но всегда возвращайся к ним. Это создаёт гармоническое напряжение.',
    category: 'harmony',
    actionable: 'На каждый аккорд выделяй 3 аккордовых тона и обыгрывай их.',
    relatedArtists: ['John Coltrane', 'Charlie Parker'],
    berkleeTip: '"When in doubt, play the third. It tells you major or minor." — Berklee Harmony 101'
  },
  {
    icon: '🔥',
    title: 'Outside Playing — контролируемый хаос',
    description: 'Используй хроматические проходы и тритоновые замены, чтобы выходить за пределы тональности. Главное — возвращаться!',
    category: 'harmony',
    actionable: 'Играй хроматическую гамму, а затем разрешай в ближайший аккордовый тон.',
    relatedArtists: ['John Scofield', 'Scott Henderson'],
    berkleeTip: '"Outside playing is not random — it\'s calculated tension." — John Scofield'
  },

  // ===== РИТМ =====
  {
    icon: '🥁',
    title: 'Синкопа — душа грува',
    description: 'Смещай акценты на слабые доли. Играй восьмые как "длинный-короткий" (шёфл) или "короткий-длинный" (синкопа).',
    category: 'rhythm',
    actionable: 'Играй один ритмический паттерн 5 минут без остановки.',
    relatedArtists: ['James Brown', 'Prince'],
    berkleeTip: '"Rhythm is not just something you play — it\'s something you live." — Victor Wooten'
  },
  {
    icon: '⚡',
    title: 'Ритмическая точность с метрономом',
    description: 'Метроном — твой лучший друг. Начинай с медленного темпа (60 BPM) и играй ровно. Только когда идеально, увеличивай скорость.',
    category: 'rhythm',
    actionable: 'Каждый день начинай с 10 минут игры под метроном.',
    relatedArtists: ['Steve Gadd', 'Dennis Chambers'],
    berkleeTip: '"The metronome is God\'s way of telling you the truth." — Berklee Rhythm Department'
  },

  // ===== ДИНАМИКА =====
  {
    icon: '🌊',
    title: 'Динамика — эмоция музыки',
    description: 'Играй одну и ту же фразу 4 раза: p (тихо), mf (средне), f (громко), ff (очень громко). Играй как поёшь!',
    category: 'dynamics',
    actionable: 'Практикуй crescendo и diminuendo на длинных нотах.',
    relatedArtists: ['David Gilmour', 'Jimi Hendrix'],
    berkleeTip: '"Dynamics are the difference between a musician and a computer." — Steve Vai'
  },

  // ===== СТИЛЬ =====
  {
    icon: '🎩',
    title: 'Джазовый подход — плавность и гармония',
    description: 'Играй плавные линии с акцентом на аккордовые тоны. Используй хроматические проходы между ними. Вслушивайся в гармонию.',
    category: 'style',
    actionable: 'Транскрибируй соло Джо Пасса или Уэса Монтгомери.',
    relatedArtists: ['Joe Pass', 'Wes Montgomery'],
    berkleeTip: '"Jazz is not a style — it\'s a way of thinking." — Joe Pass'
  },
  {
    icon: '⚡',
    title: 'Рок-фразировка — драйв и энергия',
    description: 'Используй пентатонику, бенды и пауэр-аккорды. Акцентируй сильные доли. Играй как будто поёшь!',
    category: 'style',
    actionable: 'Попробуй сыграть одну фразу в 3 разных октавах.',
    relatedArtists: ['Jimmy Page', 'Jimi Hendrix'],
    berkleeTip: '"Rock is not about notes — it\'s about attitude." — Jimmy Page'
  },
  {
    icon: '🌿',
    title: 'Блюз — душа гитары',
    description: 'Играй блюзовую пентатонику. Добавь "синие" ноты (b3, b5, b7). Бенды и вибрато — твои главные инструменты.',
    category: 'style',
    actionable: 'Сыграй 12-тактовый блюз с разными концовками.',
    relatedArtists: ['B.B. King', 'Albert King', 'Freddie King'],
    berkleeTip: '"The blues is the foundation of all American music." — B.B. King'
  },

  // ===== ПРАКТИКА (Berklee Style) =====
  {
    icon: '📝',
    title: 'Practice Journal — веди дневник',
    description: 'Записывай, что ты практиковал, что получилось, а над чем нужно работать. Прогресс должен быть видим!',
    category: 'practice',
    actionable: 'Веди дневник практики каждый день.',
    relatedArtists: ['John Coltrane', 'Pat Metheny'],
    berkleeTip: '"If you can\'t measure it, you can\'t improve it." — Berklee Practice Department'
  },
  {
    icon: '🧠',
    title: 'Практика без гитары (Mental Practice)',
    description: 'Представляй, как ты играешь. Визуализируй руки, ноты, ритм. Это прокачивает мозг и улучшает координацию.',
    category: 'practice',
    actionable: '5 минут перед сном — ментальная практика.',
    relatedArtists: ['John Coltrane', 'Chick Corea'],
    berkleeTip: '"You don\'t need a guitar to practice — you need a brain." — Berklee Neuroscience'
  },
  {
    icon: '🎯',
    title: 'Конкретная цель каждой практики',
    description: 'Всегда знай, ЧТО ты хочешь улучшить сегодня. Это может быть один приём, одна гамма или одна фраза.',
    category: 'practice',
    actionable: 'Записывай конкретную цель перед каждой практикой.',
    relatedArtists: ['Steve Vai', 'Joe Satriani'],
    berkleeTip: '"Practice with purpose, not just for time." — Berklee Dean'
  },

  // ===== TOUCHGRASS — связь с брендом =====
  {
    icon: '🌿',
    title: 'TouchGrass — играй на свежем воздухе',
    description: 'Возьми гитару и выйди в парк, к озеру или просто во двор. Природа вдохновляет, а звук гитары на улице — это особый кайф!',
    category: 'touchgrass',
    actionable: 'Сыграй свою любимую песню в парке сегодня!',
    relatedArtists: ['Joni Mitchell', 'James Taylor', 'Bob Dylan'],
    berkleeTip: '"The best practice room has no walls." — TouchGrass Philosophy'
  },
  {
    icon: '🌿',
    title: 'TouchGrass — джем с друзьями',
    description: 'Выйди на траву (или просто в гостиную) и играй с друзьями. Совместная игра — это лучший способ развить чувство времени и гармонии.',
    category: 'touchgrass',
    actionable: 'Собери джем-сейшн в выходные!',
    relatedArtists: ['The Grateful Dead', 'Phish', 'Dave Matthews Band'],
    berkleeTip: '"Music is better together." — TouchGrass Jam Sessions'
  },
  {
    icon: '🌿',
    title: 'TouchGrass — гитара везде',
    description: 'Не жди вдохновения — бери гитару и играй. На кухне, в парке, у костра. Гитара должна быть всегда под рукой!',
    category: 'touchgrass',
    actionable: 'Держи гитару рядом с диваном или рабочим столом.',
    relatedArtists: ['Ed Sheeran', 'Taylor Swift', 'John Mayer'],
    berkleeTip: '"The guitar is not just an instrument — it\'s a companion." — TouchGrass Lifestyle'
  },
  {
    icon: '🌿',
    title: 'TouchGrass — слушай больше музыки',
    description: 'Слушай музыку разных стилей: блюз, джаз, фанк, классику. Анализируй соло, структуру, гармонию. Это топливо для твоей игры.',
    category: 'touchgrass',
    actionable: 'Сегодня послушай 3 альбома разных жанров.',
    relatedArtists: ['Miles Davis', 'Jimi Hendrix', 'Bach'],
    berkleeTip: '"To play great music, you have to listen to great music." — TouchGrass Ear Training'
  },
  {
    icon: '🌿',
    title: 'TouchGrass — не бойся импровизировать',
    description: 'Импровизация — это разговор. Не бойся ошибаться. Лучше сыграть "неправильную" ноту с уверенностью, чем "правильную" неуверенно.',
    category: 'touchgrass',
    actionable: 'Поставь минусовку и играй 10 минут подряд без остановки.',
    relatedArtists: ['Miles Davis', 'John Coltrane', 'Jimi Hendrix'],
    berkleeTip: '"There are no mistakes, just unexpected notes." — TouchGrass Improv Philosophy'
  },
  {
    icon: '🌿',
    title: 'TouchGrass — гитара как терапия',
    description: 'Играй для души. Не важно, правильно или нет. Гитара — это способ выразить эмоции, снять стресс и просто быть счастливым.',
    category: 'touchgrass',
    actionable: 'Играй свою любимую песню с улыбкой 😊',
    relatedArtists: ['Bob Marley', 'Jack Johnson', 'Jason Mraz'],
    berkleeTip: '"Music is the language of the soul." — TouchGrass Wellness'
  },
];

// ============================================================
// 🔥 ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ
// ============================================================

export function generateTips(
  _lick: Lick,
  keyNote: string,
  mode: string,
  _chordProgression: string[],
  bpm: number = 120
): Tip[] {
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
  
  // 🔥 Уникализация — убираем дубли по заголовкам
  const seen = new Set();
  const uniqueTips = tips.filter(tip => {
    const key = tip.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Ограничиваем до 6 советов
  return uniqueTips.slice(0, 6);
}

// ============================================================
// 🔥 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function getContextTip(keyNote: string, mode: string): Tip | null {
  const modeMap: Record<string, { tip: string; artists: string[] }> = {
    'major': {
      tip: `Практикуй мажорную пентатонику в тональности ${keyNote}. Играй как на мажорных, так и на минорных аккордах — это расширит твой гармонический словарь.`,
      artists: ['Allman Brothers', 'Jerry Garcia']
    },
    'minor': {
      tip: `Минорная пентатоника в ${keyNote} — это основа рока и блюза. Добавь "синюю" ноту (b5) для характерного блюзового звука.`,
      artists: ['Jimi Hendrix', 'Jimmy Page']
    },
    'dorian': {
      tip: `Дорийский лад в ${keyNote} звучит как фанк и фьюжн. Акцентируй натуральную 6-ю ступень — это его "изюминка".`,
      artists: ['Santana', 'Stevie Wonder']
    },
    'mixolydian': {
      tip: `Миксолидийский лад в ${keyNote} — это рок, фанк и джаз. Играй с блюзовыми ноты, особенно b7.`,
      artists: ['Jimi Hendrix', 'John Scofield']
    },
    'lydian': {
      tip: `Лидийский лад в ${keyNote} звучит космически и светло. Акцентируй #11 ступень для магического эффекта.`,
      artists: ['Steve Vai', 'Joe Satriani']
    },
    'phrygian': {
      tip: `Фригийский лад в ${keyNote} — это испанская страсть. Используй b2 ступень для тёмного, восточного звука.`,
      artists: ['Paco de Lucía', 'Al Di Meola']
    },
    'locrian': {
      tip: `Локрийский лад в ${keyNote} — самый тёмный. Используй его для создания напряжения в джазе и металле.`,
      artists: ['John Coltrane', 'Allan Holdsworth']
    },
    'blues': {
      tip: `Блюзовая гамма в ${keyNote} — это душа гитары. Играй с бендами и вибрато на каждой ноте.`,
      artists: ['B.B. King', 'Albert King', 'Eric Clapton']
    },
    'pentatonic': {
      tip: `Пентатоника в ${keyNote} — это универсальный язык гитары. Играй её везде: от блюза до джаза.`,
      artists: ['Jimmy Page', 'David Gilmour']
    },
    'harmonic_minor': {
      tip: `Гармонический минор в ${keyNote} звучит как цыганская музыка и джаз. Акцентируй повышенную 7-ю ступень.`,
      artists: ['Django Reinhardt', 'John McLaughlin']
    },
    'melodic_minor': {
      tip: `Мелодический минор в ${keyNote} — это джаз и фьюжн. Играй его как мажор, но с минорной терцией.`,
      artists: ['Pat Metheny', 'Allan Holdsworth']
    },
    'maj7_arp': {
      tip: `Мажорное арпеджио мажор7 в ${keyNote} — основа джазовой импровизации. Играй его по всем струнам.`,
      artists: ['Wes Montgomery', 'Joe Pass']
    },
    'min7_arp': {
      tip: `Минорное арпеджио минор7 в ${keyNote} — это блюз и джаз. Добавь 9-ю ступень для современного звука.`,
      artists: ['Pat Metheny', 'John Scofield']
    },
    'dom7_arp': {
      tip: `Доминантовое арпеджио 7 в ${keyNote} — это блюз, рок и джаз. Акцентируй 3-ю и b7-ю ступени.`,
      artists: ['B.B. King', 'Jimi Hendrix']
    },
    'dom9_arp': {
      tip: `Доминантовое арпеджио 9 в ${keyNote} — это джаз и фьюжн. Добавь 9-ю ступень для более полного звука.`,
      artists: ['Joe Pass', 'Wes Montgomery']
    },
    'altered': {
      tip: `Альтерированная гамма в ${keyNote} — это джаз 20-го века. Используй все "неправильные" ноты: b9, #9, b5, #5.`,
      artists: ['John Coltrane', 'Allan Holdsworth']
    }
  };

  const context = modeMap[mode] || modeMap['major'];
  return {
    icon: '🎯',
    title: `Совет для ${mode.replace('_', ' ')} в ${keyNote}`,
    description: context.tip,
    category: 'harmony',
    actionable: 'Практикуй 5 минут без остановки',
    relatedArtists: context.artists,
    berkleeTip: '"The key to improvisation is knowing your scale and forgetting it." — Berklee Improv Dept'
  };
}

function getTempoTip(bpm: number): Tip | null {
  let description: string;
  let artists: string[];
  let actionable: string;
  
  if (bpm < 60) {
    description = 'Медленный темп — идеальное время для работы над фразировкой и вибрато. Каждая нота должна быть как вокалист.';
    artists = ['David Gilmour', 'B.B. King'];
    actionable = 'Играй одну ноту и держи её с идеальным вибрато 30 секунд.';
  } else if (bpm < 90) {
    description = 'Средний темп — баланс между контролем и энергией. Работай над ровной ритмикой и чистотой.';
    artists = ['Eric Clapton', 'John Mayer'];
    actionable = 'Играй ровные восьмые с акцентом на каждый удар метронома.';
  } else if (bpm < 140) {
    description = 'Быстрый темп — тренируй пальцы и ритм. Не забывай про динамику даже на скорости.';
    artists = ['Joe Satriani', 'Steve Vai'];
    actionable = 'Играй 16-е ноты без напряжения, расслабляй кисть.';
  } else {
    description = 'Очень быстрый темп — это уже шред. Начинай медленно и постепенно ускоряйся. Каждая нота должна быть слышна.';
    artists = ['Yngwie Malmsteen', 'John Petrucci'];
    actionable = 'Разбей фразу на группы по 4 ноты и играй с акцентом на первую.';
  }
  
  return {
    icon: '⏱️',
    title: `Работа с темпом: ${bpm} BPM`,
    description,
    category: 'rhythm',
    actionable,
    relatedArtists: artists,
    berkleeTip: '"Speed is the result of control, not the goal." — Berklee Technique Dept'
  };
}

// ============================================================
// 🔥 ДЛЯ СОВМЕСТИМОСТИ — ОСТАВЛЯЕМ СТАРЫЕ ФУНКЦИИ, НО ОНИ НЕ ИСПОЛЬЗУЮТСЯ
// ============================================================

function countTechniques(_notes: LickNote[]): Map<Technique, number> {
  return new Map();
}

function analyzeIntervals(_notes: LickNote[]): { jumps: number; stepwise: number } {
  return { jumps: 0, stepwise: 0 };
}

function analyzeRhythm(_notes: LickNote[]) {
  return { syncopation: 0, noteDensity: 0 };
}

function analyzeHarmony(
  _notes: LickNote[],
  _chordProgression: string[],
  _keyNote: string,
  _mode: string
) {
  return { outOfKeyNotes: 0, rootNoteHits: 0, chordTones: 0 };
}

function analyzeStructure(_notes: LickNote[]): {
  hasIntro: boolean;
  hasClimax: boolean;
  hasRestBeforeClimax: boolean;
  noteRange: number;
} {
  return { hasIntro: false, hasClimax: false, hasRestBeforeClimax: false, noteRange: 0 };
}

function analyzeMotif(_notes: LickNote[]): {
  repetitionCount: number;
  variationCount: number;
} {
  return { repetitionCount: 0, variationCount: 0 };
}

function getModeIntervals(_mode: string): number[] {
  return [0, 2, 4, 5, 7, 9, 11];
}

function generateStyleTips(
  _techniqueCounts: Map<Technique, number>,
  _intervals: { jumps: number; stepwise: number },
  _harmony: any
): Tip[] {
  return [];
}