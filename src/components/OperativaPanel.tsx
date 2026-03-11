"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ProyectoSemanal } from "./operativa/types";
import KanbanView from "./operativa/KanbanView";
import WeeklyView from "./operativa/WeeklyView";
import TaskDetail from "./operativa/TaskDetail";
import NewTaskForm from "./operativa/NewTaskForm";

const TEAM_MEMBERS = [
  "Bruno Olmo",
  "Pablo",
  "Ricardo Collado",
  "Romina Natali",
  "Santiago SR",
];

type ViewMode = "kanban" | "semanal";

function getSeenTasksKey(user: string) {
  return `operativa_seen_tasks_${user}`;
}

export default function OperativaPanel() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ProyectoSemanal[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewMode>("kanban");
  const [selectedTask, setSelectedTask] = useState<ProyectoSemanal | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Record<string, { date: string; note: string }>>({});
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set());
  const [showNewForm, setShowNewForm] = useState(false);
  const isFirstLoad = useRef(true);

  // Load saved user
  useEffect(() => {
    const saved = localStorage.getItem("operativa_user");
    if (saved && TEAM_MEMBERS.includes(saved)) {
      setCurrentUser(saved);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/operativa/tareas?persona=${encodeURIComponent(currentUser)}&reminders=1`
      );
      if (res.ok) {
        const data = await res.json();
        const proyectos: ProyectoSemanal[] = data.proyectos;
        setTasks(proyectos);
        setReminders(data.reminders || {});

        // Detect new tasks
        const seenKey = getSeenTasksKey(currentUser);
        const seenRaw = localStorage.getItem(seenKey);
        const seenIds: string[] = seenRaw ? JSON.parse(seenRaw) : [];

        if (seenIds.length === 0 && isFirstLoad.current) {
          // First time ever: mark all current tasks as seen (no spam)
          localStorage.setItem(seenKey, JSON.stringify(proyectos.map((t) => t.id)));
        } else {
          const seenSet = new Set(seenIds);
          const newIds = proyectos
            .filter((t) => !seenSet.has(t.id))
            .map((t) => t.id);
          if (newIds.length > 0) {
            setNewTaskIds(new Set(newIds));
          }
        }
        isFirstLoad.current = false;
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDismissNewTasks = () => {
    if (!currentUser) return;
    // Mark all current tasks as seen
    const seenKey = getSeenTasksKey(currentUser);
    localStorage.setItem(seenKey, JSON.stringify(tasks.map((t) => t.id)));
    setNewTaskIds(new Set());
  };

  const handleSelectUser = (name: string) => {
    setCurrentUser(name);
    localStorage.setItem("operativa_user", name);
  };

  const handleEstadoChange = async (taskId: string, estado: string) => {
    try {
      const res = await fetch(`/api/operativa/tareas/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (res.ok) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, estado } : t)));
        if (selectedTask?.id === taskId) {
          setSelectedTask((prev) => (prev ? { ...prev, estado } : null));
        }
      }
    } catch (err) {
      console.error("Error updating estado:", err);
    }
  };

  // User selector
  if (!currentUser) {
    return (
      <div className="max-w-sm mx-auto pt-8">
        <h2 className="text-lg font-bold text-stone-900 text-center mb-1">
          Agenda Operativa
        </h2>
        <p className="text-sm text-stone-500 text-center mb-6">
          Selecciona tu nombre
        </p>
        <div className="flex flex-col gap-2">
          {TEAM_MEMBERS.map((name) => (
            <button
              key={name}
              onClick={() => handleSelectUser(name)}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-left hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">
                    {name.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-stone-800 group-hover:text-blue-700">
                  {name}
                </span>
                <svg className="w-4 h-4 text-stone-300 ml-auto group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (!showArchived && t.estado === "Archivado") return false;
    if (filterCategoria && !t.categoria.includes(filterCategoria)) return false;
    return true;
  });

  // Active reminders (date <= today)
  const today = new Date().toISOString().split("T")[0];
  const reminderTasks = tasks.filter((t) => {
    const reminder = reminders[t.id];
    return reminder && reminder.date <= today;
  });

  // New tasks
  const newTasks = tasks.filter((t) => newTaskIds.has(t.id));

  // Get unique categories from tasks
  const allCategories = [...new Set(tasks.flatMap((t) => t.categoria))].sort();

  // Stats
  const pendientes = tasks.filter((t) => t.estado === "Pendiente").length;
  const enProceso = tasks.filter((t) => t.estado === "En proceso").length;
  const overdue = tasks.filter((t) => {
    if (!t.fechaTope || t.estado === "Finalizada" || t.estado === "Archivado") return false;
    return t.fechaTope < today;
  }).length;

  return (
    <div>
      {/* User header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-base font-bold text-blue-600">{currentUser.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">{currentUser}</h2>
            <p className="text-[11px] text-stone-400">Agenda Operativa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo
          </button>
          <button
            onClick={() => {
              setCurrentUser(null);
              localStorage.removeItem("operativa_user");
            }}
            className="text-xs text-stone-400 hover:text-stone-600 font-medium"
          >
            Cambiar
          </button>
        </div>
      </div>

      {/* New tasks alert */}
      {newTasks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 animate-fadeIn">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold text-blue-700">
                {newTasks.length === 1 ? "Nueva tarea asignada" : `${newTasks.length} nuevas tareas asignadas`}
              </span>
            </div>
            <button
              onClick={handleDismissNewTasks}
              className="text-[11px] text-blue-500 hover:text-blue-700 font-medium"
            >
              Marcar como vistas
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {newTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className="text-left text-xs text-blue-700 hover:text-blue-900 font-medium truncate"
              >
                &bull; {t.tarea}
                {t.fechaTope && (
                  <span className="text-blue-500 font-normal"> &mdash; Fecha tope: {new Date(t.fechaTope).toLocaleDateString("es-ES")}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-center">
          <div className="text-lg font-bold text-amber-600">{pendientes}</div>
          <div className="text-[10px] text-stone-500 font-medium">Pendientes</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-center">
          <div className="text-lg font-bold text-blue-600">{enProceso}</div>
          <div className="text-[10px] text-stone-500 font-medium">En proceso</div>
        </div>
        <div className={`bg-white border rounded-xl px-3 py-2.5 text-center ${overdue > 0 ? "border-red-200 bg-red-50" : "border-stone-200"}`}>
          <div className={`text-lg font-bold ${overdue > 0 ? "text-red-600" : "text-stone-400"}`}>{overdue}</div>
          <div className="text-[10px] text-stone-500 font-medium">Vencidas</div>
        </div>
      </div>

      {/* Reminder alert */}
      {reminderTasks.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            <span className="text-xs font-semibold text-amber-700">
              Recordatorios ({reminderTasks.length})
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {reminderTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className="text-left text-xs text-amber-700 hover:text-amber-900 truncate"
              >
                <span className="font-medium">&bull; {t.tarea}</span>
                {reminders[t.id]?.note && (
                  <span className="text-amber-600 font-normal"> &mdash; {reminders[t.id].note}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View switcher + filters */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex bg-stone-100 rounded-lg p-0.5">
          <button
            onClick={() => setView("kanban")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              view === "kanban" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
            Kanban
          </button>
          <button
            onClick={() => setView("semanal")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              view === "semanal" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Semanal
          </button>
        </div>

        <div className="flex items-center gap-2">
          {allCategories.length > 0 && (
            <select
              value={filterCategoria || ""}
              onChange={(e) => setFilterCategoria(e.target.value || null)}
              className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-700 focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Todas</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-stone-300 text-blue-600 focus:ring-blue-300"
            />
            Archivadas
          </label>

          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            title="Refrescar"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && tasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-stone-400">Cargando proyectos...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-stone-400">No tienes proyectos asignados</p>
        </div>
      ) : view === "kanban" ? (
        <KanbanView
          tasks={filteredTasks}
          onTaskClick={setSelectedTask}
          showArchived={showArchived}
          newTaskIds={newTaskIds}
        />
      ) : (
        <WeeklyView tasks={filteredTasks} onTaskClick={setSelectedTask} newTaskIds={newTaskIds} />
      )}

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
          onEstadoChange={handleEstadoChange}
          onReminderChange={fetchTasks}
        />
      )}

      {/* New task form */}
      {showNewForm && (
        <NewTaskForm
          currentUser={currentUser}
          onClose={() => setShowNewForm(false)}
          onCreated={fetchTasks}
        />
      )}
    </div>
  );
}
