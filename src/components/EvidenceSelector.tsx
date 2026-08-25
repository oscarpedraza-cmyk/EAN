"use client";

import { Check } from "lucide-react";
import { EVIDENCE_LEVELS, type EvidenceLevel } from "@/lib/types";

const TONE = {
  red: {
    idle: "border-red-500/20 hover:border-red-500/50 hover:bg-red-500/[0.06]",
    active: "border-red-500 bg-red-500/15 ring-2 ring-red-500/30",
    dot: "bg-red-500",
    text: "text-red-300",
  },
  amber: {
    idle: "border-amber-400/20 hover:border-amber-400/50 hover:bg-amber-400/[0.06]",
    active: "border-amber-400 bg-amber-400/15 ring-2 ring-amber-400/30",
    dot: "bg-amber-400",
    text: "text-amber-300",
  },
  green: {
    idle: "border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/[0.06]",
    active: "border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30",
    dot: "bg-emerald-500",
    text: "text-emerald-300",
  },
} as const;

interface Props {
  value: EvidenceLevel | null;
  onChange: (level: EvidenceLevel) => void;
}

/** Clickers del semáforo de evidencia: una sola pulsación durante la sesión. */
export default function EvidenceSelector({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Nivel de evidencia"
      className="grid gap-2 sm:grid-cols-3"
    >
      {EVIDENCE_LEVELS.map((item) => {
        const tone = TONE[item.tone];
        const active = value === item.level;
        return (
          <button
            key={item.level}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(item.level)}
            className={`group relative rounded-xl border bg-ink-950/50 p-3 text-left transition active:scale-[.98] ${
              active ? tone.active : tone.idle
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
              <span className={`text-xs font-bold uppercase tracking-wide ${tone.text}`}>
                {item.label}
              </span>
              {active && <Check className={`ml-auto h-4 w-4 ${tone.text}`} strokeWidth={3} />}
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-100">{item.short}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{item.examples}</p>
          </button>
        );
      })}
    </div>
  );
}
