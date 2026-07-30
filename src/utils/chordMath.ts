// Словарь соответствия нот и их позиции в полутонах (от 0 до 11)
// Учитываем и диезы (#), и бемоли (b)
const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3,
  'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8,
  'A': 9, 'A#': 10, 'BB': 10, 'B': 11
};

/**
 * Вычисляет идеальный сдвиг в полутонах между двумя нотами/аккордами.
 * Ищет кратчайший путь, чтобы избежать сильных искажений звука (эффекта "бурундука").
 */
export function calculatePitchShift(baseKey: string, targetKey: string): number {
  // Очищаем входные данные (на случай, если придет минор "Am" вместо "A")
  // Берем только корневую ноту. Заменяем всё на верхний регистр.
  const cleanBase = baseKey.replace(/m|maj|min|7|9/gi, '').toUpperCase();
  const cleanTarget = targetKey.replace(/m|maj|min|7|9/gi, '').toUpperCase();

  const baseVal = NOTE_TO_SEMITONE[cleanBase] ?? 0;
  const targetVal = NOTE_TO_SEMITONE[cleanTarget] ?? 0;

  let diff = targetVal - baseVal;

  // ОПТИМИЗАЦИЯ ПИТЧА:
  // Если мы идем из C (0) в B (11), разница = +11 полутонов. Звук будет искажен.
  // Логичнее опустить C на -1 полутон.
  if (diff > 6) {
    diff -= 12;
  }
  if (diff < -5) {
    diff += 12;
  }

  return diff;
}

// Экспортируем ту же самую функцию под вторым именем.
// Теперь неважно, импортируете вы calculatePitchShift или calculateTranspose —
// TypeScript будет доволен в обоих случаях.
export { calculatePitchShift as calculateTranspose };