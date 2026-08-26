import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { normalizarInterpretacion } from "@/lib/analisis";
import { interpretacionLocal } from "@/lib/motorLocal";
import { ESQUEMA_RESPUESTA, INSTRUCCION_SISTEMA, construirPrompt } from "@/lib/prompt";
import type { Encuentro } from "@/lib/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODELO = process.env.GEMINI_MODEL || "gemini-1.5-flash";

/**
 * El Google Gen AI SDK sirve las dos rutas de acceso:
 * Gemini Developer API (GEMINI_API_KEY) o Vertex AI (GOOGLE_GENAI_USE_VERTEXAI=true).
 */
function crearCliente(): GoogleGenAI | null {
  if (process.env.GOOGLE_GENAI_USE_VERTEXAI === "true") {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    if (!project) return null;
    return new GoogleGenAI({
      vertexai: true,
      project,
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    });
  }
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}

function recortar(valor: unknown, max = 2000): string {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

/** Reconstruye el encuentro desde el cuerpo de la petición sin confiar en su forma. */
function leerEncuentro(cuerpo: unknown): Encuentro {
  const c = (cuerpo ?? {}) as Record<string, unknown>;
  const ejecucion = (c.ejecucion ?? {}) as Record<string, unknown>;
  const ciclo = (c.segundoCiclo ?? {}) as Record<string, unknown>;
  const filas = Array.isArray(c.evidencias) ? c.evidencias.slice(0, 12) : [];
  const metricas = Array.isArray(c.metricas) ? c.metricas.slice(0, 12) : [];

  return {
    id: recortar(c.id, 64) || "sin-id",
    creadoEn: recortar(c.creadoEn, 40) || new Date().toISOString(),
    ejecucion: {
      equipo: recortar(ejecucion.equipo, 160),
      planAcordado: recortar(ejecucion.planAcordado),
      loEjecutado: recortar(ejecucion.loEjecutado),
      desviaciones: recortar(ejecucion.desviaciones),
    },
    evidencias: filas.map((f) => {
      const r = (f ?? {}) as Record<string, unknown>;
      const tipo = recortar(r.tipo, 20);
      return {
        id: recortar(r.id, 40) || "ev-0",
        accion: recortar(r.accion),
        soporte: recortar(r.soporte, 500),
        resultado: recortar(r.resultado),
        tipo:
          tipo === "Opinion" || tipo === "Intencion" || tipo === "Comportamiento" ? tipo : null,
        aprendizaje: recortar(r.aprendizaje),
      };
    }),
    metricas: metricas.map((m) => {
      const r = (m ?? {}) as Record<string, unknown>;
      return {
        id: recortar(r.id, 40) || "me-0",
        metrica: recortar(r.metrica, 200),
        definicion: recortar(r.definicion, 300),
        fuente: recortar(r.fuente, 300),
        lineaBase: recortar(r.lineaBase, 80),
        umbral: recortar(r.umbral, 80),
        resultado: recortar(r.resultado, 120),
      };
    }),
    interpretacion: null,
    decision: null,
    sustentoDecision: "",
    segundoCiclo: {
      hipotesisAjustada: recortar(ciclo.hipotesisAjustada),
      accion: recortar(ciclo.accion),
      metrica: recortar(ciclo.metrica, 200),
      umbral: recortar(ciclo.umbral, 80),
      responsable: recortar(ciclo.responsable, 120),
      fecha: recortar(ciclo.fecha, 40),
    },
    chequeo: {} as Encuentro["chequeo"],
  };
}

export async function POST(request: Request) {
  let encuentro: Encuentro;
  try {
    encuentro = leerEncuentro(await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  const hayAlgoQueAuditar =
    encuentro.evidencias.some((f) => f.accion.trim() || f.resultado.trim()) ||
    encuentro.ejecucion.loEjecutado.trim();

  if (!hayAlgoQueAuditar) {
    return NextResponse.json(
      { error: "Registren al menos lo ejecutado o una acción con su resultado." },
      { status: 422 },
    );
  }

  const cliente = crearCliente();
  if (!cliente) {
    return NextResponse.json({
      interpretacion: interpretacionLocal(encuentro),
      aviso: "Sin credenciales de Gemini: interpretación generada con las reglas locales de la guía.",
    });
  }

  try {
    const respuesta = await cliente.models.generateContent({
      model: MODELO,
      contents: construirPrompt(encuentro),
      config: {
        systemInstruction: INSTRUCCION_SISTEMA,
        responseMimeType: "application/json",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: ESQUEMA_RESPUESTA as any,
        temperature: 0.3,
        maxOutputTokens: 2400,
      },
    });

    const texto = respuesta.text;
    if (!texto) throw new Error("Respuesta vacía del modelo.");

    const analizada = JSON.parse(texto) as Record<string, unknown>;
    return NextResponse.json({
      interpretacion: normalizarInterpretacion(analizada, encuentro, "gemini", MODELO),
    });
  } catch (error) {
    console.error("[interpretar] falló la llamada a Gemini:", error);
    return NextResponse.json({
      interpretacion: interpretacionLocal(encuentro),
      aviso: "Gemini no respondió. Se muestra la interpretación local para no frenar la mentoría.",
    });
  }
}
