// src/utils/drumPatterns.ts

export interface DrumPattern {
  kick: number[];
  snare: number[];
  hihat: number[];
  ride?: number[];
  crash?: number[];
  tom?: number[];
  name: string;
  description: string;
  tempoRange?: { min: number; max: number };
  complexity?: 1 | 2 | 3 | 4 | 5;
  isRandom?: boolean;
}

// Существующие паттерны остаются...
export const DrumPatterns: Record<string, DrumPattern> = {
  ROCK: {
    kick: [1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1],
    name: 'Rock',
    description: 'Classic rock beat with accents on 2 and 4',
    tempoRange: { min: 80, max: 160 },
    complexity: 2
  },

  // ===== РОК ВАРИАЦИИ =====
  ROCK_RIDE: {
    kick: [1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0],
    hihat: [0, 0, 0, 0, 0, 0, 0, 0],
    ride: [1, 1, 1, 1, 1, 1, 1, 1],
    crash: [1, 0, 0, 0, 0, 0, 0, 0],
    name: 'Rock Ride',
    description: 'Rock with ride cymbal for brighter sound',
    tempoRange: { min: 80, max: 160 },
    complexity: 2
  },

  ROCK_TOMS: {
    kick: [1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1],
    tom: [0, 0, 0, 0, 0, 0, 0, 1],
    crash: [1, 0, 0, 0, 0, 0, 0, 0],
    name: 'Rock Toms',
    description: 'Rock with tom fill on last beat',
    tempoRange: { min: 80, max: 160 },
    complexity: 3
  },

  // ===== ФАНК =====
  FUNK: {
    kick: [1, 0, 0, 1, 0, 1, 0, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0],
    hihat: [0, 1, 0, 1, 0, 1, 0, 1],
    name: 'Funk',
    description: 'Funk groove with ghost notes on snare',
    tempoRange: { min: 90, max: 130 },
    complexity: 3
  },

  FUNK_OPEN_HIHAT: {
    kick: [1, 0, 0, 1, 0, 1, 0, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0],
    hihat: [1, 1, 1, 0, 1, 1, 1, 0],
    ride: [0, 0, 0, 1, 0, 0, 0, 1],
    name: 'Funk Open Hi-Hat',
    description: 'Funk with open hi-hat on off-beats',
    tempoRange: { min: 90, max: 130 },
    complexity: 3
  },

  // ===== ДЖАЗ =====
  JAZZ_RIDE: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [0, 0, 0, 0, 0, 0, 0, 0],
    ride: [1, 0, 1, 0, 1, 0, 1, 0],
    crash: [0, 0, 0, 0, 0, 0, 0, 0],
    name: 'Jazz Ride',
    description: 'Classic jazz ride pattern with light kick',
    tempoRange: { min: 100, max: 200 },
    complexity: 3
  },

  JAZZ_BRUSHES: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1],
    ride: [0, 0, 0, 0, 0, 0, 0, 0],
    name: 'Jazz Brushes',
    description: 'Jazz with brushes on snare (simulated with hihat)',
    tempoRange: { min: 100, max: 200 },
    complexity: 2
  },

  // ===== ЛАТИНА =====
  LATIN_CLAVE: {
    kick: [1, 0, 0, 0, 0, 0, 1, 0],
    snare: [0, 0, 0, 1, 0, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0],
    ride: [0, 1, 0, 0, 1, 0, 0, 1],
    name: 'Latin Clave',
    description: 'Latin groove with clave rhythm',
    tempoRange: { min: 100, max: 160 },
    complexity: 4
  },

  // ===== ПРОГРЕССИВ =====
  PROG_COMPLEX: {
    kick: [1, 0, 1, 0, 0, 1, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 1],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1],
    tom: [0, 0, 0, 1, 0, 0, 1, 0],
    crash: [1, 0, 0, 0, 0, 0, 0, 0],
    name: 'Prog Rock',
    description: 'Progressive rock with complex fills',
    tempoRange: { min: 100, max: 150 },
    complexity: 4
  },

  // ===== БАЛЛАДА =====
  BALLAD: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [0, 0, 0, 0, 0, 0, 0, 0],
    ride: [1, 0, 1, 0, 1, 0, 1, 0],
    crash: [1, 0, 0, 0, 0, 0, 0, 0],
    name: 'Ballad',
    description: 'Slow ballad with ride cymbal',
    tempoRange: { min: 50, max: 80 },
    complexity: 2
  },

  // ===== ДЖЕМ / ИМПРОВ =====
  JAM_16TH: {
    kick: [1, 0, 0, 0, 0, 1, 0, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1],
    ride: [0, 0, 0, 0, 0, 0, 0, 0],
    tom: [0, 0, 0, 0, 0, 0, 0, 1],
    name: 'Jam 16th',
    description: 'Jam groove with 16th note hihat and tom fill',
    tempoRange: { min: 90, max: 140 },
    complexity: 3
  },

};

