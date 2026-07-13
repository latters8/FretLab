// src/services/AIEngine.ts

export type VideoPlatform = 'youtube' | 'rutube' | 'vk';

export interface TrackOption {
  id: string;
  title: string;
  icon?: string;
  action?: { type: string; payload?: any };
  key?: string;
  mode?: string;
  bpm?: number;
}

export interface AISuggestion {
  label: string;
  description?: string;
  action?: { type: string; payload?: any };
  query?: string;
  href?: string;
}

export interface AIResponse {
  text: string;
  action?: { type: string; payload?: any };
  options?: TrackOption[];
  platformOptions?: { platform: VideoPlatform; label: string; icon: string }[];
  searchQuery?: string;
  suggestions?: AISuggestion[];
  examples?: string[];
  tips?: string[];
  links?: Array<{ label: string; href: string; description?: string }>;
}

export interface TimeSignature {
  beats: number;
  noteValue: number;
}

// ============================================================
// 🔥 БАЗА ЗНАНИЙ TOUCHGRASS AI
// ============================================================

interface KnowledgeEntry {
  keywords: string[];
  response: string;
  action?: { type: string; payload?: any };
  category: 'theory' | 'technique' | 'chords' | 'rhythm' | 'improvisation' | 'scales' | 'gear' | 'general';
  tips?: string[];
  examples?: string[];
  links?: Array<{ label: string; href: string; description?: string }>;
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ===== ТЕОРИЯ =====
  {
    keywords: ['гамма', 'scale', 'мажорная гамма', 'минорная гамма', 'что такое гамма'],
    response: '🎵 Гамма — это последовательность нот в определенном интервальном порядке.\n\nМажорная: 1-2-3-4-5-6-7 (C-D-E-F-G-A-B)\nМинорная: 1-2-b3-4-5-b6-b7 (C-D-Eb-F-G-Ab-Bb)\n\nПентатоника: 5 нот (C-D-E-G-A — мажорная, A-C-D-E-G — минорная)\n\n🔥 Совет: Начни с минорной пентатоники — она подходит для 90% рока и блюза!',
    category: 'theory',
    tips: ['Пентатоника — лучшая гамма для начала импровизации', 'Мажорная гамма звучит светло, минорная — грустно'],
    examples: ['Пентатоника Am: A-C-D-E-G', 'Блюзовая гамма Am: A-C-D-Eb-E-G']
  },
  {
    keywords: ['лад', 'mode', 'лады', 'режим', 'mode', 'дорийский', 'фригийский', 'лидийский', 'миксолидийский', 'эолийский', 'локрийский'],
    response: '🎸 7 основных ладов:\n\n1. Ионийский (мажор) — C-D-E-F-G-A-B\n2. Дорийский — D-E-F-G-A-B-C (джазовый)\n3. Фригийский — E-F-G-A-B-C-D (испанский)\n4. Лидийский — F-G-A-B-C-D-E (воздушный)\n5. Миксолидийский — G-A-B-C-D-E-F (блюзовый)\n6. Эолийский (минор) — A-B-C-D-E-F-G\n7. Локрийский — B-C-D-E-F-G-A (редкий)\n\n💡 Самые популярные: Дорийский (для джаза) и Миксолидийский (для блюза).',
    category: 'theory',
    tips: ['Дорийский — любимый лад джазовых гитаристов', 'Миксолидийский — основа блюзовой импровизации'],
    examples: ['Dorian в A: A-B-C-D-E-F#-G', 'Mixolydian в G: G-A-B-C-D-E-F']
  },
  {
    keywords: ['интервал', 'interval', 'полутон', 'интервалы'],
    response: '📏 Интервал — расстояние между нотами в полутонах:\n\nПрима (0) — C-C\nСекунда (2) — C-D\nТерция (4) — C-E\nКварта (5) — C-F\nКвинта (7) — C-G\nСекста (9) — C-A\nСептима (11) — C-B\nОктава (12) — C-C\n\n🔥 Запомни квинту (7 полутонов) — она звучит как "пустота" и используется в power chords!',
    category: 'theory'
  },
  {
    keywords: ['тоника', 'tonic', 'центр', 'ключевая нота'],
    response: '🎯 Тоника — главная нота лада или аккорда. Центр тяжести гармонии.\n\nВ тональности C мажор тоника — C.\nВ Am тоника — A.\nВ блюзе E тоника — E.\n\n💡 Тоника определяет название тональности и ключ импровизации. Всегда знай, где тоника на грифе!',
    category: 'theory'
  },
  {
    keywords: ['доминанта', 'dominant', 'v ступень', 'V ступень'],
    response: '🎸 Доминанта — V ступень лада. Самый напряженный аккорд в тональности.\n\nВ C мажор — G7.\nВ Am — E7.\nВ блюзе E — B7.\n\n🔥 Доминанта тяготеет к тонике: V → I (G7 → C). Это называется "разрешение".',
    category: 'theory'
  },
  {
    keywords: ['квинтовый круг', 'circle of fifths', 'круг квинт'],
    response: '🌀 Квинтовый круг — схема тональностей по квинтам (7 полутонов).\n\nПо часовой стрелке: C → G → D → A → E → B → F# → C#\nПротив: C → F → Bb → Eb → Ab → Db → Gb → Cb\n\n💡 Помогает находить родственные тональности и строить прогрессии. Очень полезная штука!',
    category: 'theory'
  },
  {
    keywords: ['caged', 'система caged', 'аппликатура', 'caged система'],
    response: '🎸 CAGED — система 5 основных форм аккордов на гитаре:\n\nC (форма C)\nA (форма A)\nG (форма G)\nE (форма E)\nD (форма D)\n\n🔥 Эти формы перемещаются по грифу, создавая все аккорды в разных позициях. Освой CAGED — и гриф станет понятным!',
    category: 'technique'
  },
  {
    keywords: ['пентатоника', 'pentatonic', '5 нот', 'пентатоническая гамма'],
    response: '🎵 Пентатоника — гамма из 5 нот:\n\nМажорная: 1-2-3-5-6 (C-D-E-G-A)\nМинорная: 1-b3-4-5-b7 (A-C-D-E-G)\n\n🔥 Самая популярная гамма для соло на гитаре! Подходит для рока, блюза, поп-музыки и джаза.\n\n💡 Начни с минорной пентатоники в позиции 1 (5-й лад на E струне).',
    category: 'scales',
    tips: ['Box 1 пентатоники — самая важная форма', 'Добавь блюзовую ноту (b5) для более грязного звука'],
    examples: ['Am pentatonic: A-C-D-E-G', 'Em pentatonic: E-G-A-B-D']
  },
  {
    keywords: ['блюзовая гамма', 'blues scale', 'блюз'],
    response: '🎸 Блюзовая гамма — минорная пентатоника + b5 (блюзовая нота).\n\nA блюз: A-C-D-Eb-E-G\nE блюз: E-G-A-Bb-B-D\n\n🔥 Дает характерный блюзовый звук с напряжением. Именно эта нота делает блюз — блюзом!\n\n💡 Играй блюзовую ноту как проходящую, не задерживайся на ней надолго.',
    category: 'scales',
    tips: ['Блюзовая нота — "грязная" нота, она создает напряжение', 'Используй бенд на блюзовой ноте (1/2 тона)'],
    examples: ['A blues scale: A-C-D-Eb-E-G', 'E blues scale: E-G-A-Bb-B-D']
  },
  {
    keywords: ['арпеджио', 'arpeggio', 'перебор', 'арпеджио аккорда'],
    response: '🎹 Арпеджио — аккорд, сыгранный по нотам последовательно.\n\nC мажор: C-E-G (по очереди)\nAm: A-C-E\nG7: G-B-D-F\n\n🔥 Используется для импровизации, создания мелодических линий. Отлично звучит поверх аккордов!\n\n💡 Начни с трезвучий (мажорных и минорных) — это основа всех арпеджио.',
    category: 'technique',
    examples: ['Cmaj7 arpeggio: C-E-G-B', 'Am7 arpeggio: A-C-E-G']
  },

