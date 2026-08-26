import type {
  Bloqueo,
  ChequeoId,
  Decision,
  EstadoHipotesis,
  TipoEvidencia,
} from "./guia";

/** Fila de la Auditoría de evidencia: acción · soporte · resultado · confiabilidad · aprendizaje. */
export interface FilaEvidencia {
  id: string;
  accion: string;
  /** Dónde está el dato. Sin soporte, la guía no lo considera evidencia. */
  soporte: string;
  resultado: string;
  tipo: TipoEvidencia | null;
  aprendizaje: string;
}

/** Fila del tablero de métricas, con las columnas que exige la guía. */
export interface FilaMetrica {
  id: string;
  metrica: string;
  definicion: string;
  fuente: string;
  lineaBase: string;
  umbral: string;
  resultado: string;
}

export interface Ejecucion {
  equipo: string;
  planAcordado: string;
  loEjecutado: string;
  desviaciones: string;
}

export interface SegundoCiclo {
  hipotesisAjustada: string;
  accion: string;
  metrica: string;
  umbral: string;
  responsable: string;
  fecha: string;
}

/** Confiabilidad de una fila de evidencia, evaluada individualmente. */
export interface LecturaEvidencia {
  filaId: string;
  confiabilidad: number;
  estado: EstadoHipotesis;
  observacion: string;
  /** Verdadero cuando el equipo no pudo nombrar dónde está el dato. */
  sinSoporte: boolean;
}

/** Umbral contra el que se puede decidir, o no. */
export interface PreMortem {
  puedeDecidir: boolean;
  muestraMinima: string;
  advertencia: string;
  mapaDecision: {
    mantener: string;
    ajustar: string;
    detener: string;
    explorar: string;
  };
  variableACambiar: string;
  variablesACongelar: string[];
}

export interface Interpretacion {
  confiabilidadGlobal: number;
  estadoGlobal: EstadoHipotesis;
  lecturaGeneral: string;
  lecturas: LecturaEvidencia[];
  /** "Evita celebrar o descartar una cifra aislada": qué contradice lo que esperaban. */
  contradicciones: string[];
  /** "¿Qué están interpretando a partir de una muestra todavía insuficiente?" */
  muestraInsuficiente: string;
  /** "Protege el aprendizaje": qué se ganó aunque no se cumpliera el umbral. */
  aprendizajeRescatado: string;
  bloqueoPrincipal: Bloqueo;
  razonBloqueo: string;
  /** Dos preguntas para que el mentor las lea en voz alta. */
  preguntasMentor: [string, string];
  preMortem: PreMortem;
  origen: "gemini" | "local";
  modelo?: string;
}

export interface Encuentro {
  id: string;
  creadoEn: string;
  ejecucion: Ejecucion;
  evidencias: FilaEvidencia[];
  metricas: FilaMetrica[];
  interpretacion: Interpretacion | null;
  decision: Decision | null;
  sustentoDecision: string;
  segundoCiclo: SegundoCiclo;
  chequeo: Record<ChequeoId, boolean>;
}

export function nuevoId(prefijo = "f"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefijo}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefijo}-${Math.random().toString(36).slice(2, 10)}`;
}

export function filaEvidenciaVacia(): FilaEvidencia {
  return { id: nuevoId("ev"), accion: "", soporte: "", resultado: "", tipo: null, aprendizaje: "" };
}

export function filaMetricaVacia(): FilaMetrica {
  return {
    id: nuevoId("me"),
    metrica: "",
    definicion: "",
    fuente: "",
    lineaBase: "",
    umbral: "",
    resultado: "",
  };
}
