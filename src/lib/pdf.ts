"use client";

import type { MentorshipSession } from "./types";
import { BLOCK_LABELS, EVIDENCE_LEVELS } from "./types";

const MARGIN = 14;
const WIDTH = 210;
const CONTENT = WIDTH - MARGIN * 2;

interface Cursor {
  y: number;
}

/** Genera la ficha one-pager de la sesión y devuelve el nombre del archivo. */
export async function generateOnePager(session: MentorshipSession): Promise<string> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cur: Cursor = { y: MARGIN };

  const { intake, audit, decision, decisionNote } = session;
  const level = EVIDENCE_LEVELS.find((l) => l.level === intake.evidenceLevel);

  const text = (
    value: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number; width?: number } = {},
  ) => {
    const { size = 10, bold = false, color = [30, 41, 59], gap = 1.6, width = CONTENT } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(value, width) as string[];
    doc.text(lines, MARGIN, cur.y);
    cur.y += lines.length * size * 0.38 + gap;
  };

  const rule = (gap = 4) => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, cur.y, WIDTH - MARGIN, cur.y);
    cur.y += gap;
  };

  const sectionTitle = (label: string) => {
    cur.y += 1;
    text(label.toUpperCase(), { size: 8, bold: true, color: [100, 116, 139], gap: 2.4 });
  };

  // Cabecera
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, WIDTH, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("Co-piloto de Mentoría", MARGIN, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Ficha de cierre · Sesión de 20 minutos · ${new Date(session.createdAt).toLocaleString("es-ES")}`,
    MARGIN,
    20,
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(intake.teamName || "Equipo sin nombre", MARGIN, 26.5);
  cur.y = 40;

  // Tira de métricas
  if (audit) {
    const score = audit.reliabilityScore;
    const tone: [number, number, number] =
      score >= 66 ? [16, 185, 129] : score >= 36 ? [245, 158, 11] : [239, 68, 68];
    const boxW = (CONTENT - 8) / 3;
    const boxes: [string, string, [number, number, number]][] = [
      ["Reliability Score", `${score}%`, tone],
      ["Bloqueo", BLOCK_LABELS[audit.blockCategory], [51, 65, 85]],
      ["Decisión", decision ?? "Sin registrar", [51, 65, 85]],
    ];
    boxes.forEach(([label, value, color], i) => {
      const x = MARGIN + i * (boxW + 4);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, cur.y, boxW, 18, 2, 2, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), x + 4, cur.y + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...color);
      doc.text(value, x + 4, cur.y + 14);
    });
    cur.y += 25;
  }

  sectionTitle("Problema / segmento");
  text(intake.problem || "No informado.");
  sectionTitle("Acción ejecutada y resultado");
  text(intake.action || "No informado.");
  sectionTitle("Nivel de evidencia declarado");
  text(level ? `${level.label} — ${level.short}` : "No seleccionado.");
  rule();

  if (audit) {
    if (audit.selfDeception.detected) {
      // Se mide el alto real del bloque antes de pintar el fondo.
      const innerW = CONTENT - 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      const headlineLines = doc.splitTextToSize(audit.selfDeception.headline, innerW) as string[];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const detailLines = audit.selfDeception.detail
        ? (doc.splitTextToSize(audit.selfDeception.detail, innerW) as string[])
        : [];
      const boxH = 12 + headlineLines.length * 4.5 + detailLines.length * 3.6;

      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(252, 165, 165);
      doc.roundedRect(MARGIN - 3, cur.y, CONTENT + 6, boxH, 2, 2, "FD");

      cur.y += 5.5;
      text("AUTO-ENGAÑO DETECTADO", {
        size: 8,
        bold: true,
        color: [185, 28, 28],
        gap: 1.4,
        width: innerW,
      });
      text(audit.selfDeception.headline, {
        size: 10.5,
        bold: true,
        color: [127, 29, 29],
        gap: 1.4,
        width: innerW,
      });
      if (audit.selfDeception.detail) {
        text(audit.selfDeception.detail, { size: 9, color: [127, 29, 29], width: innerW });
      }
      cur.y += 6;
    }

    sectionTitle(`Bloqueo: ${BLOCK_LABELS[audit.blockCategory]}`);
    text(audit.blockRationale || audit.scoreRationale);

    sectionTitle("Preguntas clave");
    audit.keyQuestions.forEach((q, i) => {
      text(`${i + 1}. ${q}`, { size: 11, bold: true, color: [15, 23, 42], gap: 2.2 });
    });

    sectionTitle("Experimento 48 horas ($0 USD)");
    text(audit.experiment.title, { size: 10.5, bold: true, gap: 1.4 });
    if (audit.experiment.hypothesis) {
      text(audit.experiment.hypothesis, { size: 9, color: [71, 85, 105] });
    }
    audit.experiment.steps.forEach((s, i) => text(`${i + 1}) ${s}`, { size: 9, gap: 1.2 }));
    cur.y += 1;
    text(`Umbral de éxito: ${audit.experiment.successThreshold}`, {
      size: 10,
      bold: true,
      color: [16, 185, 129],
    });
    if (audit.evidenceGap) {
      sectionTitle("Qué falta para subir de nivel");
      text(audit.evidenceGap);
    }
    rule();
  }

  sectionTitle("Decisión metodológica");
  text(decision ?? "Sin registrar", { size: 12, bold: true, gap: 1.6 });
  if (decisionNote) text(decisionNote, { size: 9, color: [71, 85, 105] });

  // Pie
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Auditoría: ${audit?.source === "gemini" ? `Gemini (${audit.model ?? "flash"})` : "reglas locales"} · Duración de sesión: ${Math.floor(session.elapsedSeconds / 60)}m ${session.elapsedSeconds % 60}s`,
    MARGIN,
    287,
  );

  const slug =
    (intake.teamName || "equipo")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "equipo";
  const filename = `mentoria-${slug}-${session.createdAt.slice(0, 10)}.pdf`;
  doc.save(filename);
  return filename;
}

/** Cuerpo de correo en texto plano con el mismo contenido de la ficha. */
export function buildEmailBody(session: MentorshipSession): string {
  const { intake, audit, decision, decisionNote } = session;
  const lines = [
    `Ficha de mentoría — ${intake.teamName || "Equipo sin nombre"}`,
    `Fecha: ${new Date(session.createdAt).toLocaleString("es-ES")}`,
    "",
    `Problema / segmento: ${intake.problem || "No informado"}`,
    `Acción y resultado: ${intake.action || "No informado"}`,
  ];
  if (audit) {
    lines.push(
      "",
      `Reliability Score: ${audit.reliabilityScore}% — ${audit.scoreRationale}`,
      `Bloqueo: ${BLOCK_LABELS[audit.blockCategory]} — ${audit.blockRationale}`,
    );
    if (audit.selfDeception.detected) {
      lines.push("", `AUTO-ENGAÑO DETECTADO: ${audit.selfDeception.headline}`, audit.selfDeception.detail);
    }
    lines.push(
      "",
      "Preguntas clave:",
      ...audit.keyQuestions.map((q, i) => `  ${i + 1}. ${q}`),
      "",
      `Experimento 48 horas (${audit.experiment.cost}): ${audit.experiment.title}`,
      ...audit.experiment.steps.map((s, i) => `  ${i + 1}) ${s}`),
      `  Umbral de éxito: ${audit.experiment.successThreshold}`,
    );
  }
  lines.push("", `Decisión: ${decision ?? "Sin registrar"}`);
  if (decisionNote) lines.push(`Compromiso: ${decisionNote}`);
  return lines.join("\n");
}
