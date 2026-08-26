"use client";

import { useState } from "react";
import { FileSearch, Plus, Trash2, TriangleAlert } from "lucide-react";
import Dictado from "./Dictado";
import Paso from "./Paso";
import { PASOS, TIPOS_EVIDENCIA, type TipoEvidencia } from "@/lib/guia";
import { anexarDictado } from "@/lib/useDictado";
import type { FilaEvidencia, LecturaEvidencia } from "@/lib/tipos";

const META = PASOS[1];

const TONO = {
  rojo: { activo: "border-ladrillo bg-ladrillo/20 text-ladrillo-claro", punto: "bg-ladrillo" },
  ambar: { activo: "border-ambar bg-ambar/20 text-ambar", punto: "bg-ambar" },
  verde: { activo: "border-menta bg-menta/20 text-menta", punto: "bg-menta" },
} as const;

function tonoConfiabilidad(valor: number) {
  if (valor >= 66) return "border-menta/40 bg-menta/10 text-menta";
  if (valor >= 36) return "border-ambar/40 bg-ambar/10 text-ambar";
  return "border-ladrillo/50 bg-ladrillo/10 text-ladrillo-claro";
}

interface Props {
  filas: FilaEvidencia[];
  lecturas: LecturaEvidencia[];
  alCambiar: (id: string, parche: Partial<FilaEvidencia>) => void;
  alAgregar: () => void;
  alQuitar: (id: string) => void;
  activo: boolean;
}

