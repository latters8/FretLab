# DONE: Fix Tablature.tsx play/stop to properly stop samples

## Problem
Play/Stop in Tablature (main page) only stopped synthesizer sounds, but guitar samples scheduled via `audioManager.playGuitarNote()` with future `Tone.now() + offset` continued playing after STOP.

## Solution
Rewrote `playLickAudio` and `stopPlayback` in `Tablature.tsx` to use `Tone.Part` + `Tone.Transport` (same approach as SoloGenerator).

### Changes made:
- **Added** `sequencePartRef`, `playheadAnimRef`, `startTimeRef` refs
- **`playLickAudio`**: Now collects all notes into events array, creates `Tone.Part`, starts via `Tone.Transport.start()`. `Tone.Part` manages scheduling — when disposed, cancels ALL scheduled sample playback
- **`stopPlayback`**: Now properly stops/disposes `sequencePartRef`, calls `Tone.Transport.stop()` + `Tone.Transport.cancel(0)` to cancel future sample events, plus `audioManager.stopAll()` as safety net
- **Visual highlighting**: Still uses `timeoutsRef` + `playbackIdRef` (setTimeout is fine for visual only — it doesn't affect audio)
- Build succeeds: `tsc -b && vite build` passes with no errors

### Verification
- [x] TypeScript compilation passes
- [x] Build produces no errors
- [x] Deployment published successfully

