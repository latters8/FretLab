import path from 'node:path';

export interface TrackBlueprint {
  instrument: string;
  midiFile: string;
  position: number;
  length: number;
  transpose: number;
}

export function buildTrackBlock(trackInfo: TrackBlueprint, projectRoot: string): string {
  const midiPath = path.join(projectRoot, 'midi', trackInfo.midiFile);
  
  // Защита: проверяем, являются ли это ударными (ищем "drum" в названии)
  const isDrums = trackInfo.instrument.toLowerCase().includes('drum');
  
  // Если ударные — жестко ставим сдвиг 0, иначе используем значение из JSON
  const finalShift = isDrums ? 0 : trackInfo.transpose;
  
  // Формат PLAYRATE: скорость(1) сохранять_питч(1) сдвиг_полутона
  const playrateStr = finalShift !== 0 ? `\n      PLAYRATE 1 1 ${finalShift}` : '';

  return `  <TRACK
    NAME "${trackInfo.instrument}"
    <ITEM
      POSITION ${trackInfo.position}
      LENGTH ${trackInfo.length}
      NAME "${trackInfo.midiFile}"${playrateStr}
      <SOURCE MIDI
        FILE "${midiPath}"
      >
    >
  >`;
}

export function buildRppContent(tracks: any[]): string {
  const projectRoot = process.cwd();
  const trackBlocks = tracks.map(track => buildTrackBlock(track, projectRoot)).join('\n');
  return `<REAPER_PROJECT 0.1 "6.80/win64" 1718293847\n${trackBlocks}\n>`;
}
