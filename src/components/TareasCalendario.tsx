"use client";

import { useState, useMemo } from "react";
import type { TareaGobernanta, EstadoTareaGobernanta } from "@/types";

const DIAS_SEMANA_NOMBRES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function parseHora(hora: string): number {
  if (!hora) return 9999;
  const clean = hora.replace(/hs?/gi, "").trim();
  const parts = clean.split(/[:.]/);
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

const estadoConfig: Record<EstadoTareaGobernanta, string> = {
  Pendiente: "bg-[var(--surface-raised)] border-[var(--border)]",
  Completada: "bg-emerald-50/60 border-emerald-200",
  "No realizada": "bg-red-50/60 border-red-200",
};

interface TareasCalendarioProps {
  tareas: TareaGobernanta[];
  onUpdateEstado: (id: string, estado: EstadoTareaGobernanta) => Promise<void>;
}

function getSemanaActual(): { nombre: string; fecha: Date; label: string }[] {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
  lunes.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    const nombre = DIAS_SEMANA_NOMBRES[fecha.getDay()];
    const label = `${nombre.slice(0, 3)} ${fecha.getDate()}`;
    return { nombre, fecha, label };
  });
}

function fechaToString(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function TareasCalendario({ tareas, onUpdateEstado }: TareasCalendarioProps) {
  const semana = useMemo(() => getSemanaActual(), []);
  const hoyStr = fechaToString(new Date());

  const [indiceDia, setIndiceDia] = useState(() => {
    const hoyIndex = semana.findIndex((d) => fechaToString(d.fecha) === hoyStr);
    return hoyIndex >= 0 ? hoyIndex : 0;
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const diaActual = semana[indiceDia];
  const fechaStr = fechaToString(diaActual.fecha);

  const tareasDelDia = useMemo(() => {
    const recurrentes = tareas.filter((t) => t.recurrente && t.dia === diaActual.nombre);
    const puntuales = tareas.filter(
      (t) => !t.recurrente && t.fechaEspecifica === fechaStr
    );
    return [...recurrentes, ...puntuales].sort((a, b) => {
      return parseHora(a.horaInicio) - parseHora(b.horaInicio);
    });
  }, [tareas, diaActual.nombre, fechaStr]);

  const conteosPorDia = useMemo(() => {
    return semana.map((dia) => {
      const fStr = fechaToString(dia.fecha);
      const recurrentes = tareas.filter((t) => t.recurrente && t.dia === dia.nombre).length;
      const puntuales = tareas.filter((t) => !t.recurrente && t.fechaEspecifica === fStr).length;
      return recurrentes + puntuales;
    });
  }, [tareas, semana]);

  const handleToggle = async (tarea: TareaGobernanta) => {
    setUpdatingId(tarea.id);
    const nuevoEstado: EstadoTareaGobernanta =
      tarea.estado === "Completada" ? "Pendiente" : "Completada";
    try {
      await onUpdateEstado(tarea.id, nuevoEstado);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarcarNoRealizada = async (tarea: TareaGobernanta) => {
    setUpdatingId(tarea.id);
    try {
      await onUpdateEstado(tarea.id, "No realizada");
    } finally {
      setUpdatingId(null);
    }
  };

  const completadas = tareasDelDia.filter((t) => t.estado === "Completada").length;
  const total = tareasDelDia.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)] capitalize">
          {diaActual.fecha.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        {total > 0 && (
          <span className="text-[11px] font-medium text-[var(--text-muted)]">
            {completadas}/{total}
          </span>
        )}
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {semana.map((dia, i) => {
          const isHoy = fechaToString(dia.fecha) === hoyStr;
          const isSelected = i === indiceDia;
          const count = conteosPorDia[i];
          return (
            <button
              key={i}
              onClick={() => setIndiceDia(i)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium border transition-all min-w-[48px] ${
                isSelected
                  ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                  : isHoy
                  ? "bg-stone-50 border-stone-200 text-[var(--text)]"
                  : "bg-[var(--surface-raised)] border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--border)]"
              }`}
            >
              <span className="text-[10px]">{dia.nombre.slice(0, 3)}</span>
              <span className={`text-sm font-semibold ${isSelected ? "text-white" : ""}`}>
                {dia.fecha.getDate()}
              </span>
              {count > 0 && (
                <span className={`text-[9px] ${isSelected ? "text-white/60" : "text-[var(--text-muted)]"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="w-full bg-stone-100 rounded-full h-1.5">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(completadas / total) * 100}%` }}
          />
        </div>
      )}

      {/* Task list */}
      {tareasDelDia.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No hay tareas para este dia</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tareasDelDia.map((tarea) => {
            const bgClass = estadoConfig[tarea.estado];
            const isUpdating = updatingId === tarea.id;
            const isPuntual = !tarea.recurrente;
            return (
              <div
                key={tarea.id}
                className={`border rounded-2xl p-3.5 transition-all ${bgClass} ${
                  isUpdating ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(tarea)}
                    disabled={isUpdating}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      tarea.estado === "Completada"
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : tarea.estado === "No realizada"
                        ? "bg-red-500 border-red-500 text-white"
                        : "border-stone-300 hover:border-rose-400"
                    }`}
                  >
                    {tarea.estado === "Completada" && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {tarea.estado === "No realizada" && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm font-medium ${
                          tarea.estado === "Completada"
                            ? "line-through text-[var(--text-muted)]"
                            : "text-[var(--text)]"
                        }`}
                      >
                        {tarea.tarea}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 rounded-md text-[var(--text-muted)] font-medium">
                        {tarea.edificio}
                      </span>
                      {isPuntual && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-500 rounded-md font-medium">
                          Puntual
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--text-muted)]">
                      {tarea.horaInicio && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {tarea.horaInicio}
                        </span>
                      )}
                      {tarea.duracion > 0 && <span>{tarea.duracion} min</span>}
                    </div>
                    {tarea.notas && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-1.5 italic">{tarea.notas}</p>
                    )}
                  </div>

                  {/* Not done button */}
                  {tarea.estado === "Pendiente" && (
                    <button
                      onClick={() => handleMarcarNoRealizada(tarea)}
                      disabled={isUpdating}
                      className="text-[var(--text-muted)] hover:text-red-500 p-1 transition-colors"
                      title="Marcar como no realizada"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
