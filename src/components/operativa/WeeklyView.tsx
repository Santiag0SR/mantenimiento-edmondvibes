"use client";

import { ProyectoSemanal } from "./types";
import TaskCard from "./TaskCard";

interface WeeklyViewProps {
  tasks: ProyectoSemanal[];
  onTaskClick: (task: ProyectoSemanal) => void;
  newTaskIds: Set<string>;
}

function getWeekDates(): { label: string; dateStr: string; isToday: boolean }[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // Start from Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const days = [];
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      label: `${dayNames[i]} ${d.getDate()}`,
      dateStr,
      isToday: dateStr === today.toISOString().split("T")[0],
    });
  }
  return days;
}

function getWeekRange(): { start: string; end: string } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export default function WeeklyView({ tasks, onTaskClick, newTaskIds }: WeeklyViewProps) {
  const weekDays = getWeekDates();
  const { start, end } = getWeekRange();

  // Tasks with deadline this week
  const thisWeekTasks = tasks.filter((t) => {
    if (!t.fechaTope) return false;
    return t.fechaTope >= start && t.fechaTope <= end;
  });

  // Overdue tasks (deadline before this week, not finalized/archived)
  const overdueTasks = tasks.filter((t) => {
    if (!t.fechaTope) return false;
    return t.fechaTope < start && t.estado !== "Finalizada" && t.estado !== "Archivado";
  });

  // Tasks without deadline
  const noDateTasks = tasks.filter((t) => !t.fechaTope && t.estado !== "Finalizada" && t.estado !== "Archivado");

  // Group this week's tasks by day
  const tasksByDay: Record<string, ProyectoSemanal[]> = {};
  for (const day of weekDays) {
    tasksByDay[day.dateStr] = thisWeekTasks.filter((t) => t.fechaTope === day.dateStr);
  }

  return (
    <div className="space-y-5">
      {/* Overdue alert */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wider">
              Vencidas ({overdueTasks.length})
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} compact isNew={newTaskIds.has(task.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Week grid */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div
            key={day.dateStr}
            className={`rounded-xl border p-2.5 min-h-[80px] ${
              day.isToday
                ? "border-blue-300 bg-blue-50/50"
                : "border-stone-200 bg-white"
            }`}
          >
            <div className={`text-[11px] font-semibold mb-2 ${day.isToday ? "text-blue-600" : "text-stone-500"}`}>
              {day.label}
              {day.isToday && <span className="ml-1 text-blue-400">hoy</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              {tasksByDay[day.dateStr]?.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="text-left text-[11px] font-medium text-stone-700 bg-white border border-stone-200 rounded-lg px-2 py-1.5 hover:border-stone-300 hover:shadow-sm transition-all truncate"
                >
                  {task.tarea}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* No date tasks */}
      {noDateTasks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
            Sin fecha límite ({noDateTasks.length})
          </h3>
          <div className="flex flex-col gap-2">
            {noDateTasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} compact isNew={newTaskIds.has(task.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
