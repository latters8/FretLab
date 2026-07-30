import { calculatePitchShift } from './chordMath';

// Имитация реального ответа от Qwen (наш SongBlueprint)
const qwenBlueprint = {
  key: "C", // Допустим, наши MIDI-исходники записаны в До-мажоре
  structure: [
    {
      name: "Verse 1",
      chords: [
        { chord: "Am7", duration_beats: 16 },
        { chord: "Fmaj7", duration_beats: 8 },
        { chord: "G", duration_beats: 8 }
      ]
    }
  ]
};

console.log(`=== Тест транспонирования ===`);
console.log(`Тональность MIDI-паттернов: ${qwenBlueprint.key}\n`);

qwenBlueprint.structure[0].chords.forEach(c => {
  const shift = calculatePitchShift(qwenBlueprint.key, c.chord);
  // Форматируем вывод для красоты
  const sign = shift > 0 ? '+' : '';
  console.log(`Аккорд: ${c.chord.padEnd(7)} | Сдвиг (PITCH): ${sign}${shift} полутонов`);
});