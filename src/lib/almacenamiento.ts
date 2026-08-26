"use client";

import { firebaseConfigurado, obtenerFirestore } from "./firebase";
import type { Encuentro } from "./tipos";

const CLAVE_LOCAL = "mentoria-ci/encuentros";
const COLECCION = process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION || "mentorias_ci";

export type Destino = "firestore" | "local";

function guardarLocal(encuentro: Encuentro): Destino {
  try {
    const bruto = window.localStorage.getItem(CLAVE_LOCAL);
    const lista = bruto ? (JSON.parse(bruto) as Encuentro[]) : [];
    const siguiente = [encuentro, ...lista.filter((e) => e.id !== encuentro.id)].slice(0, 40);
    window.localStorage.setItem(CLAVE_LOCAL, JSON.stringify(siguiente));
  } catch {
    // Modo privado o cuota llena: el encuentro sigue vivo en memoria.
  }
  return "local";
}

/** Guarda en Firestore si está configurado; si no, o si falla, cae a localStorage. */
export async function guardarEncuentro(encuentro: Encuentro): Promise<Destino> {
  if (!firebaseConfigurado) return guardarLocal(encuentro);
  try {
    const db = await obtenerFirestore();
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    await setDoc(doc(db, COLECCION, encuentro.id), {
      ...encuentro,
      actualizadoEn: serverTimestamp(),
    });
    guardarLocal(encuentro);
    return "firestore";
  } catch (error) {
    console.warn("[almacenamiento] Firestore no disponible, se guarda en local:", error);
    return guardarLocal(encuentro);
  }
}

export function recuperarBorrador(): Encuentro | null {
  try {
    const bruto = window.localStorage.getItem(CLAVE_LOCAL);
    const lista = bruto ? (JSON.parse(bruto) as Encuentro[]) : [];
    return lista[0] ?? null;
  } catch {
    return null;
  }
}
