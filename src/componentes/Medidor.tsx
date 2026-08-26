"use client";

import { useEffect, useState } from "react";
import { ESTADOS_HIPOTESIS, type EstadoHipotesis } from "@/lib/guia";

const TONO: Record<EstadoHipotesis, { texto: string; barra: string; borde: string }> = {
  Suposicion: { texto: "text-ladrillo-claro", barra: "bg-ladrillo", borde: "border-ladrillo/50" },
  Senal: { texto: "text-ambar", barra: "bg-ambar", borde: "border-ambar/50" },
  Evidencia: { texto: "text-menta", barra: "bg-menta", borde: "border-menta/50" },
};

interface Props {
  valor: number;
  estado: EstadoHipotesis;
}

/** Confiabilidad global sobre las tres bandas del semáforo de hipótesis. */
export default function Medidor({ valor, estado }: Props) {
  const [mostrado, setMostrado] = useState(0);

  useEffect(() => {
    setMostrado(0);
    const id = window.setTimeout(() => setMostrado(valor), 60);
    return () => window.clearTimeout(id);
  }, [valor]);

  const tono = TONO[estado];
  const meta = ESTADOS_HIPOTESIS.find((e) => e.clave === estado);
  const acotado = Math.min(100, Math.max(0, mostrado));

  return (
    <div className="rounded-xl border border-white/[0.08] bg-casco-950/50 p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pizarra">
            Confiabilidad de la evidencia
          </p>
          <p className={`tabular font-mono text-4xl font-bold leading-none ${tono.texto}`}>
            {Math.round(mostrado)}
            <span className="ml-0.5 text-lg text-pizarra">%</span>
          </p>
        </div>
        <span className={`pastilla ${tono.borde} ${tono.texto} bg-white/[0.03]`}>{meta?.rotulo}</span>
      </div>

      <div className="relative mt-3.5">
        <div className="flex h-2 overflow-hidden rounded-full" aria-hidden="true">
          <div className="h-full w-[36%] bg-ladrillo/25" />
          <div className="h-full w-[30%] bg-ambar/25" />
          <div className="h-full w-[34%] bg-menta/25" />
        </div>
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${tono.barra}`}
          style={{ width: `${acotado}%`, transition: "width 800ms cubic-bezier(.22,1,.36,1)" }}
          role="meter"
          aria-valuenow={valor}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Confiabilidad de la evidencia"
        />
        <div
          className="absolute -top-1 h-4 w-[3px] rounded-full bg-white shadow"
          style={{ left: `calc(${acotado}% - 1.5px)`, transition: "left 800ms cubic-bezier(.22,1,.36,1)" }}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[9px] font-semibold uppercase tracking-wider text-pizarra-oscuro">
        <span>Suposición</span>
        <span>Señal</span>
        <span>Evidencia</span>
      </div>

      {meta && <p className="mt-2.5 text-[11px] leading-relaxed text-pizarra">{meta.define}</p>}
    </div>
  );
}
