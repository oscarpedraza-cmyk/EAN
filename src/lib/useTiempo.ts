"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tiempo transcurrido del encuentro. La guía no fija una duración, así que
 * cuenta hacia arriba: informa sin presionar. Se ancla a una marca absoluta
 * para no acumular deriva si la pestaña pasa a segundo plano.
 */
export function useTiempo() {
  const [segundos, setSegundos] = useState(0);
  const [corriendo, setCorriendo] = useState(false);
  const inicioRef = useRef<number | null>(null);

  useEffect(() => {
    if (!corriendo) return;
    const tic = () => {
      if (inicioRef.current === null) return;
      setSegundos(Math.floor((Date.now() - inicioRef.current) / 1000));
    };
    tic();
    const id = window.setInterval(tic, 500);
    return () => window.clearInterval(id);
  }, [corriendo]);

  const alternar = useCallback(() => {
    if (corriendo) {
      setCorriendo(false);
      return;
    }
    inicioRef.current = Date.now() - segundos * 1000;
    setCorriendo(true);
  }, [corriendo, segundos]);

  const reiniciar = useCallback(() => {
    setCorriendo(false);
    inicioRef.current = null;
    setSegundos(0);
  }, []);

  return { segundos, corriendo, alternar, reiniciar };
}

export function formatoReloj(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
