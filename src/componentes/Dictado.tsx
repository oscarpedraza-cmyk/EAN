"use client";

import { useEffect } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { useDictado } from "@/lib/useDictado";

interface Props {
  campo: string;
  alTexto: (trozo: string) => void;
  alParcial?: (trozo: string) => void;
}

/** Botón de dictado acoplado a un campo concreto. */
export default function Dictado({ campo, alTexto, alParcial }: Props) {
  const { soportado, escuchando, error, iniciar, detener } = useDictado();

  useEffect(() => () => detener(), [detener]);

  if (!soportado) {
    return (
      <span className="text-pizarra-oscuro" title="El dictado requiere Chrome, Edge o Safari">
        <MicOff className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        escuchando
          ? detener()
          : iniciar((trozo, final) => (final ? alTexto(trozo) : alParcial?.(trozo)))
      }
      title={error ?? `Dictar ${campo}`}
      aria-label={escuchando ? `Detener dictado de ${campo}` : `Dictar ${campo}`}
      aria-pressed={escuchando}
      className={`pastilla transition ${
        escuchando
          ? "animate-latido border-ladrillo/60 bg-ladrillo/20 text-ladrillo-claro"
          : error
            ? "border-ambar/40 bg-ambar/10 text-ambar"
            : "border-white/10 bg-white/[0.04] text-pizarra hover:border-cian/50 hover:text-cian-claro"
      }`}
    >
      {escuchando ? <Square className="h-2.5 w-2.5" fill="currentColor" /> : <Mic className="h-3 w-3" />}
      {escuchando ? "Grabando" : "Dictar"}
    </button>
  );
}
