"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  id: string;
  numero: string;
  titulo: string;
  ayuda: string;
  icono: LucideIcon;
  activo: boolean;
  completo?: boolean;
  accion?: ReactNode;
  children: ReactNode;
}

/** Contenedor común de los cinco pasos de la ruta de conversación. */
export default function Paso({
  id,
  numero,
  titulo,
  ayuda,
  icono: Icono,
  activo,
  completo,
  accion,
  children,
}: Props) {
  return (
    <section
      id={id}
      className={`tarjeta scroll-mt-24 transition-colors duration-500 ${
        activo ? "border-cian/40 ring-1 ring-cian/20" : ""
      }`}
    >
      <div className="flex flex-wrap items-start gap-3 border-b border-white/[0.07] px-4 py-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
            completo
              ? "border-menta/40 bg-menta/15 text-menta"
              : activo
                ? "border-cian/50 bg-cian/15 text-cian-claro"
                : "border-white/10 bg-white/[0.04] text-pizarra"
          }`}
        >
          <Icono className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold leading-tight text-slate-100">
            <span className="font-mono text-xs text-pizarra">{numero}</span> {titulo}
          </h2>
          <p className="mt-0.5 text-xs leading-snug text-pizarra">{ayuda}</p>
        </div>
        {accion && <div className="ml-auto shrink-0">{accion}</div>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
