/** Niveles de evidencia del semáforo metodológico. */
export type EvidenceLevel = 1 | 2 | 3;

export type BlockCategory = "Demanda" | "Oferta" | "Canal" | "Operacion";

export type Decision = "Mantener" | "Ajustar" | "Detener" | "Explorar";

export interface IntakeData {
  teamName: string;
  problem: string;
  action: string;
  evidenceLevel: EvidenceLevel | null;
}

export interface Experiment48h {
  title: string;
  hypothesis: string;
  steps: string[];
  successThreshold: string;
  cost: string;
}

export interface AuditResult {
  reliabilityScore: number;
  scoreRationale: string;
  selfDeception: {
    detected: boolean;
    headline: string;
    detail: string;
  };
  blockCategory: BlockCategory;
  blockRationale: string;
  keyQuestions: [string, string];
  experiment: Experiment48h;
  evidenceGap: string;
  /** "gemini" cuando la respuesta viene del modelo, "heuristic" en modo sin credenciales. */
  source: "gemini" | "heuristic";
  model?: string;
}

export interface MentorshipSession {
  id: string;
  createdAt: string;
  intake: IntakeData;
  audit: AuditResult | null;
  decision: Decision | null;
  decisionNote: string;
  elapsedSeconds: number;
}

export const EVIDENCE_LEVELS: {
  level: EvidenceLevel;
  label: string;
  short: string;
  examples: string;
  tone: "red" | "amber" | "green";
}[] = [
  {
    level: 1,
    label: "Nivel 1 · Declarativa",
    short: "Opiniones / Encuestas",
    examples: "Entrevistas, encuestas, «les encantó la idea»",
    tone: "red",
  },
  {
    level: 2,
    label: "Nivel 2 · Conductual",
    short: "Registros / Clics",
    examples: "Landing, waitlist, clics, formularios completados",
    tone: "amber",
  },
  {
    level: 3,
    label: "Nivel 3 · Transaccional",
    short: "Ventas / Pagos / Compromisos",
    examples: "Pagos, cartas de intención firmadas, anticipos",
    tone: "green",
  },
];

export const BLOCK_CATEGORIES: BlockCategory[] = [
  "Demanda",
  "Oferta",
  "Canal",
  "Operacion",
];

/** El valor interno viaja sin tildes (estable para el enum del modelo); la UI muestra el rotulo. */
export const BLOCK_LABELS: Record<BlockCategory, string> = {
  Demanda: "Demanda",
  Oferta: "Oferta",
  Canal: "Canal",
  Operacion: "Operación",
};

export const BLOCK_HINTS: Record<BlockCategory, string> = {
  Demanda: "Nadie ha demostrado todavía que quiere o paga esto.",
  Oferta: "La solución no resuelve o no se entrega con la calidad prometida.",
  Canal: "Hay demanda, pero no una forma repetible y rentable de alcanzarla.",
  Operacion: "Pueden vender, pero no entregar ni sostener la unidad económica.",
};

export const DECISIONS: {
  key: Decision;
  helper: string;
  tone: "green" | "amber" | "red" | "blue";
}[] = [
  { key: "Mantener", helper: "La evidencia sostiene la ruta actual", tone: "green" },
  { key: "Ajustar", helper: "Misma apuesta, corregir una variable", tone: "amber" },
  { key: "Detener", helper: "La hipótesis quedó refutada", tone: "red" },
  { key: "Explorar", helper: "Falta evidencia para decidir", tone: "blue" },
];
