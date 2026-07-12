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
        // ✅ Правильный способ разделения чанков
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // Разделяем зависимости
            if (id.includes('react')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  
  // 🔧 Разрешаем импорты
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});