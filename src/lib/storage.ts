"use client";

import { getDb, isFirebaseConfigured } from "./firebase";
import type { MentorshipSession } from "./types";

const LOCAL_KEY = "copiloto-mentoria/sessions";
const COLLECTION = process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION || "mentorship_sessions";

export type PersistTarget = "firestore" | "local";

export interface PersistResult {
  target: PersistTarget;
  id: string;
}

function saveLocal(session: MentorshipSession): PersistResult {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const list = raw ? (JSON.parse(raw) as MentorshipSession[]) : [];
    const next = [session, ...list.filter((s) => s.id !== session.id)].slice(0, 50);
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch {
    // Modo privado o cuota llena: la sesión sigue viva en memoria.
  }
  return { target: "local", id: session.id };
}

/** Guarda en Firestore si está configurado; si no (o si falla), cae a localStorage. */
export async function persistSession(session: MentorshipSession): Promise<PersistResult> {
  if (!isFirebaseConfigured) return saveLocal(session);
  try {
    const db = await getDb();
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    await setDoc(doc(db, COLLECTION, session.id), {
      ...session,
      updatedAt: serverTimestamp(),
    });
    saveLocal(session);
    return { target: "firestore", id: session.id };
  } catch (error) {
    console.warn("[storage] Firestore no disponible, se guarda en local:", error);
    return saveLocal(session);
  }
}

export function loadLocalSessions(): MentorshipSession[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as MentorshipSession[]) : [];
  } catch {
    return [];
  }
}
