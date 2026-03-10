"use client";

import { ProyectoSemanal } from "./types";
import TaskCard from "./TaskCard";

interface KanbanViewProps {
  tasks: ProyectoSemanal[];
  onTaskClick: (task: ProyectoSemanal) => void;
  showArchived: boolean;
  newTaskIds: Set<string>;
}

const COLUMNS = [
  { key: "Pendiente", label: "Pendiente", color: "bg-amber-500", dotColor: "bg-amber-400" },
  { key: "En proceso", label: "En proceso", color: "bg-blue-500", dotColor: "bg-blue-400" },
  { key: "Standby", label: "Standby", color: "bg-stone-400", dotColor: "bg-stone-400" },
  { key: "Finalizada", label: "Finalizada", color: "bg-green-500", dotColor: "bg-green-400" },
];

export default function KanbanView({ tasks, onTaskClick, showArchived, newTaskIds }: KanbanViewProps) {
  const columns = showArchived
    ? [...COLUMNS, { key: "Archivado", label: "Archivado", color: "bg-red-500", dotColor: "bg-red-400" }]
    : COLUMNS;

  return (
    <>
      {/* Desktop: horizontal scroll */}
      <div className="hidden sm:flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.estado === col.key);
          return (
            <div key={col.key} className="flex-shrink-0 w-[280px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  {col.label}
                </h3>
                <span className="text-[10px] font-medium text-stone-400 bg-stone-100 rounded-full px-1.5">
                  {colTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {colTasks.length === 0 ? (
                  <div className="text-xs text-stone-400 text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    Sin tareas
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} compact isNew={newTaskIds.has(task.id)} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: stacked columns */}
      <div className="sm:hidden flex flex-col gap-5">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.estado === col.key);
          if (colTasks.length === 0) return null;
          return (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <h3 className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  {col.label}
                </h3>
                <span className="text-[10px] font-medium text-stone-400 bg-stone-100 rounded-full px-1.5">
                  {colTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} isNew={newTaskIds.has(task.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
