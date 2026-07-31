/**
 * Генерирует кривую для WaveShaperNode, имитирующую ламповое искажение.
 * Чем выше amount, тем больше "ламповой" компрессии и насыщения.
 */
export function createTubeCurve(
  samples: number = 44100,
  amount: number = 0.5,
  drive: number = 1.0
): Float32Array {
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1; // нормализуем -1..1

    // Базовое tanh-искажение (мягкое, ламповое)
    let y = Math.tanh(x * drive * (1 + amount * 4));

    // Добавляем чётные гармоники (характерно для ламп)
    const evenHarmonics = amount * 0.3 * Math.sin(x * drive * Math.PI * 0.5);
    y += evenHarmonics;

    // Небольшой асимметричный сдвиг (лампы не идеально симметричны)
    const asymmetry = amount * 0.05 * Math.sin(x * Math.PI);
    y += asymmetry;

    // Компрессия верхушки (sag)
    const sag = 1 - amount * 0.15;
    y *= sag;

    curve[i] = y;
  }

  return curve;
}

/**
 * Жёсткое клиппирование для high-gain (если понадобится)
 */
export function createHardClipCurve(
  samples: number = 44100,
  threshold: number = 0.7
): Float32Array {
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = x > threshold ? threshold : x < -threshold ? -threshold : x;
  }
  return curve;
}