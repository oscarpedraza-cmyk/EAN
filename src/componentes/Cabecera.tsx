"use client";

import { useState } from "react";
import { HelpCircle, Pause, Play, RotateCcw, X } from "lucide-react";
import { PASOS, PREGUNTAS_GUIA, type PasoId } from "@/lib/guia";
import { formatoReloj } from "@/lib/useTiempo";

interface Props {
  pasoActivo: PasoId;
  completados: Record<PasoId, boolean>;
  alIrA: (id: PasoId) => void;
  segundos: number;
  corriendo: boolean;
  alAlternar: () => void;
  alReiniciar: () => void;
}

export default function Cabecera({
  pasoActivo,
  completados,
  alIrA,
  segundos,
  corriendo,
  alAlternar,
  alReiniciar,
}: Props) {
  const [preguntasAbiertas, setPreguntasAbiertas] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-casco-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-2.5 px-4 py-2.5 lg:flex-row lg:items-center lg:gap-5">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-slate-100">
              Mentoría 2 · Evidencia, métricas y decisiones
            </p>
            <p className="truncate text-[11px] text-pizarra">
              Electiva I · Crecimiento Inteligente
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:hidden">
            <span className="tabular font-mono text-lg font-bold text-cian-claro">
              {formatoReloj(segundos)}
            </span>
            <button
              type="button"
              onClick={alAlternar}
              className="boton-tenue px-2 py-1.5"
              aria-label={corriendo ? "Pausar el tiempo del encuentro" : "Iniciar el tiempo del encuentro"}
            >
              {corriendo ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <nav aria-label="Ruta de conversación" className="flex-1 overflow-x-auto">
          <ol className="flex min-w-max items-center gap-1">
            {PASOS.map((paso) => {
              const activo = paso.id === pasoActivo;
              const listo = completados[paso.id];
              return (
                <li key={paso.id}>
                  <button
                    type="button"
                    onClick={() => alIrA(paso.id)}
                    aria-current={activo ? "step" : undefined}
                    title={paso.ayuda}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                      activo
                        ? "border-cian/60 bg-cian/15 text-cian-claro"
                        : listo
                          ? "border-menta/25 bg-menta/[0.07] text-menta"
                          : "border-white/[0.08] text-pizarra hover:border-white/20 hover:text-slate-300"
                    }`}
                  >
                    <span className="font-mono opacity-70">{paso.numero}</span>
                    <span className="hidden sm:inline">{paso.corto}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="hidden items-center gap-1.5 lg:flex">
          <span className="tabular font-mono text-xl font-bold text-cian-claro">
            {formatoReloj(segundos)}
          </span>
          <button
            type="button"
            onClick={alAlternar}
            className="boton-tenue px-2 py-1.5"
            aria-label={corriendo ? "Pausar el tiempo del encuentro" : "Iniciar el tiempo del encuentro"}
          >
            {corriendo ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={alReiniciar}
            className="boton-tenue px-2 py-1.5"
            aria-label="Reiniciar el tiempo"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPreguntasAbiertas((v) => !v)}
          className={`boton px-2.5 py-1.5 text-xs ${
            preguntasAbiertas
              ? "bg-cian text-white"
              : "border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]"
          }`}
          aria-expanded={preguntasAbiertas}
        >
          {preguntasAbiertas ? <X className="h-3.5 w-3.5" /> : <HelpCircle className="h-3.5 w-3.5" />}
          Preguntas guía
        </button>
      </div>

      {preguntasAbiertas && (
        <div className="animate-entrada border-t border-white/10 bg-casco-900/95">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <p className="mb-2 text-[11px] text-pizarra">
              No es necesario recorrerlas todas. Elijan las que profundicen en el bloqueo principal.
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {PREGUNTAS_GUIA.map((pregunta) => (
                <li
                  key={pregunta}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[13px] leading-snug text-slate-300"
                >
                  {pregunta}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
