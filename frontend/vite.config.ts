import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PWA (manifest + service worker) entra no Sprint 5 — ver fase4_planejamento.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