export default function PasoEvidencia({
  filas,
  lecturas,
  alCambiar,
  alAgregar,
  alQuitar,
  activo,
}: Props) {
  const [parcial, setParcial] = useState<Record<string, string>>({});
  const conContenido = filas.filter((f) => f.accion.trim() || f.resultado.trim());
  const completo = conContenido.length > 0 && conContenido.every((f) => f.soporte.trim());

  return (
    <Paso
      id="paso-evidencia"
      numero={META.numero}
      titulo={META.titulo}
      ayuda={META.ayuda}
      icono={FileSearch}
      activo={activo}
      completo={completo}
      accion={
        <button type="button" onClick={alAgregar} className="boton-tenue px-2.5 py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Acción
        </button>
      }
    >
      <div className="grid gap-3">
        {filas.map((fila, indice) => {
          const lectura = lecturas.find((l) => l.filaId === fila.id);
          const sinSoporte = !fila.soporte.trim() && Boolean(fila.accion.trim() || fila.resultado.trim());

          const dictar = (campo: keyof FilaEvidencia, etiqueta: string) => (
            <Dictado
              campo={etiqueta}
              alTexto={(trozo) => {
                alCambiar(fila.id, {
                  [campo]: anexarDictado(String(fila[campo] ?? ""), trozo),
                } as Partial<FilaEvidencia>);
                setParcial((p) => ({ ...p, [`${fila.id}-${campo}`]: "" }));
              }}
              alParcial={(trozo) => setParcial((p) => ({ ...p, [`${fila.id}-${campo}`]: trozo }))}
            />
          );

          return (
            <div
              key={fila.id}
              className={`rounded-xl border bg-casco-950/5 p-3.5 transition ${
                sinSoporte ? "border-ladrillo/35" : "border-casco-700"
              }`}
            >
              <div className="mb-2.5 flex items-center gap-2">
                <span className="font-mono text-[11px] text-pizarra">
                  Acción {String(indice + 1).padStart(2, "0")}
                </span>
                {lectura && (
                  <span className={`pastilla ${tonoConfiabilidad(lectura.confiabilidad)}`}>
                    Confiabilidad {lectura.confiabilidad}%
                  </span>
                )}
                {filas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => alQuitar(fila.id)}
                    className="ml-auto text-pizarra-oscuro transition hover:text-ladrillo"
                    aria-label={`Quitar acción ${indice + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="rotulo">
                    Acción ejecutada
                    <span className="ml-auto normal-case tracking-normal">{dictar("accion", "la acción")}</span>
                  </label>
                  <textarea
                    className="campo min-h-[100px] resize-y leading-relaxed"
                    placeholder="Ej: Lanzamos campaña en redes sociales (Instagram, Facebook) el 10 de agosto. Ofrecimos 20% descuento en primer pedido. Contactamos 100 usuarios existentes por WhatsApp."
                    value={fila.accion}
                    onChange={(e) => alCambiar(fila.id, { accion: e.target.value })}
                  />
                  {parcial[`${fila.id}-accion`] && (
                    <p className="mt-1 truncate text-[11px] italic text-cian/70">
                      …{parcial[`${fila.id}-accion`]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="rotulo">
                    Resultado
                    <span className="ml-auto normal-case tracking-normal">{dictar("resultado", "el resultado")}</span>
                  </label>
                  <textarea
                    className="campo min-h-[100px] resize-y leading-relaxed"
                    placeholder="Ej: De 100 contactos, 32 hicieron clic en el enlace. De esos 32, 18 completaron el primer pedido. Tasa de conversión: 18%. La campaña fue visto por 450 personas según Analytics."
                    value={fila.resultado}
                    onChange={(e) => alCambiar(fila.id, { resultado: e.target.value })}
                  />
                  {parcial[`${fila.id}-resultado`] && (
                    <p className="mt-1 truncate text-[11px] italic text-cian-claro/70">
                      …{parcial[`${fila.id}-resultado`]}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <label className="rotulo">
                  Soporte · ¿dónde está el dato?
                  <span className="ml-auto normal-case tracking-normal">{dictar("soporte", "el soporte")}</span>
                </label>
                <input
                  className={`campo ${sinSoporte ? "border-ladrillo/45 focus:border-ladrillo" : ""}`}
                  placeholder="Ej: Dashboard de Google Analytics (prueba: user@comidas-express.com), captura de conversiones en Stripe, hoja de Google Sheets con registro de pedidos"
                  value={fila.soporte}
                  onChange={(e) => alCambiar(fila.id, { soporte: e.target.value })}
                />
                {sinSoporte && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-ladrillo-claro">
                    <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                    Sin un soporte que se pueda verificar, esto todavía no cuenta como evidencia.
                  </p>
                )}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
                <div>
                  <span className="rotulo">Tipo de evidencia</span>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo de evidencia">
                    {TIPOS_EVIDENCIA.map((tipo) => {
                      const encendido = fila.tipo === tipo.clave;
                      const tono = TONO[tipo.tono];
                      return (
                        <button
                          key={tipo.clave}
                          type="button"
                          role="radio"
                          aria-checked={encendido}
                          title={`${tipo.define}. ${tipo.ejemplo}`}
                          onClick={() => alCambiar(fila.id, { tipo: tipo.clave as TipoEvidencia })}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition active:scale-[.97] ${
                            encendido
                              ? tono.activo
                              : "border-casco-700 text-pizarra hover:border-casco-600 hover:text-pizarra-oscuro"
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${tono.punto}`} />
                          {tipo.rotulo}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="rotulo">
                    Aprendizaje
                    <span className="ml-auto normal-case tracking-normal">
                      {dictar("aprendizaje", "el aprendizaje")}
                    </span>
                  </label>
                  <input
                    className="campo"
                    placeholder="Ej: Los descuentos alto atrayeron clicks pero muchos no completaron. WhatsApp fue más efectivo que Facebook. Necesitamos mejorar checkout para reducir abandonos."
                    value={fila.aprendizaje}
                    onChange={(e) => alCambiar(fila.id, { aprendizaje: e.target.value })}
                  />
                </div>
              </div>

              {lectura?.observacion && (
                <p className="mt-2.5 rounded-lg border border-cian/25 bg-cian/[0.07] px-3 py-2 text-[12px] leading-relaxed text-cian-tenue">
                  {lectura.observacion}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Paso>
  );
}
