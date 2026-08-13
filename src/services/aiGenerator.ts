import OpenAI from 'openai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

// ---------- Типы ----------

export type Instrument = 'Drums' | 'Bass' | 'RhythmGuitar' | 'LeadGuitar';
export type Style = 'rock' | 'metal' | 'funk' | 'blues' | 'pop' | 'jazz';

export interface Track {
  instrument: Instrument;
  midiFile: string;
  position: number;
  length: number;
  style: Style;
  chord?: string;
}

export interface Blueprint {
  tracks: Track[];
}

const VALID_INSTRUMENTS: readonly Instrument[] = ['Drums', 'Bass', 'RhythmGuitar', 'LeadGuitar'];
const VALID_STYLES: readonly Style[] = ['rock', 'metal', 'funk', 'blues', 'pop', 'jazz'];
const DEFAULT_STYLE: Style = 'rock';
const DEFAULT_CHORD = 'C';

// ---------- Конфигурация (через env, с фоллбеками) ----------

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY || 'ollama-local',
  baseURL: process.env.AI_BASE_URL || 'http://localhost:11434/v1',
});

const MODEL = process.env.AI_MODEL || 'qwen2.5-coder:1.5b';
const BLUEPRINT_PATH = path.resolve(process.env.BLUEPRINT_PATH || 'blueprint.json');

// ---------- Системный промпт ----------

const SYSTEM_PROMPT = `Ты — музыкальный движок. Твоя единственная задача — генерировать JSON-файл аранжировки (blueprint).
Правила:
1. Доступные инструменты: "Drums", "Bass", "RhythmGuitar", "LeadGuitar".
2. Для "Drums" никогда не указывай "chord".
3. Тональность по умолчанию C. Меняй аккорды (параметр "chord") только если попросит пользователь.
4. Добавь поле "style" для каждого трека. Доступные стили: rock, metal, funk, blues, pop, jazz.
5. Для гитар (RhythmGuitar, LeadGuitar) и баса (Bass) указывай "chord" для каждого трека.
6. Выведи ТОЛЬКО валидный JSON. Никакого текста до или после. Никаких пояснений.

Пример ответа:
{
  "tracks": [
    { "instrument": "Drums", "midiFile": "drums_01.mid", "position": 0, "length": 16, "style": "rock" },
    { "instrument": "Bass", "midiFile": "bass_01.mid", "position": 0, "length": 16, "chord": "E", "style": "rock" },
    { "instrument": "RhythmGuitar", "midiFile": "rhythm_01.mid", "position": 0, "length": 16, "chord": "E", "style": "rock" },
    { "instrument": "LeadGuitar", "midiFile": "lead_01.mid", "position": 4, "length": 12, "chord": "E", "style": "rock" }
  ]
}`;

// ---------- Запрос к модели ----------

type ChatMessage = OpenAI.Chat.ChatCompletionMessageParam;

async function requestCompletion(userPrompt: string) {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const baseParams = {
    model: MODEL,
    messages,
    temperature: 0.1,
    max_tokens: 2048,
  };

  try {
    // Некоторые модели/версии Ollama не поддерживают response_format —
    // при ошибке пробуем ещё раз без него
    return await openai.chat.completions.create({
      ...baseParams,
      response_format: { type: 'json_object' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/response_format|json_object|'format'|"format"/i.test(message)) {
      console.warn('⚠️ response_format не поддерживается, повторяем запрос без него.');
      return openai.chat.completions.create(baseParams);
    }
    throw error;
  }
}

// ---------- Разбор ответа модели ----------

function parseBlueprint(rawContent: string): { tracks: unknown[] } {
  const cleaned = rawContent
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    // Если модель вернула текст вокруг JSON — вырезаем первый объект
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('Модель вернула невалидный JSON, извлечь blueprint не удалось.');
    }
    data = JSON.parse(match[0]);
  }

  if (!data || typeof data !== 'object' || !Array.isArray((data as { tracks?: unknown }).tracks)) {
    throw new Error('Неверная структура: отсутствует массив "tracks".');
  }

  return data as { tracks: unknown[] };
}

