/// <reference lib="webworker" />

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>;
};

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
  const titulo = payload.data?.title ?? payload.notification?.title ?? 'xMatch';
  const opcoes: NotificationOptions = {
    body: payload.data?.body ?? payload.notification?.body,
    icon: payload.notification?.icon ?? '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      ...payload.data,
      url: payload.data?.url ?? payload.fcmOptions?.link ?? '/',
    },
  };

  void self.registration.showNotification(titulo, opcoes);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(
    String(event.notification.data?.url ?? '/'),
    self.location.origin,
  ).href;
  event.waitUntil(self.clients.openWindow(url));
});
