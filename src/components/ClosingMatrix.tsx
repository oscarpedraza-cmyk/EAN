"use client";

import { useState } from "react";
import {
  Check,
  Cloud,
  CloudOff,
  Compass,
  FileDown,
  HardDriveDownload,
  Loader2,
  Mail,
  OctagonX,
  SlidersHorizontal,
  Signature,
} from "lucide-react";
import SectionCard from "./SectionCard";
import { DECISIONS, type Decision, type MentorshipSession } from "@/lib/types";
import type { PersistTarget } from "@/lib/storage";

const TONE = {
  green: { active: "border-emerald-500 bg-emerald-500/15 text-emerald-200 ring-2 ring-emerald-500/25", idle: "hover:border-emerald-500/50 hover:text-emerald-300" },
  amber: { active: "border-amber-400 bg-amber-400/15 text-amber-200 ring-2 ring-amber-400/25", idle: "hover:border-amber-400/50 hover:text-amber-300" },
  red: { active: "border-red-500 bg-red-500/15 text-red-200 ring-2 ring-red-500/25", idle: "hover:border-red-500/50 hover:text-red-300" },
  blue: { active: "border-sky-400 bg-sky-400/15 text-sky-200 ring-2 ring-sky-400/25", idle: "hover:border-sky-400/50 hover:text-sky-300" },
} as const;

const ICONS: Record<Decision, typeof Check> = {
  Mantener: Check,
  Ajustar: SlidersHorizontal,
  Detener: OctagonX,
  Explorar: Compass,
};

interface Props {
  session: MentorshipSession;
  onDecision: (decision: Decision) => void;
  onNote: (note: string) => void;
  onExport: () => Promise<void>;
  onEmail: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
  savedTo: PersistTarget | null;
  firebaseReady: boolean;
  active: boolean;
}

export default function ClosingMatrix({
  session,
  onDecision,
  onNote,
  onExport,
  onEmail,
  onSave,
  saving,
  savedTo,
  firebaseReady,
  active,
}: Props) {
  const [exporting, setExporting] = useState(false);
  const ready = Boolean(session.decision);

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport();
    } finally {
      setExporting(false);
    }
  };

  return (
    <SectionCard
      id="panel-cierre"
      step={3}
      window="Minutos 15-20"
      title="Matriz de cierre y compromiso"
      subtitle="Una decisión explícita antes de que el equipo se vaya."
      icon={Signature}
      active={active}
      action={
        <span
          className={`chip ${firebaseReady ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-slate-500"}`}
          title={firebaseReady ? "Firestore configurado" : "Sin Firestore: se guarda en este navegador"}
        >
          {firebaseReady ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
          {firebaseReady ? "Firestore" : "Local"}
        </span>
      }
    >
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {DECISIONS.map(({ key, helper, tone }) => {
            const Icon = ICONS[key];
            const on = session.decision === key;
            const t = TONE[tone];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => onDecision(key)}
                className={`rounded-xl border border-white/10 bg-ink-950/50 p-3.5 text-left text-slate-300 transition active:scale-[.98] ${
                  on ? t.active : t.idle
                }`}
              >
                <Icon className="h-5 w-5" />
                <p className="mt-2 text-base font-bold">{key}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{helper}</p>
              </button>
            );
          })}
        </div>

        <div>
          <label className="label" htmlFor="commitment">
            Compromiso concreto del equipo
          </label>
          <textarea
            id="commitment"
            className="field min-h-[76px] resize-y leading-relaxed"
            placeholder="Quién hace qué, con qué número y para cuándo."
            value={session.decisionNote}
            onChange={(e) => onNote(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExport} disabled={!ready || exporting} className="btn-primary">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Descargar one-pager (PDF)
          </button>
          <button type="button" onClick={onEmail} disabled={!ready} className="btn-ghost">
            <Mail className="h-4 w-4" />
            Enviar por correo
          </button>
          <button type="button" onClick={onSave} disabled={saving} className="btn-ghost">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveDownload className="h-4 w-4" />}
            Guardar sesión
          </button>
          {savedTo && !saving && (
            <span className="chip self-center border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <Check className="h-3.5 w-3.5" />
              Guardado en {savedTo === "firestore" ? "Firestore" : "este navegador"}
            </span>
          )}
        </div>

        {!ready && (
          <p className="text-xs text-slate-500">
            Elige una decisión metodológica para habilitar la ficha de cierre.
          </p>
        )}
      </div>
    </SectionCard>
  );
}
