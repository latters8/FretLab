import fs from 'node:fs';
import path from 'node:path';
// Добавили ./src/ в пути импортов
import { calculatePitchShift } from './src/utils/chordMath.ts';
import { buildRppContent } from './src/utils/rppBuilder.ts';
import { ensureMidiFilesExist } from './src/utils/midiGenerator.ts';

export type TrackBlueprint = {
  instrument: string;
  midiFile: string;
  position: number;
  length: number;
  chord?: string;
};

export type Blueprint = {
  tracks: TrackBlueprint[];
};

// Базовая тональность всех наших исходных MIDI (по умолчанию 'C')
const PROJECT_BASE_KEY = 'C'; 
const ROOT_DIR = process.cwd();
const OUTPUT_DIR = path.join(ROOT_DIR, 'output');
const BLUEPRINT_PATH = path.join(ROOT_DIR, 'blueprint.json');

async function runFactory() {
  try {
    // 1. Проверяем наличие папки output, создаем если её нет
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 2. Читаем blueprint.json из корня проекта
    if (!fs.existsSync(BLUEPRINT_PATH)) {
      throw new Error(`Файл не найден. Убедитесь, что blueprint.json лежит здесь: ${BLUEPRINT_PATH}`);
    }
    
    const blueprintRaw = fs.readFileSync(BLUEPRINT_PATH, 'utf-8');
    const blueprint: Blueprint = JSON.parse(blueprintRaw);

    console.log('🏭 FretLab Factory запущена. Анализ треков...');

    // 3. Проверяем и генерируем недостающие MIDI-файлы
    ensureMidiFilesExist(blueprint.tracks);

    // 4. Проходимся по трекам и вычисляем питч-шифт
    const processedTracks = blueprint.tracks.map((track) => {
      let pitchShift = 0;

      // ЗАЩИТА: Меняем тональность только если это НЕ барабаны и указан аккорд
      if (track.instrument !== 'Drums' && track.chord) {
        pitchShift = calculatePitchShift(PROJECT_BASE_KEY, track.chord);
        console.log(`🎸 [${track.instrument}]: аккорд ${track.chord} -> сдвиг ${pitchShift} полутонов.`);
      } else if (track.instrument === 'Drums') {
        console.log(`🥁 [Drums]: пропуск сдвига (защита перкуссии).`);
      }

      // Возвращаем трек с добавленным параметром transpose
      return {
        ...track,
        transpose: pitchShift
      };
    });

    // 5. Генерируем текстовый код RPP файла
    const rppString = buildRppContent(processedTracks);

    // 6. Уникальное имя файла (решает проблему EBUSY и блокировок)
    const timestamp = Date.now();
    const fileName = `project_${timestamp}.rpp`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    // 7. Запись файла на диск
    fs.writeFileSync(filePath, rppString, 'utf-8');
    
    console.log(`✅ Успех! Мультитрек сохранен: ${filePath}`);

  } catch (error) {
    console.error('❌ Ошибка при сборке проекта:', error);
  }
}

// Запуск фабрики
runFactory();