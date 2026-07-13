// src/data/practice_module.ts

export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  category: 'chords' | 'scales' | 'rhythm' | 'technique' | 'improvisation' | 'ear_training';
  prerequisites?: string[];
  content: {
    type: 'video' | 'tab' | 'chord_diagram' | 'rhythm_pattern' | 'audio' | 'text' | 'interactive';
    data: any;
  };
  estimatedTime: string;
  tags: string[];
  goal: string;
  theory?: string;
  fingerPosition?: string;
  tips?: string[];
  chords?: string[];           // Для уроков с аккордами
  tabData?: {                  // Для уроков с табами
    notes: Array<{ string: number; fret: number; duration: string; technique?: string }>;
    key?: string;
    mode?: string;
  };
  audioExample?: string;
  practiceSteps?: string[];
  displayType?: 'chords' | 'tab' | 'both'; // 🔥 НОВОЕ: что показывать в модалке
}

export interface PracticePlan {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  exercises: Exercise[];
  schedule: {
    day: number;
    exercises: string[];
    focus: string;
  }[];
  totalWeeks: number;
}

export interface UserProgress {
  completedExercises: string[];
  currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  practiceStreak: number;
  lastPracticeDate: string;
  skillLevels: {
    chords: number;
    scales: number;
    rhythm: number;
    technique: number;
    improvisation: number;
    ear_training: number;
  };
}

// ============================================================
// 🔥 ОБНОВЛЕННЫЕ УРОКИ С КОНТЕНТОМ
// ============================================================

