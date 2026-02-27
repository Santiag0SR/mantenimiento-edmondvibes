"use client";

import { useState, useMemo } from "react";
import type { Incidencia, Mantenimiento } from "@/types";
import IncidenciasList from "./IncidenciasList";
import CalendarView from "./CalendarView";
import DashboardView from "./DashboardView";
import MantenimientoList from "./MantenimientoList";

interface AdminTabsProps {
  incidencias: Incidencia[];
  mantenimientos?: Mantenimiento[];
  showDashboard?: boolean;
  basePath?: string;
}

type View = "hub" | "incidencias" | "preventivo" | "calendario" | "dashboard";

function isOverdue(m: Mantenimiento): boolean {
  if (m.estado === "Completado") return false;
  if (!m.fechaProgramada) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return new Date(m.fechaProgramada) < hoy;
}

function isDueSoon(m: Mantenimiento): boolean {
  if (m.estado === "Completado") return false;
  if (!m.fechaProgramada) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(m.fechaProgramada);
  const diffDays = (fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

// Icons as components for cleaner JSX
function IconHome({ active }: { active?: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d={active ? "M12 2.1L1 12h3v9h6v-6h4v6h6v-9h3L12 2.1z" : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"} />
    </svg>
  );
}

function IconClipboard({ active }: { active?: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d={active ? "M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm5.707 5.707a1 1 0 00-1.414-1.414L7 10.586l-.293-.293a1 1 0 00-1.414 1.414l1 1a1 1 0 001.414 0l2-2z" : "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"} />
    </svg>
  );
}

function IconShield({ active }: { active?: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function IconCalendar({ active }: { active?: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d={active ? "M6 2v2M18 2v2M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" : "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"} />
    </svg>
  );
}

function IconChart({ active }: { active?: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mb-4 -ml-1 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Volver al inicio
    </button>
  );
}

export default function AdminTabs({ incidencias, mantenimientos = [], showDashboard = false, basePath = "/admin" }: AdminTabsProps) {
  const [view, setView] = useState<View>("hub");

  const stats = useMemo(() => {
    const incPendientes = incidencias.filter((i) => i.estado === "Pendiente").length;
    const incEnProceso = incidencias.filter((i) => i.estado === "En proceso").length;
    const incUrgentes = incidencias.filter(
      (i) => (i.urgencia === "Urgente" || i.urgencia === "Alta") && i.estado !== "Completada" && i.estado !== "Cancelada"
    ).length;

    const mantVencidas = mantenimientos.filter(isOverdue).length;
    const mantProximas = mantenimientos.filter(isDueSoon).length;
    const mantPendientes = mantenimientos.filter((m) => m.estado !== "Completado").length;

    return { incPendientes, incEnProceso, incUrgentes, mantVencidas, mantProximas, mantPendientes };
  }, [incidencias, mantenimientos]);

  const hasAlerts = stats.incUrgentes > 0 || stats.mantVencidas > 0;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos dias";
    if (hour < 20) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const goHub = () => setView("hub");

  return (
    <div className="pb-20 pb-safe">
      {/* CONTENT */}
      {view === "hub" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Greeting + date */}
          <div>
            <p className="text-sm text-slate-500 capitalize">{today}</p>
            <h2 className="text-lg font-bold text-slate-800">{greeting}</h2>
          </div>

          {/* Alert banner */}
          {hasAlerts && (
            <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-4 text-white shadow-lg shadow-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-bold text-sm">Requiere atencion</span>
              </div>
              <div className="space-y-1 text-sm text-white/90">
                {stats.incUrgentes > 0 && (
                  <p>{stats.incUrgentes} incidencia{stats.incUrgentes !== 1 ? "s" : ""} urgente{stats.incUrgentes !== 1 ? "s" : ""}</p>
                )}
                {stats.mantVencidas > 0 && (
                  <p>{stats.mantVencidas} mantenimiento{stats.mantVencidas !== 1 ? "s" : ""} vencido{stats.mantVencidas !== 1 ? "s" : ""}</p>
                )}
              </div>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-amber-700">Incidencias</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">{stats.incPendientes}</span>
                <span className="text-xs text-amber-600/70">pendientes</span>
              </div>
              {stats.incEnProceso > 0 && (
                <p className="text-xs text-amber-600/70 mt-0.5">{stats.incEnProceso} en proceso</p>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-indigo-700">Preventivo</span>
              </div>
              <div className="flex items-baseline gap-2">
                {stats.mantVencidas > 0 ? (
                  <>
                    <span className="text-2xl font-bold text-red-500">{stats.mantVencidas}</span>
                    <span className="text-xs text-red-500/70">vencidas</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-indigo-600">{stats.mantPendientes}</span>
                    <span className="text-xs text-indigo-600/70">pendientes</span>
                  </>
                )}
              </div>
              {stats.mantProximas > 0 && (
                <p className="text-xs text-indigo-600/70 mt-0.5">{stats.mantProximas} esta semana</p>
              )}
            </div>
          </div>

          {/* Navigation cards */}
          <div className="space-y-3">
            <button
              onClick={() => setView("incidencias")}
              className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.99] text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">Incidencias</h3>
                <p className="text-sm text-slate-500">Gestionar reportes y reparaciones</p>
              </div>
              {(stats.incPendientes + stats.incEnProceso) > 0 && (
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                  {stats.incPendientes + stats.incEnProceso}
                </span>
              )}
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => setView("preventivo")}
              className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.99] text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">Mantenimiento Preventivo</h3>
                <p className="text-sm text-slate-500">Tareas programadas y checklist</p>
              </div>
              {stats.mantVencidas > 0 ? (
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                  {stats.mantVencidas}
                </span>
              ) : stats.mantPendientes > 0 ? (
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">
                  {stats.mantPendientes}
                </span>
              ) : null}
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => setView("calendario")}
              className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.99] text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">Calendario</h3>
                <p className="text-sm text-slate-500">Vista mensual de incidencias</p>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {showDashboard && (
              <button
                onClick={() => setView("dashboard")}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.99] text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">Dashboard</h3>
                  <p className="text-sm text-slate-500">Estadisticas y graficos</p>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {view === "incidencias" && (
        <div className="animate-fadeIn">
          <BackButton onClick={goHub} />
          <IncidenciasList incidencias={incidencias} basePath={basePath} />
        </div>
      )}

      {view === "calendario" && (
        <div className="animate-fadeIn">
          <BackButton onClick={goHub} />
          <CalendarView incidencias={incidencias} basePath={basePath} />
        </div>
      )}

      {view === "preventivo" && (
        <div className="animate-fadeIn">
          <BackButton onClick={goHub} />
          <MantenimientoList mantenimientos={mantenimientos} role={basePath === "/gestion" ? "gestion" : "tecnico"} />
        </div>
      )}

      {view === "dashboard" && (
        <div className="animate-fadeIn">
          <BackButton onClick={goHub} />
          <DashboardView incidencias={incidencias} />
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 pb-safe z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-1.5">
          <NavButton active={view === "hub"} label="Inicio" onClick={() => setView("hub")}>
            <IconHome active={view === "hub"} />
          </NavButton>
          <NavButton active={view === "incidencias"} label="Incidencias" onClick={() => setView("incidencias")} badge={stats.incUrgentes > 0 ? stats.incUrgentes : undefined}>
            <IconClipboard active={view === "incidencias"} />
          </NavButton>
          <NavButton active={view === "preventivo"} label="Preventivo" onClick={() => setView("preventivo")} badge={stats.mantVencidas > 0 ? stats.mantVencidas : undefined}>
            <IconShield active={view === "preventivo"} />
          </NavButton>
          <NavButton active={view === "calendario"} label="Calendario" onClick={() => setView("calendario")}>
            <IconCalendar active={view === "calendario"} />
          </NavButton>
          {showDashboard && (
            <NavButton active={view === "dashboard"} label="Dashboard" onClick={() => setView("dashboard")}>
              <IconChart active={view === "dashboard"} />
            </NavButton>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, label, onClick, badge, children }: {
  active: boolean;
  label: string;
  onClick: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px] ${
        active ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-slate-600"
      }`}
    >
      <div className="relative">
        {children}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-semibold leading-tight">{label}</span>
    </button>
  );
}
