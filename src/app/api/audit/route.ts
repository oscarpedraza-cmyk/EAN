import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { heuristicAudit, normalizeAudit } from "@/lib/audit";
import { RESPONSE_SCHEMA, SYSTEM_INSTRUCTION, buildUserPrompt } from "@/lib/prompt";
import type { EvidenceLevel, IntakeData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

/**
 * Soporta las dos rutas de acceso del Google Gen AI SDK:
 * - Gemini Developer API con GEMINI_API_KEY / GOOGLE_API_KEY
 * - Vertex AI con GOOGLE_GENAI_USE_VERTEXAI=true + proyecto y region
 */
function createClient(): GoogleGenAI | null {
  const useVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === "true";
  if (useVertex) {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    if (!project) return null;
    return new GoogleGenAI({ vertexai: true, project, location });
  }
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function parseIntake(body: unknown): IntakeData {
  const raw = (body ?? {}) as Record<string, unknown>;
  const levelRaw = Number(raw.evidenceLevel);
  const evidenceLevel: EvidenceLevel | null =
    levelRaw === 1 || levelRaw === 2 || levelRaw === 3 ? (levelRaw as EvidenceLevel) : null;
  const trim = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 4000) : "");
  return {
    teamName: trim(raw.teamName),
    problem: trim(raw.problem),
    action: trim(raw.action),
    evidenceLevel,
  };
}

export async function POST(request: Request) {
  let intake: IntakeData;
  try {
    intake = parseIntake(await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  if (!intake.problem && !intake.action) {
    return NextResponse.json(
      { error: "Se requiere al menos el problema o la acción ejecutada." },
      { status: 422 },
    );
  }

  const client = createClient();
  if (!client) {
    // Sin credenciales la sesión no se detiene: se audita con las reglas determinísticas.
    return NextResponse.json({
      audit: heuristicAudit(intake),
      notice: "Sin credenciales de Gemini: auditoría generada con las reglas locales.",
    });
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: buildUserPrompt(intake),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: RESPONSE_SCHEMA as any,
        temperature: 0.35,
        maxOutputTokens: 1400,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Respuesta vacía del modelo.");

    const parsed = JSON.parse(text) as Record<string, unknown>;
    return NextResponse.json({ audit: normalizeAudit(parsed, "gemini", MODEL) });
  } catch (error) {
    console.error("[audit] falló la llamada a Gemini:", error);
    return NextResponse.json({
      audit: heuristicAudit(intake),
      notice:
        "Gemini no respondió. Se muestra la auditoría local para no frenar la sesión.",
    });
  }
}
