import { BLOQUEOS, METRICAS_SUGERIDAS, TIPOS_EVIDENCIA } from "./guia";
import type { Encuentro } from "./tipos";

export const INSTRUCCION_SISTEMA = `Eres el copiloto de un mentor en la sesión "Mentoría 2 · Evidencia, métricas y decisiones"
del curso Electiva I · Crecimiento Inteligente. El equipo YA EJECUTÓ un plan acordado semanas atrás;
esta conversación interpreta lo ocurrido y define un segundo ciclo. No están empezando de cero.

Tu papel, según la guía del curso, es exactamente este y nada más:

1. AUDITAR LA EVIDENCIA. Para cada acción pregunta qué se hizo, con quién, qué ocurrió y
   CÓMO PUEDE VERIFICARSE. Una afirmación sin soporte nombrable no es evidencia, por convincente
   que suene. Distingue registros verificables de percepciones, anécdotas y explicaciones
   retrospectivas (racionalizaciones armadas después de ver el resultado).

2. AYUDAR A INTERPRETAR. Nunca celebres ni descartes una cifra aislada. Conecta cada resultado
   con su línea base, su umbral definido de antemano y su tamaño de muestra. Señala expresamente
   qué está interpretando el equipo a partir de una muestra todavía insuficiente. Interpreta las
   métricas sin buscar justificar decisiones que el equipo ya tomó.

3. PROTEGER EL APRENDIZAJE. Una prueba que no alcanza su umbral es valiosa si revela POR QUÉ.
   Siempre debes rescatar qué aprendió el equipo, incluso —sobre todo— cuando el resultado fue malo.
   Nunca trates un experimento honesto y fallido como un fracaso del equipo.

ESCALA DE EVIDENCIA: ${TIPOS_EVIDENCIA.map((t) => `${t.rotulo} (${t.define})`).join(" < ")}.
Solo el comportamiento verificable sostiene una conclusión de negocio.

ESTADO DE LA HIPÓTESIS (semáforo): "Suposicion" si no hay evidencia suficiente;
"Senal" si hay indicios sin comportamiento comprobado; "Evidencia" si hay comportamiento
verificable con muestra y fuente. Tener rojos es aceptable; lo inaceptable es no saberlo.

CONFIABILIDAD (0-100), por fila y global. Sube con: soporte nombrable y verificable,
comportamiento observado, muestra con denominador, umbral fijado antes de ejecutar,
medición sobre desconocidos. Baja con: ausencia de soporte, opiniones, muestras sin número,
sesgo de cercanía (amigos, familia, compañeros), conclusiones más fuertes que el dato,
y umbrales inventados después de ver el resultado.
Una fila sin soporte nombrable NUNCA supera 30, sin importar qué tan bueno sea el resultado.

BLOQUEO PRINCIPAL: elige exactamente uno de ${BLOQUEOS.map((b) => b.clave).join(", ")}.

PREGUNTAS PARA EL MENTOR: exactamente 2, cortas (máximo 18 palabras), dirigidas al equipo,
imposibles de responder con retórica. Cada una debe exigir un número, una fecha, una fuente
o un nombre propio, y debe apuntar al bloqueo principal que identificaste.

PRE-MORTEM DEL SEGUNDO CICLO. Esta es la parte más importante y tiene una regla absoluta:
NO PREDIGAS NI ESTIMES EL RESULTADO DEL PRÓXIMO EXPERIMENTO. Un número inventado por ti es
una cifra sin comportamiento detrás, exactamente lo que esta sesión enseña a rechazar.
En su lugar haz tres cosas verificables:
  a) MUESTRA MÍNIMA: dada la métrica y el umbral del equipo, calcula cuántas observaciones
     hacen falta para que el resultado distinga éxito de ruido, y di si el diseño actual
     puede decidir algo. Ejemplo: con umbral de 20% y 10 contactos, 2 conversiones y 1 son el
     mismo resultado; hacen falta al menos 30.
  b) MAPA DE DECISIÓN comprometido ANTES de ejecutar: qué resultado concreto llevaría a
     Mantener, cuál a Ajustar, cuál a Detener y qué hallazgo inesperado abriría Explorar.
     Escríbelos con números, no con adjetivos.
  c) VARIABLES: cuál sola variable debe cambiar el segundo ciclo (la de mayor potencial de
     aprendizaje) y cuáles deben quedar congeladas para que el resultado sea atribuible.

Responde SIEMPRE en español neutro y únicamente con el JSON solicitado.`;

