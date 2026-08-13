import { existsSync, mkdirSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculatePitchShift } from './src/utils/chordMath.ts';
import { buildRppContent } from './src/utils/rppBuilder.ts';
import { ensureMidiFilesExist } from './src/utils/midiGenerator.ts';
import type { Blueprint, Track } from './src/services/aiGenerator.ts';

// ---------- Конфигурация (через env, с фоллбеками) ----------

const ROOT_DIR = process.cwd();
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || path.join(ROOT_DIR, 'output'));
const BLUEPRINT_PATH = path.resolve(process.env.BLUEPRINT_PATH || path.join(ROOT_DIR, 'blueprint.json'));
const PROJECT_BASE_KEY = process.env.PROJECT_BASE_KEY || 'C';

// ---------- Типы ----------

export interface ProcessedTrack extends Track {
  transpose: number;
}

export interface FactoryResult {
  filePath: string;
  tracks: ProcessedTrack[];
}

// ---------- Основная функция ----------

export async function runFactory(): Promise<FactoryResult> {
  // 1. Создаём папку output (синхронно — однократно при старте, до асинхронных операций)
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Создана папка: ${OUTPUT_DIR}`);
  }

  // 2. Читаем blueprint.json
  let blueprintRaw: string;
  try {
    blueprintRaw = await fs.readFile(BLUEPRINT_PATH, 'utf-8');
  } catch {
    throw new Error(`Файл не найден: ${BLUEPRINT_PATH}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(blueprintRaw);
  } catch {
    throw new Error(`Ошибка парсинга ${BLUEPRINT_PATH}: невалидный JSON.`);
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as Record<string, unknown>).tracks)
  ) {
    throw new Error('Неверная структура blueprint: ожидается объект с полем "tracks" (массив).');
  }

  const { tracks } = parsed as Blueprint;

  if (tracks.length === 0) {
    throw new Error('Blueprint пуст: массив tracks не содержит треков.');
  }

  // Проверяем, что каждый трек имеет обязательные поля
  tracks.forEach((track, index) => {
    const label = `Трек ${index + 1}`;
    if (!track.instrument) throw new Error(`${label}: отсутствует поле "instrument".`);
    if (!track.midiFile) throw new Error(`${label}: отсутствует поле "midiFile".`);
    if (typeof track.position !== 'number' || track.position < 0) {
      throw new Error(`${label}: невалидное поле "position".`);
    }
    if (typeof track.length !== 'number' || track.length <= 0) {
      throw new Error(`${label}: невалидное поле "length".`);
    }
  });

  console.log('🏭 FretLab Factory запущена. Анализ треков...');

  // 3. Генерируем недостающие MIDI-файлы
  await ensureMidiFilesExist(tracks);

  // 4. Вычисляем питч-шифт для каждого трека
  const processedTracks: ProcessedTrack[] = tracks.map((track) => {
    let pitchShift = 0;

    if (track.instrument !== 'Drums' && track.chord) {
      pitchShift = calculatePitchShift(PROJECT_BASE_KEY, track.chord);
      console.log(`🎸 [${track.instrument}]: аккорд ${track.chord} -> сдвиг ${pitchShift} полутонов.`);
    } else if (track.instrument === 'Drums') {
      console.log(`🥁 [Drums]: пропуск сдвига (защита перкуссии).`);
    }

    return { ...track, transpose: pitchShift };
  });

  // 5. Генерируем RPP
  const rppString = buildRppContent(processedTracks);

  // 6. Уникальное имя файла (таймштамп + случайный суффикс, чтобы избежать коллизий)
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const fileName = `project_${timestamp}_${randomSuffix}.rpp`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  await fs.writeFile(filePath, rppString, 'utf-8');

  console.log(`✅ Успех! Мультитрек сохранён: ${filePath}`);

  return { filePath, tracks: processedTracks };
}

// ---------- Запуск только при прямом вызове из консоли ----------

const isMainModule = (() => {
  if (!process.argv[1]) return false;
  const entry = path.resolve(process.argv[1]);
  const self = path.resolve(fileURLToPath(import.meta.url));
  return process.platform === 'win32' ? entry.toLowerCase() === self.toLowerCase() : entry === self;
})();

if (isMainModule) {
  runFactory().catch((error) => {
    console.error('❌ Ошибка при сборке проекта:', error);
    process.exitCode = 1;
  });
}