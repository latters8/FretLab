# TODO: GameRoom — Make "Coming Soon" Games Playable

## ✅ Шаг 1: Создать 12 новых игр
- [x] MazeRunner — генерация лабиринта (DFS) + WASD
- [x] SpaceDefender — Space Invaders (←→ Space)
- [x] PixelRacer — гонки с уклонением
- [x] ChessGame — шахматы с базовыми правилами
- [x] HexglGame — hex-гонка
- [x] SandboxGame — симуляция песка (Particle System)
- [x] SudokuGame — генератор судоку
- [x] WordleGame — Wordle
- [x] StreetFighter — файтинг
- [x] MkjsGame — файтинг #2
- [x] ContraGame — платформер/шутер
- [x] SokobanGame — Sokoban

## ✅ Шаг 2: Обновить games/index.ts
- [x] Добавить экспорты всех 12 игр

## ✅ Шаг 3: Обновить GameRoom.tsx
- [x] Импортировать все игры
- [x] Добавить в GAME_COMPONENTS
- [x] Изменить playable: true для всех (18/18 PLAYABLE)

## ✅ Шаг 4: Проверка и сборка
- [x] `npx tsc --noEmit` — 0 ошибок
- [x] `npm run build` — успешная сборка