const EXERCISES: Exercise[] = [
  // ============================================================
  // УРОК 1: ОТКРЫТЫЕ АККОРДЫ
  // ============================================================
  {
    id: 'open_chords',
    title: '🎸 Урок 1: Открытые аккорды (C, G, D, A, E)',
    description: 'Освой 5 основных открытых аккордов. Эти аккорды — фундамент всей гитарной музыки.',
    difficulty: 'beginner',
    category: 'chords',
    content: { 
      type: 'interactive', 
      data: {
        chords: [
          { name: 'C', frets: ['x', 3, 2, 0, 1, 0], baseFret: 1 },
          { name: 'G', frets: [3, 2, 0, 0, 0, 3], baseFret: 1 },
          { name: 'D', frets: ['x', 'x', 0, 2, 3, 2], baseFret: 1 },
          { name: 'A', frets: ['x', 0, 2, 2, 2, 0], baseFret: 1 },
          { name: 'E', frets: [0, 2, 2, 1, 0, 0], baseFret: 1 }
        ]
      }
    },
    estimatedTime: '15 min',
    tags: ['chords', 'open', 'beginner', 'lesson1'],
    goal: 'Играть 5 открытых аккордов чисто и без задержек',
    theory: 'Открытые аккорды — это аккорды, в которых используются открытые (незажатые) струны. Они звучат ярко и полно. Это первые аккорды, которые осваивает каждый гитарист.',
    fingerPosition: 'Пальцы нумеруются: 1 — указательный, 2 — средний, 3 — безымянный, 4 — мизинец.\n\nC: 3-й палец на 3-м ладу 5-й струны, 2-й на 2-м ладу 4-й струны, 1-й на 1-м ладу 2-й струны.\nG: 2-й на 3-м ладу 6-й струны, 1-й на 2-м ладу 5-й струны, 3-й на 3-м ладу 1-й струны.\nD: 1-й на 2-м ладу 3-й струны, 3-й на 3-м ладу 2-й струны, 2-й на 2-м ладу 1-й струны.\nA: 1-й на 2-м ладу 4-й струны, 2-й на 2-м ладу 3-й струны, 3-й на 2-м ладу 2-й струны.\nE: 2-й на 2-м ладу 5-й струны, 3-й на 2-м ладу 4-й струны, 1-й на 1-м ладу 3-й струны.',
    tips: [
      'Нажимай струны кончиками пальцев, близко к ладовому порожку.',
      'Следи, чтобы пальцы не касались соседних струн (глушили их).'
    ],
    chords: ['C', 'G', 'D', 'A', 'E'],
    audioExample: 'C-G-D-A-E прогрессия в 4/4',
    practiceSteps: [
      '1. Поставь аккорд C. Проверь каждую струну (кроме 6-й) — все должны звучать.',
      '2. Поставь аккорд G. Проверь все струны.',
      '3. Переключайся между C и G. Считай: 1-2-3-4, на каждый счет — удар по струнам.'
    ],
    displayType: 'chords' // 🔥 Показываем аккорды
  },

  // ============================================================
  // УРОК 2: БЫСТРЫЕ ПЕРЕКЛЮЧЕНИЯ
  // ============================================================
  {
    id: 'chord_changes',
    title: '⚡ Урок 2: Быстрые переключения аккордов',
    description: 'Научись переключаться между открытыми аккордами без задержек.',
    difficulty: 'beginner',
    category: 'chords',
    prerequisites: ['open_chords'],
    content: { 
      type: 'rhythm_pattern', 
      data: {
        pattern: '↓ ↓↓ ↓↓ ↓',
        chords: ['C', 'G', 'Am', 'F']
      }
    },
    estimatedTime: '15 min',
    tags: ['chords', 'rhythm', 'beginner', 'lesson2'],
    goal: 'Переключаться между аккордами за 1 секунду',
    theory: 'Быстрое переключение аккордов — ключевой навык ритм-гитариста. Секрет в том, чтобы пальцы двигались одновременно, а не по очереди.',
    fingerPosition: 'Используй "якорные" пальцы — те, которые остаются на тех же струнах при смене аккорда.\n\nC → G: средний палец (2) остается на 2-м ладу 4-й струны.\nC → Am: безымянный (3) остается на 2-м ладу 4-й струны.',
    tips: [
      'Сначала двигайся медленно, но осознанно.',
      'Используй общие пальцы между аккордами (якорные пальцы).'
    ],
    chords: ['C', 'G', 'Am', 'F'],
    audioExample: 'C-G-Am-F прогрессия в ритме 4/4',
    practiceSteps: [
      '1. Тренируй C → G: поставь C, затем G. Повтори 20 раз.',
      '2. Тренируй G → D: поставь G, затем D. Повтори 20 раз.'
    ],
    displayType: 'chords'
  },

  // ============================================================
  // УРОК 3: ПЕНТАТОНИКА (ТАБЫ)
  // ============================================================
  {
    id: 'pentatonic_box1',
    title: '🎵 Урок 3: Пентатоника Box 1',
    description: 'Первая форма пентатоники — самая популярная позиция для соло на гитаре.',
    difficulty: 'beginner',
    category: 'scales',
    content: { 
      type: 'tab', 
      data: {
        scale: 'Am Pentatonic Box 1',
        tab: 'E|-----------------5-8-|\nB|---------------5-8---|\nG|-------------5-7-----|\nD|-----------5-7-------|\nA|---------5-7---------|\nE|-------5-8-----------|',
        notes: ['A', 'C', 'D', 'E', 'G']
      }
    },
    estimatedTime: '15 min',
    tags: ['scales', 'pentatonic', 'beginner', 'lesson3'],
    goal: 'Играть пентатонику Box 1 вверх и вниз',
    theory: 'Пентатоника — гамма из 5 нот. Минорная пентатоника: 1-b3-4-5-b7.',
    fingerPosition: 'Box 1 начинается с 5-го лада (A минор)',
    tips: [
      'Играй гамму медленно, кончиками пальцев.',
      'Чередуй удары медиатора: вниз-вверх-вниз-вверх.'
    ],
    audioExample: 'Am pentatonic Box 1 — вверх и вниз',
    practiceSteps: [
      '1. Сыграй гамму вверх от 6-й струны к 1-й.',
      '2. Сыграй гамму вниз от 1-й струны к 6-й.'
    ],
    displayType: 'tab',
    tabData: {
      notes: [
        { string: 5, fret: 5, duration: 'eighth' },
        { string: 5, fret: 8, duration: 'eighth' },
        { string: 4, fret: 5, duration: 'eighth' },
        { string: 4, fret: 7, duration: 'eighth' },
        { string: 3, fret: 5, duration: 'eighth' },
        { string: 3, fret: 7, duration: 'eighth' },
        { string: 2, fret: 5, duration: 'eighth' },
        { string: 2, fret: 8, duration: 'eighth' },
        { string: 1, fret: 5, duration: 'eighth' },
        { string: 1, fret: 8, duration: 'eighth' }
      ],
      key: 'A',
      mode: 'minor'
    }
  },

  // ============================================================
  // УРОК 4: БЛЮЗОВАЯ ГАММА (ТАБЫ)
  // ============================================================
  {
    id: 'blues_scale',
    title: '🎸 Урок 4: Блюзовая гамма',
    description: 'Добавь блюзовую ноту (b5) в пентатонику — получишь характерный блюзовый звук.',
    difficulty: 'intermediate',
    category: 'scales',
    prerequisites: ['pentatonic_box1'],
    content: { 
      type: 'tab', 
      data: {
        scale: 'A Blues Scale',
        tab: 'A-C-D-Eb-E-G',
        positions: 'Box 1 с добавлением Eb на 6-й ладу 5-й струны'
      }
    },
    estimatedTime: '15 min',
    tags: ['scales', 'blues', 'intermediate', 'lesson4'],
    goal: 'Использовать блюзовую ноту в импровизации',
    theory: 'Блюзовая гамма = минорная пентатоника + b5 ступень (синяя нота).',
    fingerPosition: 'В Box 1 добавляется Eb (6-й лад на 5-й струне) между D (5 лад) и E (7 лад).',
    tips: [
      'Блюзовая нота — это "грязная" нота. Она не должна звучать чисто, она создает напряжение.',
      'Используй блюзовую ноту как проходящую, не задерживайся на ней надолго.'
    ],
    audioExample: 'A blues scale с блюзовыми бендами',
    practiceSteps: [
      '1. Сыграй пентатонику Box 1, добавь Eb на 6-м ладу 5-й струны.',
      '2. Сыграй блюзовую гамму вверх и вниз.'
    ],
    displayType: 'tab',
    tabData: {
      notes: [
        { string: 5, fret: 5, duration: 'eighth' },
        { string: 5, fret: 6, duration: 'eighth', technique: 'bend' },
        { string: 5, fret: 7, duration: 'eighth' },
        { string: 4, fret: 5, duration: 'eighth' },
        { string: 4, fret: 7, duration: 'eighth' },
        { string: 3, fret: 5, duration: 'eighth' },
        { string: 3, fret: 7, duration: 'eighth' }
      ],
      key: 'A',
      mode: 'blues'
    }
  },

  // ============================================================
  // УРОК 5: ЛЕГАТО (ТАБЫ)
  // ============================================================
  {
    id: 'hammer_pull',
    title: '🔥 Урок 5: Легато (Hammer-on & Pull-off)',
    description: 'Освой технику легато — связную игру без щипка правой руки.',
    difficulty: 'intermediate',
    category: 'technique',
    prerequisites: ['pentatonic_box1'],
    content: { 
      type: 'interactive', 
      data: {
        techniques: ['Hammer-on', 'Pull-off'],
        examples: [
          { technique: 'hammer', from: 5, to: 7, string: 4 },
          { technique: 'pull', from: 7, to: 5, string: 4 }
        ]
      }
    },
    estimatedTime: '15 min',
    tags: ['technique', 'legato', 'intermediate', 'lesson5'],
    goal: 'Исполнять легато на любой позиции',
    theory: 'Легато — это игра связно, без пауз между нотами.',
    fingerPosition: 'Hammer-on: сыграй ноту правой рукой → ударь левой по следующему ладу.\nPull-off: зажми две ноты → сыграй нижнюю → срывая палец, извлеки верхнюю.',
    tips: [
      'Для хаммера ударь пальцем с силой и точностью.',
      'Для пулла — резкий срыв пальца вниз (в сторону струны).'
    ],
    audioExample: 'Legato runs on pentatonic Box 1',
    practiceSteps: [
      '1. Тренируй hammer-on: 5-7 на 4-й струне. Повтори 20 раз.',
      '2. Тренируй pull-off: 7-5 на 4-й струне. Повтори 20 раз.'
    ],
    displayType: 'tab',
    tabData: {
      notes: [
        { string: 3, fret: 5, duration: 'eighth' },
        { string: 3, fret: 7, duration: 'eighth', technique: 'hammer' },
        { string: 3, fret: 5, duration: 'eighth', technique: 'pull' },
        { string: 3, fret: 7, duration: 'eighth', technique: 'hammer' },
        { string: 3, fret: 5, duration: 'eighth', technique: 'pull' }
      ],
      key: 'A',
      mode: 'minor'
    }
  }
];

