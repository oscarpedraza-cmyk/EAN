"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuditPanel from "@/components/AuditPanel";
import ClosingMatrix from "@/components/ClosingMatrix";
import IntakePanel from "@/components/IntakePanel";
import TimerHeader from "@/components/TimerHeader";
import { isFirebaseConfigured } from "@/lib/firebase";
import { buildEmailBody, generateOnePager } from "@/lib/pdf";
import { persistSession, type PersistTarget } from "@/lib/storage";
import type { AuditResult, Decision, IntakeData, MentorshipSession } from "@/lib/types";
import { SESSION_SECONDS, useTimer } from "@/lib/useTimer";

const EMPTY_INTAKE: IntakeData = { teamName: "", problem: "", action: "", evidenceLevel: null };

type Phase = "intake" | "audit" | "closing";

function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Home() {
  const timer = useTimer();
  const [sessionId] = useState(newSessionId);
  const [createdAt] = useState(() => new Date().toISOString());

  const [intake, setIntake] = useState<IntakeData>(EMPTY_INTAKE);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedTo, setSavedTo] = useState<PersistTarget | null>(null);
  const [override, setOverride] = useState<Phase | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const patchIntake = useCallback((patch: Partial<IntakeData>) => {
    setIntake((prev) => ({ ...prev, ...patch }));
    setSavedTo(null);
  }, []);

  const canAudit = Boolean(intake.problem.trim() || intake.action.trim());

  const runAudit = useCallback(async () => {
    if (!canAudit || loading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        audit?: AuditResult;
        notice?: string;
        error?: string;
      };
      if (!response.ok || !data.audit) {
        setError(data.error ?? "No se pudo completar la auditoría.");
        return;
      }
      setAudit(data.audit);
      setNotice(data.notice ?? null);
      setSavedTo(null);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError("Sin conexión con el servicio de auditoría. Revisa la red e intenta de nuevo.");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }, [canAudit, intake, loading]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /** Fase sugerida por el reloj, salvo que el mentor haya saltado manualmente. */
  const phase: Phase = useMemo(() => {
    if (override) return override;
    const minutes = timer.elapsed / 60;
    if (minutes < 8) return "intake";
    if (minutes < 14) return "audit";
    return "closing";
  }, [override, timer.elapsed]);

  const jumpToEvidence = useCallback(() => {
    setOverride("audit");
    if (!timer.running && timer.remaining === SESSION_SECONDS) timer.start();
    document.getElementById("panel-auditoria")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (canAudit && !loading) void runAudit();
  }, [canAudit, loading, runAudit, timer]);

  const session: MentorshipSession = useMemo(
    () => ({
      id: sessionId,
      createdAt,
      intake,
      audit,
      decision,
      decisionNote,
      elapsedSeconds: timer.elapsed,
    }),
    [sessionId, createdAt, intake, audit, decision, decisionNote, timer.elapsed],
  );

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const result = await persistSession(session);
      setSavedTo(result.target);
    } finally {
      setSaving(false);
    }
  }, [session]);

  const exportPdf = useCallback(async () => {
    await generateOnePager(session);
    void save();
  }, [session, save]);

  const emailSummary = useCallback(() => {
    const subject = `Ficha de mentoría — ${session.intake.teamName || "Equipo"}`;
    const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      buildEmailBody(session),
    )}`;
    window.location.href = href;
  }, [session]);

  // Al elegir decisión se persiste sola: nadie recuerda pulsar "guardar" al minuto 20.
  const chooseDecision = useCallback((value: Decision) => {
    setDecision(value);
    setOverride("closing");
    setSavedTo(null);
  }, []);

  return (
    <div className="min-h-screen">
      <TimerHeader
        remaining={timer.remaining}
        running={timer.running}
        tone={timer.tone}
        onToggle={timer.toggle}
        onReset={() => {
          timer.reset();
          setOverride(null);
        }}
        onJumpToEvidence={jumpToEvidence}
      />

      {/* En movil el orden es 1-2-3; en escritorio la auditoria ocupa la columna derecha completa. */}
      <main className="mx-auto grid max-w-6xl auto-rows-min gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-2">
        <div className="lg:col-start-1 lg:row-start-1">
          <IntakePanel
            value={intake}
            onChange={patchIntake}
            onClear={() => {
              setIntake(EMPTY_INTAKE);
              setAudit(null);
              setNotice(null);
              setError(null);
            }}
            active={phase === "intake"}
          />
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <AuditPanel
            audit={audit}
            loading={loading}
            error={error}
            notice={notice}
            canAudit={canAudit}
            onAudit={() => {
              setOverride("audit");
              void runAudit();
            }}
            active={phase === "audit"}
          />
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <ClosingMatrix
            session={session}
            onDecision={chooseDecision}
            onNote={setDecisionNote}
            onExport={exportPdf}
            onEmail={emailSummary}
            onSave={save}
            saving={saving}
            savedTo={savedTo}
            firebaseReady={isFirebaseConfigured}
            active={phase === "closing"}
          />
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-[11px] text-slate-600 sm:px-6">
        20 minutos · 3 etapas · una decisión. La evidencia manda.
      </footer>
    </div>
  );
}
