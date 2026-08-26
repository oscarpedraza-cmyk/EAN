"use client";

import { useState } from "react";
import {
  Check,
  Cloud,
  CloudOff,
  Compass,
  FileDown,
  Loader2,
  Mail,
  OctagonX,
  Recycle,
  Save,
  Signature,
  SlidersHorizontal,
} from "lucide-react";
import Paso from "./Paso";
import { CHEQUEO_CIERRE, DECISIONES, PASOS, RESULTADO_ESPERADO, type ChequeoId, type Decision } from "@/lib/guia";
import type { Destino } from "@/lib/almacenamiento";
import type { Encuentro, SegundoCiclo } from "@/lib/tipos";

const META = PASOS[4];

const TONO = {
  verde: "border-menta bg-menta/15 text-menta ring-2 ring-menta/20",
  ambar: "border-ambar bg-ambar/15 text-ambar ring-2 ring-ambar/20",
  rojo: "border-ladrillo bg-ladrillo/15 text-ladrillo-claro ring-2 ring-ladrillo/20",
  cian: "border-cian bg-cian/15 text-cian-claro ring-2 ring-cian/20",
} as const;

const ICONO: Record<Decision, typeof Check> = {
  Mantener: Check,
  Ajustar: SlidersHorizontal,
  Detener: OctagonX,
  Explorar: Compass,
};

interface Props {
  encuentro: Encuentro;
  alDecidir: (decision: Decision) => void;
  alSustentar: (texto: string) => void;
  alCambiarCiclo: (parche: Partial<SegundoCiclo>) => void;
  alMarcar: (id: ChequeoId, valor: boolean) => void;
  /** Vuelve a auditar con el segundo ciclo ya diseñado, para recalcular el pre-mortem. */
  alRevisarDiseno: () => void;
  revisando: boolean;
  disenoRevisado: boolean;
  alExportar: () => Promise<void>;
  alEnviar: () => void;
  alGuardar: () => Promise<void>;
  guardando: boolean;
  guardadoEn: Destino | null;
  firebaseListo: boolean;
  activo: boolean;
}

