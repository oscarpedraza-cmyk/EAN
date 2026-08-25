"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  id: string;
  step: number;
  window: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  active: boolean;
  action?: ReactNode;
  children: ReactNode;
}

/** Contenedor común de las tres etapas: mismo encabezado, mismo ritmo visual. */
export default function SectionCard({
  id,
  step,
  window,
  title,
  subtitle,
  icon: Icon,
  active,
  action,
  children,
}: Props) {
  return (
    <section
      id={id}
      className={`card scroll-mt-32 transition-colors duration-500 ${
        active ? "border-sky-400/30 ring-1 ring-sky-400/20" : ""
      }`}
    >
      <div className="flex flex-wrap items-start gap-3 border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
            active
              ? "border-sky-400/40 bg-sky-400/15 text-sky-300"
              : "border-white/10 bg-white/[0.04] text-slate-400"
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-bold text-slate-100">
              <span className="text-slate-500">{step}.</span> {title}
            </h2>
            <span
              className={`chip ${
                active
                  ? "border-sky-400/40 bg-sky-400/10 text-sky-300"
                  : "border-white/10 bg-white/[0.03] text-slate-500"
              }`}
            >
              {window}
            </span>
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
