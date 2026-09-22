import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Messaging,
  type Unsubscribe,
} from 'firebase/messaging';
import { api, getToken as getJwt } from './api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let messagingPromise: Promise<Messaging | null> | null = null;

async function obterMessaging(): Promise<Messaging | null> {
  if (!Object.values(firebaseConfig).every(Boolean)) {
    return null;
  }

  if (!messagingPromise) {
    messagingPromise = (async () => {
      if (!(await isSupported())) {
        return null;
      }

      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      return getMessaging(app);
    })();
  }

  return messagingPromise;
}

/**
 * Deve ser chamado depois de uma ação explícita do usuário autenticado
 * (por exemplo, ao concluir o login), pois iOS e navegadores modernos exigem
 * interação do usuário para solicitar permissão de notificações.
 */
export async function registrarDispositivoParaNotificacoes(): Promise<boolean> {
  if (!getJwt() || !import.meta.env.VITE_FIREBASE_VAPID_KEY || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return false;
  }

  const messaging = await obterMessaging();
  if (!messaging) {
    return false;
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') {
    return false;
  }

  const serviceWorkerRegistration = await navigator.serviceWorker.ready;
  const fcmToken = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  });

  if (!fcmToken) {
    return false;
  }

  await api.post('/dispositivos', {
    fcmToken,
    plataforma: 'web',
  });

  return true;
}

export async function observarNotificacoesEmPrimeiroPlano(
  handler: (payload: MessagePayload) => void,
): Promise<Unsubscribe | null> {
  const messaging = await obterMessaging();
  return messaging ? onMessage(messaging, handler) : null;
}