export default function PasoCierre({
  encuentro,
  alDecidir,
  alSustentar,
  alCambiarCiclo,
  alMarcar,
  alRevisarDiseno,
  revisando,
  disenoRevisado,
  alExportar,
  alEnviar,
  alGuardar,
  guardando,
  guardadoEn,
  firebaseListo,
  activo,
}: Props) {
  const [exportando, setExportando] = useState(false);
  const { segundoCiclo, chequeo } = encuentro;

  const hayDiseno = Boolean(segundoCiclo.accion.trim() || segundoCiclo.umbral.trim());
  const marcados = CHEQUEO_CIERRE.filter((c) => chequeo[c.id]).length;
  const listo = marcados === CHEQUEO_CIERRE.length && Boolean(encuentro.decision);

  const exportar = async () => {
    setExportando(true);
    try {
      await alExportar();
    } finally {
      setExportando(false);
    }
  };

  const campoCiclo = (
    clave: keyof SegundoCiclo,
    etiqueta: string,
    marcador: string,
    tipo: "text" | "date" = "text",
  ) => (
    <div>
      <label className="rotulo" htmlFor={`ciclo-${clave}`}>
        {etiqueta}
      </label>
      <input
        id={`ciclo-${clave}`}
        type={tipo}
        className="campo"
        placeholder={marcador}
        value={segundoCiclo[clave]}
        onChange={(e) => alCambiarCiclo({ [clave]: e.target.value } as Partial<SegundoCiclo>)}
      />
    </div>
  );

  return (
    <Paso
      id="paso-cierre"
      numero={META.numero}
      titulo={META.titulo}
      ayuda={META.ayuda}
      icono={Signature}
      activo={activo}
      completo={listo}
      accion={
        <span
          className={`pastilla ${
            firebaseListo
              ? "border-menta/30 bg-menta/10 text-menta"
              : "border-white/10 bg-white/[0.03] text-pizarra"
          }`}
          title={firebaseListo ? "Firestore configurado" : "Sin Firestore: se guarda en este navegador"}
        >
          {firebaseListo ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
          {firebaseListo ? "Firestore" : "Local"}
        </span>
      }
    >
      <div className="grid gap-4">
        <div>
          <span className="rotulo">Decisión, con la evidencia que la justifica</span>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {DECISIONES.map(({ clave, cuando, pregunta, tono }) => {
              const Icono = ICONO[clave];
              const encendido = encuentro.decision === clave;
              return (
                <button
                  key={clave}
                  type="button"
                  aria-pressed={encendido}
                  title={pregunta}
                  onClick={() => alDecidir(clave)}
                  className={`rounded-xl border border-white/10 bg-casco-950/50 p-3 text-left text-slate-300 transition active:scale-[.98] ${
                    encendido ? TONO[tono] : "hover:border-white/25"
                  }`}
                >
                  <Icono className="h-4.5 w-4.5" />
                  <p className="mt-1.5 text-sm font-bold">{clave}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-pizarra">{cuando}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="rotulo" htmlFor="sustento">
            ¿Qué evidencia sustenta esa decisión?
          </label>
          <textarea
            id="sustento"
            className="campo min-h-[62px] resize-y leading-relaxed"
            placeholder="Cita la acción y el número concreto, no la impresión general."
            value={encuentro.sustentoDecision}
            onChange={(e) => alSustentar(e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-casco-950/40 p-3.5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <p className="rotulo mb-0">Diseño del segundo ciclo</p>
            <button
              type="button"
              onClick={alRevisarDiseno}
              disabled={revisando || !hayDiseno}
              className="boton-tenue px-2.5 py-1.5 text-xs"
              title="Recalcula la muestra mínima y el mapa de decisión con este diseño"
            >
              {revisando ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Recycle className="h-3.5 w-3.5" />
              )}
              Revisar este diseño
            </button>
          </div>
          {hayDiseno && !disenoRevisado && !revisando && (
            <p className="mb-2 text-[11px] leading-snug text-ambar">
              Este diseño todavía no pasó por el pre-mortem: revísenlo antes de comprometerse con él.
            </p>
          )}
          <div className="grid gap-3">
            {campoCiclo("hipotesisAjustada", "Hipótesis ajustada", "Creemos que…")}
            {campoCiclo("accion", "Acción", "Qué van a hacer y con cuántas personas.")}
            <div className="grid gap-3 sm:grid-cols-2">
              {campoCiclo("metrica", "Métrica", "Qué van a medir.")}
              {campoCiclo("umbral", "Umbral", "Éxito si… (número, fijado hoy)")}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {campoCiclo("responsable", "Responsable", "Nombre propio.")}
              {campoCiclo("fecha", "Fecha", "", "date")}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-casco-950/40 p-3.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="rotulo mb-0">Chequeo de cierre</p>
            <span
              className={`pastilla ${
                marcados === CHEQUEO_CIERRE.length
                  ? "border-menta/40 bg-menta/10 text-menta"
                  : "border-white/10 bg-white/[0.03] text-pizarra"
              }`}
            >
              {marcados} / {CHEQUEO_CIERRE.length}
            </span>
          </div>
          <div className="grid gap-1">
            {CHEQUEO_CIERRE.map((item) => {
              const marcado = Boolean(chequeo[item.id]);
              return (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/[0.03]"
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={(e) => alMarcar(item.id, e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#00d494]"
                  />
                  <span
                    className={`text-[12.5px] leading-snug ${marcado ? "text-slate-300" : "text-pizarra"}`}
                  >
                    {item.texto}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportar} disabled={!listo || exportando} className="boton-menta">
            {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Ficha del encuentro (PDF)
          </button>
          <button type="button" onClick={alEnviar} disabled={!listo} className="boton-tenue">
            <Mail className="h-4 w-4" />
            Enviar por correo
          </button>
          <button type="button" onClick={alGuardar} disabled={guardando} className="boton-tenue">
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Descargar PDF
          </button>
        </div>

        <p className="text-[11px] leading-relaxed text-pizarra">
          {listo ? (
            <>
              <span className="font-semibold text-menta">Resultado del encuentro: </span>
              {RESULTADO_ESPERADO}
            </>
          ) : (
            "La ficha se habilita cuando haya una decisión registrada y los seis puntos del chequeo estén verificados."
          )}
        </p>
      </div>
    </Paso>
  );
}
