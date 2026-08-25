"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Web Speech API: aún no está en lib.dom, se declara el mínimo necesario. */
interface SpeechAlternative {
  transcript: string;
}
interface SpeechResult {
  isFinal: boolean;
  0: SpeechAlternative;
}
interface SpeechEvent {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechResult };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * Dictado al vuelo. Devuelve el texto final acumulado por sesión de dictado
 * más el fragmento provisional, para que el textarea se sienta en vivo.
 */
export function useSpeech(lang = "es-ES") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const handlerRef = useRef<((chunk: string, isFinal: boolean) => void) | null>(null);

  useEffect(() => {
    setSupported(getCtor() !== null);
    return () => recognitionRef.current?.abort();
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(
    (onChunk: (chunk: string, isFinal: boolean) => void) => {
      const Ctor = getCtor();
      if (!Ctor) {
        setError("Este navegador no soporta dictado por voz.");
        return;
      }
      recognitionRef.current?.abort();

      const recognition = new Ctor();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      handlerRef.current = onChunk;

      recognition.onresult = (event) => {
        let final = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) final += result[0].transcript;
          else interim += result[0].transcript;
        }
        if (final) handlerRef.current?.(final.trim(), true);
        else if (interim) handlerRef.current?.(interim.trim(), false);
      };
      recognition.onerror = (event) => {
        const code = event.error;
        setError(
          code === "not-allowed"
            ? "Permiso de micrófono denegado."
            : code === "no-speech"
              ? "No se detectó voz."
              : "No se pudo dictar.",
        );
        setListening(false);
      };
      recognition.onend = () => setListening(false);

      setError(null);
      recognitionRef.current = recognition;
      try {
        recognition.start();
        setListening(true);
      } catch {
        setError("El dictado ya estaba activo.");
      }
    },
    [lang],
  );

  return { supported, listening, error, start, stop };
}
