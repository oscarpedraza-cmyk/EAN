"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* La Web Speech API todavía no está en lib.dom: se declara lo mínimo necesario. */
interface Alternativa { transcript: string }
interface Resultado { isFinal: boolean; 0: Alternativa }
interface EventoVoz { resultIndex: number; results: { length: number; [i: number]: Resultado } }
interface Reconocedor {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: EventoVoz) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type Constructor = new () => Reconocedor;

function obtenerConstructor(): Constructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Constructor; webkitSpeechRecognition?: Constructor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** Dictado por voz para llenar los campos sin escribir durante la conversación. */
export function useDictado(idioma = "es-CO") {
  const [soportado, setSoportado] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconocedorRef = useRef<Reconocedor | null>(null);
  const manejadorRef = useRef<((trozo: string, final: boolean) => void) | null>(null);

  useEffect(() => {
    setSoportado(obtenerConstructor() !== null);
    return () => reconocedorRef.current?.abort();
  }, []);

  const detener = useCallback(() => {
    reconocedorRef.current?.stop();
    reconocedorRef.current = null;
    setEscuchando(false);
  }, []);

  const iniciar = useCallback(
    (alTrozo: (trozo: string, final: boolean) => void) => {
      const Ctor = obtenerConstructor();
      if (!Ctor) {
        setError("Este navegador no soporta dictado por voz.");
        return;
      }
      reconocedorRef.current?.abort();

      const reconocedor = new Ctor();
      reconocedor.lang = idioma;
      reconocedor.continuous = true;
      reconocedor.interimResults = true;
      manejadorRef.current = alTrozo;

      reconocedor.onresult = (evento) => {
        let final = "";
        let parcial = "";
        for (let i = evento.resultIndex; i < evento.results.length; i += 1) {
          const r = evento.results[i];
          if (r.isFinal) final += r[0].transcript;
          else parcial += r[0].transcript;
        }
        if (final) manejadorRef.current?.(final.trim(), true);
        else if (parcial) manejadorRef.current?.(parcial.trim(), false);
      };
      reconocedor.onerror = (evento) => {
        setError(
          evento.error === "not-allowed"
            ? "Permiso de micrófono denegado."
            : evento.error === "no-speech"
              ? "No se detectó voz."
              : "No se pudo dictar.",
        );
        setEscuchando(false);
      };
      reconocedor.onend = () => setEscuchando(false);

      setError(null);
      reconocedorRef.current = reconocedor;
      try {
        reconocedor.start();
        setEscuchando(true);
      } catch {
        setError("El dictado ya estaba activo.");
      }
    },
    [idioma],
  );

  return { soportado, escuchando, error, iniciar, detener };
}

/** Anexa lo dictado al texto que ya había, con puntuación y mayúscula inicial. */
export function anexarDictado(actual: string, trozo: string): string {
  if (!trozo) return actual;
  const base = actual.trimEnd();
  const capitalizado = trozo.charAt(0).toUpperCase() + trozo.slice(1);
  if (!base) return capitalizado;
  return `${base}${/[.!?]$/.test(base) ? " " : ". "}${capitalizado}`;
}
