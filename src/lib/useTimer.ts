"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const SESSION_SECONDS = 20 * 60;

export type TimerTone = "green" | "amber" | "red";

/**
 * Cronómetro regresivo basado en marcas de tiempo reales: no acumula deriva
 * si la pestaña queda en segundo plano durante la sesión.
 */
export function useTimer(total = SESSION_SECONDS) {
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const deadlineRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (deadlineRef.current === null) return;
      const left = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) setRunning(false);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    if (running) return;
    deadlineRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  }, [running, remaining]);

  const pause = useCallback(() => setRunning(false), []);

  const toggle = useCallback(() => {
    if (running) pause();
    else start();
  }, [running, start, pause]);

  const reset = useCallback(() => {
    setRunning(false);
    deadlineRef.current = null;
    setRemaining(total);
  }, [total]);

  const elapsed = total - remaining;
  const tone: TimerTone = remaining > 600 ? "green" : remaining > 300 ? "amber" : "red";

  return { remaining, elapsed, running, tone, total, start, pause, toggle, reset };
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
