import type { AuditResult, BlockCategory, IntakeData } from "./types";

const CATEGORIES: BlockCategory[] = ["Demanda", "Oferta", "Canal", "Operacion"];

function clampScore(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeCategory(value: unknown): BlockCategory {
  const raw = asString(value).toLowerCase();
  const hit = CATEGORIES.find((c) => c.toLowerCase() === raw);
  if (hit) return hit;
  if (raw.startsWith("operac")) return "Operacion";
  if (raw.startsWith("dem")) return "Demanda";
  if (raw.startsWith("of")) return "Oferta";
  if (raw.startsWith("can")) return "Canal";
  return "Demanda";
}

/**
 * Convierte la respuesta cruda del modelo en un AuditResult válido.
 * Gemini respeta el esquema casi siempre, pero la UI no puede romperse si no lo hace.
 */
export function normalizeAudit(
  raw: Record<string, unknown>,
  source: AuditResult["source"],
  model?: string,
): AuditResult {
  const sd = (raw.selfDeception ?? {}) as Record<string, unknown>;
  const exp = (raw.experiment ?? {}) as Record<string, unknown>;

  const questions = Array.isArray(raw.keyQuestions)
    ? raw.keyQuestions.map((q) => asString(q)).filter(Boolean)
    : [];
  while (questions.length < 2) {
    questions.push(
      questions.length === 0
        ? "¿Cuántas personas que no conocen a nadie del equipo ya pagaron?"
        : "¿Qué dato concreto los haría abandonar esta hipótesis esta semana?",
    );
  }

  const steps = Array.isArray(exp.steps)
    ? exp.steps.map((s) => asString(s)).filter(Boolean)
    : [];

  return {
    reliabilityScore: clampScore(raw.reliabilityScore),
    scoreRationale: asString(raw.scoreRationale, "Sin justificación devuelta por el modelo."),
    selfDeception: {
      detected: Boolean(sd.detected),
      headline: asString(sd.headline, "Sin salto lógico evidente"),
      detail: asString(sd.detail, ""),
    },
    blockCategory: normalizeCategory(raw.blockCategory),
    blockRationale: asString(raw.blockRationale, ""),
    keyQuestions: [questions[0], questions[1]],
    experiment: {
      title: asString(exp.title, "Prueba de disposición real"),
      hypothesis: asString(exp.hypothesis, ""),
      steps: steps.length ? steps : ["Definir el pedido concreto", "Contactar 20 prospectos reales", "Registrar respuestas en una hoja"],
      successThreshold: asString(exp.successThreshold, "3 de 20 en 48 horas"),
      cost: asString(exp.cost, "$0 USD"),
    },
    evidenceGap: asString(raw.evidenceGap, ""),
    source,
    model,
  };
}

const OVERCLAIM_PATTERNS = [
  /product[- ]?market fit/i,
  /\bvalidad[oa]s?\b/i,
  /\bcomprobad[oa]s?\b/i,
  /\bdemostrad[oa]s?\b/i,
  /les? (encant|fascin|gust)/i,
  /\btodos\b/i,
  /\bnadie\b/i,
  /muy interesad/i,
  /si lo (compraria|usaria)/i,
  /\bhuge\b|\benorme\b/i,
];

const CATEGORY_HINTS: { category: BlockCategory; patterns: RegExp[] }[] = [
  {
    category: "Demanda",
    patterns: [/\bcliente/i, /\bsegmento\b/i, /\bpaga/i, /\bventa/i, /\bdemanda\b/i, /\binteres/i, /\bnecesid/i],
  },
  {
    category: "Canal",
    patterns: [/\bcanal(es)?\b/i, /\banuncio/i, /\bads?\b/i, /\bcac\b/i, /\btrafico\b/i, /\bredes\b/i, /\balcanc/i, /\bdistribu/i],
  },
  {
    category: "Operacion",
    patterns: [/\boperaci/i, /\blogist/i, /\bcosto/i, /\bmargen/i, /\bentreg/i, /\bproveedor/i, /\bcapacidad\b/i, /\bsoport/i],
  },
  {
    category: "Oferta",
    patterns: [/\bproduct[oa]\b/i, /\bprototipo\b/i, /\bmvp\b/i, /\bfuncionalidad/i, /\bfeature/i, /\bcalidad\b/i, /\busabilidad/i],
  },
];

function firstNumber(text: string): number | null {
  const m = text.match(/\b(\d{1,6})\b/);
  return m ? Number(m[1]) : null;
}

/**
 * Auditoría de respaldo cuando no hay credenciales de Gemini configuradas.
 * Aplica las mismas reglas del prompt de forma determinística para que la app
 * siga siendo usable en una sesión real (y en demos sin red).
 */
export function heuristicAudit(intake: IntakeData): AuditResult {
  const level = intake.evidenceLevel ?? 1;
  const corpus = `${intake.problem} ${intake.action}`;
  const sample = firstNumber(intake.action);

  let score = level === 3 ? 72 : level === 2 ? 48 : 24;

  if (sample === null) score -= 12;
  else if (sample < 5) score -= 10;
  else if (sample >= 30) score += 8;

  const overclaims = OVERCLAIM_PATTERNS.filter((p) => p.test(corpus));
  score -= Math.min(24, overclaims.length * 8);

  if (/\bamig|famili|conocid|compañer|colega/i.test(corpus)) score -= 10;
  if (/\bpag(o|aron|ados?)\b|\banticipo|\bfactur|\bfirm/i.test(corpus)) score += 8;
  if (intake.action.trim().length < 40) score -= 8;

  // Piso de 5: un cero exacto en el velocímetro se lee como "sin dato", no como veredicto.
  score = Math.min(100, Math.max(5, score));

  const detected = overclaims.length > 0 || (level === 1 && /valid|fit|demanda/i.test(corpus));

  // Gana la categoría con más señales; en empate manda el orden de CATEGORY_HINTS (Demanda primero).
  const category = CATEGORY_HINTS.reduce<{ category: BlockCategory; hits: number }>(
    (best, hint) => {
      const hits = hint.patterns.filter((p) => p.test(corpus)).length;
      return hits > best.hits ? { category: hint.category, hits } : best;
    },
    { category: "Demanda", hits: 0 },
  ).category;

  const target = level === 3 ? "una recompra" : level === 2 ? "un pago real" : "una acción observable";

  return normalizeAudit(
    {
      reliabilityScore: score,
      scoreRationale:
        level === 3
          ? `Evidencia transaccional${sample ? ` con muestra de ${sample}` : " sin muestra declarada"}; el puntaje baja por lo que aún no está medido.`
          : `Evidencia de nivel ${level}: describe intención, no comportamiento de compra${sample ? ` (muestra ${sample})` : " y no declara muestra"}.`,
      selfDeception: {
        detected,
        headline: detected
          ? "La conclusión es más fuerte que el dato que la sostiene"
          : "Sin salto lógico evidente en lo declarado",
        detail: detected
          ? `El equipo usa lenguaje de validación (${overclaims.length} señal${overclaims.length === 1 ? "" : "es"}) sobre evidencia de nivel ${level}. Lo que tienen mide interés declarado; lo que están concluyendo requiere ${target}.`
          : "Lo declarado y la evidencia están al mismo nivel. Verifiquen la muestra y el denominador antes de escalar.",
      },
      blockCategory: category,
      blockRationale: `Lo reportado todavía no demuestra ${
        category === "Demanda"
          ? "que alguien fuera del círculo cercano quiera pagar"
          : category === "Oferta"
            ? "que la solución entregue el resultado prometido"
            : category === "Canal"
              ? "una forma repetible de alcanzar al segmento"
              : "que puedan entregar de forma sostenible"
      }.`,
      keyQuestions: [
        `¿Cuántas personas fuera de su círculo cercano hicieron ${target} y cuándo fue la última vez?`,
        "¿Qué resultado concreto los haría abandonar esta hipótesis esta semana?",
      ],
      experiment: {
        title: level === 3 ? "Repetir la venta con desconocidos" : "Pedido real con $0 de presupuesto",
        hypothesis: `Si el problema es real, al menos 3 de 20 prospectos desconocidos aceptan ${target} en 48 horas.`,
        steps: [
          "Escribir un pedido concreto de una línea: qué compran, a qué precio y cuándo.",
          "Contactar a 20 prospectos reales del segmento por canales que ya usan (WhatsApp, DM, correo).",
          `Registrar cada respuesta en una hoja: contactado / respondió / ${level === 3 ? "recompró" : "comprometió pago"}.`,
          "Cerrar a las 48 horas y comparar contra el umbral antes de interpretar.",
        ],
        successThreshold: "3 de 20 en 48 horas",
        cost: "$0 USD",
      },
      evidenceGap:
        level === 3
          ? "Falta volumen y repetición: la misma compra sostenida por clientes nuevos."
          : `Falta una transacción o un compromiso firmado para pasar del nivel ${level} al nivel ${level + 1}.`,
    },
    "heuristic",
  );
}