  // ===== ТЕХНИКИ =====
  {
    keywords: ['хаммер', 'hammer-on', 'hammer', 'хаммерон'],
    response: '🔨 Hammer-on — удар по струне левой рукой без щипка правой.\n\nТехника: сыграй ноту правой рукой → ударь левой по следующему ладу.\n\n🔥 Звук извлекается от силы удара пальца. Создает быстрые, плавные переходы.\n\n💡 Тренируй на одной струне: 5-7-5-7-5 (хаммер-пулл).',
    category: 'technique'
  },
  {
    keywords: ['пулл', 'pull-off', 'pull', 'пуллоф'],
    response: '🔄 Pull-off — срыв пальца со струны.\n\nТехника: зажми две ноты (нижнюю и верхнюю) → сыграй нижнюю → срывая палец, извлеки верхнюю.\n\n🔥 Создает эффект нисходящего легато. Отлично сочетается с хаммерами!\n\n💡 Держи пальцы сильными — пулл требует четкости.',
    category: 'technique'
  },
  {
    keywords: ['слайд', 'slide', 'скольжение', 'слайд на гитаре'],
    response: '🤘 Slide — скольжение пальца по струне от одного лада к другому без отрыва.\n\nТехника: зажми ноту → скользни к другому ладу → продолжай звук.\n\n🔥 Создает связное, плавное движение. Классика блюза и рока!',
    category: 'technique'
  },
  {
    keywords: ['вибрато', 'vibrato', 'вибрато на гитаре'],
    response: '🎵 Vibrato — быстрое колебание высоты звука.\n\nТехника: покачивай палец на струне, изменяя натяжение.\n\n🔥 Придает звуку выразительность, "человечность". Без вибрато соло звучит плоско!\n\n💡 Вибрато бывает: медленное (для баллад), быстрое (для рока), широкое (для блюза).',
    category: 'technique'
  },
  {
    keywords: ['бенд', 'bend', 'подтяжка', 'бенд на гитаре'],
    response: '🎸 Bend — подтяжка струны вверх или вниз.\n\nНа 1/2 тона: сдвиг на 1 полутон.\nНа 1 тон: сдвиг на 2 полутона.\nНа 2 тона: сдвиг на 4 полутона.\n\n🔥 Дает вокальный, эмоциональный звук. Без бендов блюз — не блюз!\n\n💡 Используй 2-3 пальца для силы (2-й и 3-й вместе). Слушай, чтобы бенд попадал в нужную ноту.',
    category: 'technique'
  },
  {
    keywords: ['глушение', 'palm mute', 'mute', 'глушение струн'],
    response: '🖐️ Palm mute — глушение струн ребром ладони у бриджа.\n\nДает жесткий, "перкуссионный" звук.\n\n🔥 Используется в роке, металле, панке. Создает ритмический пульс.\n\n💡 Не дави слишком сильно — струны должны звучать, но с глухим оттенком.',
    category: 'technique'
  },
  {
    keywords: ['тэппинг', 'tapping', 'таппинг', 'тэп'],
    response: '👆 Tapping — извлечение звука ударами пальцев правой руки по ладам.\n\nТехника: ударь правой рукой по струне на нужном ладу → затем левой рукой.\n\n🔥 Популяризирован Эдди Ван Халеном (Eruption). Выглядит эффектно!\n\n💡 Начни с простых паттернов на одной струне.',
    category: 'technique'
  },
  {
    keywords: ['флажолет', 'harmonic', 'harmonics', 'флажолеты'],
    response: '✨ Harmonic — прикосновение к струне в точке деления.\n\nНатуральные: 12, 7, 5 лады.\nИскусственные: прикосновение + щипок правой руки.\n\n🔥 Дает "звенящий", "колокольный" звук. Красиво звучит в чистых тонах.\n\n💡 Самый простой флажолет — на 12-м ладу.',
    category: 'technique'
  },
  {
    keywords: ['легато', 'legato', 'легато на гитаре'],
    response: '🎵 Legato — плавная, связная игра без щипка правой руки.\n\nСочетание хаммеров и пуллов.\n\n🔥 Создает "поющий" звук, экономит движения пальцев.\n\n💡 Тренируй легато на пентатонике — это сделает соло более живым!',
    category: 'technique'
  },

  // ===== АККОРДЫ =====
  {
    keywords: ['мажорный аккорд', 'major chord', 'мажор', 'аккорд мажор'],
    response: '🎵 Мажорный аккорд — 1-3-5 ступени.\n\nЗвучит ярко, радостно.\n\nC = C-E-G\nG = G-B-D\nF = F-A-C\n\n💡 Мажор — это "солнечное" звучание. Отлично подходит для поп-музыки и рока.',
    category: 'chords'
  },
  {
    keywords: ['минорный аккорд', 'minor chord', 'минор', 'аккорд минор'],
    response: '🎵 Минорный аккорд — 1-b3-5 ступени.\n\nЗвучит грустно, темно.\n\nAm = A-C-E\nEm = E-G-B\nDm = D-F-A\n\n💡 Минор — это "меланхоличное" звучание. Основа блюза и рока.',
    category: 'chords'
  },
  {
    keywords: ['доминантсептаккорд', 'dominant 7', '7 аккорд', 'септаккорд'],
    response: '🎵 Доминантсептаккорд — 1-3-5-b7.\n\nЗвучит напряженно, требует разрешения.\n\nG7 = G-B-D-F\nE7 = E-G#-B-D\nA7 = A-C#-E-G\n\n🔥 Самый важный аккорд в блюзе и джазе! Без него нет движения к тонике.',
    category: 'chords'
  },
  {
    keywords: ['мажорный септаккорд', 'major 7', 'maj7', 'maj 7', 'мажор септаккорд'],
    response: '🎵 Мажорный септаккорд — 1-3-5-7.\n\nЗвучит мягко, джазово.\n\nCmaj7 = C-E-G-B\nGmaj7 = G-B-D-F#\nFmaj7 = F-A-C-E\n\n💡 Maj7 — любимый аккорд джазовых гитаристов. Очень красивое звучание!',
    category: 'chords'
  },
  {
    keywords: ['минорный септаккорд', 'minor 7', 'm7', 'минор септаккорд'],
    response: '🎵 Минорный септаккорд — 1-b3-5-b7.\n\nЗвучит грустно, джазово.\n\nAm7 = A-C-E-G\nEm7 = E-G-B-D\nDm7 = D-F-A-C\n\n💡 m7 — основа джазовой гармонии. Отлично звучит в прогрессиях.',
    category: 'chords'
  },
  {
    keywords: ['уменьшенный аккорд', 'diminished', 'dim', 'уменьшенный'],
    response: '🎵 Уменьшенный аккорд — 1-b3-b5.\n\nЗвучит тревожно, диссонансно.\n\nCdim = C-Eb-Gb\nGdim = G-Bb-Db\n\n🔥 Используется для создания напряжения. Классика джаза и хоррора!',
    category: 'chords'
  },
  {
    keywords: ['увеличенный аккорд', 'augmented', 'aug', 'увеличенный'],
    response: '🎵 Увеличенный аккорд — 1-3-#5.\n\nЗвучит напряженно, "загадочно".\n\nCaug = C-E-G#\nGaug = G-B-D#\n\n💡 Дает ощущение неопределенности. Используется в джазе для создания напряженных моментов.',
    category: 'chords'
  },
  {
    keywords: ['sus4', 'sus2', 'задержанный аккорд', 'задержанный'],
    response: '🎵 Sus4 — аккорд с задержанной квартой вместо терции.\nCsus4 = C-F-G (без E)\nGsus4 = G-C-D\n\n🎵 Sus2 — аккорд с задержанной секундой вместо терции.\nCsus2 = C-D-G\nGsus2 = G-A-D\n\n💡 Sus аккорды звучат неустойчиво и красиво. Отлично работают в поп-музыке!',
    category: 'chords'
  },

