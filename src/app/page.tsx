"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cabecera from "@/componentes/Cabecera";
import PasoCierre from "@/componentes/PasoCierre";
import PasoEjecucion from "@/componentes/PasoEjecucion";
import PasoEvidencia from "@/componentes/PasoEvidencia";
import PasoInterpretacion from "@/componentes/PasoInterpretacion";
import PasoMetricas from "@/componentes/PasoMetricas";
import { guardarEncuentro, type Destino } from "@/lib/almacenamiento";
import { cuerpoCorreo, generarFicha } from "@/lib/ficha";
import { firebaseConfigurado } from "@/lib/firebase";
import { CHEQUEO_CIERRE, type ChequeoId, type Decision, type PasoId } from "@/lib/guia";
import {
  filaEvidenciaVacia,
  filaMetricaVacia,
  nuevoId,
  type Ejecucion,
  type Encuentro,
  type FilaEvidencia,
  type FilaMetrica,
  type Interpretacion,
  type SegundoCiclo,
} from "@/lib/tipos";
import { useTiempo } from "@/lib/useTiempo";

const EJECUCION_VACIA: Ejecucion = {
  equipo: "",
  planAcordado: "",
  loEjecutado: "",
  desviaciones: "",
};

const CICLO_VACIO: SegundoCiclo = {
  hipotesisAjustada: "",
  accion: "",
  metrica: "",
  umbral: "",
  responsable: "",
  fecha: "",
};

const CHEQUEO_VACIO = Object.fromEntries(
  CHEQUEO_CIERRE.map((c) => [c.id, false]),
) as Record<ChequeoId, boolean>;

