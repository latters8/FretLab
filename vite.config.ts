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
    rollupOptions: {
      output: {
        // ✅ Выделяем только React+react-dom в отдельный чанк.
        // Для остальных node_modules возвращаем undefined — Rollup сам разобьёт
        // их на оптимальные чанки без циклических зависимостей.
        manualChunks(id: string) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
});
