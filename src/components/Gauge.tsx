"use client";

import { useEffect, useState } from "react";

const R = 80;
const CX = 100;
const CY = 100;
const ARC = Math.PI * R; // longitud del semicírculo

function toneFor(score: number) {
  if (score >= 66) return { stroke: "#10b981", text: "text-emerald-400", label: "Evidencia sólida" };
  if (score >= 36) return { stroke: "#f59e0b", text: "text-amber-400", label: "Evidencia parcial" };
  return { stroke: "#ef4444", text: "text-red-400", label: "Evidencia frágil" };
}

/** Velocímetro del Reliability Score, animado desde 0 al montar la auditoría. */
export default function Gauge({ score }: { score: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    const id = window.setTimeout(() => setShown(score), 60);
    return () => window.clearTimeout(id);
  }, [score]);

  const tone = toneFor(score);
  const filled = (Math.min(100, Math.max(0, shown)) / 100) * ARC;
  const angle = -90 + (Math.min(100, Math.max(0, shown)) / 100) * 180;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 128" className="w-full max-w-[240px]" role="img" aria-label={`Reliability Score ${score} por ciento`}>
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Zonas del semáforo, apenas visibles bajo el arco activo. */}
        <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX - 33.6} ${CY - 72.6}`} fill="none" stroke="#ef4444" strokeOpacity="0.22" strokeWidth="3" />
        <path d={`M ${CX - 33.6} ${CY - 72.6} A ${R} ${R} 0 0 1 ${CX + 39.6} ${CY - 69.5}`} fill="none" stroke="#f59e0b" strokeOpacity="0.22" strokeWidth="3" />
        <path d={`M ${CX + 39.6} ${CY - 69.5} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} fill="none" stroke="#10b981" strokeOpacity="0.22" strokeWidth="3" />

        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke={tone.stroke}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${ARC}`}
          style={{ transition: "stroke-dasharray 900ms cubic-bezier(.22,1,.36,1), stroke 400ms" }}
        />

        <g style={{ transition: "transform 900ms cubic-bezier(.22,1,.36,1)", transform: `rotate(${angle}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
          <line
            x1={CX}
            y1={CY - R + 22}
            x2={CX}
            y2={CY - R - 3}
            stroke={tone.stroke}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx={CX} cy={CY - R - 8} r="3.5" fill={tone.stroke} />
        </g>

        <text x={CX} y={CY - 26} textAnchor="middle" className={`fill-current ${tone.text}`} style={{ fontSize: 38, fontWeight: 800 }}>
          {Math.round(shown)}
        </text>
        <text x={CX} y={CY - 10} textAnchor="middle" fill="#64748b" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
          / 100
        </text>
        <text x={CX - R} y={CY + 16} textAnchor="middle" fill="#475569" style={{ fontSize: 9 }}>0</text>
        <text x={CX + R} y={CY + 16} textAnchor="middle" fill="#475569" style={{ fontSize: 9 }}>100</text>
      </svg>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Reliability Score</p>
      <p className={`text-sm font-bold ${tone.text}`}>{tone.label}</p>
    </div>
  );
}
