import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/mt5/account': {
        target: 'http://202.155.94.173',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mt5\/account/, '/api/account'),
        headers: {
          'x-api-key': 'TokenRahasia2026',
        },
      },
      '/api/account': {
        target: 'http://202.155.94.173',
        changeOrigin: true,
        headers: {
          'x-api-key': 'TokenRahasia2026',
        },
      },
      '/api/calendar/thisweek': {
        target: 'https://nfs.faireconomy.media',
        changeOrigin: true,
        rewrite: () => '/ff_calendar_thisweek.json',
      },
      '/api/calendar/nextweek': {
        target: 'https://nfs.faireconomy.media',
        changeOrigin: true,
        rewrite: () => '/ff_calendar_nextweek.json',
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  }
});
