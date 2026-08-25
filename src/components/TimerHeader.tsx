"use client";

import { Pause, Play, RotateCcw, Zap } from "lucide-react";
import { SESSION_SECONDS, formatClock, type TimerTone } from "@/lib/useTimer";

const TONE: Record<TimerTone, { text: string; ring: string; bar: string; dot: string; label: string }> = {
  green: {
    text: "text-emerald-400",
    ring: "border-emerald-400/30 bg-emerald-400/[0.07]",
    bar: "bg-emerald-400",
    dot: "bg-emerald-400",
    label: "Exploración",
  },
  amber: {
    text: "text-amber-400",
    ring: "border-amber-400/30 bg-amber-400/[0.07]",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
    label: "Cierra la evidencia",
  },
  red: {
    text: "text-red-400",
    ring: "border-red-400/40 bg-red-400/[0.09]",
    bar: "bg-red-400",
    dot: "bg-red-400",
    label: "Compromiso ya",
  },
};

interface Props {
  remaining: number;
  running: boolean;
  tone: TimerTone;
  onToggle: () => void;
  onReset: () => void;
  onJumpToEvidence: () => void;
}

export default function TimerHeader({
  remaining,
  running,
  tone,
  onToggle,
  onReset,
  onJumpToEvidence,
}: Props) {
  const t = TONE[tone];
  const progress = ((SESSION_SECONDS - remaining) / SESSION_SECONDS) * 100;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2 sm:px-5 sm:py-2.5 ${t.ring} ${
              tone === "red" && running ? "animate-pulse-ring" : ""
            }`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${t.dot} ${running ? "animate-pulse" : ""}`} />
            <span className={`tabular font-mono text-3xl font-bold leading-none sm:text-4xl ${t.text}`}>
              {formatClock(remaining)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-100">Co-piloto de Mentoría</p>
            <p className={`truncate text-xs font-medium ${t.text}`}>
              {remaining === 0 ? "Tiempo agotado" : t.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="btn-ghost px-3 sm:px-4"
            aria-label={running ? "Pausar cronómetro" : "Iniciar cronómetro"}
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {running ? "Pausar" : remaining === SESSION_SECONDS ? "Iniciar" : "Reanudar"}
            </span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="btn-ghost px-3"
            aria-label="Reiniciar cronómetro a 20:00"
            title="Reiniciar a 20:00"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onJumpToEvidence}
            className="btn flex-1 whitespace-nowrap bg-amber-400 px-3 text-ink-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300 sm:flex-none sm:px-4"
          >
            <Zap className="h-4 w-4" fill="currentColor" />
            ¡Ir a la Evidencia!
          </button>
        </div>
      </div>

      <div className="h-1 w-full bg-white/5" role="presentation">
        <div
          className={`h-full transition-[width] duration-300 ease-linear ${t.bar}`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </header>
  );
}
