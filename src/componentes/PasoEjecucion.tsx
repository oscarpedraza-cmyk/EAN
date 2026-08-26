"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import Dictado from "./Dictado";
import Paso from "./Paso";
import { PASOS } from "@/lib/guia";
import { anexarDictado } from "@/lib/useDictado";
import type { Ejecucion } from "@/lib/tipos";

const META = PASOS[0];

interface Props {
  valor: Ejecucion;
  alCambiar: (parche: Partial<Ejecucion>) => void;
  activo: boolean;
}

export default function PasoEjecucion({ valor, alCambiar, activo }: Props) {
  const [parcial, setParcial] = useState<Record<string, string>>({});

  const dictado = (campo: keyof Ejecucion, etiqueta: string) => (
    <Dictado
      campo={etiqueta}
      alTexto={(trozo) => {
        alCambiar({ [campo]: anexarDictado(valor[campo], trozo) } as Partial<Ejecucion>);
        setParcial((p) => ({ ...p, [campo]: "" }));
      }}
      alParcial={(trozo) => setParcial((p) => ({ ...p, [campo]: trozo }))}
    />
  );

  const fantasma = (campo: string) =>
    parcial[campo] ? (
      <p className="mt-1 truncate text-[11px] italic text-cian/70">…{parcial[campo]}</p>
    ) : null;

  const completo = Boolean(valor.loEjecutado.trim());

  return (
    <Paso
      id="paso-ejecucion"
      numero={META.numero}
      titulo={META.titulo}
      ayuda={META.ayuda}
      icono={ClipboardList}
      activo={activo}
      completo={completo}
    >
      <div className="grid gap-3.5">
        <div>
          <label className="rotulo" htmlFor="equipo">
            Equipo
            <span className="ml-auto normal-case tracking-normal">{dictado("equipo", "el equipo")}</span>
          </label>
          <input
            id="equipo"
            className="campo"
            placeholder="Ej: Comidas Express - Delivery de Almuerzos"
            value={valor.equipo}
            onChange={(e) => alCambiar({ equipo: e.target.value })}
            autoComplete="off"
          />
          {fantasma("equipo")}
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="rotulo" htmlFor="plan">
              Plan acordado
              <span className="ml-auto normal-case tracking-normal">{dictado("planAcordado", "el plan")}</span>
            </label>
            <textarea
              id="plan"
              className="campo min-h-[120px] resize-y leading-relaxed"
              placeholder="Ej: Completar 50 entregas el próximo mes con 3 repartidores, mejorando el tiempo promedio de entrega a máximo 30 minutos. Validar 5 nuevas zonas del barrio."
              value={valor.planAcordado}
              onChange={(e) => alCambiar({ planAcordado: e.target.value })}
            />
            {fantasma("planAcordado")}
          </div>
          <div>
            <label className="rotulo" htmlFor="ejecutado">
              Lo que realmente se ejecutó
              <span className="ml-auto normal-case tracking-normal">{dictado("loEjecutado", "lo ejecutado")}</span>
            </label>
            <textarea
              id="ejecutado"
              className="campo min-h-[120px] resize-y leading-relaxed"
              placeholder="Ej: Logramos 42 entregas en 4 semanas con 2 repartidores (uno se enfermó). El tiempo promedio fue 35 min. Abrimos 3 de las 5 zonas planeadas. Dos entregas fallaron por dirección incorrecta."
              value={valor.loEjecutado}
              onChange={(e) => alCambiar({ loEjecutado: e.target.value })}
            />
            {fantasma("loEjecutado")}
          </div>
        </div>

        <div>
          <label className="rotulo" htmlFor="desviaciones">
            Desviaciones relevantes
            <span className="ml-auto normal-case tracking-normal">
              {dictado("desviaciones", "las desviaciones")}
            </span>
          </label>
          <input
            id="desviaciones"
            className="campo"
            placeholder="Ej: No llegamos a 50 entregas por repartidor enfermo. 2 zonas no se abrieron por falta de motos. Sí mejoramos tiempo de entrega pero tuvimos más errores de dirección."
            value={valor.desviaciones}
            onChange={(e) => alCambiar({ desviaciones: e.target.value })}
          />
          {fantasma("desviaciones")}
        </div>
      </div>
    </Paso>
  );
}
