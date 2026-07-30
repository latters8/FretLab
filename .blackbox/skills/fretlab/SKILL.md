---
name: fretlab-dev
description: Development guidance for FretLab, a React/TypeScript/Tone.js guitar practice web app (Circle of Fifths, interactive fretboard, backing track player, AI solo/backing generation engine) hosted on GitHub Pages. Use this skill whenever working on FretLab code — mobile responsive layout, Tone.js audio engine timing/scheduling bugs, AI solo generation quality (motifs, voice-leading, style profiles), the shared music context that syncs components, or any FretLab feature/bugfix, even if the user just says "фретлаб", "guitar app", or references v2.0.0.
---

# FretLab Development

FretLab is a personal guitar-practice web app: Circle of Fifths, interactive fretboard, YouTube/Tone.js backing track player, and an AI practice/solo-generation engine — all synced through one shared music context. Stack: React + TypeScript + Tone.js, deployed to GitHub Pages. Currently on v2.0.0.

## Working style (important)

- Direction is often given concisely, in Russian, expecting **direct, actionable output with ready-to-use code blocks** — not long spec discussions first.
- Prefer **functional interactive demos** over sequential spec-driven development. When in doubt, build something runnable and iterate, rather than writing a design doc.
- Don't over-explain framework basics; assume solid React/TS familiarity.

## Architecture: the shared music context

Every component (Circle of Fifths SVG, fretboard, backing track player, AI engine) reads/writes a **single unified music context** (key, scale, chord progression, current chord/beat, tempo, playback state). Before changing any component:

1. Identify what part of the shared context it reads and what it mutates.
2. Never let a component hold local state that duplicates something already in the context — that's the classic source of desync bugs (e.g. fretboard highlighting the wrong key because it cached an old value).
3. When adding a new feature, extend the context shape first, then wire components to it — don't bolt on parallel state.

## Tone.js audio engine

Known problem area: **beat-to-seconds conversion and scheduling**. When touching playback/timing code:

- Double-check tempo (BPM) → seconds conversion at every point it's used (`Tone.Time`, `Transport.bpm`, manual math) — mixing manual math with Tone.js's own time units is the most common source of drift/glitches.
- Prefer Tone.Transport-driven scheduling over manual `setTimeout`-based timing.
- Test timing changes across a range of tempos (slow ~60 BPM and fast ~180 BPM), not just the default — drift often only shows up at the extremes.
- Watch for scheduling leaks: parts/events not cleared (`.dispose()` / `.cancel()`) between song changes or on component unmount.

## AI solo/backing generation engine

The generation engine's quality work centers on:

- **Style profiles** — parameterized phrasing/rhythm/note-choice tendencies per style (e.g. blues vs. jazz vs. rock). New styles should be added as profile presets, not special-cased branches in the generator.
- **Motif-based phrasing** — solos should develop and vary a small set of motifs rather than generating note-by-note with no memory. When improving melodic quality, check whether motif reuse/variation logic is actually being invoked, not just the raw note picker.
- **Voice-leading** — note transitions should favor smooth movement relative to the underlying chord tones; validate any change against a chord progression with several different chord qualities (maj7, min7, dom7, dim), not just a I–IV–V loop.
- **Chord progression diversity** — avoid generation logic that overfits to simple diatonic loops; test against progressions with borrowed chords/secondary dominants too.
- Current direction: **prioritize deepening the existing Tone.js-based engine** over integrating external models (e.g. MusicGen) — don't suggest swapping in a new generation backend unless explicitly asked.

## Mobile responsive layout

- The tools panel pattern is an **off-canvas drawer** on mobile, not a squeezed-down desktop layout. Any new tool/panel should follow this pattern rather than adding new inline style overrides.
- Actively avoid reintroducing ad-hoc inline style overrides for responsiveness — these were deliberately removed in favor of a consistent responsive system. If you find yourself adding `style={{ ... }}` for breakpoint logic, stop and use the existing responsive utilities/classes instead.
- Test any layout change at common mobile widths (~375px) in addition to desktop.

## Common bug patterns to check first

When debugging, check these before deep-diving:

1. **Desync between components** → shared music context not being read/written correctly (see Architecture above).
2. **Audio timing glitches** → beat/seconds conversion or Transport scheduling (see Tone.js section).
3. **Weak/repetitive AI solos** → motif logic or voice-leading not actually engaged, or style profile falling back to a default.
4. **Mobile layout breakage** → inline style override instead of the off-canvas/responsive system.

## Deployment

Hosted on GitHub Pages. Keep this in mind for any change involving asset paths, routing, or build output — relative paths and base-path config matter more than on a typical dev server.

## When responding

- Give runnable code, not pseudocode.
- If a change touches the shared context, show the context shape change alongside the component change so it's clear what's now in sync.
- Flag (briefly) if a fix only patches a symptom rather than the root desync/timing/style-profile cause described above.