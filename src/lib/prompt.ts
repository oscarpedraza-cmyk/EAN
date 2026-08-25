import type { IntakeData } from "./types";

export const SYSTEM_INSTRUCTION = `Eres el "Co-piloto de Mentoría": un auditor de evidencia brutalmente honesto que asiste
a un mentor durante una sesión exprés de 20 minutos con un equipo emprendedor.

Tu único trabajo es separar la RETÓRICA del equipo de la EVIDENCIA real y devolver munición
accionable para el mentor. Nunca felicites, nunca uses lenguaje motivacional, nunca suavices.

ESCALA DE EVIDENCIA (semáforo):
- Nivel 1 (Rojo, declarativa): opiniones, encuestas, entrevistas, "les encantó". Casi no vale.
- Nivel 2 (Amarillo, conductual): registros, clics, waitlist, formularios. Vale, pero no prueba disposición a pagar.
- Nivel 3 (Verde, transaccional): ventas, pagos, anticipos, cartas de intención firmadas. Es lo único que prueba demanda real.

CÓMO CALIFICAR EL "RELIABILITY SCORE" (0-100):
- 0-35: la conclusión del equipo se apoya en evidencia Nivel 1, muestras diminutas, o el resultado
  reportado no se deriva de la acción ejecutada.
- 36-65: evidencia Nivel 2 razonable, o Nivel 3 con muestra muy pequeña o sesgo de cercanía (amigos, familia).
- 66-100: evidencia Nivel 3 con volumen o repetición, medida sobre desconocidos, con umbral definido de antemano.
Penaliza siempre: muestras sin número, "todos dijeron que sí", ausencia de grupo de control,
resultados sin denominador, y cualquier conclusión más fuerte que el dato que la sostiene.

AUTO-ENGAÑO: márcalo como detectado cuando el equipo extrapola una conclusión de negocio
(demanda validada, product-market fit, disposición a pagar) desde evidencia que no la soporta,
o cuando el nivel de evidencia que declara es mayor al que realmente describe.

CATEGORÍA DE BLOQUEO: elige exactamente una.
- "Demanda": nadie ha demostrado que quiere o paga esto.
- "Oferta": la solución no resuelve, o no se puede entregar con la calidad prometida.
- "Canal": existe demanda pero no saben alcanzarla de forma repetible y rentable.
- "Operacion": pueden vender pero no entregar ni sostener la unidad económica.

PREGUNTAS CLAVE: exactamente 2, cortas (máximo 18 palabras), dirigidas al equipo,
imposibles de responder con retórica. Cada una debe exigir un número, una fecha o un nombre propio.

EXPERIMENTO 48 HORAS: debe costar 0 USD, ejecutarse con lo que el equipo ya tiene,
producir evidencia de un nivel mayor al actual, y traer un UMBRAL DE ÉXITO numérico
definido de antemano (formato "X de Y en Z horas").

Responde SIEMPRE en español neutro y únicamente con el JSON solicitado.`;

const LEVEL_TEXT: Record<number, string> = {
  1: "Nivel 1 (Rojo) · Opiniones / Encuestas",
  2: "Nivel 2 (Amarillo) · Registros / Clics",
  3: "Nivel 3 (Verde) · Ventas / Pagos / Compromisos firmados",
};

export function buildUserPrompt(intake: IntakeData): string {
  return [
    `EQUIPO: ${intake.teamName || "(sin nombre)"}`,
    "",
    `PROBLEMA / SEGMENTO declarado por el equipo:`,
    intake.problem || "(no informado)",
    "",
    `ACCIÓN EJECUTADA Y RESULTADO reportado:`,
    intake.action || "(no informado)",
    "",
    `NIVEL DE EVIDENCIA que el equipo se auto-asigna: ${
      intake.evidenceLevel ? LEVEL_TEXT[intake.evidenceLevel] : "(no seleccionado)"
    }`,
    "",
    "Audita esta declaración y devuelve el JSON.",
  ].join("\n");
}

/** Esquema de respuesta forzado para Gemini (responseSchema). Tipos en mayúsculas, según la API. */
export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reliabilityScore: {
      type: "INTEGER",
      description: "Confiabilidad de la evidencia, 0 a 100.",
    },
    scoreRationale: {
      type: "STRING",
      description: "Una sola frase (máximo 25 palabras) justificando el puntaje.",
    },
    selfDeception: {
      type: "OBJECT",
      properties: {
        detected: { type: "BOOLEAN" },
        headline: {
          type: "STRING",
          description: "Titular de 6 a 10 palabras nombrando el salto lógico.",
        },
        detail: {
          type: "STRING",
          description: "Máximo 2 frases: qué dato tienen contra qué están concluyendo.",
        },
      },
      required: ["detected", "headline", "detail"],
    },
    blockCategory: {
      type: "STRING",
      enum: ["Demanda", "Oferta", "Canal", "Operacion"],
    },
    blockRationale: {
      type: "STRING",
      description: "Una frase explicando por qué ese es el cuello de botella.",
    },
    keyQuestions: {
      type: "ARRAY",
      description: "Exactamente 2 preguntas para que el mentor las lea en voz alta.",
      items: { type: "STRING" },
      minItems: "2",
      maxItems: "2",
    },
    experiment: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Nombre corto del experimento." },
        hypothesis: { type: "STRING", description: "Hipótesis falsable en una frase." },
        steps: {
          type: "ARRAY",
          description: "3 a 4 pasos ejecutables hoy mismo, sin presupuesto.",
          items: { type: "STRING" },
          minItems: "3",
          maxItems: "4",
        },
        successThreshold: {
          type: "STRING",
          description: "Umbral numérico definido de antemano. Formato: X de Y en Z horas.",
        },
        cost: { type: "STRING", description: "Siempre '$0 USD'." },
      },
      required: ["title", "hypothesis", "steps", "successThreshold", "cost"],
    },
    evidenceGap: {
      type: "STRING",
      description: "Qué dato falta para subir un nivel en el semáforo de evidencia.",
    },
  },
  required: [
    "reliabilityScore",
    "scoreRationale",
    "selfDeception",
    "blockCategory",
    "blockRationale",
    "keyQuestions",
    "experiment",
    "evidenceGap",
  ],
} as const;
