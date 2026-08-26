import type { FirebaseApp } from "firebase/app";

const configuracion = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigurado = Boolean(
  configuracion.apiKey && configuracion.projectId && configuracion.appId,
);

let promesaApp: Promise<FirebaseApp> | null = null;

/** Carga perezosa: el SDK no entra al bundle inicial ni retrasa el arranque. */
async function obtenerApp(): Promise<FirebaseApp> {
  if (!promesaApp) {
    promesaApp = (async () => {
      const { getApps, initializeApp } = await import("firebase/app");
      const existentes = getApps();
      return existentes.length
        ? existentes[0]
        : initializeApp(configuracion as Record<string, string>);
    })();
  }
  return promesaApp;
}

export async function obtenerFirestore() {
  const { getFirestore } = await import("firebase/firestore");
  return getFirestore(await obtenerApp());
}