// ============================================
// 🎲 ГЕНЕРАТОР СЛУЧАЙНЫХ ПАТТЕРНОВ
// ============================================

export interface RandomPatternOptions {
  length?: 8 | 16 | 32;  // Длина паттерна в шагах
  density?: 'sparse' | 'medium' | 'dense';  // Плотность
  style?: 'rock' | 'funk' | 'jazz' | 'electronic' | 'experimental';
  swing?: number;  // 0-1, смещение для свинга
  complexity?: 1 | 2 | 3 | 4 | 5;
}

export class PatternGenerator {
  /**
   * Генерирует случайный паттерн с заданными параметрами
   */
  static generateRandom(options: RandomPatternOptions = {}): DrumPattern {
    const {
      length = 16,
      density = 'medium',
      style = 'rock',
      swing = 0,
      complexity = 3
    } = options;

    // Базовые настройки плотности
    const densityMap = {
      sparse: { kick: 0.2, snare: 0.15, hihat: 0.3, extra: 0.1 },
      medium: { kick: 0.35, snare: 0.25, hihat: 0.5, extra: 0.2 },
      dense: { kick: 0.5, snare: 0.4, hihat: 0.7, extra: 0.3 }
    };

    const d = densityMap[density];

    // Генерируем паттерны
    let kick = this.generatePattern(length, d.kick, style, 'kick');
    let snare = this.generatePattern(length, d.snare, style, 'snare');
    let hihat = this.generatePattern(length, d.hihat, style, 'hihat');
    let ride: number[] | undefined;
    let crash: number[] | undefined;
    let tom: number[] | undefined;

    // Добавляем дополнительные элементы в зависимости от сложности
    if (complexity >= 4) {
      ride = this.generatePattern(length, 0.3, style, 'ride');
    }
    if (complexity >= 5) {
      crash = this.generatePattern(length, 0.1, style, 'crash');
      tom = this.generatePattern(length, 0.2, style, 'tom');
    }

    // Применяем свинг
    if (swing > 0) {
      kick = this.applySwing(kick, swing);
      snare = this.applySwing(snare, swing);
      hihat = this.applySwing(hihat, swing);
      if (ride) ride = this.applySwing(ride, swing);
      if (crash) crash = this.applySwing(crash, swing);
      if (tom) tom = this.applySwing(tom, swing);
    }

    // Генерируем имя и описание
    const styleNames: Record<string, string> = {
      rock: 'Rock',
      funk: 'Funk',
      jazz: 'Jazz',
      electronic: 'Electronic',
      experimental: 'Experimental'
    };

    const densityNames = {
      sparse: 'Sparse',
      medium: 'Medium',
      dense: 'Dense'
    };

    const complexityStars = '★'.repeat(Math.min(complexity, 5));

    return {
      kick,
      snare,
      hihat,
      ride,
      crash,
      tom,
      name: `Random ${styleNames[style] || 'Style'} ${densityNames[density]}`,
      description: `Generated ${style} pattern • ${density} density • ${complexityStars}`,
      complexity: complexity as any,
      isRandom: true
    };
  }

  /**
   * Генерирует один барабанный трек
   */
  private static generatePattern(
    length: number,
    density: number,
    style: string,
    type: string
  ): number[] {
    const pattern: number[] = [];

    for (let i = 0; i < length; i++) {
      let value = 0;

      // Базовые правила для разных стилей
      switch (style) {
        case 'rock':
          // Типичный рок-паттерн
          if (type === 'kick' && (i % 4 === 0 || i % 4 === 2)) {
            value = Math.random() < 0.8 ? 1 : 0;
          } else if (type === 'snare' && (i % 4 === 1 || i % 4 === 3)) {
            value = Math.random() < 0.9 ? 1 : 0;
          } else if (type === 'hihat') {
            value = Math.random() < 0.7 ? 1 : 0;
          } else {
            value = Math.random() < density * 0.5 ? 1 : 0;
          }
          break;

        case 'funk':
          // Фанк - больше синкоп
          if (type === 'kick') {
            // Акценты на 1 и "и" 2 и 3
            const syncPoints = [0, 2, 4, 6, 8, 10, 12, 14];
            if (syncPoints.includes(i % 16)) {
              value = Math.random() < 0.7 ? 1 : 0;
            } else {
              value = Math.random() < density * 0.6 ? 1 : 0;
            }
          } else if (type === 'snare') {
            value = (i % 4 === 1 || i % 4 === 3) && Math.random() < 0.8 ? 1 : 0;
          } else {
            value = Math.random() < density * 0.8 ? 1 : 0;
          }
          break;

        case 'jazz':
          // Джаз - более разреженный, свинг
          if (type === 'ride') {
            value = i % 2 === 0 ? 1 : 0;
          } else if (type === 'kick') {
            value = (i % 4 === 0 || i % 4 === 2) && Math.random() < 0.6 ? 1 : 0;
          } else {
            value = Math.random() < density * 0.4 ? 1 : 0;
          }
          break;

        case 'electronic':
          // Электро - ровные 16-е
          if (type === 'kick') {
            value = (i % 4 === 0 || i % 4 === 2) && Math.random() < 0.9 ? 1 : 0;
          } else if (type === 'hihat') {
            value = Math.random() < 0.9 ? 1 : 0;
          } else {
            value = Math.random() < density * 0.7 ? 1 : 0;
          }
          break;

        default: // experimental
          // Экспериментальный - полный рандом
          value = Math.random() < density ? 1 : 0;
          break;
      }

      pattern.push(value);
    }

    return pattern;
  }

