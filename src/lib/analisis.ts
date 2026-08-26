import { BLOQUEOS, type Bloqueo, type EstadoHipotesis } from "./guia";
import type { Encuentro, Interpretacion, LecturaEvidencia } from "./tipos";

const CLAVES_BLOQUEO = BLOQUEOS.map((b) => b.clave) as readonly Bloqueo[];
const ESTADOS: EstadoHipotesis[] = ["Suposicion", "Senal", "Evidencia"];

function acotar(valor: unknown, min = 0, max = 100): number {
  const n = Math.round(Number(valor));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function texto(valor: unknown, respaldo = ""): string {
  return typeof valor === "string" && valor.trim() ? valor.trim() : respaldo;
}

function normalizarEstado(valor: unknown): EstadoHipotesis {
  const bruto = texto(valor).toLowerCase();
  const hallado = ESTADOS.find((e) => e.toLowerCase() === bruto);
  if (hallado) return hallado;
  if (bruto.startsWith("sup")) return "Suposicion";
  if (bruto.startsWith("sen") || bruto.startsWith("señ")) return "Senal";
  if (bruto.startsWith("evi")) return "Evidencia";
  return "Suposicion";
}

function normalizarBloqueo(valor: unknown): Bloqueo {
  const bruto = texto(valor).toLowerCase();
  const hallado = CLAVES_BLOQUEO.find((c) => c.toLowerCase() === bruto);
  if (hallado) return hallado;
  if (bruto.startsWith("operac")) return "Operacion";
  if (bruto.startsWith("tecno")) return "Tecnologia";
  if (bruto.startsWith("financ")) return "Financiamiento";
  if (bruto.startsWith("alian")) return "Alianzas";
  if (bruto.startsWith("segm") || bruto.startsWith("dem")) return "Segmento";
  if (bruto.startsWith("of")) return "Oferta";
  if (bruto.startsWith("can")) return "Canal";
  return "Segmento";
}

/** Deriva el estado del semáforo desde la confiabilidad, para rellenar huecos del modelo. */
export function estadoDesdeConfiabilidad(valor: number): EstadoHipotesis {
  if (valor >= 66) return "Evidencia";
  if (valor >= 36) return "Senal";
  return "Suposicion";
}

/**
 * Valida la respuesta del modelo antes de que llegue a la pantalla. La sesión ocurre
 * en vivo: la interfaz no puede romperse por un campo faltante.
 */
export function normalizarInterpretacion(
  bruto: Record<string, unknown>,
  encuentro: Encuentro,
  origen: Interpretacion["origen"],
  modelo?: string,
): Interpretacion {
  const filas = encuentro.evidencias.filter((f) => f.accion.trim() || f.resultado.trim());
  const recibidas = Array.isArray(bruto.lecturas) ? (bruto.lecturas as Record<string, unknown>[]) : [];

  const lecturas: LecturaEvidencia[] = filas.map((fila) => {
    const cruda = recibidas.find((l) => texto(l.filaId) === fila.id) ?? {};
    const sinSoporte = !fila.soporte.trim() || Boolean(cruda.sinSoporte);
    // La guía es tajante: sin soporte nombrable no es evidencia, gane lo que gane el modelo.
    const confiabilidad = sinSoporte
      ? Math.min(30, acotar(cruda.confiabilidad))
      : acotar(cruda.confiabilidad);
    return {
      filaId: fila.id,
      confiabilidad,
      estado: cruda.estado ? normalizarEstado(cruda.estado) : estadoDesdeConfiabilidad(confiabilidad),
      observacion: texto(
        cruda.observacion,
        sinSoporte ? "Falta nombrar dónde está el dato que lo demuestra." : "",
      ),
      sinSoporte,
    };
  });

  const promedio = lecturas.length
    ? Math.round(lecturas.reduce((s, l) => s + l.confiabilidad, 0) / lecturas.length)
    : 0;
  const confiabilidadGlobal = acotar(bruto.confiabilidadGlobal ?? promedio);

  const preguntas = Array.isArray(bruto.preguntasMentor)
    ? bruto.preguntasMentor.map((p) => texto(p)).filter(Boolean)
    : [];
  while (preguntas.length < 2) {
    preguntas.push(
      preguntas.length === 0
        ? "¿Dónde está registrado ese resultado y quién puede verificarlo hoy?"
        : "¿Qué resultado concreto los haría cambiar de decisión la próxima semana?",
    );
  }

  const preMortemCrudo = (bruto.preMortem ?? {}) as Record<string, unknown>;
  const mapaCrudo = (preMortemCrudo.mapaDecision ?? {}) as Record<string, unknown>;

  return {
    confiabilidadGlobal,
    estadoGlobal: bruto.estadoGlobal
      ? normalizarEstado(bruto.estadoGlobal)
      : estadoDesdeConfiabilidad(confiabilidadGlobal),
    lecturaGeneral: texto(bruto.lecturaGeneral, "Sin lectura general devuelta."),
    lecturas,
    contradicciones: Array.isArray(bruto.contradicciones)
      ? bruto.contradicciones.map((c) => texto(c)).filter(Boolean).slice(0, 3)
      : [],
    muestraInsuficiente: texto(bruto.muestraInsuficiente),
    aprendizajeRescatado: texto(
      bruto.aprendizajeRescatado,
      "Registren qué cambió en su comprensión del problema, aunque el resultado no haya alcanzado el umbral.",
    ),
    bloqueoPrincipal: normalizarBloqueo(bruto.bloqueoPrincipal),
    razonBloqueo: texto(bruto.razonBloqueo),
    preguntasMentor: [preguntas[0], preguntas[1]],
    preMortem: {
      puedeDecidir: Boolean(preMortemCrudo.puedeDecidir),
      muestraMinima: texto(preMortemCrudo.muestraMinima, "Sin muestra mínima calculada."),
      advertencia: texto(preMortemCrudo.advertencia),
      mapaDecision: {
        mantener: texto(mapaCrudo.mantener, "Por definir antes de ejecutar."),
        ajustar: texto(mapaCrudo.ajustar, "Por definir antes de ejecutar."),
        detener: texto(mapaCrudo.detener, "Por definir antes de ejecutar."),
        explorar: texto(mapaCrudo.explorar, "Por definir antes de ejecutar."),
      },
      variableACambiar: texto(preMortemCrudo.variableACambiar),
      variablesACongelar: Array.isArray(preMortemCrudo.variablesACongelar)
        ? preMortemCrudo.variablesACongelar.map((v) => texto(v)).filter(Boolean).slice(0, 4)
        : [],
    },
    origen,
    modelo,
  };
}
