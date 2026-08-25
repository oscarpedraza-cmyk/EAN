"use client";

import {
  AlertTriangle,
  FlaskConical,
  Gauge as GaugeIcon,
  Loader2,
  MessageCircleQuestion,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import Gauge from "./Gauge";
import SectionCard from "./SectionCard";
import { BLOCK_CATEGORIES, BLOCK_HINTS, BLOCK_LABELS, type AuditResult } from "@/lib/types";

interface Props {
  audit: AuditResult | null;
  loading: boolean;
  error: string | null;
  notice: string | null;
  canAudit: boolean;
  onAudit: () => void;
  active: boolean;
}

export default function AuditPanel({
  audit,
  loading,
  error,
  notice,
  canAudit,
  onAudit,
  active,
}: Props) {
  return (
    <SectionCard
      id="panel-auditoria"
      step={2}
      window="Minutos 9-14"
      title="Auditoría IA en tiempo real"
      subtitle="Separa la evidencia de la retórica."
      icon={Radar}
      active={active}
      action={
        <button type="button" onClick={onAudit} disabled={!canAudit || loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Auditando…" : audit ? "Volver a auditar" : "Auditar con IA"}
        </button>
      }
    >
      {error && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}
      {notice && !error && (
        <p className="mb-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.08] px-3.5 py-2.5 text-xs text-amber-300">
          {notice}
        </p>
      )}

      {!audit && !loading && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
          <GaugeIcon className="h-7 w-7 text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">Todavía no hay auditoría</p>
          <p className="max-w-sm text-xs text-slate-500">
            Completa el problema o la acción ejecutada y pulsa <strong>Auditar con IA</strong>. La
            respuesta llega en segundos para que la uses en vivo.
          </p>
        </div>
      )}

      {loading && !audit && (
        <div className="grid gap-3 sm:grid-cols-[240px_1fr]">
          <div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        </div>
      )}

      {audit && (
        <div className={`grid gap-4 animate-fade-up ${loading ? "opacity-60" : ""}`}>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)] sm:items-center">
            <div className="rounded-xl border border-white/[0.07] bg-ink-950/40 p-4">
              <Gauge score={audit.reliabilityScore} />
            </div>
            <div className="grid gap-3">
              <p className="text-sm leading-relaxed text-slate-300">{audit.scoreRationale}</p>

              <div>
                <p className="label mb-2">Categoría de bloqueo</p>
                <div className="flex flex-wrap gap-1.5">
                  {BLOCK_CATEGORIES.map((c) => {
                    const on = c === audit.blockCategory;
                    return (
                      <span
                        key={c}
                        title={BLOCK_HINTS[c]}
                        className={`chip ${
                          on
                            ? "border-sky-400/50 bg-sky-400/15 text-sky-200"
                            : "border-white/10 bg-white/[0.02] text-slate-600"
                        }`}
                      >
                        {on && <Target className="h-3 w-3" />}
                        {BLOCK_LABELS[c]}
                      </span>
                    );
                  })}
                </div>
                {audit.blockRationale && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{audit.blockRationale}</p>
                )}
              </div>
            </div>
          </div>

          {audit.selfDeception.detected ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/[0.09] p-4">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Auto-engaño detectado
              </p>
              <p className="mt-2 text-lg font-bold leading-snug text-red-200">
                {audit.selfDeception.headline}
              </p>
              {audit.selfDeception.detail && (
                <p className="mt-1.5 text-sm leading-relaxed text-red-200/75">
                  {audit.selfDeception.detail}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Sin auto-engaño evidente</p>
                <p className="text-xs text-emerald-200/70">{audit.selfDeception.detail}</p>
              </div>
            </div>
          )}

          <div>
            <p className="label">
              <MessageCircleQuestion className="h-3.5 w-3.5" />
              Preguntas clave para el mentor
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {audit.keyQuestions.map((q, i) => (
                <blockquote
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-lg font-semibold leading-snug text-slate-100 sm:text-xl"
                >
                  <span className="mr-1.5 font-mono text-sm text-sky-400">0{i + 1}</span>
                  {q}
                </blockquote>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <FlaskConical className="h-4 w-4 text-emerald-400" />
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-400">
                Experimento 48 horas
              </p>
              <span className="chip border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
                {audit.experiment.cost}
              </span>
            </div>
            <p className="mt-2.5 text-base font-bold text-slate-100">{audit.experiment.title}</p>
            {audit.experiment.hypothesis && (
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{audit.experiment.hypothesis}</p>
            )}
            <ol className="mt-3 grid gap-1.5">
              {audit.experiment.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
                  <span className="mt-[3px] flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-[10px] font-bold text-emerald-400">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-3.5 flex flex-wrap items-baseline gap-2 rounded-lg border border-emerald-500/25 bg-ink-950/50 px-3.5 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Umbral de éxito
              </span>
              <span className="text-base font-bold text-emerald-300">
                {audit.experiment.successThreshold}
              </span>
            </div>
          </div>

          {audit.evidenceGap && (
            <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-sm text-slate-400">
              <span className="font-semibold text-slate-300">Para subir de nivel: </span>
              {audit.evidenceGap}
            </p>
          )}

          <p className="text-right text-[10px] uppercase tracking-[0.14em] text-slate-600">
            {audit.source === "gemini" ? `Auditado por ${audit.model}` : "Auditado con reglas locales"}
          </p>
        </div>
      )}
    </SectionCard>
  );
}
