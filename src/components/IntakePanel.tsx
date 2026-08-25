"use client";

import { useState } from "react";
import { Eraser, Target, Users, Waypoints } from "lucide-react";
import EvidenceSelector from "./EvidenceSelector";
import SpeechButton from "./SpeechButton";
import SectionCard from "./SectionCard";
import type { EvidenceLevel, IntakeData } from "@/lib/types";

interface Props {
  value: IntakeData;
  onChange: (patch: Partial<IntakeData>) => void;
  onClear: () => void;
  active: boolean;
}

function appendDictation(current: string, chunk: string): string {
  if (!chunk) return current;
  const base = current.trimEnd();
  if (!base) return chunk.charAt(0).toUpperCase() + chunk.slice(1);
  const needsStop = /[.!?]$/.test(base) ? " " : ". ";
  return `${base}${needsStop}${chunk.charAt(0).toUpperCase()}${chunk.slice(1)}`;
}

export default function IntakePanel({ value, onChange, onClear, active }: Props) {
  const [interim, setInterim] = useState<Record<string, string>>({});

  const dictate = (field: keyof IntakeData) => (
    <SpeechButton
      label={String(field)}
      onFinal={(chunk) => {
        onChange({ [field]: appendDictation(String(value[field] ?? ""), chunk) } as Partial<IntakeData>);
        setInterim((s) => ({ ...s, [field]: "" }));
      }}
      onInterim={(chunk) => setInterim((s) => ({ ...s, [field]: chunk }))}
    />
  );

  const ghost = (field: string) =>
    interim[field] ? (
      <p className="mt-1 truncate text-[11px] italic text-sky-400/70">…{interim[field]}</p>
    ) : null;

  return (
    <SectionCard
      id="panel-entrada"
      step={1}
      window="Minutos 0-8"
      title="Entrada rápida"
      subtitle="Captura lo que el equipo dice, sin editarlo."
      icon={Waypoints}
      active={active}
      action={
        <button type="button" onClick={onClear} className="chip border-white/10 bg-white/[0.04] text-slate-400 hover:text-slate-200">
          <Eraser className="h-3.5 w-3.5" />
          Limpiar
        </button>
      }
    >
      <div className="grid gap-4">
        <div>
          <label className="label" htmlFor="team">
            <Users className="h-3.5 w-3.5" />
            Nombre del equipo
            <span className="ml-auto normal-case tracking-normal">{dictate("teamName")}</span>
          </label>
          <input
            id="team"
            className="field"
            placeholder="Ej. Cosecha Directa"
            value={value.teamName}
            onChange={(e) => onChange({ teamName: e.target.value })}
            autoComplete="off"
          />
          {ghost("teamName")}
        </div>

        <div>
          <label className="label" htmlFor="problem">
            <Target className="h-3.5 w-3.5" />
            Problema / Segmento
            <span className="ml-auto normal-case tracking-normal">{dictate("problem")}</span>
          </label>
          <textarea
            id="problem"
            className="field min-h-[92px] resize-y leading-relaxed"
            placeholder="¿Quién tiene el problema y qué le duele hoy?"
            value={value.problem}
            onChange={(e) => onChange({ problem: e.target.value })}
          />
          {ghost("problem")}
        </div>

        <div>
          <label className="label" htmlFor="action">
            <Waypoints className="h-3.5 w-3.5" />
            Acción ejecutada y resultado
            <span className="ml-auto normal-case tracking-normal">{dictate("action")}</span>
          </label>
          <textarea
            id="action"
            className="field min-h-[110px] resize-y leading-relaxed"
            placeholder="¿Qué hicieron esta semana, con cuántas personas y qué pasó? Números, no adjetivos."
            value={value.action}
            onChange={(e) => onChange({ action: e.target.value })}
          />
          {ghost("action")}
        </div>

        <div>
          <span className="label">Nivel de evidencia declarado</span>
          <EvidenceSelector
            value={value.evidenceLevel}
            onChange={(level: EvidenceLevel) => onChange({ evidenceLevel: level })}
          />
        </div>
      </div>
    </SectionCard>
  );
}
