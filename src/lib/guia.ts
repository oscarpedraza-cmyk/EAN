/**
 * Constantes tomadas literalmente de la Guía para mentores · Mentoría 2
 * (Electiva I · Crecimiento Inteligente, semana 6).
 * Todo el vocabulario de la app sale de aquí para que coincida con lo que
 * el equipo ve en la sesión.
 */

/** Ruta de conversación de la guía: evidencia, interpretación, decisión y compromiso. */
export const PASOS = [
  {
    id: "ejecucion",
    numero: "01",
    titulo: "Reconstruir lo ejecutado",
    corto: "Ejecutado",
    ayuda: "Compara el plan acordado con las acciones realizadas y reconoce desviaciones relevantes.",
  },
  {
    id: "evidencia",
    numero: "02",
    titulo: "Examinar la evidencia",
    corto: "Evidencia",
    ayuda: "Distingue registros verificables de percepciones, anécdotas o explicaciones retrospectivas.",
  },
  {
    id: "metricas",
    numero: "03",
    titulo: "Interpretar las métricas",
    corto: "Métricas",
    ayuda: "Contrasta resultados con la línea base y con los umbrales definidos antes de ejecutar.",
  },
  {
    id: "bloqueo",
    numero: "04",
    titulo: "Localizar el bloqueo principal",
    corto: "Bloqueo",
    ayuda: "Identifica si el obstáculo está en segmento, oferta, canal, operación, tecnología, alianzas o financiamiento.",
  },
  {
    id: "ciclo",
    numero: "05",
    titulo: "Diseñar el segundo ciclo",
    corto: "Segundo ciclo",
    ayuda: "Prioriza el ajuste con mayor potencial de aprendizaje y define cómo se medirá.",
  },
] as const;

export type PasoId = (typeof PASOS)[number]["id"];

/** Los siete bloqueos que nombra la guía, agrupados por su pregunta de tres vías. */
export const BLOQUEOS = [
  { clave: "Segmento", grupo: "Demanda" },
  { clave: "Oferta", grupo: "Oferta" },
  { clave: "Canal", grupo: "Demanda" },
  { clave: "Operacion", grupo: "Capacidad" },
  { clave: "Tecnologia", grupo: "Capacidad" },
  { clave: "Alianzas", grupo: "Capacidad" },
  { clave: "Financiamiento", grupo: "Capacidad" },
] as const;

export type Bloqueo = (typeof BLOQUEOS)[number]["clave"];
export type GrupoBloqueo = (typeof BLOQUEOS)[number]["grupo"];

/** Rótulos con tilde; la clave viaja sin tildes para que el enum sea estable. */
export const ROTULO_BLOQUEO: Record<Bloqueo, string> = {
  Segmento: "Segmento",
  Oferta: "Oferta",
  Canal: "Canal",
  Operacion: "Operación",
  Tecnologia: "Tecnología",
  Alianzas: "Alianzas",
  Financiamiento: "Financiamiento",
};

/** Escala de la sesión: opinión → intención → comportamiento. */
export const TIPOS_EVIDENCIA = [
  {
    clave: "Opinion",
    rotulo: "Opinión",
    define: "Lo que la gente dice que piensa",
    ejemplo: "Encuestas, entrevistas, «les encantó»",
    tono: "rojo",
  },
  {
    clave: "Intencion",
    rotulo: "Intención",
    define: "Lo que la gente dice que hará",
    ejemplo: "Registros, waitlist, clics, formularios",
    tono: "ambar",
  },
  {
    clave: "Comportamiento",
    rotulo: "Comportamiento",
    define: "Lo que la gente efectivamente hizo",
    ejemplo: "Pagos, recompras, compromisos firmados",
    tono: "verde",
  },
] as const;

export type TipoEvidencia = (typeof TIPOS_EVIDENCIA)[number]["clave"];

/** Semáforo de la hipótesis; lo asigna la interpretación, no el equipo. */
export const ESTADOS_HIPOTESIS = [
  { clave: "Suposicion", rotulo: "Suposición", tono: "rojo", define: "No hay evidencia suficiente. Hay que diseñar una prueba." },
  { clave: "Senal", rotulo: "Señal", tono: "ambar", define: "Hay indicios, pero falta comprobar comportamiento." },
  { clave: "Evidencia", rotulo: "Evidencia", tono: "verde", define: "Hay comportamiento verificable que respalda la hipótesis." },
] as const;

export type EstadoHipotesis = (typeof ESTADOS_HIPOTESIS)[number]["clave"];

export const DECISIONES = [
  { clave: "Mantener", cuando: "La evidencia respalda lo que hacemos.", pregunta: "¿Qué seguimos haciendo?", tono: "verde" },
  { clave: "Ajustar", cuando: "Hay señales, pero algo debe cambiar.", pregunta: "¿Qué modificamos?", tono: "ambar" },
  { clave: "Detener", cuando: "La evidencia no respalda la hipótesis.", pregunta: "¿Qué dejamos de hacer?", tono: "rojo" },
  { clave: "Explorar", cuando: "Apareció una oportunidad que no veíamos.", pregunta: "¿Qué nueva hipótesis probamos?", tono: "cian" },
] as const;

export type Decision = (typeof DECISIONES)[number]["clave"];

/** Taxonomía de métricas de la sesión: primero la decisión, después qué medir. */
export const METRICAS_SUGERIDAS = [
  { pregunta: "¿La gente usa el producto?", metrica: "Porcentaje de usuarios que lo utilizan" },
  { pregunta: "¿La gente vuelve?", metrica: "Porcentaje de usuarios recurrentes" },
  { pregunta: "¿La gente paga?", metrica: "Porcentaje que compra o paga" },
  { pregunta: "¿La propuesta convierte?", metrica: "Conversión del segmento objetivo" },
  { pregunta: "¿El negocio mejora?", metrica: "Ingresos, margen o recurrencia" },
] as const;

/** Chequeo de cierre de la guía. Habilita la ficha del encuentro. */
export const CHEQUEO_CIERRE = [
  { id: "soportes", texto: "Las acciones ejecutadas están respaldadas por soportes verificables." },
  { id: "umbral", texto: "Las métricas se interpretaron frente a una línea base o umbral." },
  { id: "avance", texto: "El equipo diferencia actividad de avance real." },
  { id: "bloqueo", texto: "Se identificó el principal bloqueo o palanca." },
  { id: "decision", texto: "La decisión de mantener, ajustar o descartar está sustentada." },
  { id: "ciclo", texto: "El segundo ciclo tiene foco, métrica y fecha." },
] as const;

export type ChequeoId = (typeof CHEQUEO_CIERRE)[number]["id"];

/** Preguntas guía; el mentor escoge, no las recorre todas. */
export const PREGUNTAS_GUIA = [
  "¿Qué ejecutaron exactamente y qué evidencia lo demuestra?",
  "¿Qué resultado contradijo sus expectativas?",
  "¿Cuál métrica cambió y cuál permaneció igual?",
  "¿Qué están interpretando a partir de una muestra todavía insuficiente?",
  "¿El bloqueo está en la demanda, en la oferta o en la capacidad para responder?",
  "¿Qué acción generó aprendizaje, aunque no produjera el resultado esperado?",
  "¿Qué deberían mantener, ajustar, detener o probar de otra manera?",
  "¿Qué evidencia esperan obtener en el segundo ciclo?",
] as const;

export const RESULTADO_ESPERADO =
  "Resultados interpretados y segundo ciclo de ejecución definido.";
