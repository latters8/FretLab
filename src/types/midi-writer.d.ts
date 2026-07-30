declare module 'midi-writer-js' {
  interface NoteEventOpts {
    pitch: string | string[];
    duration: string | number;
    velocity?: number;
    startTick?: number;
    sequential?: boolean;
  }

  interface TrackEvent {}

  class Track {
    addEvent(event: any): void;
    removeEventsByName(name: string): void;
    mergeTrack(track: Track): void;
  }

  class NoteEvent {
    constructor(opts: NoteEventOpts);
  }

  class CopyrightEvent {
    constructor(opts: { text: string });
  }

  class Writer {
    constructor(track: Track | Track[]);
    buildFile(): Uint8Array;
  }

  const MidiWriter: {
    Track: typeof Track;
    NoteEvent: typeof NoteEvent;
    Writer: typeof Writer;
    CopyrightEvent: typeof CopyrightEvent;
  };

  export default MidiWriter;
}