  // ===== РИТМ =====
  {
    keywords: ['bpm', 'темп', 'удары в минуту', 'beats per minute'],
    response: '🎵 BPM — ударов в минуту (Beats Per Minute).\n\nМедленно: 60-80 BPM\nСредне: 90-120 BPM\nБыстро: 130-180 BPM\nОчень быстро: 180-240 BPM\n\n💡 Метроном помогает держать темп. Начни с 80 BPM и постепенно увеличивай!',
    category: 'rhythm',
    examples: ['Slow blues: 60-70 BPM', 'Rock: 120-140 BPM', 'Metal: 160-200 BPM']
  },
  {
    keywords: ['размер 4/4', '4/4', 'четыре четверти'],
    response: '🎵 4/4 — 4 четверти в такте.\n\nСамый распространенный размер.\n\nСчитается: 1-2-3-4.\n\n🔥 Подходит для рока, поп-музыки, блюза, джаза — почти всего!',
    category: 'rhythm'
  },
  {
    keywords: ['размер 3/4', '3/4', 'вальс', 'вальсовый размер'],
    response: '🎵 3/4 — 3 четверти в такте.\n\nВальсовый размер.\n\nСчитается: 1-2-3.\n\n💡 Подходит для вальсов, баллад, некоторых джазовых композиций.',
    category: 'rhythm'
  },
  {
    keywords: ['метроном', 'metronome', 'под метроном'],
    response: '🎵 Метроном — устройство для поддержания темпа.\n\nЩелкает в ритме заданного BPM.\n\n🔥 Обязательный инструмент для развития ритма! Играй под метроном каждый день.',
    category: 'rhythm'
  },

  // ===== ИМПРОВИЗАЦИЯ =====
  {
    keywords: ['импровизация', 'improvise', 'соло', 'играть соло', 'как импровизировать'],
    response: '🎸 Импровизация — игра музыки на ходу, без записи.\n\nКак научиться:\n1. Выучи пентатонику или блюзовую гамму.\n2. Играй на одной струне (мелодично).\n3. Добавь ритмический рисунок.\n4. Используй хаммеры, слайды, бенды.\n5. Копируй любимых гитаристов (транскрипция).\n6. Играй под минусовки.\n\n🔥 Начни с малого: 3-4 ноты в ритме! Постепенно расширяй фразы.',
    category: 'improvisation',
    tips: ['Начни с пентатоники Box 1', 'Используй бенды и вибрато для выразительности', 'Слушай много блюза и рока'],
    examples: ['Am pentatonic: A-C-D-E-G', 'A blues scale: A-C-D-Eb-E-G']
  },
  {
    keywords: ['развитие ритма', 'ритм', 'как играть ровно', 'развить ритм'],
    response: '🥁 Как развить ритм:\n\n1. Метроном — играй под него ежедневно.\n2. Считай вслух (1-2-3-4).\n3. Танцуй под музыку (тело чувствует ритм).\n4. Копируй ритмические рисунки (слушай музыку).\n5. Используй глушение (palm mute) для перкуссионного эффекта.\n6. Медленно — затем быстро!',
    category: 'improvisation'
  },

  // ===== ОБУЧЕНИЕ =====
  {
    keywords: ['как научиться играть', 'уроки', 'self-taught', 'самоучка', 'с чего начать'],
    response: '🎸 Путь гитариста-самоучки:\n\n1. Поставь руки (техника).\n2. Выучи 5-10 открытых аккордов (C, G, D, A, E, Am, Em, Dm).\n3. Выучи баррэ (F, Bm).\n4. Выучи пентатонику.\n5. Играй песни под минус.\n6. Учи теорию параллельно.\n7. Снимай соло на слух.\n8. Импровизируй 20 минут в день.\n\n🔥 Главное — регулярность! Лучше 15 минут каждый день, чем 2 часа раз в неделю.',
    category: 'general',
    tips: ['Начни с открытых аккордов', 'Используй метроном с первого дня', 'Играй то, что нравится — это мотивирует']
  },
  {
    keywords: ['совет', 'лайфхак', 'как', 'подсказка', 'советы гитаристу'],
    response: '🎸 Топ-5 советов начинающему гитаристу:\n\n1. Медленно = быстро (играй с метрономом).\n2. Чистота важнее скорости.\n3. Развивай слух (пой ноты).\n4. Используй пальцевую технику (легато).\n5. Играй то, что нравится (мотивация).\n\n🔥 И помни: гитара — это про удовольствие, а не про гонку за скоростью!',
    category: 'general'
  }
];

// ============================================================
// 🔥 РАСШИРЕННЫЙ АНАЛИЗ ЗАПРОСОВ ГИТАРИСТОВ
// ============================================================

interface QueryPattern {
  pattern: RegExp;
  action: string;
}

