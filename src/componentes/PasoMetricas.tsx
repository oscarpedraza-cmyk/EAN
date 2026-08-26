"use client";

import { Gauge, Plus, Trash2 } from "lucide-react";
import Paso from "./Paso";
import { METRICAS_SUGERIDAS, PASOS } from "@/lib/guia";
import type { FilaMetrica } from "@/lib/tipos";

const META = PASOS[2];

interface Props {
  filas: FilaMetrica[];
  alCambiar: (id: string, parche: Partial<FilaMetrica>) => void;
  alAgregar: (semilla?: Partial<FilaMetrica>) => void;
  alQuitar: (id: string) => void;
  activo: boolean;
}

export default function PasoMetricas({ filas, alCambiar, alAgregar, alQuitar, activo }: Props) {
  const conContenido = filas.filter((m) => m.metrica.trim());
  const completo =
    conContenido.length > 0 && conContenido.every((m) => m.fuente.trim() && m.umbral.trim());

  return (
    <Paso
      id="paso-metricas"
      numero={META.numero}
      titulo={META.titulo}
      ayuda={META.ayuda}
      icono={Gauge}
      activo={activo}
      completo={completo}
      accion={
        <button type="button" onClick={() => alAgregar()} className="boton-tenue px-2.5 py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Métrica
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className="self-center text-[10px] font-semibold uppercase tracking-[0.13em] text-pizarra">
          Sugeridas:
        </span>
        {METRICAS_SUGERIDAS.map((s) => (
          <button
            key={s.metrica}
            type="button"
            title={s.pregunta}
            onClick={() => alAgregar({ metrica: s.metrica, definicion: s.pregunta })}
            className="pastilla border-casco-700 bg-casco-950/5 text-pizarra transition hover:border-cian/50 hover:text-cian"
          >
            {s.pregunta}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filas.map((fila, indice) => {
          const sinUmbral = !fila.umbral.trim() && Boolean(fila.metrica.trim());
          const sinFuente = !fila.fuente.trim() && Boolean(fila.metrica.trim());
          return (
            <div key={fila.id} className="rounded-xl border border-casco-700 bg-casco-950/5 p-3.5">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="font-mono text-[11px] text-pizarra">
                  Métrica {String(indice + 1).padStart(2, "0")}
                </span>
                {filas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => alQuitar(fila.id)}
                    className="ml-auto text-pizarra-oscuro transition hover:text-ladrillo"
                    aria-label={`Quitar métrica ${indice + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="rotulo">Métrica</label>
                  <input
                    className="campo"
                    placeholder="Ej: % de usuarios que completan primer pedido"
                    value={fila.metrica}
                    onChange={(e) => alCambiar(fila.id, { metrica: e.target.value })}
                  />
                </div>
                <div>
                  <label className="rotulo">Definición</label>
                  <input
                    className="campo"
                    placeholder="Ej: Usuario que inicia sesión, añade algo y paga"
                    value={fila.definicion}
                    onChange={(e) => alCambiar(fila.id, { definicion: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="rotulo">Fuente y verificación</label>
                <input
                  className={`campo ${sinFuente ? "border-ladrillo/45" : ""}`}
                  placeholder="Ej: Base de datos de pedidos / Dashboard de Analytics"
                  value={fila.fuente}
                  onChange={(e) => alCambiar(fila.id, { fuente: e.target.value })}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="rotulo">Valor hoy</label>
                  <input
                    className="campo tabular"
                    placeholder="Ej: 12%"
                    value={fila.lineaBase}
                    onChange={(e) => alCambiar(fila.id, { lineaBase: e.target.value })}
                  />
                </div>
                <div>
                  <label className="rotulo">Meta</label>
                  <input
                    className={`campo tabular ${sinUmbral ? "border-ladrillo/45" : ""}`}
                    placeholder="Ej: 25%"
                    value={fila.umbral}
                    onChange={(e) => alCambiar(fila.id, { umbral: e.target.value })}
                  />
                </div>
                <div>
                  <label className="rotulo">Resultado</label>
                  <input
                    className="campo tabular"
                    placeholder="Ej: 18 de 50"
                    value={fila.resultado}
                    onChange={(e) => alCambiar(fila.id, { resultado: e.target.value })}
                  />
                </div>
              </div>

              {sinUmbral && (
                <p className="mt-2 text-[11px] leading-snug text-ladrillo-claro">
                  Sin un umbral fijado antes de ejecutar, cualquier resultado se puede interpretar
                  como éxito después.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 rounded-lg border border-casco-700 bg-casco-950/5 px-3 py-2 text-[11px] leading-relaxed text-pizarra">
        Una métrica sirve cuando su resultado cambia lo que van a hacer la semana siguiente.
      </p>
    </Paso>
  );
}