// ============================================================
// ПЛАНЫ ТРЕНИРОВОК
// ============================================================

export const PRACTICE_PLANS: PracticePlan[] = [
  {
    id: 'beginner_plan',
    name: '🎸 Начинающий гитарист',
    level: 'beginner',
    exercises: EXERCISES.filter(e => e.difficulty === 'beginner'),
    schedule: [
      { day: 1, exercises: ['open_chords'], focus: '🎸 Открытые аккорды' },
      { day: 2, exercises: ['chord_changes'], focus: '⚡ Быстрые переключения' },
      { day: 3, exercises: ['pentatonic_box1'], focus: '🎵 Пентатоника' },
      { day: 4, exercises: ['open_chords', 'chord_changes'], focus: '🔄 Повтор' },
      { day: 5, exercises: ['pentatonic_box1', 'chord_changes'], focus: '🎯 Комбинирование' }
    ],
    totalWeeks: 2
  },
  {
    id: 'intermediate_plan',
    name: '🔥 Средний уровень',
    level: 'intermediate',
    exercises: EXERCISES.filter(e => e.difficulty === 'intermediate'),
    schedule: [
      { day: 1, exercises: ['blues_scale'], focus: '🎸 Блюзовая гамма' },
      { day: 2, exercises: ['hammer_pull'], focus: '🔥 Легато' },
      { day: 3, exercises: ['blues_scale', 'hammer_pull'], focus: '🔄 Повтор' }
    ],
    totalWeeks: 3
  }
];

