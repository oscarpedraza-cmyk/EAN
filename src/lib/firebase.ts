import type { FirebaseApp } from "firebase/app";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let appPromise: Promise<FirebaseApp> | null = null;

/** Carga Firebase de forma perezosa: no entra al bundle inicial ni bloquea el arranque. */
async function getApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = (async () => {
      const { getApps, initializeApp } = await import("firebase/app");
      const existing = getApps();
      return existing.length ? existing[0] : initializeApp(config as Record<string, string>);
    })();
  }
  return appPromise;
}

export async function getDb() {
  const { getFirestore } = await import("firebase/firestore");
  return getFirestore(await getApp());
}
