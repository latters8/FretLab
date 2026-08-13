import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // ✅ Базовый путь для GitHub Pages
  base: '/FretLab/',
  
  // 🖥️ Настройки сервера для разработки
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    open: true,
  },
  
  // 📦 Настройки сборки
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Скрывает желтые предупреждения до 1 МБ
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // 1. Изолируем ядро React в отдельный файл
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          
          // 2. Изолируем тяжелые библиотеки для работы со звуком и MIDI
          if (
            id.includes('node_modules/tone/') || 
            id.includes('node_modules/midi-writer-js/')
          ) {
            return 'vendor-audio';
          }
          
          // Для всех остальных библиотек (например, openai или react-helmet-async) 
          // возвращаем undefined — Rollup разобьет их на оптимальные чанки сам.
        },
      },
    },
  },
});