export default function Inicio() {
  const tiempo = useTiempo();
  const [id] = useState(() => nuevoId("enc"));
  const [creadoEn] = useState(() => new Date().toISOString());

  const [ejecucion, setEjecucion] = useState<Ejecucion>(EJECUCION_VACIA);
  const [evidencias, setEvidencias] = useState<FilaEvidencia[]>(() => [filaEvidenciaVacia()]);
  const [metricas, setMetricas] = useState<FilaMetrica[]>(() => [filaMetricaVacia()]);
  const [interpretacion, setInterpretacion] = useState<Interpretacion | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [sustentoDecision, setSustentoDecision] = useState("");
  const [segundoCiclo, setSegundoCiclo] = useState<SegundoCiclo>(CICLO_VACIO);
  const [chequeo, setChequeo] = useState<Record<ChequeoId, boolean>>(CHEQUEO_VACIO);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardadoEn, setGuardadoEn] = useState<Destino | null>(null);
  const [pasoActivo, setPasoActivo] = useState<PasoId>("ejecucion");

  const [firmaAuditada, setFirmaAuditada] = useState<string | null>(null);

  const abortoRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortoRef.current?.abort(), []);

  const encuentro: Encuentro = useMemo(
    () => ({
      id,
      creadoEn,
      ejecucion,
      evidencias,
      metricas,
      interpretacion,
      decision,
      sustentoDecision,
      segundoCiclo,
      chequeo,
    }),
    [id, creadoEn, ejecucion, evidencias, metricas, interpretacion, decision, sustentoDecision, segundoCiclo, chequeo],
  );

  /** Huella de todo lo que alimenta la auditoría, para saber si quedó desactualizada. */
  const firmaActual = useMemo(
    () =>
      JSON.stringify([
        ejecucion,
        evidencias.map((f) => [f.accion, f.soporte, f.resultado, f.tipo, f.aprendizaje]),
        metricas.map((m) => [m.metrica, m.definicion, m.fuente, m.lineaBase, m.umbral, m.resultado]),
        [segundoCiclo.hipotesisAjustada, segundoCiclo.accion, segundoCiclo.metrica, segundoCiclo.umbral],
      ]),
    [ejecucion, evidencias, metricas, segundoCiclo],
  );

  const desactualizada = interpretacion !== null && firmaAuditada !== firmaActual;

  const puedeInterpretar =
    Boolean(ejecucion.loEjecutado.trim()) ||
    evidencias.some((f) => f.accion.trim() || f.resultado.trim());

  const auditar = useCallback(async () => {
    if (!puedeInterpretar || cargando) return;
    abortoRef.current?.abort();
    const control = new AbortController();
    abortoRef.current = control;

    setCargando(true);
    setError(null);
    setAviso(null);
    try {
      const respuesta = await fetch("/api/interpretar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encuentro),
        signal: control.signal,
      });
      const datos = (await respuesta.json()) as {
        interpretacion?: Interpretacion;
        aviso?: string;
        error?: string;
      };
      if (!respuesta.ok || !datos.interpretacion) {
        setError(datos.error ?? "No se pudo completar la auditoría.");
        return;
      }
      setInterpretacion(datos.interpretacion);
      setAviso(datos.aviso ?? null);
      setFirmaAuditada(firmaActual);
      setGuardadoEn(null);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError("Sin conexión con el servicio de auditoría. Revisa la red e intenta de nuevo.");
    } finally {
      if (abortoRef.current === control) {
        abortoRef.current = null;
        setCargando(false);
      }
    }
  }, [puedeInterpretar, cargando, encuentro, firmaActual]);

  const irA = useCallback((destino: PasoId) => {
    setPasoActivo(destino);
    document.getElementById(`paso-${destino}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const guardar = useCallback(async () => {
    setGuardando(true);
    try {
      setGuardadoEn(await guardarEncuentro(encuentro));
    } finally {
      setGuardando(false);
    }
  }, [encuentro]);

  const exportar = useCallback(async () => {
    await generarFicha(encuentro);
    void guardar();
  }, [encuentro, guardar]);

  const enviarCorreo = useCallback(() => {
    const asunto = `Mentoría 2 — ${encuentro.ejecucion.equipo || "Equipo"}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(
      cuerpoCorreo(encuentro),
    )}`;
  }, [encuentro]);

  const conEvidencia = evidencias.filter((f) => f.accion.trim() || f.resultado.trim());
  const conMetrica = metricas.filter((m) => m.metrica.trim());

  const completados: Record<PasoId, boolean> = {
    ejecucion: Boolean(ejecucion.loEjecutado.trim()),
    evidencia: conEvidencia.length > 0 && conEvidencia.every((f) => f.soporte.trim()),
    metricas: conMetrica.length > 0 && conMetrica.every((m) => m.fuente.trim() && m.umbral.trim()),
    bloqueo: Boolean(interpretacion),
    ciclo:
      Boolean(decision) && CHEQUEO_CIERRE.every((c) => chequeo[c.id]),
  };

  return (
    <div className="min-h-screen">
      <Cabecera
        pasoActivo={pasoActivo}
        completados={completados}
        alIrA={irA}
        segundos={tiempo.segundos}
        corriendo={tiempo.corriendo}
        alAlternar={tiempo.alternar}
        alReiniciar={tiempo.reiniciar}
      />

      {/* Dos columnas independientes: en móvil se apilan y dan el orden 01→05 sin huecos. */}
      <main className="mx-auto grid max-w-7xl items-start gap-3.5 px-4 py-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3.5">
          <PasoEjecucion
            valor={ejecucion}
            alCambiar={(parche) => {
              setEjecucion((v) => ({ ...v, ...parche }));
              setGuardadoEn(null);
            }}
            activo={pasoActivo === "ejecucion"}
          />

          <PasoEvidencia
            filas={evidencias}
            lecturas={interpretacion?.lecturas ?? []}
            alCambiar={(idFila, parche) =>
              setEvidencias((filas) => filas.map((f) => (f.id === idFila ? { ...f, ...parche } : f)))
            }
            alAgregar={() => setEvidencias((filas) => [...filas, filaEvidenciaVacia()])}
            alQuitar={(idFila) => setEvidencias((filas) => filas.filter((f) => f.id !== idFila))}
            activo={pasoActivo === "evidencia"}
          />

          <PasoMetricas
            filas={metricas}
            alCambiar={(idFila, parche) =>
              setMetricas((filas) => filas.map((m) => (m.id === idFila ? { ...m, ...parche } : m)))
            }
            alAgregar={(semilla) =>
              setMetricas((filas) => {
                if (!semilla) return [...filas, filaMetricaVacia()];
                // Una sugerencia llena la primera fila en blanco antes de crear otra.
                const vacia = filas.findIndex((m) => !m.metrica.trim() && !m.fuente.trim());
                if (vacia >= 0) {
                  return filas.map((m, i) => (i === vacia ? { ...m, ...semilla } : m));
                }
                return [...filas, { ...filaMetricaVacia(), ...semilla }];
              })
            }
            alQuitar={(idFila) => setMetricas((filas) => filas.filter((m) => m.id !== idFila))}
            activo={pasoActivo === "metricas"}
          />
        </div>

        <div className="flex flex-col gap-3.5">
          <PasoInterpretacion
            interpretacion={interpretacion}
            cargando={cargando}
            error={error}
            aviso={aviso}
            desactualizada={desactualizada}
            puedeInterpretar={puedeInterpretar}
            alInterpretar={() => {
              setPasoActivo("bloqueo");
              void auditar();
            }}
            activo={pasoActivo === "bloqueo"}
          />

          <PasoCierre
            encuentro={encuentro}
            alDecidir={(valor) => {
              setDecision(valor);
              setPasoActivo("ciclo");
              setGuardadoEn(null);
            }}
            alSustentar={setSustentoDecision}
            alCambiarCiclo={(parche) => setSegundoCiclo((v) => ({ ...v, ...parche }))}
            alMarcar={(idCheck, valor) => setChequeo((c) => ({ ...c, [idCheck]: valor }))}
            alRevisarDiseno={() => void auditar()}
            revisando={cargando}
            disenoRevisado={Boolean(interpretacion) && !desactualizada}
            alExportar={exportar}
            alEnviar={enviarCorreo}
            alGuardar={guardar}
            guardando={guardando}
            guardadoEn={guardadoEn}
            firebaseListo={firebaseConfigurado}
            activo={pasoActivo === "ciclo"}
          />
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-6 text-center text-[10px] text-pizarra-oscuro">
        Apoyo a la conversación de mentoría. No sustituye los entregables definidos en el curso.
      </footer>
    </div>
  );
}