// ============================================================
// ХЕЛПЕРЫ (без изменений)
// ============================================================

export const getUserProgress = (): UserProgress => {
  return {
    completedExercises: [],
    currentLevel: 'beginner',
    practiceStreak: 0,
    lastPracticeDate: new Date().toISOString().split('T')[0],
    skillLevels: {
      chords: 0,
      scales: 0,
      rhythm: 0,
      technique: 0,
      improvisation: 0,
      ear_training: 0
    }
  };
};

export const getNextExercise = (progress: UserProgress, plan: PracticePlan): Exercise | null => {
  const completed = progress.completedExercises;
  const available = plan.exercises.filter((e: Exercise) => !completed.includes(e.id));
  
  const ready = available.filter((e: Exercise) => {
    if (!e.prerequisites) return true;
    return e.prerequisites.every((p: string) => completed.includes(p));
  });
  
  return ready.length > 0 ? ready[0] : null;
};

export const updateProgress = (progress: UserProgress, exerciseId: string): UserProgress => {
  const updated = { ...progress };
  
  if (!updated.completedExercises.includes(exerciseId)) {
    updated.completedExercises.push(exerciseId);
    
    const totalExercises = PRACTICE_PLANS.flatMap((p: PracticePlan) => p.exercises).length;
    const completionRate = updated.completedExercises.length / totalExercises;
    
    if (completionRate > 0.7) updated.currentLevel = 'pro';
    else if (completionRate > 0.5) updated.currentLevel = 'advanced';
    else if (completionRate > 0.3) updated.currentLevel = 'intermediate';
    else updated.currentLevel = 'beginner';
    
    const exercise = EXERCISES.find((e: Exercise) => e.id === exerciseId);
    if (exercise) {
      const skill = exercise.category;
      const increase = exercise.difficulty === 'beginner' ? 5 :
                      exercise.difficulty === 'intermediate' ? 8 :
                      exercise.difficulty === 'advanced' ? 12 : 15;
      
      updated.skillLevels = {
        ...updated.skillLevels,
        [skill]: Math.min(100, (updated.skillLevels[skill as keyof UserProgress['skillLevels']] || 0) + increase)
      };
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (updated.lastPracticeDate === today) {
      // Already practiced today
    } else if (updated.lastPracticeDate === getYesterday()) {
      updated.practiceStreak += 1;
    } else {
      updated.practiceStreak = 1;
    }
    updated.lastPracticeDate = today;
  }
  
  return updated;
};

const getYesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};