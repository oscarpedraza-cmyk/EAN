import type { Bloqueo } from "./guia";
import { estadoDesdeConfiabilidad, normalizarInterpretacion } from "./analisis";
import type { Encuentro, FilaMetrica, Interpretacion } from "./tipos";

/** Extrae una proporción (0-1) de textos como "20%", "al menos 20 %", "3 de 20", "0,25". */
export function leerProporcion(bruto: string): number | null {
  const t = bruto.replace(",", ".").toLowerCase();
  const deCada = t.match(/(\d+(?:\.\d+)?)\s*(?:de|\/)\s*(\d+(?:\.\d+)?)/);
  if (deCada) {
    const [, a, b] = deCada;
    const num = Number(a);
    const den = Number(b);
    if (den > 0 && num <= den) return num / den;
  }
  const pct = t.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) return Number(pct[1]) / 100;
  const suelto = t.match(/^\s*(0?\.\d+)\s*$/);
  if (suelto) return Number(suelto[1]);
  return null;
}

/** Primer entero "de muestra" que aparezca en el texto (contactos, personas, pedidos). */
export function leerMuestra(bruto: string): number | null {
  const deCada = bruto.match(/\d+\s*(?:de|\/)\s*(\d+)/);
  if (deCada) return Number(deCada[1]);
  const suelto = bruto.match(/\b(\d{1,6})\b/);
  return suelto ? Number(suelto[1]) : null;
}

/**
 * Muestra mínima para que el umbral no dependa de una sola observación:
 * se exigen al menos 5 casos esperados en el umbral, redondeando a múltiplos de 5.
 */
export function muestraMinima(proporcion: number): number {
  if (proporcion <= 0) return 30;
  return Math.max(10, Math.ceil(5 / proporcion / 5) * 5);
}

const CERCANIA = /\bamig|famili|conocid|compa[ñn]er|colega|nuestro entorno|allegad/i;
const RETORICA = [
  /product[- ]?market fit/i,
  /\bvalidad[oa]s?\b/i,
  /\bcomprobad[oa]s?\b/i,
  /les? (encant|fascin|gust)/i,
  /\btodos\b/i,
  /muy interesad/i,
  /\benorme\b|\bmuchisim|\bmuchísim/i,
];

const PISTAS: { bloqueo: Bloqueo; patrones: RegExp[] }[] = [
  { bloqueo: "Segmento", patrones: [/\bsegmento\b/i, /\bcliente/i, /\bp[uú]blico\b/i, /\bnadie (quiso|compr)/i, /\bnecesid/i] },
  { bloqueo: "Oferta", patrones: [/\boferta\b/i, /\bproduct[oa]\b/i, /\bprototipo\b/i, /\bmvp\b/i, /\bfuncionalidad/i, /\bcalidad\b/i] },
  { bloqueo: "Canal", patrones: [/\bcanal(es)?\b/i, /\banuncio/i, /\bads?\b/i, /\bcac\b/i, /\btr[aá]fico\b/i, /\bredes\b/i, /\balcanc/i] },
  { bloqueo: "Operacion", patrones: [/\boperaci/i, /\blog[ií]st/i, /\bentreg/i, /\bcapacidad\b/i, /\bproveedor/i, /\bsoport/i, /\btiempo de respuesta/i] },
  { bloqueo: "Tecnologia", patrones: [/\btecnolog/i, /\bplataforma\b/i, /\bapp\b/i, /\bdesarroll/i, /\bintegraci[oó]n/i, /\bbug|\berror t[eé]cnico/i] },
  { bloqueo: "Alianzas", patrones: [/\balianz/i, /\bsoci[oa]s?\b/i, /\bconvenio/i, /\bpartner/i, /\bintermediari/i] },
  { bloqueo: "Financiamiento", patrones: [/\bfinanci/i, /\bcapital\b/i, /\bpresupuesto\b/i, /\binversi[oó]n\b/i, /\bcaja\b/i, /\bflujo\b/i] },
];

function evaluarFila(accion: string, soporte: string, resultado: string, tipo: string | null) {
  const corpus = `${accion} ${resultado}`;
  const conSoporte = Boolean(soporte.trim());

  let puntaje = tipo === "Comportamiento" ? 70 : tipo === "Intencion" ? 45 : 22;

  if (!conSoporte) {
    // Techo duro de la guía: sin soporte nombrable no es evidencia.
    return { puntaje: Math.min(30, puntaje), conSoporte };
  }

  // Un soporte que nombra un registro concreto vale más que "lo tenemos anotado".
  if (/\bhoja|\bexcel|\bsheet|\bcrm\b|\bfactur|\bcomprobante|\brecibo|\bcaptura|\bregistro|\bbit[aá]cora|\bbase de datos|\bwhatsapp|\bcorreo/i.test(soporte)) {
    puntaje += 8;
  }

  const muestra = leerMuestra(resultado);
  if (muestra === null) puntaje -= 12;
  else if (muestra < 5) puntaje -= 10;
  else if (muestra >= 30) puntaje += 6;

  const retorica = RETORICA.filter((p) => p.test(corpus)).length;
  puntaje -= Math.min(18, retorica * 7);
  if (CERCANIA.test(corpus)) puntaje -= 10;
  if (resultado.trim().length < 25) puntaje -= 6;

  return { puntaje: Math.min(100, Math.max(5, puntaje)), conSoporte };
}

