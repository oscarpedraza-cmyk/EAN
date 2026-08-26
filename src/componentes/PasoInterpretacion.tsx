"use client";

import {
  Crosshair,
  FlaskConical,
  Loader2,
  Lightbulb,
  MessageCircleQuestion,
  Radar,
  ScanSearch,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import Medidor from "./Medidor";
import Paso from "./Paso";
import { BLOQUEOS, PASOS, ROTULO_BLOQUEO } from "@/lib/guia";
import type { Interpretacion } from "@/lib/tipos";

const META = PASOS[3];

interface Props {
  interpretacion: Interpretacion | null;
  cargando: boolean;
  error: string | null;
  aviso: string | null;
  /** Los datos cambiaron después de la última auditoría. */
  desactualizada: boolean;
  puedeInterpretar: boolean;
  alInterpretar: () => void;
  activo: boolean;
}

export default function PasoInterpretacion({
  interpretacion,
  cargando,
  error,
  aviso,
  desactualizada,
  puedeInterpretar,
  alInterpretar,
  activo,
}: Props) {
  return (
    <Paso
      id="paso-interpretacion"
      numero={META.numero}
      titulo={META.titulo}
      ayuda={META.ayuda}
      icono={Radar}
      activo={activo}
      completo={Boolean(interpretacion)}
      accion={
        <button
          type="button"
          onClick={alInterpretar}
          disabled={!puedeInterpretar || cargando}
          className="boton-primario"
        >
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {cargando
            ? "Auditando…"
            : desactualizada
              ? "Actualizar auditoría"
              : interpretacion
                ? "Volver a auditar"
                : "Auditar evidencia"}
        </button>
      }
    >
      {error && (
        <p className="mb-3 rounded-lg border border-ladrillo/40 bg-ladrillo/10 px-3 py-2 text-sm text-ladrillo-claro">
          {error}
        </p>
      )}
      {aviso && !error && (
        <p className="mb-3 rounded-lg border border-ambar/25 bg-ambar/[0.08] px-3 py-2 text-[11px] text-ambar">
          {aviso}
        </p>
      )}

      {!interpretacion && !cargando && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
          <ScanSearch className="h-7 w-7 text-pizarra-oscuro" />
          <p className="text-sm font-semibold text-slate-300">Sin auditar todavía</p>
          <p className="max-w-sm text-xs leading-relaxed text-pizarra">
            Registren lo ejecutado y al menos una acción con su soporte. La auditoría califica cada
            evidencia, localiza el bloqueo y revisa si el segundo ciclo podrá decidir algo.
          </p>
        </div>
      )}

      {cargando && !interpretacion && (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      )}

      {interpretacion && (
        <div className={`grid gap-3.5 animate-entrada ${cargando ? "opacity-60" : ""}`}>
          {desactualizada && !cargando && (
            <p className="rounded-lg border border-ambar/40 bg-ambar/[0.09] px-3 py-2 text-[12px] leading-relaxed text-ambar">
              Los datos cambiaron desde esta auditoría. Vuelve a auditar para que la lectura y el
              pre-mortem correspondan a lo que hay ahora en pantalla.
            </p>
          )}
          <Medidor valor={interpretacion.confiabilidadGlobal} estado={interpretacion.estadoGlobal} />
          <p className="text-sm leading-relaxed text-slate-300">{interpretacion.lecturaGeneral}</p>

          <div>
            <p className="rotulo">
              <Crosshair className="h-3 w-3" />
              Bloqueo principal
            </p>
            <div className="flex flex-wrap gap-1.5">
              {BLOQUEOS.map(({ clave, grupo }) => {
                const encendido = clave === interpretacion.bloqueoPrincipal;
                return (
                  <span
                    key={clave}
                    title={`Grupo: ${grupo}`}
                    className={`pastilla ${
                      encendido
                        ? "border-cian bg-cian/20 text-cian-claro"
                        : "border-white/[0.08] bg-white/[0.02] text-pizarra-oscuro"
                    }`}
                  >
                    {ROTULO_BLOQUEO[clave]}
                  </span>
                );
              })}
            </div>
            {interpretacion.razonBloqueo && (
              <p className="mt-2 text-xs leading-relaxed text-pizarra">{interpretacion.razonBloqueo}</p>
            )}
          </div>

          {interpretacion.contradicciones.length > 0 && (
            <div className="rounded-xl border border-ladrillo/40 bg-ladrillo/[0.08] p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ladrillo-claro">
                <TriangleAlert className="h-3.5 w-3.5" />
                Contradicciones con lo esperado
              </p>
              <ul className="mt-2 grid gap-1.5">
                {interpretacion.contradicciones.map((c, i) => (
                  <li key={i} className="text-sm leading-relaxed text-ladrillo-claro/90">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {interpretacion.muestraInsuficiente && (
            <p className="rounded-lg border border-ambar/25 bg-ambar/[0.06] px-3.5 py-2.5 text-sm leading-relaxed text-ambar">
              {interpretacion.muestraInsuficiente}
            </p>
          )}

          <div className="flex items-start gap-2.5 rounded-xl border border-menta/25 bg-menta/[0.06] p-3.5">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-menta" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-menta">
                Aprendizaje protegido
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                {interpretacion.aprendizajeRescatado}
              </p>
            </div>
          </div>

          <div>
            <p className="rotulo">
              <MessageCircleQuestion className="h-3 w-3" />
              Preguntas para el mentor
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {interpretacion.preguntasMentor.map((p, i) => (
                <blockquote
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-[17px] font-semibold leading-snug text-slate-100"
                >
                  <span className="mr-1.5 font-mono text-xs text-cian-claro">0{i + 1}</span>
                  {p}
                </blockquote>
              ))}
            </div>
          </div>

          <div
            className={`rounded-xl border p-3.5 ${
              interpretacion.preMortem.puedeDecidir
                ? "border-menta/30 bg-menta/[0.05]"
                : "border-ambar/40 bg-ambar/[0.07]"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <FlaskConical
                className={`h-4 w-4 ${interpretacion.preMortem.puedeDecidir ? "text-menta" : "text-ambar"}`}
              />
              <p
                className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                  interpretacion.preMortem.puedeDecidir ? "text-menta" : "text-ambar"
                }`}
              >
                Antes de ejecutar el segundo ciclo
              </p>
              <span
                className={`pastilla ${
                  interpretacion.preMortem.puedeDecidir
                    ? "border-menta/40 bg-menta/15 text-menta"
                    : "border-ambar/50 bg-ambar/15 text-ambar"
                }`}
              >
                {interpretacion.preMortem.puedeDecidir ? "Puede decidir" : "No podrá decidir"}
              </span>
            </div>

            <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
              {interpretacion.preMortem.muestraMinima}
            </p>
            {interpretacion.preMortem.advertencia && (
              <p className="mt-1.5 text-xs leading-relaxed text-pizarra">
                {interpretacion.preMortem.advertencia}
              </p>
            )}

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-pizarra">
              Mapa de decisión, comprometido de antemano
            </p>
            <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
              {(
                [
                  ["Mantener", interpretacion.preMortem.mapaDecision.mantener, "text-menta"],
                  ["Ajustar", interpretacion.preMortem.mapaDecision.ajustar, "text-ambar"],
                  ["Detener", interpretacion.preMortem.mapaDecision.detener, "text-ladrillo-claro"],
                  ["Explorar", interpretacion.preMortem.mapaDecision.explorar, "text-cian-claro"],
                ] as const
              ).map(([clave, valor, color]) => (
                <div
                  key={clave}
                  className="rounded-lg border border-white/[0.07] bg-casco-950/50 px-3 py-2 text-xs leading-relaxed text-slate-300"
                >
                  <span className={`font-bold ${color}`}>{clave}: </span>
                  {valor}
                </div>
              ))}
            </div>

            {interpretacion.preMortem.variableACambiar && (
              <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                <span className="font-semibold text-slate-100">Variable a cambiar: </span>
                {interpretacion.preMortem.variableACambiar}
              </p>
            )}
            {interpretacion.preMortem.variablesACongelar.length > 0 && (
              <p className="mt-1 text-xs text-pizarra">
                <span className="font-semibold">Congelar: </span>
                {interpretacion.preMortem.variablesACongelar.join(" · ")}
              </p>
            )}
          </div>

          <p className="text-right text-[9px] uppercase tracking-[0.13em] text-pizarra-oscuro">
            {interpretacion.origen === "gemini"
              ? `Auditado con ${interpretacion.modelo}`
              : "Auditado con las reglas locales de la guía"}
          </p>
        </div>
      )}
    </Paso>
  );
}
