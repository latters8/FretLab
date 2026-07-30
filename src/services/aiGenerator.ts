import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

// Инициализация клиента OpenAI с фоллбеками на Ollama
const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY || 'ollama-local',
  baseURL: process.env.AI_BASE_URL || 'http://localhost:11434/v1',
});

const BLUEPRINT_PATH = path.join(process.cwd(), 'blueprint.json');

// Системный промпт с примером для защиты структуры
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

export async function generateBlueprint(userPrompt: string) {
  console.log(`🧠 Отправляем запрос к локальной модели: "${userPrompt}"...`);

  try {
    const response = await openai.chat.completions.create({
      model: 'qwen2.5-coder:1.5b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    let rawContent = response.choices[0]?.message?.content;
    
    if (!rawContent) {
      throw new Error('Модель вернула пустой ответ.');
    }

    // Очистка ответа от Markdown-тегов
    rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Валидация JSON
    const blueprint = JSON.parse(rawContent);
    
    if (!blueprint.tracks || !Array.isArray(blueprint.tracks)) {
      throw new Error('Неверная структура: отсутствует массив "tracks".');
    }

    // Валидация полей для каждого трека
    blueprint.tracks.forEach((track: any, index: number) => {
      // Проверяем наличие style
      if (!track.style) {
        console.warn(`⚠️ Трек ${index} (${track.instrument}) не имеет поля style, добавляем "rock" по умолчанию`);
        track.style = 'rock';
      }
      
      // Проверяем допустимость style
      const validStyles = ['rock', 'metal', 'funk', 'blues', 'pop', 'jazz'];
      if (!validStyles.includes(track.style)) {
        console.warn(`⚠️ Трек ${index} (${track.instrument}) имеет недопустимый style "${track.style}", меняем на "rock"`);
        track.style = 'rock';
      }

      // Для инструментов, кроме Drums, проверяем наличие chord
      if (track.instrument !== 'Drums' && !track.chord) {
        console.warn(`⚠️ Трек ${index} (${track.instrument}) не имеет поля chord, добавляем "C" по умолчанию`);
        track.chord = 'C';
      }

      // Для Drums убеждаемся, что chord отсутствует
      if (track.instrument === 'Drums' && track.chord) {
        console.warn(`⚠️ Трек ${index} (Drums) содержит поле chord, удаляем его`);
        delete track.chord;
      }
    });

    // Сохранение blueprint
    fs.writeFileSync(BLUEPRINT_PATH, JSON.stringify(blueprint, null, 2), 'utf-8');
    console.log(`✅ Успех! Файл blueprint.json обновлен.`);
    console.log(`📋 Сгенерировано ${blueprint.tracks.length} треков:`);
    blueprint.tracks.forEach((track: any, index: number) => {
      console.log(`  ${index + 1}. ${track.instrument} (${track.style})${track.chord ? ` - ${track.chord}` : ''}`);
    });

  } catch (error) {
    console.error('❌ Ошибка при генерации:', error);
  }
}

// Запуск при вызове напрямую из консоли
const promptArg = process.argv[2] || "Сделай метал-трек на 4 такта: барабаны, бас в E и ритм-гитара в E";
generateBlueprint(promptArg);