const commonQueries: QueryPattern[] = [
  { pattern: /(?:минус|минусовка|backing|jam|track|джем)\s*(?:в|на|под)?\s*([A-G][b#]?(?:m|maj|m|7|maj7|m7)?)/i, action: 'SEARCH_BACKING' },
  { pattern: /(?:покажи|show|как играть|аппликатура|аккорд)\s*([A-G][b#]?(?:m|maj|m|7|maj7|m7|dim|aug|sus4|sus2)?)/i, action: 'OPEN_CHORD' },
  { pattern: /(?:обыграть|play over|импровизировать|соло под|арпеджио)\s*([A-G][b#]?(?:m|maj|7|maj7|m7|alt)?)/i, action: 'PLAY_OVER' },
  { pattern: /(?:сгенерируй|генерация|создай|make|lick|фраза|рифф|соло)\s*(?:в|на)?\s*([A-G][b#]?(?:m|maj|dorian|blues|pentatonic)?)/i, action: 'GENERATE_LICK' },
  { pattern: /(?:bpm|tempo|скорость|темп)\s*(\d{2,3})/i, action: 'SET_BPM' },
  { pattern: /(?:совет|подскажи|как|помоги|объясни)/i, action: 'GIVE_ADVICE' },
  { pattern: /(?:задай|настрой|set|выбери)\s*(?:размер|time signature|метр)\s*(\d+)\/(\d+)/i, action: 'SET_TIME_SIGNATURE' }
];

const guitarResponses: Record<string, (match: RegExpMatchArray) => AIResponse> = {
  'SEARCH_BACKING': (match) => {
    const chord = match[1] || 'E';
    return {
      text: `🎸 Ищу минусовку для ${chord}! Где искать?`,
      platformOptions: [
        { platform: 'youtube', label: 'YouTube', icon: '▶️' },
        { platform: 'rutube', label: 'RUTUBE', icon: '📺' },
        { platform: 'vk', label: 'VK Видео', icon: '📱' }
      ],
      searchQuery: `${chord} guitar backing track`
    };
  },
  'OPEN_CHORD': (match) => ({
    text: `📖 Открываю аккорд ${match[1]}!`,
    action: { type: 'OPEN_CHORD', payload: { chord: match[1] } }
  }),
  'PLAY_OVER': (match) => {
    const chord = match[1] || 'E';
    const cleanKey = chord.replace(/[^A-G#b]/g, '');
    const isMinor = chord.includes('m');
    return {
      text: `🎯 Настраиваю гриф для обыгрывания ${chord}!`,
      action: { type: 'OPEN_AUTOTAB', payload: { key: cleanKey, mode: isMinor ? 'minor' : 'major' } }
    };
  },
  'GENERATE_LICK': (match) => {
    const key = match[1] || 'E';
    const cleanKey = key.replace(/[^A-G#b]/g, '');
    let mode = 'major';
    if (key.includes('blues')) mode = 'blues';
    else if (key.includes('dorian')) mode = 'dorian';
    else if (key.includes('m')) mode = 'minor';
    return {
      text: `🎸 Генерирую фразу в ${key}!`,
      action: { type: 'OPEN_AUTOTAB', payload: { key: cleanKey, mode } }
    };
  },
  'SET_BPM': (match) => ({
    text: `🎵 Устанавливаю темп ${match[1]} BPM!`,
    action: { type: 'SET_BPM', payload: { bpm: Number(match[1]) } }
  }),
  'SET_TIME_SIGNATURE': (match) => ({
    text: `🎵 Устанавливаю размер ${match[1]}/${match[2]}!`,
    action: { type: 'SET_TIME_SIGNATURE', payload: { beats: Number(match[1]), noteValue: Number(match[2]) } }
  }),
  'GIVE_ADVICE': () => ({
    text: "🎸 Вот несколько советов для гитариста:\n\n" +
          "1. Играй с метрономом — развивает ритм\n" +
          "2. Пентатоника — основа для импровизации\n" +
          "3. Тренируй хаммеры и пуллы — делает звук живым\n" +
          "4. Снимай соло на слух — развивает музыкальный слух\n" +
          "5. Играй с разной динамикой — делает игру выразительной\n\n" +
          "Хочешь конкретный совет? Спроси подробнее! 😊"
  })
};

const normalizeRoot = (value: string) => ({ Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' }[value] || value);

const parseChordLike = (value: string) => {
  const match = value.match(/([A-G][b#]?)(m|maj|dim|aug|sus4|sus2|m7|m9|maj7|maj9|7|9|11|13|add9|add11|alt)?/i);
  if (!match) return null;
  const root = normalizeRoot(match[1]);
  const quality = (match[2] || '').toLowerCase();
  return { root, quality, display: `${root}${quality || ''}` };
};

const inferModeFromChord = (quality: string) => {
  const q = quality.toLowerCase();
  if (q.includes('alt')) return 'altered';
  if (q.includes('maj7') || q.includes('maj9')) return 'maj7_arp';
  if (q.includes('m7') || q.includes('m9') || q.includes('m11') || q.includes('m')) return 'minor';
  if (q.includes('9') || q.includes('7')) return 'dom7_arp';
  if (q.includes('dim')) return 'locrian';
  return 'major';
};

const buildTrackSearchLinks = (queryText: string) => {
  const encoded = encodeURIComponent(queryText);
  return [
    { label: 'YouTube', href: `https://www.youtube.com/results?search_query=${encoded}`, description: 'Search for backing tracks' },
    { label: 'RUTUBE', href: `https://rutube.ru/search/?query=${encoded}`, description: 'Search on RUTUBE' },
    { label: 'VK Видео', href: `https://vk.com/video?q=${encoded}`, description: 'Search in VK Video' }
  ];
};

// ============================================================
// 🔥 ОСНОВНАЯ ФУНКЦИЯ ОБРАБОТКИ ЗАПРОСОВ (ИСПРАВЛЕННАЯ)
// ============================================================

export const processAIQuery = async (query: string): Promise<AIResponse> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  const lowerQuery = query.toLowerCase();

  // ============================================================
  // 🔥 1. ПОИСК В БАЗЕ ЗНАНИЙ
  // ============================================================
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some(kw => lowerQuery.includes(kw))) {
      const response: AIResponse = {
        text: entry.response,
        action: entry.action,
        suggestions: [
          { label: 'Узнать больше', description: 'Задай еще вопрос', action: { type: 'OPEN_ENGINE' } }
        ]
      };
      if (entry.tips) response.tips = entry.tips;
      if (entry.examples) response.examples = entry.examples;
      if (entry.links) response.links = entry.links;
      return response;
    }
  }

  // ============================================================
  // 🔥 2. ПРОВЕРКА НА ПРОСТОЙ АККОРД (СПРАШИВАЕМ ЧТО ДЕЛАТЬ)
  // ============================================================
  const simpleChordMatch = query.match(/^[A-G][b#]?(?:m|maj|dim|aug|sus|7|9|11|13|maj7|m7|m9|m11|maj9|add9|add11|alt)?\d*$/i);
  
  if (simpleChordMatch && !lowerQuery.includes('chord') && !lowerQuery.includes('show') && 
      !lowerQuery.includes('покажи') && !lowerQuery.includes('аккорд') &&
      !lowerQuery.includes('обыграть') && !lowerQuery.includes('арпеджио') &&
      !lowerQuery.includes('минус') && !lowerQuery.includes('джем') &&
      !lowerQuery.includes('соло') && !lowerQuery.includes('таб') &&
      !lowerQuery.includes('найди') && !lowerQuery.includes('поищи') &&
      !lowerQuery.includes('подбери') && !lowerQuery.includes('искать')) {
    
    const chord = simpleChordMatch[0];
    const cleanKey = chord.replace(/[^A-G#b]/g, '');
    const isMinor = chord.includes('m');
    
    return {
      text: `🎸 Я нашёл аккорд **${chord}**. Что ты хочешь сделать?\n\n1️⃣ **Показать аппликатуру** — открою словарь\n2️⃣ **Найти минусовку** — поищу backing track\n3️⃣ **Обыграть (арпеджио)** — настрою гриф\n4️⃣ **Сгенерировать фразу** — создам лик в этой тональности`,
      options: [
        { 
          id: 'show', 
          title: `📖 Показать аппликатуру ${chord}`, 
          action: { type: 'OPEN_CHORD', payload: { chord } }
        },
        { 
          id: 'backing', 
          title: `🎧 Найти минусовку ${chord}`, 
          action: { type: 'SEARCH_BACKING', payload: { query: `${chord} guitar backing track` } }
        },
        { 
          id: 'playover', 
          title: `🎯 Обыграть ${chord} (арпеджио)`, 
          action: { type: 'OPEN_AUTOTAB', payload: { key: cleanKey, mode: isMinor ? 'minor' : 'major' } }
        },
        { 
          id: 'lick', 
          title: `⚡ Сгенерировать фразу в ${chord}`, 
          action: { type: 'OPEN_AUTOTAB', payload: { key: cleanKey, mode: isMinor ? 'minor' : 'major' } }
        }
      ],
      suggestions: [
        { label: `Open ${chord} dictionary`, description: 'Show chord voicings', action: { type: 'OPEN_CHORD', payload: { chord } } },
        { label: `Solo over ${chord}`, description: 'Switch to solo generator', action: { type: 'OPEN_AUTOTAB', payload: { key: cleanKey, mode: isMinor ? 'minor' : 'major' } } }
      ],
      links: buildTrackSearchLinks(`${chord} guitar backing track`),
      tips: ['Напиши "покажи аккорд Am7" чтобы сразу открыть словарь.', 'Напиши "найди минусовку Am7" чтобы найти backing track.']
    };
  }

  // ============================================================
  // 🔥 3. РАСШИРЕННЫЙ АНАЛИЗ ГИТАРНЫХ ЗАПРОСОВ
  // ============================================================
  for (const queryPattern of commonQueries) {
    const match = query.match(queryPattern.pattern);
    if (match) {
      const response = guitarResponses[queryPattern.action]?.(match);
      if (response) return response;
    }
  }

  // ============================================================
  // 4. BPM
  // ============================================================
  const tempoMatch = query.match(/\b(?:tempo|bpm|beats per minute)\b[^0-9]{0,6}(\d{2,3})/i) || query.match(/^\s*(\d{2,3})\s*(?:bpm)?\s*$/i);
  if (tempoMatch) {
    const bpm = Number(tempoMatch[1]);
    return {
      text: `🎵 Темп установлен на ${bpm} BPM. Метроном и ритм-секция готовы к работе.`,
      action: { type: 'SET_BPM', payload: { bpm } },
      suggestions: [
        { label: 'Start metronome', description: 'Tap play and lock the groove', action: { type: 'OPEN_ENGINE' } },
        { label: `Build a solo at ${bpm} BPM`, description: 'Open the solo generator', action: { type: 'OPEN_AUTOTAB', payload: { bpm } } }
      ],
      tips: ['Try “blues solo at 96 BPM” for a more relaxed feel.', 'Ask for “drop D and 110 BPM” to change tuning and tempo together.'],
      examples: ['Set tempo to 96 BPM', 'Build a minor solo at 110 BPM', 'Find a backing track at 82 BPM']
    };
  }

  // ============================================================
  // 5. PLAY OVER
  // ============================================================
  const playOverMatch = query.match(/(?:обыграть|обыгрывание|соло (?:под|на|в)|play over|scale for|arpeggio|арпеджио)\s+([A-G][b#]?(?:m|maj|dim|aug|sus4|sus2|m7|m9|maj7|maj9|7|9|11|13|alt)?)?/i);
  if (playOverMatch) {
    const chordStr = (playOverMatch[1] || query.match(/[A-G][b#]?(?:m|maj|dim|aug|sus4|sus2|m7|m9|maj7|maj9|7|9|11|13|alt)?/i)?.[0] || 'E').toUpperCase();
    const parsed = parseChordLike(chordStr) || { root: 'E', quality: '', display: 'E' };
    const key = normalizeRoot(parsed.root);
    const targetMode = inferModeFromChord(parsed.quality);

    return {
      text: `🎸 Я настрою гриф под ${parsed.display} и открою генератор для соло-подхода.`,
      action: { type: 'OPEN_AUTOTAB', payload: { key, mode: targetMode } },
      suggestions: [
        { label: `Open chord ${parsed.display}`, description: 'Show the chord dictionary', action: { type: 'OPEN_CHORD', payload: { chord: parsed.display } } },
        { label: `Find backing track in ${parsed.display}`, description: 'Search for a jam track', action: { type: 'SEARCH_BACKING', payload: { query: `${parsed.display} guitar backing track` } } }
      ],
      links: buildTrackSearchLinks(`${parsed.display} guitar backing track`),
      tips: ['Use “blues solo” for a more expressive phrase.', 'Try “play over Am” if you want a darker mood.']
    };
  }

  // ============================================================
  // 6. SEARCH BACKING
  // ============================================================
  const isLookingForTrack = lowerQuery.includes('track') || lowerQuery.includes('jam') ||
                            lowerQuery.includes('find') || lowerQuery.includes('backing') ||
                            lowerQuery.includes('минус') || lowerQuery.includes('джем') ||
                            lowerQuery.includes('найди') || lowerQuery.includes('поищи') ||
                            lowerQuery.includes('подбери') || lowerQuery.includes('искать');
  
  if (isLookingForTrack) {
    const hasSpotify = lowerQuery.includes('spotify');
    const hasApple = lowerQuery.includes('apple') || lowerQuery.includes('apple music');
    const hasYoutube = lowerQuery.includes('youtube') || lowerQuery.includes('yt');
    const hasRutube = lowerQuery.includes('rutube');
    const hasVk = lowerQuery.includes('vk') || lowerQuery.includes('vkontakte');

    if (hasSpotify) return { text: 'Открываю Spotify! 🎧', action: { type: 'SEARCH_SPOTIFY', payload: { query } } };
    if (hasApple) return { text: 'Открываю Apple Music! 🎵', action: { type: 'SEARCH_APPLE', payload: { query } } };
    if (hasYoutube) return { text: 'Открываю YouTube! 📺', action: { type: 'SEARCH_YOUTUBE', payload: { query } } };
    if (hasRutube) return { text: 'Открываю RUTUBE! 📺', action: { type: 'SEARCH_RUTUBE', payload: { query } } };
    if (hasVk) return { text: 'Открываю VK Видео! 📱', action: { type: 'SEARCH_VK', payload: { query } } };

    let searchQuery = query
      .replace(/backing|track|jam|минус|джем|найди|поищи|подбери|искать|search|play|for|in|на|в|найди мне|подбери мне|пожалуйста/gi, '')
      .trim();
    
    if (!searchQuery || searchQuery.length < 2) {
      searchQuery = 'guitar backing track';
    } else {
      const lowerSearch = searchQuery.toLowerCase();
      const hasGuitar = lowerSearch.includes('guitar') || lowerSearch.includes('гитара');
      const hasBacking = lowerSearch.includes('backing') || lowerSearch.includes('минус') || lowerSearch.includes('джем');
      const hasIn = lowerSearch.includes('in') || lowerSearch.includes('в');
      
      if (searchQuery.match(/^[A-G][b#]?(?:m|maj|dim|aug|sus|7|9|11|13)?\d*$/i)) {
        searchQuery = `guitar backing track in ${searchQuery}`;
      }
      else if (!hasGuitar && !hasBacking && searchQuery.length < 30) {
        searchQuery = `guitar backing track ${searchQuery}`;
      }
      else if (!hasGuitar && (hasBacking || hasIn)) {
        searchQuery = `guitar ${searchQuery}`;
      }
      else if (hasBacking && !searchQuery.toLowerCase().includes('track')) {
        searchQuery = `${searchQuery} backing track`;
      }
    }

    return {
      text: `🎵 Подбираю идеи для "${searchQuery}". Вот где можно искать прямо сейчас:`,
      platformOptions: [
        { platform: 'youtube', label: 'YouTube', icon: '▶️' },
        { platform: 'rutube', label: 'RUTUBE', icon: '📺' },
        { platform: 'vk', label: 'VK Видео', icon: '📱' }
      ],
      searchQuery,
      suggestions: [
        { label: 'Open player', description: 'Jump to the media panel', action: { type: 'OPEN_ENGINE' } },
        { label: 'Build a solo around it', description: 'Switch to solo mode', action: { type: 'OPEN_AUTOTAB' } }
      ],
      links: buildTrackSearchLinks(searchQuery),
      tips: ['Use a key and a tempo to make the search more precise.', 'Try “blues jam in E” for a more practical result.']
    };
  }

  // ============================================================
  // 7. OPEN CHORD (покажи аккорд)
  // ============================================================
  const chordMatch = query.match(/\b([A-G][b#]?(?:maj7|m7|m9|m11|maj9|7|9|11|13|m|dim|aug|sus4|sus2|add9|add11|alt)?)\b/i);
  
  if (chordMatch && (lowerQuery.includes('chord') || lowerQuery.includes('show') || lowerQuery.includes('покажи') || lowerQuery.includes('аккорд'))) {
    const chordName = chordMatch[1];
    return {
      text: `📖 Открываю разбор аккорда ${chordName}!`,
      action: { type: 'OPEN_CHORD', payload: { chord: chordName } },
      suggestions: [
        { label: `Play over ${chordName}`, description: 'Set up the fretboard', action: { type: 'OPEN_AUTOTAB', payload: { key: chordName.replace(/[^A-G#b]/g, ''), mode: inferModeFromChord(chordName) } } },
        { label: `Find a backing track for ${chordName}`, description: 'Search a jam track', action: { type: 'SEARCH_BACKING', payload: { query: `${chordName} guitar backing track` } } }
      ],
      links: buildTrackSearchLinks(`${chordName} guitar backing track`),
      tips: ['Ask for “solo over E7” to switch instantly to the solo generator.']
    };
  }

  // ============================================================
  // 8. GENERATE LICK
  // ============================================================
  const isTabIntent = lowerQuery.includes('соло') || lowerQuery.includes('таб') || 
                      lowerQuery.includes('tab') || lowerQuery.includes('lick') || 
                      lowerQuery.includes('фраза') || lowerQuery.includes('рифф') ||
                      lowerQuery.includes('riff') || lowerQuery.includes('generate') || lowerQuery.includes('improv');

  if (isTabIntent) {
    const chord = parseChordLike(query)?.display || 'E';
    const mode = lowerQuery.includes('blues') ? 'blues' : lowerQuery.includes('dorian') ? 'dorian' : lowerQuery.includes('minor') || lowerQuery.includes('минор') ? 'minor' : 'major';
    return {
      text: `🎸 Открываю генератор соло. Сейчас подстрою контекст под ${chord} и ${mode}.`,
      action: { type: 'OPEN_AUTOTAB', payload: { key: chord.replace(/[^A-G#b]/g, '') || 'E', mode } },
      suggestions: [
        { label: 'Show chord ideas', description: 'Switch to chord dictionary', action: { type: 'OPEN_CHORD', payload: { chord } } },
        { label: 'Find a backing track', description: 'Open a jam search', action: { type: 'SEARCH_BACKING', payload: { query: `${chord} guitar backing track` } } }
      ],
      tips: ['Ask for “blues solo in E” or “dorian solo” for a more specific phrase.']
    };
  }

  // ============================================================
  // 9. DEFAULT
  // ============================================================
  return {
    text: '🤖 Привет! Я TouchGrass AI — ваш музыкальный ассистент.\n\n' +
          '🎸 Что я умею:\n' +
          '• Находить минусовки: *«Найди блюз минус в Am»*\n' +
          '• Показывать аккорды: *«Покажи Cmaj7»*\n' +
          '• Подсвечивать лады: *«Как обыграть E7?»*\n' +
          '• Генерировать табы: *«Придумай фразу в Dorian»*',
    suggestions: [
      { label: 'Set tempo to 96 BPM', query: 'Set tempo to 96 BPM' },
      { label: 'Build a blues solo', query: 'Build a blues solo in E' },
      { label: 'Find a backing track in Am', query: 'Find a backing track in Am' }
    ],
    examples: ['Set tempo to 96 BPM', 'Show Cmaj7', 'Build a blues solo in E', 'Find a backing track in Am'],
    links: [
      { label: 'Open the player', href: 'https://www.youtube.com/results?search_query=guitar%20backing%20track', description: 'Jump to a jam search' }
    ]
  };
};

// ============================================================
// 🎸 РЕАЛИСТИЧНЫЙ ГЕНЕРАТОР ФРАЗ ДЛЯ ГИТАРИСТОВ
// ============================================================

export type Technique = 
  | 'none' 
  | 'hammer' 
  | 'pull' 
  | 'slide' 
  | 'vibrato' 
  | 'bend' 
  | 'prebend'
  | 'unison_bend'
  | 'grace'
  | 'fall'
  | 'ghost' 
  | 'choke'
  | 'mute'
  | 'harmonic'
  | 'artificial_harmonic'
  | 'open'
  | 'pick_squeal';

export interface LickNote {
  string: number;
  fret: number | null;
  duration: 'quarter' | 'eighth' | 'sixteenth' | 'dotted_eighth' | 'half' | 'whole';
  isRest?: boolean;
  articulation?: string;
  technique?: Technique;
  tiedToNext?: boolean;
  velocity?: number;
  accent?: boolean;
  graceNote?: { string: number; fret: number };
  bendAmount?: number;
  durationFactor?: number;
  legatoGroup?: number;
  isLegatoEnd?: boolean;
  harmonicType?: 'natural' | 'artificial';
  harmonicNode?: number;
  isPalmMuted?: boolean;
  isOpenString?: boolean;
  pickDirection?: 'down' | 'up';
  stringSqueal?: boolean;
  bar?: number;      // 🔥 Добавлено
  chord?: string;    // 🔥 Добавлено
}

export interface Lick {
  id: string;
  name: string;
  notes: LickNote[];
  tempo?: number;
  swing?: number;
  feel?: 'straight' | 'shuffle' | 'half_time';
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STANDARD_TUNING = ['E', 'B', 'G', 'D', 'A', 'E'];

const findFretForNote = (
  targetNote: string,
  targetStringIdx: number,
  minFret: number = 0,
  maxFret: number = 21,
  preferOpen: boolean = true
): number => {
  const openNote = STANDARD_TUNING[targetStringIdx];
  let baseDistance = (ALL_NOTES.indexOf(targetNote) - ALL_NOTES.indexOf(openNote) + 12) % 12;
  if (preferOpen && baseDistance === 0) return 0;
  let bestFret = baseDistance;
  let bestDistance = Math.abs(baseDistance - 5);
  for (let octave = -1; octave <= 1; octave++) {
    const candidate = baseDistance + octave * 12;
    if (candidate >= minFret && candidate <= maxFret) {
      const dist = Math.abs(candidate - 5);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestFret = candidate;
      }
    }
  }
  return bestFret;
};

interface PhrasePattern {
  name: string;
  intervals: number[];
  durations: LickNote['duration'][];
  techniques: Technique[];
  accentPositions: number[];
  legatoGroups?: { start: number; end: number; type: 'hammer' | 'pull' }[];
  useHarmonics?: number[];
  harmonicTypes?: ('natural' | 'artificial')[];
  useMutes?: number[];
  useOpenStrings?: number[];
  useVibratoEnd?: boolean;
  usePickSqueal?: number[];
  restIndices?: number[];
}

const GUITAR_PHRASES: PhrasePattern[] = [
  {
    name: 'Blues Shuffle with Mute',
    intervals: [0, 3, 5, 3, 0, 5, 7, 3],
    durations: ['eighth', 'eighth', 'quarter', 'eighth', 'eighth', 'eighth', 'eighth', 'quarter'],
    techniques: ['none', 'none', 'vibrato', 'none', 'mute', 'slide', 'none', 'vibrato'],
    accentPositions: [0, 2, 4, 7],
    useMutes: [4, 5],
    useVibratoEnd: true,
    legatoGroups: []
  },
  {
    name: 'Blues Turnaround with Open Strings',
    intervals: [0, 5, 7, 0, 5, 7, 0, 5],
    durations: ['quarter', 'eighth', 'eighth', 'quarter', 'eighth', 'eighth', 'eighth', 'half'],
    techniques: ['open', 'slide', 'vibrato', 'open', 'slide', 'bend', 'open', 'vibrato'],
    accentPositions: [0, 3, 7],
    useOpenStrings: [0, 3, 6],
    useVibratoEnd: true,
    legatoGroups: []
  },
  {
    name: 'Rock Power with Harmonics',
    intervals: [0, 5, 7, 12, 7, 5, 0, 7],
    durations: ['quarter', 'eighth', 'eighth', 'half', 'eighth', 'eighth', 'quarter', 'half'],
    techniques: ['none', 'slide', 'vibrato', 'harmonic', 'pull', 'slide', 'none', 'vibrato'],
    accentPositions: [0, 3, 7],
    useHarmonics: [3],
    harmonicTypes: ['natural'],
    useVibratoEnd: true,
    legatoGroups: [{ start: 1, end: 2, type: 'hammer' }]
  },
  {
    name: 'Heavy Riff with Mutes and Squeal',
    intervals: [0, 5, 7, 5, 0, 7, 5, 3],
    durations: ['eighth', 'eighth', 'quarter', 'eighth', 'eighth', 'eighth', 'eighth', 'half'],
    techniques: ['mute', 'slide', 'vibrato', 'mute', 'mute', 'bend', 'pick_squeal', 'vibrato'],
    accentPositions: [0, 2, 5, 7],
    useMutes: [0, 3, 4],
    usePickSqueal: [6],
    useVibratoEnd: true,
    legatoGroups: []
  },
  {
    name: 'Jazz Legato with Rests',
    intervals: [0, 4, 7, 9, 7, 4, 0, 5],
    durations: ['quarter', 'eighth', 'eighth', 'quarter', 'eighth', 'eighth', 'quarter', 'half'],
    techniques: ['none', 'hammer', 'vibrato', 'pull', 'hammer', 'slide', 'none', 'vibrato'],
    accentPositions: [0, 3, 7],
    restIndices: [2, 5],
    useVibratoEnd: true,
    legatoGroups: [
      { start: 1, end: 2, type: 'hammer' },
      { start: 4, end: 5, type: 'hammer' }
    ]
  },
  {
    name: 'Neo-Soul Open & Harmonics',
    intervals: [0, 4, 7, 12, 7, 4, 0, 7],
    durations: ['quarter', 'eighth', 'quarter', 'half', 'eighth', 'eighth', 'eighth', 'half'],
    techniques: ['open', 'hammer', 'vibrato', 'harmonic', 'pull', 'slide', 'open', 'vibrato'],
    accentPositions: [0, 2, 6],
    useOpenStrings: [0, 6],
    useHarmonics: [3],
    harmonicTypes: ['natural'],
    useVibratoEnd: true,
    legatoGroups: []
  },
  {
    name: 'Fast Muted Run',
    intervals: [0, 2, 4, 5, 7, 5, 4, 2],
    durations: ['sixteenth', 'sixteenth', 'sixteenth', 'sixteenth', 'sixteenth', 'sixteenth', 'sixteenth', 'half'],
    techniques: ['mute', 'hammer', 'mute', 'slide', 'pull', 'mute', 'hammer', 'vibrato'],
    accentPositions: [0, 4, 7],
    useMutes: [0, 2, 5],
    useVibratoEnd: true,
    legatoGroups: [
      { start: 1, end: 2, type: 'hammer' },
      { start: 4, end: 5, type: 'pull' }
    ]
  },
  {
    name: 'Arpeggio with Harmonics & Rests',
    intervals: [0, 4, 7, 12, 7, 4, 0, 5],
    durations: ['quarter', 'eighth', 'dotted_eighth', 'half', 'eighth', 'sixteenth', 'eighth', 'half'],
    techniques: ['none', 'hammer', 'vibrato', 'harmonic', 'pull', 'slide', 'none', 'vibrato'],
    accentPositions: [0, 3, 7],
    useHarmonics: [3],
    harmonicTypes: ['natural'],
    restIndices: [2, 5],
    useVibratoEnd: true,
    legatoGroups: [
      { start: 1, end: 2, type: 'hammer' },
      { start: 4, end: 5, type: 'pull' }
    ]
  }
];

export const generateSmartLick = (
  scaleNotes: string[], 
  keyNote: string, 
  mode: string,
  bpm: number = 120,
  timeSignature: { beats: number; noteValue: number } = { beats: 4, noteValue: 4 },
  bar: number = 0 // 🔥 НОВЫЙ ПАРАМЕТР
): Lick => {
  const safeScaleNotes = (scaleNotes && scaleNotes.length > 0) ? scaleNotes : ['C', 'D', 'E', 'G', 'A'];
  
  // Используем bar для вариативности паттерна
  const patternIndex = (Math.floor(Math.random() * GUITAR_PHRASES.length) + bar) % GUITAR_PHRASES.length;
  const pattern = GUITAR_PHRASES[patternIndex];
  
  const beatsPerBar = timeSignature.beats;
  const MIN_NOTES = 4;
  const MAX_NOTES = 11;
  const minNotes = Math.max(MIN_NOTES, beatsPerBar);
  const maxNotes = Math.min(MAX_NOTES, beatsPerBar * 3);
  const noteCount = Math.floor(Math.random() * (maxNotes - minNotes + 1)) + minNotes;

  const durations: LickNote['duration'][] = [];
  let totalDuration = 0;
  for (let i = 0; i < noteCount; i++) {
    let dur: LickNote['duration'];
    if (i === noteCount - 1) {
      const remaining = beatsPerBar - totalDuration;
      if (remaining >= 1) dur = 'quarter';
      else if (remaining >= 0.5) dur = 'eighth';
      else if (remaining >= 0.25) dur = 'sixteenth';
      else dur = 'eighth';
    } else {
      const r = Math.random();
      if (r < 0.4) dur = 'eighth';
      else if (r < 0.7) dur = 'quarter';
      else dur = 'sixteenth';
    }
    durations.push(dur);
    const durValue = dur === 'quarter' ? 1 : dur === 'eighth' ? 0.5 : 0.25;
    totalDuration += durValue;
    if (totalDuration >= beatsPerBar) {
      if (totalDuration > beatsPerBar) {
        const excess = totalDuration - beatsPerBar;
        const lastDur = durations[durations.length - 1];
        if (lastDur === 'quarter' && excess <= 0.5) durations[durations.length - 1] = 'eighth';
        else if (lastDur === 'eighth' && excess <= 0.25) durations[durations.length - 1] = 'sixteenth';
        totalDuration = beatsPerBar;
      }
      break;
    }
  }
  if (totalDuration < beatsPerBar && durations.length > 0) {
    const lastIdx = durations.length - 1;
    const remaining = beatsPerBar - totalDuration;
    if (remaining >= 0.5 && durations[lastIdx] === 'eighth') durations[lastIdx] = 'quarter';
    else if (remaining >= 0.25 && durations[lastIdx] === 'sixteenth') durations[lastIdx] = 'eighth';
  }

  const startFret = Math.floor(Math.random() * 5) + 3 + (bar % 3); // сдвиг от такта
  let currentString = Math.floor(Math.random() * 3) + 2;
  const degreeOffset = Math.floor(Math.random() * safeScaleNotes.length);

  const notes: LickNote[] = [];
  let legatoGroupId = 0;

  if (Math.random() < 0.3) {
    notes.push({
      string: 0,
      fret: null,
      duration: 'eighth',
      isRest: true
    });
  }

  for (let i = 0; i < durations.length; i++) {
    const degree = pattern.intervals[i % pattern.intervals.length];
    const noteIndex = (degree + degreeOffset) % safeScaleNotes.length;
    const selectedNote = safeScaleNotes[noteIndex];

    let fret: number = 0;
    let string = currentString;
    let isOpen = false;
    let isHarmonic = false;
    let harmonicType: 'natural' | 'artificial' | undefined = undefined;
    let harmonicNode: number | undefined = undefined;
    let isPalmMuted = false;
    let isPickSqueal = false;

    if (pattern.useOpenStrings?.includes(i)) {
      for (let s = 0; s < 6; s++) {
        const openNote = STANDARD_TUNING[s];
        if (openNote === selectedNote) {
          string = s;
          fret = 0;
          isOpen = true;
          break;
        }
      }
      if (!isOpen) {
        fret = findFretForNote(selectedNote, string, 0, 21, false);
      }
    } else {
      fret = findFretForNote(selectedNote, string, 0, 21, true);
      if (fret === 0 && !pattern.useOpenStrings?.includes(i)) {
        isOpen = true;
      }
    }

    if (pattern.useMutes?.includes(i) || (i > 0 && Math.random() < 0.15 && pattern.useMutes?.includes(i-1))) {
      isPalmMuted = true;
    }

    if (pattern.useHarmonics?.includes(i)) {
      const harmonicIdx = pattern.useHarmonics.indexOf(i);
      const hType = pattern.harmonicTypes?.[harmonicIdx] || 'natural';
      isHarmonic = true;
      harmonicType = hType;
      const nodes = [12, 7, 5, 4, 3];
      harmonicNode = nodes[Math.floor(Math.random() * nodes.length)];
      if (hType === 'natural') {
        const nodeFret = harmonicNode;
        if (nodeFret >= 0 && nodeFret <= 21) {
          fret = nodeFret;
        } else {
          isHarmonic = false;
        }
      } else {
        isHarmonic = false;
      }
    }

    if (pattern.usePickSqueal?.includes(i)) {
      isPickSqueal = true;
    }

    if (fret < startFret - 3 || fret > startFret + 5 || fret > 21) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const altString = Math.floor(Math.random() * 4) + 1;
        const altFret = findFretForNote(selectedNote, altString, 0, 21, false);
        if (altFret >= startFret - 2 && altFret <= startFret + 4) {
          string = altString;
          fret = altFret;
          break;
        }
      }
    }

    let technique: Technique = pattern.techniques[i % pattern.techniques.length] || 'none';
    if (technique === 'open' && !isOpen) {
      for (let s = 0; s < 6; s++) {
        if (STANDARD_TUNING[s] === selectedNote) {
          string = s;
          fret = 0;
          isOpen = true;
          break;
        }
      }
      if (!isOpen) technique = 'none';
    }
    if (technique === 'harmonic') {
      isHarmonic = true;
      if (!harmonicType) harmonicType = 'natural';
    }
    if (technique === 'mute') {
      isPalmMuted = true;
    }
    if (technique === 'pick_squeal') {
      isPickSqueal = true;
    }

    let isLegatoEnd = false;
    let legatoGroup = undefined;
    if (pattern.legatoGroups) {
      for (const group of pattern.legatoGroups) {
        if (i >= group.start && i <= group.end) {
          legatoGroup = group;
          if (i === group.start) technique = 'none';
          else technique = group.type;
          if (i === group.end) isLegatoEnd = true;
          break;
        }
      }
    }

    const isAccent = pattern.accentPositions.includes(i % pattern.accentPositions.length);
    let velocity = isAccent ? 0.7 + Math.random() * 0.3 : 0.4 + Math.random() * 0.3;
    if (isPalmMuted) velocity *= 0.6;
    if (isHarmonic) velocity *= 0.8;
    if (technique === 'hammer' || technique === 'pull') velocity *= 0.7;

    const duration = durations[i];

    const tiedToNext = (i < durations.length - 1 && 
                        Math.random() < 0.1 && 
                        notes.length > 0 && 
                        notes[notes.length - 1]?.string === string);

    notes.push({
      string,
      fret: Math.max(0, Math.min(24, fret)),
      duration,
      technique: technique !== 'open' && technique !== 'harmonic' && technique !== 'mute' && technique !== 'pick_squeal' 
                  ? technique 
                  : (technique === 'open' ? 'none' : technique),
      tiedToNext,
      velocity,
      accent: isAccent,
      durationFactor: 0.9 + Math.random() * 0.2,
      legatoGroup: legatoGroup ? legatoGroupId : undefined,
      isLegatoEnd,
      isPalmMuted,
      isOpenString: isOpen,
      harmonicType: isHarmonic ? harmonicType : undefined,
      harmonicNode: isHarmonic ? harmonicNode : undefined,
      stringSqueal: isPickSqueal,
      pickDirection: Math.random() > 0.5 ? 'down' : 'up',
    });

    if (legatoGroup && i === legatoGroup.end) legatoGroupId++;

    if (pattern.restIndices?.includes(i) && !(i === durations.length - 1 && pattern.useVibratoEnd)) {
      notes.push({
        string: 0,
        fret: null,
        duration: Math.random() > 0.5 ? 'eighth' : 'sixteenth',
        isRest: true
      });
    }

    if (i < durations.length - 1 && Math.random() < 0.25) {
      const newString = Math.max(0, Math.min(5, string + (Math.random() > 0.5 ? 1 : -1)));
      if (newString !== string && newString >= 0 && newString <= 5) {
        string = newString;
      }
    }
    currentString = string;
  }

  if (pattern.useVibratoEnd && notes.length > 0) {
    const lastIdx = notes.length - 1;
    const lastNote = notes[lastIdx];
    if (!lastNote.isRest) {
      lastNote.technique = 'vibrato';
      lastNote.duration = 'half';
    }
  }

  if (Math.random() < 0.3) {
    notes.push({
      string: 0,
      fret: null,
      duration: Math.random() > 0.5 ? 'quarter' : 'half',
      isRest: true
    });
  }

  const modeName = mode.replace(/_/g, ' ');
  const feel = Math.random() > 0.5 ? 'Swing' : 'Straight';
  
  const techCounts = notes.reduce((acc, n) => {
    if (n.technique && n.technique !== 'none') {
      acc[n.technique] = (acc[n.technique] || 0) + 1;
    }
    if (n.isPalmMuted) acc.mute = (acc.mute || 0) + 1;
    if (n.harmonicType) acc.harmonic = (acc.harmonic || 0) + 1;
    if (n.isOpenString) acc.open = (acc.open || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const techSummary = Object.keys(techCounts).length > 0 
    ? ` (${Object.entries(techCounts).map(([k,v]) => `${k}:${v}`).join(', ')})` 
    : '';

  return {
    id: `lick-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: `${feel} ${keyNote} ${modeName} Phrase${techSummary}`,
    notes,
    tempo: bpm,
    swing: Math.random() * 0.3 + 0.1,
    feel: Math.random() > 0.5 ? 'shuffle' : 'straight'
  };
};