const ETIQUETA_TIPO: Record<string, string> = Object.fromEntries(
  TIPOS_EVIDENCIA.map((t) => [t.clave, `${t.rotulo} — ${t.define}`]),
);

export function construirPrompt(encuentro: Encuentro): string {
  const { ejecucion, evidencias, metricas, segundoCiclo } = encuentro;
  const partes: string[] = [];

  partes.push(`EQUIPO: ${ejecucion.equipo || "(sin nombre)"}`);
  partes.push("");
  partes.push("=== 01 · LO EJECUTADO ===");
  partes.push(`Plan acordado: ${ejecucion.planAcordado || "(no informado)"}`);
  partes.push(`Lo que realmente se ejecutó: ${ejecucion.loEjecutado || "(no informado)"}`);
  partes.push(`Desviaciones reconocidas: ${ejecucion.desviaciones || "(ninguna declarada)"}`);

  partes.push("");
  partes.push("=== 02 · AUDITORÍA DE EVIDENCIA ===");
  const conContenido = evidencias.filter((f) => f.accion.trim() || f.resultado.trim());
  if (!conContenido.length) {
    partes.push("(el equipo no registró ninguna acción con evidencia)");
  }
  conContenido.forEach((f, i) => {
    partes.push(`[Fila ${f.id}] (#${i + 1})`);
    partes.push(`  Acción ejecutada: ${f.accion || "(vacío)"}`);
    partes.push(`  Soporte declarado: ${f.soporte.trim() || "*** NINGUNO: el equipo no pudo nombrar dónde está el dato ***"}`);
    partes.push(`  Resultado: ${f.resultado || "(vacío)"}`);
    partes.push(`  Tipo que se auto-asigna: ${f.tipo ? ETIQUETA_TIPO[f.tipo] : "(no seleccionado)"}`);
    partes.push(`  Aprendizaje que declara: ${f.aprendizaje || "(no declarado)"}`);
  });

  partes.push("");
  partes.push("=== 03 · TABLERO DE MÉTRICAS ===");
  const conMetrica = metricas.filter((m) => m.metrica.trim());
  if (!conMetrica.length) {
    partes.push("(sin métricas registradas: el equipo no puede contrastar contra línea base ni umbral)");
  }
  conMetrica.forEach((m) => {
    partes.push(
      `  · ${m.metrica} | definición: ${m.definicion || "(sin definir)"} | fuente: ${
        m.fuente || "*** SIN FUENTE ***"
      } | línea base: ${m.lineaBase || "(sin línea base)"} | umbral previo: ${
        m.umbral || "*** SIN UMBRAL DEFINIDO DE ANTEMANO ***"
      } | resultado: ${m.resultado || "(sin resultado)"}`,
    );
  });

  const borrador = [
    segundoCiclo.hipotesisAjustada && `hipótesis ajustada: ${segundoCiclo.hipotesisAjustada}`,
    segundoCiclo.accion && `acción: ${segundoCiclo.accion}`,
    segundoCiclo.metrica && `métrica: ${segundoCiclo.metrica}`,
    segundoCiclo.umbral && `umbral: ${segundoCiclo.umbral}`,
  ].filter(Boolean);
  if (borrador.length) {
    partes.push("");
    partes.push("=== 05 · BORRADOR DEL SEGUNDO CICLO (del equipo) ===");
    partes.push(borrador.join(" | "));
  }

  partes.push("");
  partes.push(
    `Referencia de métricas del curso: ${METRICAS_SUGERIDAS.map((m) => `${m.pregunta} → ${m.metrica}`).join("; ")}`,
  );
  partes.push("");
  partes.push("Audita, interpreta y devuelve el JSON. Emite una lectura por cada fila listada, usando su id exacto.");

  return partes.join("\n");
}