  /**
   * Применяет свинг к паттерну
   */
  private static applySwing(pattern: number[], swing: number): number[] {
    if (swing === 0) return pattern;

    const result = [...pattern];
    const step = pattern.length / 4;

    for (let i = 0; i < pattern.length; i++) {
      // Сдвигаем каждый второй удар
      if (i % step >= step / 2 && i % step < step / 2 + 1) {
        const shift = Math.round(swing * 0.5);
        if (i + shift < pattern.length && pattern[i] === 1) {
          result[i] = 0;
          result[i + shift] = 1;
        }
      }
    }

    return result;
  }

  /**
   * Генерирует несколько случайных паттернов
   */
  static generateMultiple(count: number = 5): DrumPattern[] {
    const patterns: DrumPattern[] = [];
    const styles: ('rock' | 'funk' | 'jazz' | 'electronic' | 'experimental')[] = 
      ['rock', 'funk', 'jazz', 'electronic', 'experimental'];
    const densities: ('sparse' | 'medium' | 'dense')[] = ['sparse', 'medium', 'dense'];

    for (let i = 0; i < count; i++) {
      const style = styles[Math.floor(Math.random() * styles.length)];
      const density = densities[Math.floor(Math.random() * densities.length)];
      const complexity = Math.floor(Math.random() * 5) + 1 as 1 | 2 | 3 | 4 | 5;
      const length = Math.random() > 0.5 ? 16 : 8;
      const swing = Math.random() * 0.3;

      const pattern = this.generateRandom({
        length: length as 8 | 16,
        density,
        style,
        swing,
        complexity
      });

      patterns.push(pattern);
    }

    return patterns;
  }

  /**
   * Мутирует существующий паттерн (создает вариацию)
   */
  static mutate(pattern: DrumPattern, mutationRate: number = 0.1): DrumPattern {
    const mutateArray = (arr: number[]): number[] => {
      return arr.map(val => {
        if (Math.random() < mutationRate) {
          return val === 1 ? 0 : 1;
        }
        return val;
      });
    };

    return {
      ...pattern,
      kick: mutateArray(pattern.kick),
      snare: mutateArray(pattern.snare),
      hihat: mutateArray(pattern.hihat),
      ride: pattern.ride ? mutateArray(pattern.ride) : undefined,
      crash: pattern.crash ? mutateArray(pattern.crash) : undefined,
      tom: pattern.tom ? mutateArray(pattern.tom) : undefined,
      name: `Mutated ${pattern.name}`,
      description: `Variation of ${pattern.name}`,
      isRandom: true
    };
  }
}

// ============================================
// 🎲 ХЕЛПЕРЫ ДЛЯ РАБОТЫ СО СЛУЧАЙНЫМИ ПАТТЕРНАМИ
// ============================================

export const getRandomPattern = (options?: RandomPatternOptions): DrumPattern => {
  return PatternGenerator.generateRandom(options);
};

export const getRandomPatterns = (count: number = 5): DrumPattern[] => {
  return PatternGenerator.generateMultiple(count);
};

export const mutatePattern = (pattern: DrumPattern, mutationRate?: number): DrumPattern => {
  return PatternGenerator.mutate(pattern, mutationRate);
};

export const addRandomPatternsToLibrary = (count: number = 3): Record<string, DrumPattern> => {
  const randomPatterns: Record<string, DrumPattern> = {};
  const patterns = getRandomPatterns(count);
  
  patterns.forEach((pattern, index) => {
    const name = `RANDOM_${index + 1}`;
    randomPatterns[name] = pattern;
  });
  
  return randomPatterns;
};