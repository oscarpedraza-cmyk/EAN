"use client";

import { useState } from "react";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";

interface Hallazgo {
  id: string;
  iniciativa: string;
  usuario: string;
  prototipo: "boceto" | "fisico" | "digital";
  funciono: string;
  confundio: string;
  cita: string;
  intencion: "si" | "talvez" | "no";
  claridad: number;
  satisfaccion: number;
  accion: string;
  fecha: string;
}

export default function Prototipado() {
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([]);
  const [nuevo, setNuevo] = useState<Partial<Hallazgo>>({
    prototipo: "boceto",
    claridad: 3,
    satisfaccion: 3,
    fecha: new Date().toISOString().split("T")[0],
  });
  const [guardando, setGuardando] = useState(false);

  const agregar = () => {
    if (!nuevo.iniciativa?.trim() || !nuevo.usuario?.trim()) {
      alert("Completa iniciativa y usuario");
      return;
    }

    const hallazgo: Hallazgo = {
      id: Math.random().toString(36).substr(2, 9),
      iniciativa: nuevo.iniciativa,
      usuario: nuevo.usuario,
      prototipo: nuevo.prototipo || "boceto",
      funciono: nuevo.funciono || "",
      confundio: nuevo.confundio || "",
      cita: nuevo.cita || "",
      intencion: nuevo.intencion || "talvez",
      claridad: nuevo.claridad || 3,
      satisfaccion: nuevo.satisfaccion || 3,
      accion: nuevo.accion || "",
      fecha: nuevo.fecha || new Date().toISOString().split("T")[0],
    };

    setHallazgos([...hallazgos, hallazgo]);
    setNuevo({
      prototipo: "boceto",
      claridad: 3,
      satisfaccion: 3,
      fecha: new Date().toISOString().split("T")[0],
    });
  };

  const eliminar = (id: string) => {
    setHallazgos(hallazgos.filter((h) => h.id !== id));
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const data = {
        fecha: new Date().toISOString(),
        hallazgos,
        resumen: {
          total: hallazgos.length,
          promedioClaridad:
            hallazgos.length > 0
              ? Math.round(hallazgos.reduce((s, h) => s + h.claridad, 0) / hallazgos.length)
              : 0,
          promedioSatisfaccion:
            hallazgos.length > 0
              ? Math.round(hallazgos.reduce((s, h) => s + h.satisfaccion, 0) / hallazgos.length)
              : 0,
          intentoSi: hallazgos.filter((h) => h.intencion === "si").length,
        },
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hallazgos-prototipado-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert(`✅ Guardado: ${hallazgos.length} hallazgos capturados`);
    } finally {
      setGuardando(false);
    }
  };

  const promedioClaridad =
    hallazgos.length > 0
      ? (hallazgos.reduce((s, h) => s + h.claridad, 0) / hallazgos.length).toFixed(1)
      : "—";

  const promedioSatisfaccion =
    hallazgos.length > 0
      ? (hallazgos.reduce((s, h) => s + h.satisfaccion, 0) / hallazgos.length).toFixed(1)
      : "—";

  const intentoSi = hallazgos.filter((h) => h.intencion === "si").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cian/10 to-menta/10">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-pizarra-oscuro">
            🚀 Validación de Prototipado
          </h1>
          <p className="mt-2 text-pizarra">
            Documenta hallazgos de testeos de usuario en tiempo real
          </p>
        </div>

        {/* RESUMEN */}
        {hallazgos.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-cian/40 bg-cian/10 p-4 text-center">
              <p className="text-2xl font-bold text-cian">{hallazgos.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-pizarra">
                Testeos
              </p>
            </div>
            <div className="rounded-lg border border-menta/40 bg-menta/10 p-4 text-center">
              <p className="text-2xl font-bold text-menta">{promedioClaridad}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-pizarra">
                Claridad
              </p>
            </div>
            <div className="rounded-lg border border-ambar/40 bg-ambar/10 p-4 text-center">
              <p className="text-2xl font-bold text-ambar">{promedioSatisfaccion}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-pizarra">
                Satisfacción
              </p>
            </div>
            <div className="rounded-lg border border-ladrillo/40 bg-ladrillo/10 p-4 text-center">
              <p className="text-2xl font-bold text-ladrillo">{intentoSi}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-pizarra">
                Usarían
              </p>
            </div>
          </div>
        )}

        {/* FORMULARIO */}
        <div className="mb-8 rounded-xl border border-casco-700 bg-white p-6">
          <h2 className="mb-6 text-xl font-bold text-pizarra-oscuro">
            ➕ Nuevo Hallazgo
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="rotulo">Iniciativa</label>
              <input
                className="campo"
                placeholder="Ej: Comidas Express"
                value={nuevo.iniciativa || ""}
                onChange={(e) =>
                  setNuevo({ ...nuevo, iniciativa: e.target.value })
                }
              />
            </div>

            <div>
              <label className="rotulo">Usuario</label>
              <input
                className="campo"
                placeholder="Ej: Carlos, 28 años"
                value={nuevo.usuario || ""}
                onChange={(e) => setNuevo({ ...nuevo, usuario: e.target.value })}
              />
            </div>

            <div>
              <label className="rotulo">Prototipo</label>
              <select
                className="campo"
                value={nuevo.prototipo || "boceto"}
                onChange={(e) =>
                  setNuevo({
                    ...nuevo,
                    prototipo: e.target.value as "boceto" | "fisico" | "digital",
                  })
                }
              >
                <option value="boceto">📄 Boceto</option>
                <option value="fisico">🛠️ Físico</option>
                <option value="digital">💻 Digital</option>
              </select>
            </div>

            <div>
              <label className="rotulo">Fecha</label>
              <input
                type="date"
                className="campo"
                value={nuevo.fecha || ""}
                onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="rotulo">¿Qué FUNCIONÓ?</label>
            <textarea
              className="campo min-h-[80px]"
              placeholder="Descubre qué hizo bien tu prototipo..."
              value={nuevo.funciono || ""}
              onChange={(e) => setNuevo({ ...nuevo, funciono: e.target.value })}
            />
          </div>

          <div className="mt-4">
            <label className="rotulo">¿Qué confundió o NO funcionó?</label>
            <textarea
              className="campo min-h-[80px]"
              placeholder="Identifica los problemas o confusiones..."
              value={nuevo.confundio || ""}
              onChange={(e) => setNuevo({ ...nuevo, confundio: e.target.value })}
            />
          </div>

          <div className="mt-4">
            <label className="rotulo">Cita textual del usuario</label>
            <input
              className="campo"
              placeholder='Ej: "Esto no es claro, esperaba que..."'
              value={nuevo.cita || ""}
              onChange={(e) => setNuevo({ ...nuevo, cita: e.target.value })}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="rotulo">¿Usarías esto?</label>
              <select
                className="campo"
                value={nuevo.intencion || "talvez"}
                onChange={(e) =>
                  setNuevo({
                    ...nuevo,
                    intencion: e.target.value as "si" | "talvez" | "no",
                  })
                }
              >
                <option value="si">✅ Sí</option>
                <option value="talvez">❓ Tal vez</option>
                <option value="no">❌ No</option>
              </select>
            </div>

            <div>
              <label className="rotulo">Claridad (1-5)</label>
              <input
                type="range"
                min="1"
                max="5"
                className="w-full"
                value={nuevo.claridad || 3}
                onChange={(e) =>
                  setNuevo({ ...nuevo, claridad: parseInt(e.target.value) })
                }
              />
              <p className="mt-1 text-center text-sm font-bold text-cian">
                {nuevo.claridad}/5
              </p>
            </div>

            <div>
              <label className="rotulo">Satisfacción (1-5)</label>
              <input
                type="range"
                min="1"
                max="5"
                className="w-full"
                value={nuevo.satisfaccion || 3}
                onChange={(e) =>
                  setNuevo({
                    ...nuevo,
                    satisfaccion: parseInt(e.target.value),
                  })
                }
              />
              <p className="mt-1 text-center text-sm font-bold text-menta">
                {nuevo.satisfaccion}/5
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="rotulo">¿Qué haremos diferente?</label>
            <textarea
              className="campo min-h-[80px]"
              placeholder="Acciones a tomar basadas en este hallazgo..."
              value={nuevo.accion || ""}
              onChange={(e) => setNuevo({ ...nuevo, accion: e.target.value })}
            />
          </div>

          <button
            onClick={agregar}
            className="boton-menta mt-6 w-full"
          >
            <Plus className="h-4 w-4" />
            Registrar Hallazgo
          </button>
        </div>

        {/* LISTADO DE HALLAZGOS */}
        {hallazgos.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-pizarra-oscuro">
              📋 Hallazgos Registrados
            </h2>

            <div className="grid gap-4">
              {hallazgos.map((h, idx) => (
                <div
                  key={h.id}
                  className="rounded-lg border border-casco-700 bg-casco-950/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-xs text-pizarra">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-pizarra-oscuro">
                          {h.iniciativa}
                        </span>
                        <span className="text-xs text-pizarra">
                          {h.usuario}
                        </span>
                        <span className="rounded-full bg-cian/20 px-2 py-1 text-xs font-semibold text-cian">
                          {h.prototipo === "boceto"
                            ? "📄"
                            : h.prototipo === "fisico"
                              ? "🛠️"
                              : "💻"}
                        </span>
                      </div>

                      {h.funciono && (
                        <p className="mt-2 text-sm text-pizarra">
                          <strong className="text-menta">✅ Funcionó:</strong>{" "}
                          {h.funciono}
                        </p>
                      )}

                      {h.confundio && (
                        <p className="mt-1 text-sm text-pizarra">
                          <strong className="text-ambar">😕 Confundió:</strong>{" "}
                          {h.confundio}
                        </p>
                      )}

                      {h.cita && (
                        <p className="mt-1 text-xs italic text-pizarra">
                          💬 "{h.cita}"
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            h.intencion === "si"
                              ? "border border-menta/40 bg-menta/10 text-menta"
                              : h.intencion === "talvez"
                                ? "border border-ambar/40 bg-ambar/10 text-ambar"
                                : "border border-ladrillo/40 bg-ladrillo/10 text-ladrillo"
                          }`}
                        >
                          {h.intencion === "si"
                            ? "✅"
                            : h.intencion === "talvez"
                              ? "❓"
                              : "❌"}
                          {h.intencion === "si"
                            ? "Usaría"
                            : h.intencion === "talvez"
                              ? "Tal vez"
                              : "No usaría"}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full border border-cian/40 bg-cian/10 px-2.5 py-1 text-xs font-semibold text-cian">
                          🔍 Claridad: {h.claridad}/5
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full border border-menta/40 bg-menta/10 px-2.5 py-1 text-xs font-semibold text-menta">
                          😊 Satisfacción: {h.satisfaccion}/5
                        </span>
                      </div>

                      {h.accion && (
                        <p className="mt-2 text-xs font-semibold text-pizarra-oscuro">
                          🎯 Acción: {h.accion}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => eliminar(h.id)}
                      className="text-pizarra-oscuro transition hover:text-ladrillo"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTÓN GUARDAR */}
        {hallazgos.length > 0 && (
          <button
            onClick={guardar}
            disabled={guardando}
            className="boton-primario w-full"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {guardando ? "Guardando..." : "Descargar Hallazgos (JSON)"}
          </button>
        )}

        {hallazgos.length === 0 && (
          <div className="rounded-lg border border-dashed border-casco-700 p-12 text-center">
            <p className="text-pizarra">
              📝 No hay hallazgos registrados aún. ¡Comienza a documentar!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
