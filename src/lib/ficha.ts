"use client";

import { CHEQUEO_CIERRE, RESULTADO_ESPERADO, ROTULO_BLOQUEO, TIPOS_EVIDENCIA } from "./guia";
import type { Encuentro } from "./tipos";

const MARGEN = 14;
const ANCHO = 210;
const UTIL = ANCHO - MARGEN * 2;
const PIE = 282;

const ROTULO_TIPO = Object.fromEntries(TIPOS_EVIDENCIA.map((t) => [t.clave, t.rotulo]));

type RGB = [number, number, number];

const TINTA: RGB = [15, 30, 40];
const SUAVE: RGB = [90, 110, 120];
const CASCO: RGB = [4, 36, 51];
const CIAN: RGB = [10, 127, 160];
const MENTA: RGB = [0, 150, 105];
const LADRILLO: RGB = [190, 75, 75];

function tonoConfiabilidad(valor: number): RGB {
  return valor >= 66 ? MENTA : valor >= 36 ? [200, 140, 40] : LADRILLO;
}

/** Genera la ficha del encuentro y devuelve el nombre del archivo descargado. */
export async function generarFicha(encuentro: Encuentro): Promise<string> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cursor = { y: MARGEN };
  let pagina = 1;

  const pieDePagina = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...SUAVE);
    doc.text(
      `Electiva I · Crecimiento Inteligente · Mentoría 2 · apoyo a la conversación, no sustituye los entregables del curso.`,
      MARGEN,
      289,
    );
    doc.text(String(pagina), ANCHO - MARGEN, 289, { align: "right" });
  };

  const saltoSiHaceFalta = (alto: number) => {
    if (cursor.y + alto <= PIE) return;
    pieDePagina();
    doc.addPage();
    pagina += 1;
    cursor.y = MARGEN;
  };

  const escribir = (
    valor: string,
    opciones: { tam?: number; negrita?: boolean; color?: RGB; salto?: number; ancho?: number; x?: number } = {},
  ) => {
    const { tam = 9.5, negrita = false, color = TINTA, salto = 1.5, ancho = UTIL, x = MARGEN } = opciones;
    doc.setFont("helvetica", negrita ? "bold" : "normal");
    doc.setFontSize(tam);
    doc.setTextColor(...color);
    const lineas = doc.splitTextToSize(valor, ancho) as string[];
    saltoSiHaceFalta(lineas.length * tam * 0.38 + salto);
    doc.text(lineas, x, cursor.y);
    cursor.y += lineas.length * tam * 0.38 + salto;
  };

  const titulo = (etiqueta: string) => {
    saltoSiHaceFalta(10);
    cursor.y += 2;
    escribir(etiqueta.toUpperCase(), { tam: 7.5, negrita: true, color: CIAN, salto: 2.2 });
  };

  const linea = () => {
    saltoSiHaceFalta(4);
    doc.setDrawColor(215, 225, 230);
    doc.setLineWidth(0.3);
    doc.line(MARGEN, cursor.y, ANCHO - MARGEN, cursor.y);
    cursor.y += 3.5;
  };

  const { ejecucion, interpretacion, decision, sustentoDecision, segundoCiclo, chequeo } = encuentro;

  // Cabecera
  doc.setFillColor(...CASCO);
  doc.rect(0, 0, ANCHO, 31, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("Mentoría 2 · Evidencia, métricas y decisiones", MARGEN, 12.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 205, 215);
  doc.text(
    `Electiva I · Crecimiento Inteligente · ${new Date(encuentro.creadoEn).toLocaleString("es-CO")}`,
    MARGEN,
    18.5,
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(ejecucion.equipo || "Equipo sin nombre", MARGEN, 26.5);
  cursor.y = 39;

  // Tira de resultados
  if (interpretacion) {
    const anchoCaja = (UTIL - 8) / 3;
    const cajas: [string, string, RGB][] = [
      ["Confiabilidad", `${interpretacion.confiabilidadGlobal}%`, tonoConfiabilidad(interpretacion.confiabilidadGlobal)],
      ["Bloqueo principal", ROTULO_BLOQUEO[interpretacion.bloqueoPrincipal], CASCO],
      ["Decisión", decision ?? "Sin registrar", CASCO],
    ];
    cajas.forEach(([etiqueta, valor, color], i) => {
      const x = MARGEN + i * (anchoCaja + 4);
      doc.setFillColor(246, 250, 251);
      doc.setDrawColor(215, 228, 233);
      doc.roundedRect(x, cursor.y, anchoCaja, 17, 2, 2, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...SUAVE);
      doc.text(etiqueta.toUpperCase(), x + 3.5, cursor.y + 5.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...color);
      doc.text(doc.splitTextToSize(valor, anchoCaja - 7)[0], x + 3.5, cursor.y + 13);
    });
    cursor.y += 23;
    escribir(interpretacion.lecturaGeneral, { color: SUAVE });
    linea();
  }

  // 01 Lo ejecutado
  titulo("01 · Lo ejecutado");
  escribir("Plan acordado", { tam: 8, negrita: true, salto: 0.8 });
  escribir(ejecucion.planAcordado || "No informado.", { salto: 2 });
  escribir("Lo que realmente se ejecutó", { tam: 8, negrita: true, salto: 0.8 });
  escribir(ejecucion.loEjecutado || "No informado.", { salto: 2 });
  if (ejecucion.desviaciones) {
    escribir("Desviaciones reconocidas", { tam: 8, negrita: true, salto: 0.8 });
    escribir(ejecucion.desviaciones);
  }
  linea();

  // 02 Auditoría de evidencia
  const filas = encuentro.evidencias.filter((f) => f.accion.trim() || f.resultado.trim());
  if (filas.length) {
    titulo("02 · Auditoría de evidencia");
    filas.forEach((fila, i) => {
      const lectura = interpretacion?.lecturas.find((l) => l.filaId === fila.id);
      saltoSiHaceFalta(22);
      const marca = lectura ? tonoConfiabilidad(lectura.confiabilidad) : SUAVE;
      escribir(
        `${i + 1}. ${fila.accion || "(acción sin describir)"}${
          lectura ? `   ·   confiabilidad ${lectura.confiabilidad}%` : ""
        }`,
        { tam: 10, negrita: true, color: marca, salto: 1.2 },
      );
      escribir(`Soporte: ${fila.soporte || "SIN SOPORTE VERIFICABLE"}`, {
        tam: 8.5,
        color: fila.soporte ? TINTA : LADRILLO,
        salto: 0.8,
      });
      escribir(`Resultado: ${fila.resultado || "no informado"}`, { tam: 8.5, salto: 0.8 });
      escribir(
        `Tipo de evidencia: ${fila.tipo ? ROTULO_TIPO[fila.tipo] : "no clasificado"}${
          fila.aprendizaje ? `   ·   Aprendizaje: ${fila.aprendizaje}` : ""
        }`,
        { tam: 8.5, color: SUAVE, salto: 1 },
      );
      if (lectura?.observacion) {
        escribir(`» ${lectura.observacion}`, { tam: 8.5, color: CIAN, salto: 2.5 });
      }
    });
    linea();
  }

  // 03 Métricas
  const metricas = encuentro.metricas.filter((m) => m.metrica.trim());
  if (metricas.length) {
    titulo("03 · Tablero de métricas");
    metricas.forEach((m) => {
      saltoSiHaceFalta(14);
      escribir(m.metrica, { tam: 9.5, negrita: true, salto: 0.8 });
      escribir(
        `Definición: ${m.definicion || "sin definir"}   ·   Fuente: ${m.fuente || "SIN FUENTE"}`,
        { tam: 8.5, color: m.fuente ? SUAVE : LADRILLO, salto: 0.8 },
      );
      escribir(
        `Línea base: ${m.lineaBase || "-"}   ·   Umbral previo: ${m.umbral || "NO DEFINIDO"}   ·   Resultado: ${m.resultado || "-"}`,
        { tam: 8.5, color: m.umbral ? TINTA : LADRILLO, salto: 2.5 },
      );
    });
    linea();
  }

  // 04 Interpretación
  if (interpretacion) {
    titulo(`04 · Bloqueo principal · ${ROTULO_BLOQUEO[interpretacion.bloqueoPrincipal]}`);
    escribir(interpretacion.razonBloqueo);

    if (interpretacion.contradicciones.length) {
      titulo("Contradicciones con lo esperado");
      interpretacion.contradicciones.forEach((c) => escribir(`· ${c}`, { color: LADRILLO, salto: 1.2 }));
    }
    if (interpretacion.muestraInsuficiente) {
      titulo("Muestra todavía insuficiente");
      escribir(interpretacion.muestraInsuficiente);
    }

    titulo("Aprendizaje protegido");
    escribir(interpretacion.aprendizajeRescatado, { color: MENTA });

    titulo("Preguntas del mentor");
    interpretacion.preguntasMentor.forEach((p, i) =>
      escribir(`${i + 1}. ${p}`, { tam: 10.5, negrita: true, salto: 2 }),
    );
    linea();

    // Pre-mortem
    titulo("Antes de ejecutar el segundo ciclo");
    escribir(
      interpretacion.preMortem.puedeDecidir
        ? "El diseño permite distinguir éxito de ruido."
        : "ATENCIÓN: con el diseño actual el resultado no permitirá decidir.",
      { tam: 9.5, negrita: true, color: interpretacion.preMortem.puedeDecidir ? MENTA : LADRILLO, salto: 1.2 },
    );
    escribir(interpretacion.preMortem.muestraMinima, { salto: 1.2 });
    if (interpretacion.preMortem.advertencia) {
      escribir(interpretacion.preMortem.advertencia, { color: SUAVE, salto: 2 });
    }
    escribir("Mapa de decisión, comprometido antes de ejecutar", { tam: 8, negrita: true, salto: 1.2 });
    (
      [
        ["Mantener", interpretacion.preMortem.mapaDecision.mantener],
        ["Ajustar", interpretacion.preMortem.mapaDecision.ajustar],
        ["Detener", interpretacion.preMortem.mapaDecision.detener],
        ["Explorar", interpretacion.preMortem.mapaDecision.explorar],
      ] as const
    ).forEach(([clave, valor]) => escribir(`${clave}: ${valor}`, { tam: 8.5, salto: 1 }));
    if (interpretacion.preMortem.variableACambiar) {
      cursor.y += 1;
      escribir(`Variable a cambiar: ${interpretacion.preMortem.variableACambiar}`, { tam: 8.5, salto: 1 });
    }
    if (interpretacion.preMortem.variablesACongelar.length) {
      escribir(`Congelar: ${interpretacion.preMortem.variablesACongelar.join(", ")}`, {
        tam: 8.5,
        color: SUAVE,
      });
    }
    linea();
  }

  // 05 Decisión y segundo ciclo
  titulo("05 · Decisión y segundo ciclo");
  escribir(decision ?? "Decisión sin registrar", { tam: 13, negrita: true, salto: 1.2 });
  if (sustentoDecision) escribir(`Evidencia que la justifica: ${sustentoDecision}`, { salto: 2.5 });

  (
    [
      ["Hipótesis ajustada", segundoCiclo.hipotesisAjustada],
      ["Acción", segundoCiclo.accion],
      ["Métrica", segundoCiclo.metrica],
      ["Umbral", segundoCiclo.umbral],
      ["Responsable", segundoCiclo.responsable],
      ["Fecha", segundoCiclo.fecha],
    ] as const
  ).forEach(([etiqueta, valor]) => {
    escribir(`${etiqueta}: ${valor || "-"}`, { tam: 9, negrita: Boolean(valor), salto: 1.1 });
  });

  // Chequeo de cierre
  titulo("Chequeo de cierre");
  CHEQUEO_CIERRE.forEach((item) => {
    const marcado = chequeo[item.id];
    escribir(`${marcado ? "[x]" : "[ ]"} ${item.texto}`, {
      tam: 8.5,
      color: marcado ? MENTA : SUAVE,
      salto: 1,
    });
  });
  cursor.y += 1.5;
  escribir(`Resultado esperado del encuentro: ${RESULTADO_ESPERADO}`, { tam: 8, color: SUAVE });

  pieDePagina();

  const nombre =
    (ejecucion.equipo || "equipo")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "equipo";
  const archivo = `mentoria2-${nombre}-${encuentro.creadoEn.slice(0, 10)}.pdf`;
  doc.save(archivo);
  return archivo;
}

/** Mismo contenido en texto plano, para enviarlo por correo al equipo. */
export function cuerpoCorreo(encuentro: Encuentro): string {
  const { ejecucion, interpretacion, decision, sustentoDecision, segundoCiclo } = encuentro;
  const l: string[] = [
    `Mentoría 2 · Evidencia, métricas y decisiones — ${ejecucion.equipo || "Equipo"}`,
    `Fecha: ${new Date(encuentro.creadoEn).toLocaleString("es-CO")}`,
    "",
    `Plan acordado: ${ejecucion.planAcordado || "No informado"}`,
    `Lo ejecutado: ${ejecucion.loEjecutado || "No informado"}`,
  ];
  if (ejecucion.desviaciones) l.push(`Desviaciones: ${ejecucion.desviaciones}`);

  const filas = encuentro.evidencias.filter((f) => f.accion.trim() || f.resultado.trim());
  if (filas.length) {
    l.push("", "AUDITORÍA DE EVIDENCIA");
    filas.forEach((f, i) => {
      const lec = interpretacion?.lecturas.find((x) => x.filaId === f.id);
      l.push(
        `  ${i + 1}. ${f.accion}${lec ? ` [confiabilidad ${lec.confiabilidad}%]` : ""}`,
        `     Soporte: ${f.soporte || "SIN SOPORTE VERIFICABLE"}`,
        `     Resultado: ${f.resultado || "—"}`,
      );
    });
  }

  if (interpretacion) {
    l.push(
      "",
      `Confiabilidad global: ${interpretacion.confiabilidadGlobal}% — ${interpretacion.lecturaGeneral}`,
      `Bloqueo principal: ${ROTULO_BLOQUEO[interpretacion.bloqueoPrincipal]} — ${interpretacion.razonBloqueo}`,
      "",
      `Aprendizaje: ${interpretacion.aprendizajeRescatado}`,
      "",
      "Preguntas del mentor:",
      ...interpretacion.preguntasMentor.map((p, i) => `  ${i + 1}. ${p}`),
      "",
      "ANTES DE EJECUTAR EL SEGUNDO CICLO",
      `  ${interpretacion.preMortem.muestraMinima}`,
      `  Mantener: ${interpretacion.preMortem.mapaDecision.mantener}`,
      `  Ajustar: ${interpretacion.preMortem.mapaDecision.ajustar}`,
      `  Detener: ${interpretacion.preMortem.mapaDecision.detener}`,
      `  Explorar: ${interpretacion.preMortem.mapaDecision.explorar}`,
    );
  }

  l.push(
    "",
    `DECISIÓN: ${decision ?? "Sin registrar"}`,
    sustentoDecision ? `Evidencia que la justifica: ${sustentoDecision}` : "",
    "",
    "SEGUNDO CICLO",
    `  Hipótesis ajustada: ${segundoCiclo.hipotesisAjustada || "—"}`,
    `  Acción: ${segundoCiclo.accion || "—"}`,
    `  Métrica: ${segundoCiclo.metrica || "—"}`,
    `  Umbral: ${segundoCiclo.umbral || "—"}`,
    `  Responsable: ${segundoCiclo.responsable || "—"}`,
    `  Fecha: ${segundoCiclo.fecha || "—"}`,
  );

  return l.filter((x) => x !== "").join("\n");
}