function revisarMetrica(m: FilaMetrica): { contradiccion?: string; sinUmbral: boolean } {
  const sinUmbral = !m.umbral.trim();
  const umbral = leerProporcion(m.umbral);
  const logrado = leerProporcion(m.resultado);
  if (umbral !== null && logrado !== null && logrado < umbral) {
    const falta = Math.round((umbral - logrado) * 1000) / 10;
    return {
      contradiccion: `«${m.metrica}» quedó ${falta} puntos por debajo del umbral que ustedes mismos fijaron (${m.umbral} frente a ${m.resultado}).`,
      sinUmbral,
    };
  }
  const base = leerProporcion(m.lineaBase);
  if (base !== null && logrado !== null && logrado <= base) {
    return {
      contradiccion: `«${m.metrica}» no mejoró respecto a la línea base (${m.lineaBase} → ${m.resultado}).`,
      sinUmbral,
    };
  }
  return { sinUmbral };
}

/**
 * Interpretación de respaldo cuando no hay credenciales de Gemini o el modelo no responde.
 * Aplica las mismas reglas de la guía de forma determinística: la sesión ocurre en vivo
 * y no puede quedarse esperando una API.
 */
export function interpretacionLocal(encuentro: Encuentro): Interpretacion {
  const filas = encuentro.evidencias.filter((f) => f.accion.trim() || f.resultado.trim());
  const metricas = encuentro.metricas.filter((m) => m.metrica.trim());

  const lecturas = filas.map((f) => {
    const { puntaje, conSoporte } = evaluarFila(f.accion, f.soporte, f.resultado, f.tipo);
    return {
      filaId: f.id,
      confiabilidad: puntaje,
      estado: estadoDesdeConfiabilidad(puntaje),
      observacion: !conSoporte
        ? "Sin soporte nombrable todavía no es evidencia: ¿dónde está registrado este dato?"
        : f.tipo === "Opinion"
          ? "Mide lo que la gente dice, no lo que hizo. Falta un comportamiento observable."
          : leerMuestra(f.resultado) === null
            ? "Falta el denominador: ¿sobre cuántas personas se midió?"
            : "Registro verificable. Contrástenlo contra la línea base antes de concluir.",
      sinSoporte: !conSoporte,
    };
  });

  const global = lecturas.length
    ? Math.round(lecturas.reduce((s, l) => s + l.confiabilidad, 0) / lecturas.length)
    : 0;

  const corpus = [
    encuentro.ejecucion.planAcordado,
    encuentro.ejecucion.loEjecutado,
    encuentro.ejecucion.desviaciones,
    ...filas.map((f) => `${f.accion} ${f.resultado} ${f.aprendizaje}`),
    ...metricas.map((m) => m.metrica),
  ].join(" ");

  const bloqueo = PISTAS.reduce<{ bloqueo: Bloqueo; aciertos: number }>(
    (mejor, pista) => {
      const aciertos = pista.patrones.filter((p) => p.test(corpus)).length;
      return aciertos > mejor.aciertos ? { bloqueo: pista.bloqueo, aciertos } : mejor;
    },
    { bloqueo: "Segmento", aciertos: 0 },
  ).bloqueo;

  const revisiones = metricas.map(revisarMetrica);
  const contradicciones = revisiones.map((r) => r.contradiccion).filter(Boolean) as string[];
  const sinUmbral = revisiones.filter((r) => r.sinUmbral).length;
  if (sinUmbral) {
    contradicciones.push(
      `${sinUmbral} de ${metricas.length} métricas no tienen umbral definido de antemano: cualquier resultado puede parecer bueno a posteriori.`,
    );
  }

  const sinSoporte = lecturas.filter((l) => l.sinSoporte).length;
  const muestras = filas.map((f) => leerMuestra(f.resultado)).filter((n): n is number => n !== null);
  const menorMuestra = muestras.length ? Math.min(...muestras) : null;

  // Pre-mortem: aritmética sobre el umbral que el propio equipo escribió.
  const umbralCiclo =
    leerProporcion(encuentro.segundoCiclo.umbral) ??
    metricas.map((m) => leerProporcion(m.umbral)).find((p) => p !== null) ??
    null;
  const minima = umbralCiclo !== null ? muestraMinima(umbralCiclo) : null;
  const pctUmbral = umbralCiclo !== null ? Math.round(umbralCiclo * 100) : null;
  const muestraPlan = leerMuestra(encuentro.segundoCiclo.accion) ?? menorMuestra;
  const puedeDecidir = minima !== null && muestraPlan !== null && muestraPlan >= minima;

  const aprendizajes = filas.map((f) => f.aprendizaje.trim()).filter(Boolean);

  return normalizarInterpretacion(
    {
      confiabilidadGlobal: global,
      estadoGlobal: estadoDesdeConfiabilidad(global),
      lecturaGeneral: filas.length
        ? `${filas.length} ${filas.length === 1 ? "acción registrada" : "acciones registradas"}, ${sinSoporte} sin soporte verificable. La evidencia sostiene ${
            global >= 66 ? "la ruta actual" : global >= 36 ? "una señal, no una conclusión" : "muy poco todavía"
          }.`
        : "Todavía no hay acciones registradas para auditar.",
      lecturas,
      contradicciones: contradicciones.slice(0, 3),
      muestraInsuficiente:
        menorMuestra !== null && menorMuestra < 30
          ? `La muestra más pequeña es de ${menorMuestra}. Con ese tamaño, una sola respuesta mueve el resultado ${Math.round(1000 / menorMuestra) / 10} puntos porcentuales: no alcanza para concluir.`
          : sinSoporte
            ? "Sin soporte no se puede saber sobre cuántos casos se midió, así que ninguna conclusión es todavía atribuible."
            : "",
      aprendizajeRescatado: aprendizajes.length
        ? `El equipo ya nombró un aprendizaje: «${aprendizajes[0]}». Conviértanlo en la hipótesis ajustada del segundo ciclo.`
        : "Aunque el resultado no alcanzara el umbral, la ejecución revela algo: nombren qué cambió en su comprensión del problema antes de rediseñar.",
      bloqueoPrincipal: bloqueo,
      razonBloqueo: `Lo ejecutado todavía no demuestra ${
        bloqueo === "Segmento"
          ? "que el segmento elegido sea el que tiene el problema"
          : bloqueo === "Oferta"
            ? "que la oferta entregue el resultado prometido"
            : bloqueo === "Canal"
              ? "una forma repetible de alcanzar al segmento"
              : bloqueo === "Operacion"
                ? "que puedan entregar de forma sostenible"
                : bloqueo === "Tecnologia"
                  ? "que la solución técnica soporte el uso real"
                  : bloqueo === "Alianzas"
                    ? "que los terceros de los que dependen respondan a tiempo"
                    : "que la operación se sostenga con la caja disponible"
      }.`,
      preguntasMentor: [
        sinSoporte
          ? "¿Dónde está registrado ese resultado y quién puede verificarlo hoy mismo?"
          : "¿Sobre cuántas personas se midió y cuántas eran ajenas a su círculo?",
        umbralCiclo !== null
          ? "¿Qué resultado concreto los haría detener esta hipótesis la próxima semana?"
          : "¿Qué umbral fijan hoy, antes de ejecutar, para no discutir el resultado después?",
      ],
      preMortem: {
        puedeDecidir,
        muestraMinima:
          minima !== null
            ? `Con un umbral de ${pctUmbral}% hacen falta al menos ${minima} observaciones para que el resultado no dependa de una sola respuesta.${
                muestraPlan !== null
                  ? ` Su diseño actual contempla ${muestraPlan}: cada caso mueve el resultado ${Math.round(1000 / muestraPlan) / 10} puntos.`
                  : " Aún no declararon cuántas van a medir."
              }`
            : "Sin un umbral numérico no se puede calcular la muestra mínima. Fíjenlo antes de ejecutar.",
        advertencia: puedeDecidir
          ? "El diseño permite decidir. Fijen el mapa de decisión antes de ejecutar y no lo renegocien después."
          : minima !== null
            ? `Con la muestra prevista no van a poder distinguir éxito de ruido: el segundo ciclo terminaría en discusión, no en decisión. Suban a ${minima} o bajen la ambición del umbral.`
            : "Sin umbral previo, cualquier resultado se podrá interpretar como éxito. Ese es el riesgo a corregir primero.",
        mapaDecision:
          pctUmbral !== null
            ? {
                mantener: `Resultado igual o superior a ${pctUmbral}%.`,
                ajustar: `Entre ${Math.round(pctUmbral / 2)}% y ${pctUmbral}%: hay señal, cambien una sola variable.`,
                detener: `Por debajo de ${Math.round(pctUmbral / 2)}%: la hipótesis no se sostiene.`,
                explorar: "Aparece un uso o un comprador que no estaba en la hipótesis original.",
              }
            : {
                mantener: "Por definir: necesitan un umbral numérico primero.",
                ajustar: "Por definir: necesitan un umbral numérico primero.",
                detener: "Por definir: necesitan un umbral numérico primero.",
                explorar: "Aparece un uso o un comprador que no estaba en la hipótesis original.",
              },
        variableACambiar:
          bloqueo === "Segmento"
            ? "El segmento: prueben el mismo ofrecimiento con un público distinto."
            : bloqueo === "Oferta"
              ? "La oferta: cambien lo que reciben, no a quién se lo ofrecen."
              : bloqueo === "Canal"
                ? "El canal: mismo segmento y misma oferta, otra forma de llegar."
                : "La restricción de capacidad que hoy impide entregar lo prometido.",
        variablesACongelar: ["Precio", "Promesa de valor", "Periodo de medición"].filter(
          (v) =>
            !(bloqueo === "Oferta" && v === "Promesa de valor") &&
            !(bloqueo === "Financiamiento" && v === "Precio"),
        ),
      },
    },
    encuentro,
    "local",
  );
}