// ---------- Валидация и «починка» треков ----------

function validateBlueprint(raw: { tracks: unknown[] }): Blueprint {
  if (raw.tracks.length === 0) {
    console.warn('⚠️ Модель вернула пустой массив треков.');
  }

  const tracks = raw.tracks.map((entry, index) => {
    const track = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
    const label = `Трек ${index + 1}`;

    // Инструмент — критичное поле, чинить его нельзя
    const instrument = track.instrument as Instrument;
    if (!VALID_INSTRUMENTS.includes(instrument)) {
      throw new Error(
        `${label}: неизвестный инструмент "${String(track.instrument)}". Допустимые: ${VALID_INSTRUMENTS.join(', ')}.`,
      );
    }

    // Стиль
    let style = track.style as Style;
    if (!VALID_STYLES.includes(style)) {
      console.warn(`⚠️ ${label} (${instrument}): недопустимый style "${String(style)}", меняем на "${DEFAULT_STYLE}".`);
      style = DEFAULT_STYLE;
    }

    const result: Track = {
      instrument,
      midiFile:
        typeof track.midiFile === 'string' && track.midiFile.trim()
          ? track.midiFile.trim()
          : `${instrument.toLowerCase()}_${String(index + 1).padStart(2, '0')}.mid`,
      position:
        typeof track.position === 'number' && Number.isFinite(track.position) && track.position >= 0
          ? Math.floor(track.position)
          : 0,
      length:
        typeof track.length === 'number' && Number.isFinite(track.length) && track.length > 0
          ? Math.floor(track.length)
          : 16,
      style,
    };

    // Аккорд: барабанам — никогда, остальным — по умолчанию "C"
    if (instrument === 'Drums') {
      if (track.chord !== undefined) {
        console.warn(`⚠️ ${label} (Drums) содержит поле chord, удаляем его.`);
      }
    } else {
      if (typeof track.chord === 'string' && track.chord.trim()) {
        result.chord = track.chord.trim();
      } else {
        console.warn(`⚠️ ${label} (${instrument}): нет поля chord, добавляем "${DEFAULT_CHORD}" по умолчанию.`);
        result.chord = DEFAULT_CHORD;
      }
    }

    return result;
  });

  return { tracks };
}

// ---------- Основная функция ----------

export async function generateBlueprint(userPrompt: string): Promise<Blueprint> {
  if (!userPrompt || !userPrompt.trim()) {
    throw new Error('Пустой промпт: передайте описание трека.');
  }

  console.log(`🧠 Отправляем запрос к локальной модели: "${userPrompt}"...`);

  const response = await requestCompletion(userPrompt);

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Модель вернула пустой ответ.');
  }

  const blueprint = parseBlueprint(rawContent);
  const validated = validateBlueprint(blueprint);

  await fs.writeFile(BLUEPRINT_PATH, JSON.stringify(validated, null, 2), 'utf-8');
  console.log(`✅ Успех! Файл ${BLUEPRINT_PATH} обновлен.`);
  console.log(`📋 Сгенерировано ${validated.tracks.length} треков:`);
  validated.tracks.forEach((track, index) => {
    console.log(`  ${index + 1}. ${track.instrument} (${track.style})${track.chord ? ` - ${track.chord}` : ''}`);
  });

  return validated;
}

// ---------- Запуск только при прямом вызове из консоли ----------

const isMainModule = (() => {
  if (!process.argv[1]) return false;
  const entry = path.resolve(process.argv[1]);
  const self = path.resolve(fileURLToPath(import.meta.url));
  return process.platform === 'win32' ? entry.toLowerCase() === self.toLowerCase() : entry === self;
})();

if (isMainModule) {
  const promptArg = process.argv[2] || 'Сделай метал-трек на 4 такта: барабаны, бас в E и ритм-гитара в E';
  generateBlueprint(promptArg).catch((error) => {
    console.error('❌ Ошибка при генерации:', error);
    process.exitCode = 1;
  });
}
