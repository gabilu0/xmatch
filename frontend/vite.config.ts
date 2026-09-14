import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Ver fase4_planejamento (Sprint 5) e fase3_stack — PWA como estratégia de
// entrega, um código para Android e iPhone, sem loja de apps.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Service worker de cache básico (offline/instalação). A parte de
      // notificações push via Firebase entra à parte, quando o Firebase
      // for configurado — precisa de um firebase-messaging-sw.js próprio.
      manifest: {
        name: 'xMatch',
        short_name: 'xMatch',
        description:
          'Placar de rivalidade entre amigos gamers, organizado em salas privadas.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