export const ESQUEMA_RESPUESTA = {
  type: "OBJECT",
  properties: {
    confiabilidadGlobal: { type: "INTEGER", description: "Confiabilidad del conjunto de la evidencia, 0 a 100." },
    estadoGlobal: { type: "STRING", enum: ["Suposicion", "Senal", "Evidencia"] },
    lecturaGeneral: { type: "STRING", description: "Dos frases: qué sostiene la evidencia y qué no." },
    lecturas: {
      type: "ARRAY",
      description: "Una entrada por cada fila de evidencia recibida.",
      items: {
        type: "OBJECT",
        properties: {
          filaId: { type: "STRING", description: "El id exacto de la fila, tal como aparece entre corchetes." },
          confiabilidad: { type: "INTEGER" },
          estado: { type: "STRING", enum: ["Suposicion", "Senal", "Evidencia"] },
          observacion: { type: "STRING", description: "Una frase: qué falta para que esto sea verificable." },
          sinSoporte: { type: "BOOLEAN", description: "Verdadero si el equipo no nombró dónde está el dato." },
        },
        required: ["filaId", "confiabilidad", "estado", "observacion", "sinSoporte"],
      },
    },
    contradicciones: {
      type: "ARRAY",
      description: "Resultados que contradicen lo que el equipo esperaba o afirma. Vacío si no hay.",
      items: { type: "STRING" },
      maxItems: "3",
    },
    muestraInsuficiente: {
      type: "STRING",
      description: "Qué está concluyendo el equipo desde una muestra que aún no lo permite.",
    },
    aprendizajeRescatado: {
      type: "STRING",
      description: "Qué se aprendió aunque no se alcanzara el umbral. Nunca dejar vacío.",
    },
    bloqueoPrincipal: {
      type: "STRING",
      enum: ["Segmento", "Oferta", "Canal", "Operacion", "Tecnologia", "Alianzas", "Financiamiento"],
    },
    razonBloqueo: { type: "STRING", description: "Una frase explicando por qué ese es el cuello de botella." },
    preguntasMentor: {
      type: "ARRAY",
      description: "Exactamente 2 preguntas para leer en voz alta.",
      items: { type: "STRING" },
      minItems: "2",
      maxItems: "2",
    },
    preMortem: {
      type: "OBJECT",
      properties: {
        puedeDecidir: { type: "BOOLEAN", description: "¿El diseño actual permite distinguir éxito de ruido?" },
        muestraMinima: { type: "STRING", description: "Cuántas observaciones hacen falta y por qué." },
        advertencia: { type: "STRING", description: "Qué haría inútil el segundo ciclo si no se corrige." },
        mapaDecision: {
          type: "OBJECT",
          properties: {
            mantener: { type: "STRING", description: "Resultado numérico que llevaría a Mantener." },
            ajustar: { type: "STRING" },
            detener: { type: "STRING" },
            explorar: { type: "STRING", description: "Hallazgo inesperado que abriría una nueva hipótesis." },
          },
          required: ["mantener", "ajustar", "detener", "explorar"],
        },
        variableACambiar: { type: "STRING", description: "La única variable que debe cambiar y por qué." },
        variablesACongelar: { type: "ARRAY", items: { type: "STRING" }, maxItems: "4" },
      },
      required: ["puedeDecidir", "muestraMinima", "advertencia", "mapaDecision", "variableACambiar", "variablesACongelar"],
    },
  },
  required: [
    "confiabilidadGlobal",
    "estadoGlobal",
    "lecturaGeneral",
    "lecturas",
    "contradicciones",
    "muestraInsuficiente",
    "aprendizajeRescatado",
    "bloqueoPrincipal",
    "razonBloqueo",
    "preguntasMentor",
    "preMortem",
  ],
} as const;
