"use client";

import { ProyectoSemanal } from "./types";

interface TaskCardProps {
  task: ProyectoSemanal;
  onClick: () => void;
  compact?: boolean;
  hasReminder?: boolean;
  isNew?: boolean;
}

const CATEGORIA_COLORS: Record<string, string> = {
  Marketing: "bg-green-100 text-green-700",
  Operaciones: "bg-amber-100 text-amber-700",
  Mantenimiento: "bg-purple-100 text-purple-700",
  Finanzas: "bg-orange-100 text-orange-700",
};

function getDeadlineInfo(fechaTope: string | null): {
  label: string;
  className: string;
  urgency: "overdue" | "urgent" | "soon" | "ok" | "none";
} {
  if (!fechaTope) return { label: "", className: "", urgency: "none" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(fechaTope);
  deadline.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Vencida hace ${Math.abs(diffDays)}d`,
      className: "text-red-600 bg-red-50 border-red-200",
      urgency: "overdue",
    };
  }
  if (diffDays === 0) {
    return { label: "Vence hoy", className: "text-red-600 bg-red-50 border-red-200", urgency: "overdue" };
  }
  if (diffDays <= 2) {
    return { label: `Vence en ${diffDays}d`, className: "text-orange-600 bg-orange-50 border-orange-200", urgency: "urgent" };
  }
  if (diffDays <= 5) {
    return { label: `Vence en ${diffDays}d`, className: "text-amber-600 bg-amber-50 border-amber-200", urgency: "soon" };
  }
  return { label: `${diffDays}d restantes`, className: "text-stone-500 bg-stone-50 border-stone-200", urgency: "ok" };
}

export default function TaskCard({ task, onClick, compact, hasReminder, isNew }: TaskCardProps) {
  const deadline = getDeadlineInfo(task.fechaTope);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border hover:border-stone-300 hover:shadow-md transition-all active:scale-[0.99] ${
        isNew ? "bg-blue-50/60 border-blue-200 ring-1 ring-blue-100" : "bg-white border-stone-200"
      } ${
        deadline.urgency === "overdue" ? "border-l-4 border-l-red-400" :
        deadline.urgency === "urgent" ? "border-l-4 border-l-orange-400" :
        deadline.urgency === "soon" ? "border-l-4 border-l-amber-400" : ""
      }`}
    >
      <div className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`font-semibold text-stone-900 leading-tight ${compact ? "text-xs" : "text-sm"}`}>
            {isNew && (
              <span className="inline-block px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded mr-1.5 uppercase align-middle">
                Nueva
              </span>
            )}
            {task.tarea}
          </h3>
          {hasReminder && (
            <span className="text-amber-500 flex-shrink-0" title="Recordatorio activo">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </span>
          )}
        </div>

        {!compact && task.descripcion && (
          <p className="text-xs text-stone-500 mb-2 line-clamp-2">
            {task.descripcion}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {task.categoria.map((cat) => (
            <span
              key={cat}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORIA_COLORS[cat] || "bg-stone-100 text-stone-600"}`}
            >
              {cat}
            </span>
          ))}
          {deadline.label && (
            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${deadline.className}`}>
              {deadline.label}
            </span>
          )}
        </div>

        {!compact && task.encargados.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <svg className="w-3 h-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] text-stone-400">
              {task.encargados.map((e) => e.name).join(", ")}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export { getDeadlineInfo };
