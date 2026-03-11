"use client";

import { useState, useEffect, useCallback } from "react";
import { ProyectoSemanal, TaskUpdate, TaskReminder } from "./types";
import { getDeadlineInfo } from "./TaskCard";

interface TaskDetailProps {
  task: ProyectoSemanal;
  currentUser: string;
  onClose: () => void;
  onEstadoChange: (taskId: string, estado: string) => void;
  onFechaTopeChange: (taskId: string, fechaTope: string, oldFechaTope: string | null) => void;
  onReminderChange: () => void;
}

const ESTADOS = ["Pendiente", "En proceso", "Standby", "Finalizada", "Archivado"];

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-700 border-amber-200",
  "En proceso": "bg-blue-100 text-blue-700 border-blue-200",
  Standby: "bg-stone-100 text-stone-600 border-stone-200",
  Finalizada: "bg-green-100 text-green-700 border-green-200",
  Archivado: "bg-red-100 text-red-600 border-red-200",
};

export default function TaskDetail({ task, currentUser, onClose, onEstadoChange, onFechaTopeChange, onReminderChange }: TaskDetailProps) {
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [reminders, setReminders] = useState<TaskReminder[]>([]);
  const [newUpdate, setNewUpdate] = useState("");
  const [loadingUpdates, setLoadingUpdates] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderNote, setReminderNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const deadline = getDeadlineInfo(task.fechaTope);

  // Get current user's reminder
  const myReminder = reminders.find((r) => r.person === currentUser);

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await fetch(`/api/operativa/tareas/${task.id}/updates`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.updates);
        setReminders(data.reminders);
      }
    } catch (err) {
      console.error("Error fetching updates:", err);
    } finally {
      setLoadingUpdates(false);
    }
  }, [task.id]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  // Sync local fields when reminder loads
  useEffect(() => {
    if (myReminder) {
      setReminderDate(myReminder.date);
      setReminderNote(myReminder.note);
    }
  }, [myReminder]);

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/operativa/tareas/${task.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newUpdate.trim(), author: currentUser }),
      });
      if (res.ok) {
        setNewUpdate("");
        fetchUpdates();
      }
    } catch (err) {
      console.error("Error adding update:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveReminder = async () => {
    if (!reminderDate) return;
    setSavingReminder(true);
    try {
      const res = await fetch(`/api/operativa/tareas/${task.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reminder", person: currentUser, date: reminderDate, note: reminderNote }),
      });
      if (res.ok) {
        setReminders((prev) => {
          const filtered = prev.filter((r) => r.person !== currentUser);
          return [...filtered, { blockId: "", person: currentUser, date: reminderDate, note: reminderNote }];
        });
        onReminderChange();
      }
    } catch (err) {
      console.error("Error setting reminder:", err);
    } finally {
      setSavingReminder(false);
    }
  };

  const handleRemoveReminder = async () => {
    setSavingReminder(true);
    try {
      const res = await fetch(`/api/operativa/tareas/${task.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reminder", person: currentUser, date: null }),
      });
      if (res.ok) {
        setReminders((prev) => prev.filter((r) => r.person !== currentUser));
        setReminderDate("");
        setReminderNote("");
        onReminderChange();
      }
    } catch (err) {
      console.error("Error removing reminder:", err);
    } finally {
      setSavingReminder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-4 flex items-start justify-between rounded-t-2xl z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-base font-bold text-stone-900 leading-tight">
              {task.tarea}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ESTADO_COLORS[task.estado] || ""}`}>
                {task.estado}
              </span>
              {deadline.label && (
                <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${deadline.className}`}>
                  {deadline.label}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0">
            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Info */}
          {task.descripcion && (
            <div>
              <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Descripción</h4>
              <p className="text-sm text-stone-700">{task.descripcion}</p>
            </div>
          )}

          {task.comentarios && (
            <div>
              <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Comentarios</h4>
              <p className="text-sm text-stone-700">{task.comentarios}</p>
            </div>
          )}

          {task.infoExtra && (
            <div>
              <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Info extra</h4>
              <p className="text-sm text-stone-700">{task.infoExtra}</p>
            </div>
          )}

          <div className="flex gap-4 items-end">
            {task.fechaInicio && (
              <div>
                <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Inicio</h4>
                <p className="text-sm text-stone-700">{new Date(task.fechaInicio).toLocaleDateString("es-ES")}</p>
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Fecha tope</h4>
              <input
                type="date"
                value={task.fechaTope || ""}
                onChange={(e) => onFechaTopeChange(task.id, e.target.value, task.fechaTope)}
                className="w-full px-2.5 py-1 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              />
            </div>
          </div>

          {task.encargados.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Encargados</h4>
              <div className="flex flex-wrap gap-1.5">
                {task.encargados.map((e) => (
                  <span key={e.id} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-xs font-medium">
                    {e.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Change estado */}
          <div>
            <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Cambiar estado</h4>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS.map((e) => (
                <button
                  key={e}
                  onClick={() => onEstadoChange(task.id, e)}
                  disabled={task.estado === e}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    task.estado === e
                      ? `${ESTADO_COLORS[e]} ring-2 ring-offset-1 ring-stone-300`
                      : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3.5">
            <h4 className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2.5">
              <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Mi recordatorio
            </h4>
            <div className="space-y-2">
              <input
                type="text"
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                placeholder="Ej: Llamar a Juan para confirmar presupuesto..."
                disabled={savingReminder}
                className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 placeholder-stone-400 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 disabled:opacity-50"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  disabled={savingReminder}
                  className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 disabled:opacity-50"
                />
                <button
                  onClick={handleSaveReminder}
                  disabled={!reminderDate || savingReminder}
                  className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {savingReminder ? "..." : myReminder ? "Actualizar" : "Guardar"}
                </button>
              </div>
              {myReminder && (
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-amber-700">
                    <span className="font-medium">{new Date(myReminder.date).toLocaleDateString("es-ES")}</span>
                    {myReminder.note && (
                      <span className="text-stone-500"> &middot; {myReminder.note}</span>
                    )}
                  </div>
                  <button
                    onClick={handleRemoveReminder}
                    disabled={savingReminder}
                    className="text-[11px] text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Updates */}
          <div>
            <h4 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Actualizaciones ({updates.length})
            </h4>

            {/* Add update form */}
            <form onSubmit={handleSubmitUpdate} className="mb-4">
              <textarea
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                placeholder="Escribe una actualización..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-stone-50 text-stone-700 placeholder-stone-400 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newUpdate.trim() || submitting}
                  className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Enviando..." : "Añadir update"}
                </button>
              </div>
            </form>

            {/* Updates list */}
            {loadingUpdates ? (
              <div className="text-xs text-stone-400 text-center py-4">Cargando...</div>
            ) : updates.length === 0 ? (
              <div className="text-xs text-stone-400 text-center py-4 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                Sin actualizaciones aún
              </div>
            ) : (
              <div className="space-y-2">
                {updates.slice().reverse().map((update) => {
                  const lines = update.text.split("\n");
                  const header = lines[0] || "";
                  const body = lines.slice(1).join("\n");
                  return (
                    <div key={update.id} className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5">
                      <div className="text-[10px] font-semibold text-stone-500 mb-1">
                        {header}
                      </div>
                      {body && <p className="text-sm text-stone-700 whitespace-pre-wrap">{body}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
