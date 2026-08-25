"use client";

import { useEffect } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { useSpeech } from "@/lib/useSpeech";

interface Props {
  /** Se invoca con el texto ya reconocido para que el campo lo anexe. */
  onFinal: (chunk: string) => void;
  onInterim?: (chunk: string) => void;
  label: string;
  compact?: boolean;
}

/** Botón de dictado (Web Speech API) acoplado a un campo concreto del panel. */
export default function SpeechButton({ onFinal, onInterim, label, compact }: Props) {
  const { supported, listening, error, start, stop } = useSpeech("es-ES");

  useEffect(() => () => stop(), [stop]);

  if (!supported) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600"
        title="El dictado requiere Chrome, Edge o Safari"
      >
        <MicOff className="h-3.5 w-3.5" />
        {compact ? "" : "Sin dictado"}
      </span>
    );
  }

  const handle = () => {
    if (listening) {
      stop();
      return;
    }
    start((chunk, isFinal) => {
      if (isFinal) onFinal(chunk);
      else onInterim?.(chunk);
    });
  };

  return (
    <button
      type="button"
      onClick={handle}
      title={error ?? `Dictar ${label}`}
      aria-label={listening ? `Detener dictado de ${label}` : `Dictar ${label}`}
      aria-pressed={listening}
      className={`chip transition ${
        listening
          ? "animate-pulse-ring border-red-400/50 bg-red-500/15 text-red-300"
          : error
            ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
            : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-sky-400/40 hover:text-sky-300"
      }`}
    >
      {listening ? <Square className="h-3 w-3" fill="currentColor" /> : <Mic className="h-3.5 w-3.5" />}
      {listening ? "Grabando" : compact ? "Dictar" : "Dictar"}
    </button>
  );
}
