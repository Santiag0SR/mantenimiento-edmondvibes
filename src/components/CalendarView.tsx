"use client";

import { useState } from "react";
import Link from "next/link";
import type { Incidencia } from "@/types";

interface CalendarViewProps {
  incidencias: Incidencia[];
  basePath?: string;
}

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  return { year, month, day };
}

function createLocalDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0);
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekLabel(date: Date): string {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const formatShort = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return `${formatShort(monday)} - ${formatShort(sunday)}`;
}

function getWeekKey(dateStr: string): string {
  const { year, month, day } = parseDate(dateStr);
  const date = createLocalDate(year, month, day);
  const monday = getMonday(date);
  return formatDateKey(monday);
}

function getDayKey(dateStr: string): string {
  return dateStr.split("T")[0];
}




const urgenciaColors: Record<string, string> = {
  Baja: "border-l-emerald-500",
  Media: "border-l-amber-500",
  Alta: "border-l-orange-500",
  Urgente: "border-l-red-500",
};

const estadoConfig: Record<string, { bg: string; text: string }> = {
  Pendiente: { bg: "bg-amber-50", text: "text-amber-700" },
  "En proceso": { bg: "bg-blue-50", text: "text-blue-700" },
  "Derivar a especialista": { bg: "bg-fuchsia-50", text: "text-fuchsia-700" },
  Completada: { bg: "bg-emerald-50", text: "text-emerald-700" },
  Cancelada: { bg: "bg-slate-100", text: "text-slate-600" },
};

const categoriaStyles: Record<string, string> = {
  "Turístico": "bg-indigo-100 text-indigo-700",
  "Corporativo": "bg-violet-100 text-violet-700",
  "Vitarooms": "bg-teal-100 text-teal-700",
};

export default function CalendarView({ incidencias, basePath = "/admin" }: CalendarViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const conFecha = incidencias.filter((inc) => inc.fechaProgramada);

  const porSemana = conFecha.reduce((acc, inc) => {
    const weekKey = getWeekKey(inc.fechaProgramada!);
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(inc);
    return acc;
  }, {} as Record<string, Incidencia[]>);

  const today = new Date();
  const todayKey = formatDateKey(today);
  const currentMonday = getMonday(today);
  currentMonday.setDate(currentMonday.getDate() + weekOffset * 7);
  const currentWeekKey = formatDateKey(currentMonday);

  const incidenciasSemanActual = porSemana[currentWeekKey] || [];

  const porDia: Record<string, Incidencia[]> = {};
  for (let i = 0; i < 7; i++) {
    const day = new Date(currentMonday);
    day.setDate(day.getDate() + i);
    const dayKey = formatDateKey(day);
    porDia[dayKey] = [];
  }

  incidenciasSemanActual.forEach((inc) => {
    const dayKey = getDayKey(inc.fechaProgramada!);
    if (porDia[dayKey]) {
      porDia[dayKey].push(inc);
    }
  });

  const diasOrdenados = Object.keys(porDia).sort();

  const sinFecha = incidencias.filter((inc) => !inc.fechaProgramada && inc.estado !== "Completada" && inc.estado !== "Cancelada");

  const ITEMS_SIN_FECHA = 5;
  const [sinFechaVisible, setSinFechaVisible] = useState(ITEMS_SIN_FECHA);
  const sinFechaVisibles = sinFecha.slice(0, sinFechaVisible);
  const hayMasSinFecha = sinFechaVisible < sinFecha.length;

  const cargarMasSinFecha = () => {
    setSinFechaVisible((prev) => prev + ITEMS_SIN_FECHA);
  };

  return (
    <div className="space-y-4">
      {/* Navegación de semanas */}
      <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Anterior</span>
        </button>
        <div className="text-center">
          <div className="font-bold text-slate-800">
            {getWeekLabel(currentMonday)}
          </div>
          {weekOffset === 0 && (
            <div className="text-xs text-amber-600 font-medium">Esta semana</div>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-1"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Días de la semana */}
      <div className="space-y-3">
        {diasOrdenados.map((dayKey) => {
          const { year, month, day } = parseDate(dayKey);
          const date = createLocalDate(year, month, day);
          const isToday = dayKey === todayKey;
          const dayIncidencias = porDia[dayKey];

          return (
            <div
              key={dayKey}
              className={`bg-white rounded-xl border overflow-hidden ${
                isToday ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-200"
              }`}
            >
              <div className={`px-4 py-2.5 border-b ${isToday ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100"}`}>
                <span className={`font-semibold capitalize ${isToday ? "text-amber-700" : "text-slate-700"}`}>
                  {date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                </span>
                {isToday && (
                  <span className="ml-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                    HOY
                  </span>
                )}
              </div>
              <div className="p-2">
                {dayIncidencias.length === 0 ? (
                  <div className="text-slate-400 text-sm py-3 px-2 text-center">
                    Sin reparaciones programadas
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayIncidencias.map((inc) => {
                      const hora = inc.horaProgramada || null;
                      const estado = estadoConfig[inc.estado] || estadoConfig.Pendiente;
                      return (
                        <Link key={inc.id} href={`${basePath}/${inc.id}`}>
                          <div className={`p-3 rounded-lg border-l-4 bg-slate-50 hover:bg-slate-100 transition-colors ${urgenciaColors[inc.urgencia] || "border-l-slate-300"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {hora && (
                                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                                      {hora}
                                    </span>
                                  )}
                                  <span className="font-medium text-slate-800 text-sm">
                                    {inc.edificio} • {inc.apartamento}
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${categoriaStyles[inc.categoria] || "bg-slate-100 text-slate-600"}`}>
                                    {inc.categoria}
                                  </span>
                                </div>
                                <div className="text-slate-600 text-sm truncate mt-1">
                                  {inc.descripcion}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${estado.bg} ${estado.text}`}>
                                {inc.estado}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sin fecha programada */}
      {sinFecha.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b bg-orange-50 border-orange-100">
            <span className="font-semibold text-orange-800">
              Sin fecha programada ({sinFecha.length})
            </span>
          </div>
          <div className="p-2 space-y-2">
            {sinFechaVisibles.map((inc) => {
              const estado = estadoConfig[inc.estado] || estadoConfig.Pendiente;
              return (
                <Link key={inc.id} href={`${basePath}/${inc.id}`}>
                  <div className={`p-3 rounded-lg border-l-4 bg-slate-50 hover:bg-slate-100 transition-colors ${urgenciaColors[inc.urgencia] || "border-l-slate-300"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-800 text-sm">
                            {inc.edificio} • {inc.apartamento}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${categoriaStyles[inc.categoria] || "bg-slate-100 text-slate-600"}`}>
                            {inc.categoria}
                          </span>
                        </div>
                        <div className="text-slate-600 text-sm truncate mt-1">
                          {inc.descripcion}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${estado.bg} ${estado.text}`}>
                        {inc.estado}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Botón cargar más */}
            {hayMasSinFecha && (
              <button
                onClick={cargarMasSinFecha}
                className="w-full py-2.5 px-4 bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Cargar más ({sinFecha.length - sinFechaVisible} restantes)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
