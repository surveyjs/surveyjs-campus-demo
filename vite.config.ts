import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'SURVEYJS_'],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT || 4002}`,
        changeOrigin: true,
      },
    },
  },
});
