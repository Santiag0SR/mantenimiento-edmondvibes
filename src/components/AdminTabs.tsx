"use client";

import { useState, useMemo } from "react";
import type { Incidencia, Mantenimiento, SolicitudCompra, SolicitudCompraInput } from "@/types";
import IncidenciasList from "./IncidenciasList";
import CalendarView from "./CalendarView";
import DashboardView from "./DashboardView";
import MantenimientoList from "./MantenimientoList";
import ComprasForm from "./ComprasForm";

interface AdminTabsProps {
  incidencias: Incidencia[];
  mantenimientos?: Mantenimiento[];
  compras?: SolicitudCompra[];
  showDashboard?: boolean;
  basePath?: string;
  onComprasUpdated?: () => void;
}

type View = "hub" | "incidencias" | "preventivo" | "calendario" | "dashboard" | "compras";

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

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d={active ? "M12 2.1L1 12h3v9h6v-6h4v6h6v-9h3L12 2.1z" : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"} />
    </svg>
  );
}

function IconClipboard({ active }: { active?: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d={active ? "M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm5.707 5.707a1 1 0 00-1.414-1.414L7 10.586l-.293-.293a1 1 0 00-1.414 1.414l1 1a1 1 0 001.414 0l2-2z" : "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"} />
    </svg>
  );
}

function IconShield({ active }: { active?: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function IconCalendar({ active }: { active?: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d={active ? "M6 2v2M18 2v2M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" : "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"} />
    </svg>
  );
}

function IconChart({ active }: { active?: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconCart({ active }: { active?: boolean }) {
  return (
    <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] mb-4 -ml-1 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Volver
    </button>
  );
}

const navItems: { view: View; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  { view: "hub", label: "Inicio", icon: (a) => <IconHome active={a} /> },
  { view: "incidencias", label: "Incidencias", icon: (a) => <IconClipboard active={a} /> },
  { view: "preventivo", label: "Preventivo", icon: (a) => <IconShield active={a} /> },
  { view: "calendario", label: "Calendario", icon: (a) => <IconCalendar active={a} /> },
  { view: "compras", label: "Compras", icon: (a) => <IconCart active={a} /> },
];

export default function AdminTabs({ incidencias, mantenimientos = [], compras = [], showDashboard = false, basePath = "/admin", onComprasUpdated }: AdminTabsProps) {
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

    const comprasPendientes = compras.filter((c) => c.estado === "Pendiente" || c.estado === "En revisión").length;

    return { incPendientes, incEnProceso, incUrgentes, mantVencidas, mantProximas, mantPendientes, comprasPendientes };
  }, [incidencias, mantenimientos, compras]);

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

  const getBadge = (v: View): number | undefined => {
    if (v === "incidencias" && stats.incUrgentes > 0) return stats.incUrgentes;
    if (v === "preventivo" && stats.mantVencidas > 0) return stats.mantVencidas;
    if (v === "compras" && stats.comprasPendientes > 0) return stats.comprasPendientes;
    return undefined;
  };

  return (
    <div className="pb-20 pb-safe">
      {/* CONTENT */}
      {view === "hub" && (
        <div className="space-y-5 animate-fadeIn">
          {/* Greeting */}
          <div>
            <p className="text-xs text-[var(--text-muted)] capitalize">{today}</p>
            <h2 className="text-lg font-semibold text-[var(--text)]">{greeting}</h2>
          </div>

          {/* Alert banner */}
          {hasAlerts && (
            <div className="bg-red-500 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-2 mb-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold text-sm">Requiere atencion</span>
              </div>
              <div className="text-sm text-white/80 space-y-0.5">
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
            <div className="bg-[var(--surface-raised)] border border-[var(--border-light)] rounded-2xl p-4">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">Incidencias</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-amber-600">{stats.incPendientes}</span>
                <span className="text-[11px] text-[var(--text-muted)]">pendientes</span>
              </div>
              {stats.incEnProceso > 0 && (
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{stats.incEnProceso} en proceso</p>
              )}
            </div>

            <div className="bg-[var(--surface-raised)] border border-[var(--border-light)] rounded-2xl p-4">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">Preventivo</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                {stats.mantVencidas > 0 ? (
                  <>
                    <span className="text-2xl font-bold text-red-500">{stats.mantVencidas}</span>
                    <span className="text-[11px] text-red-400">vencidas</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-[var(--text)]">{stats.mantPendientes}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">pendientes</span>
                  </>
                )}
              </div>
              {stats.mantProximas > 0 && (
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{stats.mantProximas} esta semana</p>
              )}
            </div>
          </div>

          {/* Navigation cards */}
          <div className="space-y-2">
            {[
              { view: "incidencias" as View, title: "Incidencias", desc: "Reportes abiertos y reparaciones", gradient: "from-amber-500 to-orange-500", badge: stats.incPendientes + stats.incEnProceso },
              { view: "preventivo" as View, title: "Preventivo", desc: "Revisiones programadas por edificio", gradient: "from-stone-600 to-stone-800", badge: stats.mantVencidas || stats.mantPendientes },
              { view: "calendario" as View, title: "Calendario", desc: "Vista mensual de incidencias", gradient: "from-blue-500 to-blue-600", badge: 0 },
              { view: "compras" as View, title: "Compras", desc: "Solicitudes de material y suministros", gradient: "from-[#b8956a] to-[#9a7a54]", badge: stats.comprasPendientes },
              ...(showDashboard ? [{ view: "dashboard" as View, title: "Dashboard", desc: "Resumen y métricas", gradient: "from-emerald-500 to-teal-600", badge: 0 }] : []),
            ].map((item) => (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className="w-full bg-[var(--surface-raised)] border border-[var(--border-light)] rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--border)] hover:shadow-sm transition-all active:scale-[0.99] text-left"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    {item.view === "incidencias" && <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                    {item.view === "preventivo" && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
                    {item.view === "calendario" && <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                    {item.view === "compras" && <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />}
                    {item.view === "dashboard" && <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--text)]">{item.title}</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">{item.desc}</p>
                </div>
                {item.badge > 0 && (
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-stone-100 text-[var(--text-secondary)] text-[11px] font-bold">
                    {item.badge}
                  </span>
                )}
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
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

      {view === "compras" && (
        <div className="animate-fadeIn">
          <BackButton onClick={goHub} />
          <ComprasForm
            compras={compras}
            showSolicitante={basePath === "/gestion"}
            onCrear={async (input: SolicitudCompraInput) => {
              const res = await fetch("/api/gobernanta/compras", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...input, solicitante: "Javier" }),
              });
              if (!res.ok) throw new Error();
              onComprasUpdated?.();
            }}
          />
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-stone-200 pb-safe z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-1.5">
          {navItems.map((item) => (
            <NavButton
              key={item.view}
              active={view === item.view}
              label={item.label}
              onClick={() => setView(item.view)}
              badge={getBadge(item.view)}
            >
              {item.icon(view === item.view)}
            </NavButton>
          ))}
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
      className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px] ${
        active ? "text-[var(--primary)] bg-stone-100" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
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
      <span className="text-[10px] font-medium leading-tight">{label}</span>
    </button>
  );
}
