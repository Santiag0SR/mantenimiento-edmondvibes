"use client";

import { useMemo, useState } from "react";
import type { Incidencia, SolicitudCompra } from "@/types";

interface DashboardViewProps {
  incidencias: Incidencia[];
  compras?: SolicitudCompra[];
}

// ── Helpers ──

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function parseMinutes(val?: string): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function formatTime(mins: number): string {
  if (mins === 0) return "—";
  if (mins < 60) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// Vitarooms incidencias have edificio like "VG15 - Vasco de Gama 15"
// Group them all under "Vitarooms" for dashboard purposes
function getEdificioForDashboard(inc: Incidencia): string {
  if (inc.categoria === "Vitarooms") return "Vitarooms";
  return inc.edificio || "Sin edificio";
}

function getAllEdificios(incidencias: Incidencia[]): string[] {
  const set = new Set(incidencias.map((i) => getEdificioForDashboard(i)).filter(Boolean));
  return Array.from(set).sort();
}

function getAvailableMonths(incidencias: Incidencia[], compras: SolicitudCompra[]): string[] {
  const set = new Set<string>();
  incidencias.forEach((i) => { if (i.fechaReporte) set.add(getMonthKey(i.fechaReporte)); });
  compras.forEach((c) => { if (c.fechaSolicitud) set.add(getMonthKey(c.fechaSolicitud)); });
  return Array.from(set).sort().reverse();
}

// ── Component ──

export default function DashboardView({ incidencias, compras = [] }: DashboardViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedEdificio, setSelectedEdificio] = useState<string>("all");
  const [showReport, setShowReport] = useState(false);
  const [reportLink, setReportLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const availableMonths = useMemo(() => getAvailableMonths(incidencias, compras), [incidencias, compras]);
  const allEdificios = useMemo(() => getAllEdificios(incidencias), [incidencias]);

  // Filtered data
  const filteredInc = useMemo(() => {
    let items = incidencias;
    if (selectedMonth !== "all") {
      items = items.filter((i) => i.fechaReporte && getMonthKey(i.fechaReporte) === selectedMonth);
    }
    if (selectedEdificio !== "all") {
      items = items.filter((i) => getEdificioForDashboard(i) === selectedEdificio);
    }
    return items;
  }, [incidencias, selectedMonth, selectedEdificio]);

  const filteredCompras = useMemo(() => {
    let items = compras;
    if (selectedMonth !== "all") {
      items = items.filter((c) => c.fechaSolicitud && getMonthKey(c.fechaSolicitud) === selectedMonth);
    }
    if (selectedEdificio !== "all") {
      items = items.filter((c) => c.edificio.some((e) => e === selectedEdificio));
    }
    return items;
  }, [compras, selectedMonth, selectedEdificio]);

  // ── Stats ──
  const stats = useMemo(() => {
    const pendientes = filteredInc.filter((i) => i.estado === "Pendiente").length;
    const enProceso = filteredInc.filter((i) => i.estado === "En proceso").length;
    const derivaciones = filteredInc.filter((i) => i.estado === "Derivar a especialista").length;
    const completadas = filteredInc.filter((i) => i.estado === "Completada").length;

    // Resolution time
    const resueltas = filteredInc.filter((i) => i.estado === "Completada" && i.fechaReporte && i.fechaReparacion);
    let tiempoPromedio = 0;
    if (resueltas.length > 0) {
      const tiempos = resueltas
        .map((i) => (new Date(i.fechaReparacion!).getTime() - new Date(i.fechaReporte!).getTime()) / (1000 * 60 * 60 * 24))
        .filter((t) => t >= 0 && t < 365);
      if (tiempos.length > 0) tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
    }

    // Costs & time by building
    const porEdificio: Record<string, { incidencias: number; costo: number; minutos: number; completadas: number }> = {};
    filteredInc.forEach((i) => {
      const ed = getEdificioForDashboard(i);
      if (!porEdificio[ed]) porEdificio[ed] = { incidencias: 0, costo: 0, minutos: 0, completadas: 0 };
      porEdificio[ed].incidencias++;
      if (i.costoReparacion) porEdificio[ed].costo += i.costoReparacion;
      porEdificio[ed].minutos += parseMinutes(i.tiempoReparacion);
      if (i.estado === "Completada") porEdificio[ed].completadas++;
    });

    const edificiosData = Object.entries(porEdificio)
      .map(([edificio, data]) => ({ edificio, ...data }))
      .sort((a, b) => b.costo - a.costo);

    const costoTotal = edificiosData.reduce((s, e) => s + e.costo, 0);
    const minutosTotal = edificiosData.reduce((s, e) => s + e.minutos, 0);

    // Compras by building
    const comprasPorEdificio: Record<string, { count: number; presupuesto: number; gastado: number }> = {};
    filteredCompras.forEach((c) => {
      const eds = selectedEdificio !== "all"
        ? [selectedEdificio]
        : c.edificio.length > 0 ? c.edificio : ["Sin edificio"];
      eds.forEach((ed) => {
        if (!comprasPorEdificio[ed]) comprasPorEdificio[ed] = { count: 0, presupuesto: 0, gastado: 0 };
        comprasPorEdificio[ed].count++;
        if (c.presupuestoEstimado) comprasPorEdificio[ed].presupuesto += c.presupuestoEstimado;
        if (c.montoGastado) comprasPorEdificio[ed].gastado += c.montoGastado;
      });
    });

    const comprasEdificiosData = Object.entries(comprasPorEdificio)
      .map(([edificio, data]) => ({ edificio, ...data }))
      .sort((a, b) => b.gastado - a.gastado || b.presupuesto - a.presupuesto);

    const comprasGastoTotal = filteredCompras.reduce((s, c) => s + (c.montoGastado || 0), 0);
    const comprasPresupTotal = filteredCompras.reduce((s, c) => s + (c.presupuestoEstimado || 0), 0);

    // Monthly trend (last 6 months or filtered)
    const meses: { key: string; label: string; incCount: number; comprasCount: number; costo: number }[] = [];
    const ahora = new Date();
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      const label = fecha.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
      const monthInc = incidencias.filter((inc) => inc.fechaReporte && getMonthKey(inc.fechaReporte) === key && (selectedEdificio === "all" || getEdificioForDashboard(inc) === selectedEdificio));
      const monthComp = compras.filter((c) => c.fechaSolicitud && getMonthKey(c.fechaSolicitud) === key && (selectedEdificio === "all" || c.edificio.includes(selectedEdificio)));
      const costo = monthInc.reduce((s, inc) => s + (inc.costoReparacion || 0), 0);
      meses.push({ key, label, incCount: monthInc.length, comprasCount: monthComp.length, costo });
    }

    // Problem types
    const palabrasClave: Record<string, number> = {};
    const kwMap: Record<string, string> = {
      agua: "Agua/Fugas", fuga: "Agua/Fugas", gotea: "Agua/Fugas", humedad: "Agua/Fugas",
      luz: "Electricidad", electricidad: "Electricidad", enchufe: "Electricidad", interruptor: "Electricidad",
      puerta: "Puertas/Cerraduras", cerradura: "Puertas/Cerraduras", llave: "Puertas/Cerraduras",
      ventana: "Ventanas", persiana: "Ventanas", cristal: "Ventanas",
      "calefacción": "Calefacción", radiador: "Calefacción", caldera: "Calefacción",
      "aire acondicionado": "Climatización", clima: "Climatización",
      "desagüe": "Fontanería", atasco: "Fontanería", "tubería": "Fontanería", wc: "Fontanería", "baño": "Fontanería",
      nevera: "Electrodomésticos", "electrodoméstico": "Electrodomésticos", lavadora: "Electrodomésticos",
      pintura: "Pintura/Paredes", pared: "Pintura/Paredes", techo: "Pintura/Paredes",
    };
    filteredInc.forEach((i) => {
      const desc = i.descripcion.toLowerCase();
      const found = new Set<string>();
      Object.entries(kwMap).forEach(([kw, cat]) => {
        if (desc.includes(kw) && !found.has(cat)) {
          found.add(cat);
          palabrasClave[cat] = (palabrasClave[cat] || 0) + 1;
        }
      });
    });
    const tiposProblemas = Object.entries(palabrasClave)
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Urgencias
    const urgentes = filteredInc.filter((i) => i.urgencia === "Urgente" && i.estado !== "Completada" && i.estado !== "Cancelada").length;
    const altas = filteredInc.filter((i) => i.urgencia === "Alta" && i.estado !== "Completada" && i.estado !== "Cancelada").length;

    return {
      pendientes, enProceso, derivaciones, completadas,
      total: filteredInc.length,
      tiempoPromedio,
      edificiosData, costoTotal, minutosTotal,
      comprasEdificiosData, comprasGastoTotal, comprasPresupTotal,
      comprasTotal: filteredCompras.length,
      meses,
      tiposProblemas,
      urgentes, altas,
    };
  }, [filteredInc, filteredCompras, incidencias, compras, selectedEdificio]);

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await fetch("/api/reporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes: selectedMonth, edificio: selectedEdificio }),
      });
      if (res.ok) {
        const { url } = await res.json();
        setReportLink(url);
      }
    } catch (e) {
      console.error("Error generating report link:", e);
    } finally {
      setGeneratingLink(false);
    }
  };

  const maxMesInc = Math.max(...stats.meses.map((m) => m.incCount), 1);

  // ── Report View ──
  if (showReport) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowReport(false)} className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Volver al dashboard
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateLink}
              disabled={generatingLink}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>
              {generatingLink ? "Generando..." : "Generar enlace"}
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-stone-600 text-white text-xs font-semibold rounded-lg hover:bg-stone-700 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Imprimir
            </button>
          </div>
        </div>

        {reportLink && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-emerald-700 font-medium mb-1">Enlace generado (válido 7 días)</p>
              <input
                readOnly
                value={reportLink}
                className="w-full text-xs bg-white border border-emerald-200 rounded px-2 py-1 text-emerald-800"
                onClick={(e) => { (e.target as HTMLInputElement).select(); navigator.clipboard.writeText(reportLink); }}
              />
            </div>
          </div>
        )}

        <ReportContent stats={stats} selectedMonth={selectedMonth} selectedEdificio={selectedEdificio} filteredCompras={filteredCompras} />
      </div>
    );
  }

  // ── Main Dashboard ──
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface-raised)] text-[var(--text-secondary)] focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Todos los meses</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>{getMonthLabel(m)}</option>
          ))}
        </select>
        <select
          value={selectedEdificio}
          onChange={(e) => setSelectedEdificio(e.target.value)}
          className="px-3 py-2 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface-raised)] text-[var(--text-secondary)] focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Todos los edificios</option>
          {allEdificios.map((ed) => (
            <option key={ed} value={ed}>{ed}</option>
          ))}
        </select>
        <button
          onClick={() => setShowReport(true)}
          className="ml-auto px-3 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Reporte
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pendientes" value={stats.pendientes} color="amber" />
        <StatCard label="En proceso" value={stats.enProceso} color="blue" />
        <StatCard label="Completadas" value={stats.completadas} color="emerald" />
        <StatCard label="Total" value={stats.total} color="stone" />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard icon="clock" label="Tiempo promedio resolución" value={`${stats.tiempoPromedio.toFixed(1)} días`} />
        <MetricCard icon="money" label="Costo total reparaciones" value={`${stats.costoTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`} />
        <MetricCard icon="time" label="Tiempo total dedicado" value={formatTime(stats.minutosTotal)} />
      </div>

      {/* Urgencies alert */}
      {(stats.urgentes > 0 || stats.altas > 0) && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="font-semibold text-red-800 text-sm">Requieren atención</span>
          </div>
          <div className="flex gap-4 text-sm">
            {stats.urgentes > 0 && <span className="text-red-700"><span className="font-bold">{stats.urgentes}</span> urgentes</span>}
            {stats.altas > 0 && <span className="text-orange-700"><span className="font-bold">{stats.altas}</span> prioridad alta</span>}
          </div>
        </div>
      )}

      {/* Monthly trend chart */}
      <div className="bg-[var(--surface-raised)] rounded-xl border border-[var(--border)] p-4">
        <h3 className="font-semibold text-[var(--text)] mb-4 text-sm">Tendencia mensual</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {stats.meses.map((mes) => (
            <div key={mes.key} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center justify-end h-24">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1">{mes.incCount}</span>
                <div
                  className="w-full max-w-[36px] bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all"
                  style={{ height: `${Math.max((mes.incCount / maxMesInc) * 100, 6)}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] capitalize">{mes.label}</span>
              {mes.costo > 0 && <span className="text-[9px] text-emerald-600 font-medium">{mes.costo.toLocaleString("es-ES")}€</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Incidencias by building - costs & time */}
      {stats.edificiosData.length > 0 && (
        <div className="bg-[var(--surface-raised)] rounded-xl border border-[var(--border)] p-4">
          <h3 className="font-semibold text-[var(--text)] mb-3 text-sm">Incidencias por edificio — Costos y tiempo</h3>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-light)]">
                  <th className="text-left py-2 pr-3 font-semibold text-[var(--text-muted)]">Edificio</th>
                  <th className="text-right py-2 px-2 font-semibold text-[var(--text-muted)]">Inc.</th>
                  <th className="text-right py-2 px-2 font-semibold text-[var(--text-muted)]">Compl.</th>
                  <th className="text-right py-2 px-2 font-semibold text-[var(--text-muted)]">Costo</th>
                  <th className="text-right py-2 pl-2 font-semibold text-[var(--text-muted)]">Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {stats.edificiosData.map((ed) => (
                  <tr key={ed.edificio} className="border-b border-stone-50">
                    <td className="py-2 pr-3 font-medium text-[var(--text)]">{ed.edificio}</td>
                    <td className="py-2 px-2 text-right text-[var(--text-secondary)]">{ed.incidencias}</td>
                    <td className="py-2 px-2 text-right text-emerald-600">{ed.completadas}</td>
                    <td className="py-2 px-2 text-right font-semibold text-[var(--text)]">
                      {ed.costo > 0 ? `${ed.costo.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€` : "—"}
                    </td>
                    <td className="py-2 pl-2 text-right text-[var(--text-secondary)]">{formatTime(ed.minutos)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--border)] font-bold">
                  <td className="py-2 pr-3 text-[var(--text)]">Total</td>
                  <td className="py-2 px-2 text-right">{stats.total}</td>
                  <td className="py-2 px-2 text-right text-emerald-600">{stats.completadas}</td>
                  <td className="py-2 px-2 text-right">{stats.costoTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€</td>
                  <td className="py-2 pl-2 text-right">{formatTime(stats.minutosTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Compras by building */}
      {stats.comprasEdificiosData.length > 0 && (
        <div className="bg-[var(--surface-raised)] rounded-xl border border-[var(--border)] p-4">
          <h3 className="font-semibold text-[var(--text)] mb-1 text-sm">Compras por edificio</h3>
          <p className="text-[11px] text-[var(--text-muted)] mb-3">{stats.comprasTotal} solicitudes · Presupuestado: {stats.comprasPresupTotal.toLocaleString("es-ES")}€ · Gastado: {stats.comprasGastoTotal.toLocaleString("es-ES")}€</p>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-light)]">
                  <th className="text-left py-2 pr-3 font-semibold text-[var(--text-muted)]">Edificio</th>
                  <th className="text-right py-2 px-2 font-semibold text-[var(--text-muted)]">Solic.</th>
                  <th className="text-right py-2 px-2 font-semibold text-[var(--text-muted)]">Presup.</th>
                  <th className="text-right py-2 pl-2 font-semibold text-[var(--text-muted)]">Gastado</th>
                </tr>
              </thead>
              <tbody>
                {stats.comprasEdificiosData.map((ed) => (
                  <tr key={ed.edificio} className="border-b border-stone-50">
                    <td className="py-2 pr-3 font-medium text-[var(--text)]">{ed.edificio}</td>
                    <td className="py-2 px-2 text-right text-[var(--text-secondary)]">{ed.count}</td>
                    <td className="py-2 px-2 text-right text-[var(--text-secondary)]">{ed.presupuesto > 0 ? `${ed.presupuesto.toLocaleString("es-ES")}€` : "—"}</td>
                    <td className="py-2 pl-2 text-right font-semibold text-[var(--text)]">{ed.gastado > 0 ? `${ed.gastado.toLocaleString("es-ES")}€` : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--border)] font-bold">
                  <td className="py-2 pr-3">Total</td>
                  <td className="py-2 px-2 text-right">{stats.comprasTotal}</td>
                  <td className="py-2 px-2 text-right">{stats.comprasPresupTotal.toLocaleString("es-ES")}€</td>
                  <td className="py-2 pl-2 text-right">{stats.comprasGastoTotal.toLocaleString("es-ES")}€</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Compras detail list */}
      {filteredCompras.length > 0 && (
        <div className="bg-[var(--surface-raised)] rounded-xl border border-[var(--border)] p-4">
          <h3 className="font-semibold text-[var(--text)] mb-3 text-sm">Detalle de compras</h3>
          <div className="space-y-2">
            {filteredCompras.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b border-stone-50 last:border-0">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-[var(--text)]">{c.solicitud}</span>
                  {c.edificio.length > 0 && (
                    <span className="text-[10px] text-[var(--text-muted)] ml-1.5">{selectedEdificio !== "all" ? selectedEdificio : c.edificio.join(", ")}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.montoGastado ? (
                    <span className="text-xs font-semibold text-[var(--text)]">{c.montoGastado.toLocaleString("es-ES")}€</span>
                  ) : c.presupuestoEstimado ? (
                    <span className="text-xs text-[var(--text-muted)]">~{c.presupuestoEstimado.toLocaleString("es-ES")}€</span>
                  ) : null}
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    c.estado === "Comprado" ? "bg-stone-100 text-stone-500" :
                    c.estado === "Aprobado" ? "bg-emerald-50 text-emerald-700" :
                    c.estado === "Rechazado" ? "bg-red-50 text-red-600" :
                    "bg-amber-50 text-amber-700"
                  }`}>{c.estado}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problem types */}
      {stats.tiposProblemas.length > 0 && (
        <div className="bg-[var(--surface-raised)] rounded-xl border border-[var(--border)] p-4">
          <h3 className="font-semibold text-[var(--text)] mb-3 text-sm">Problemas más frecuentes</h3>
          <div className="flex flex-wrap gap-2">
            {stats.tiposProblemas.map((p, i) => {
              const colors = ["bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-pink-100 text-pink-700", "bg-indigo-100 text-indigo-700", "bg-cyan-100 text-cyan-700", "bg-teal-100 text-teal-700"];
              return (
                <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${colors[i % colors.length]}`}>
                  {p.tipo} <span className="font-bold">{p.count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: "from-amber-50 to-amber-100/50 border-amber-200 text-amber-600",
    blue: "from-blue-50 to-blue-100/50 border-blue-200 text-blue-600",
    emerald: "from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-600",
    stone: "from-stone-50 to-stone-100/50 border-stone-200 text-stone-600",
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-3.5 text-center`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[11px] font-medium opacity-80">{label}</div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  const icons: Record<string, React.ReactNode> = {
    clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    money: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    time: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
  };
  return (
    <div className="bg-[var(--surface-raised)] rounded-xl border border-[var(--border)] p-3.5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icons[icon]}</svg>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-[var(--text)] truncate">{value}</div>
          <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
        </div>
      </div>
    </div>
  );
}

// ── Report Content (reusable for report page and print) ──

interface ReportStats {
  pendientes: number; enProceso: number; derivaciones: number; completadas: number; total: number;
  tiempoPromedio: number; costoTotal: number; minutosTotal: number;
  edificiosData: { edificio: string; incidencias: number; costo: number; minutos: number; completadas: number }[];
  comprasEdificiosData: { edificio: string; count: number; presupuesto: number; gastado: number }[];
  comprasGastoTotal: number; comprasPresupTotal: number; comprasTotal: number;
}

function ReportContent({ stats, selectedMonth, selectedEdificio, filteredCompras }: {
  stats: ReportStats; selectedMonth: string; selectedEdificio: string; filteredCompras: SolicitudCompra[];
}) {
  const periodo = selectedMonth === "all" ? "Todos los períodos" : getMonthLabel(selectedMonth);
  const edificio = selectedEdificio === "all" ? "Todos los edificios" : selectedEdificio;

  return (
    <div className="space-y-6 print:space-y-4" id="report-content">
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-4 print:pb-2">
        <h1 className="text-lg font-bold text-[var(--text)]">Reporte de Mantenimiento</h1>
        <p className="text-sm text-[var(--text-muted)]">{periodo} · {edificio}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Generado el {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Summary */}
      <div>
        <h2 className="text-sm font-bold text-[var(--text)] mb-2">Resumen de incidencias</h2>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-amber-50 rounded-lg p-2"><div className="text-lg font-bold text-amber-600">{stats.pendientes}</div><div className="text-amber-700">Pendientes</div></div>
          <div className="bg-blue-50 rounded-lg p-2"><div className="text-lg font-bold text-blue-600">{stats.enProceso}</div><div className="text-blue-700">En proceso</div></div>
          <div className="bg-emerald-50 rounded-lg p-2"><div className="text-lg font-bold text-emerald-600">{stats.completadas}</div><div className="text-emerald-700">Completadas</div></div>
          <div className="bg-stone-50 rounded-lg p-2"><div className="text-lg font-bold text-stone-600">{stats.total}</div><div className="text-stone-700">Total</div></div>
        </div>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="bg-stone-50 rounded-lg p-3">
          <div className="text-[var(--text-muted)]">Tiempo promedio resolución</div>
          <div className="text-sm font-bold text-[var(--text)] mt-0.5">{stats.tiempoPromedio.toFixed(1)} días</div>
        </div>
        <div className="bg-stone-50 rounded-lg p-3">
          <div className="text-[var(--text-muted)]">Costo reparaciones</div>
          <div className="text-sm font-bold text-[var(--text)] mt-0.5">{stats.costoTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€</div>
        </div>
        <div className="bg-stone-50 rounded-lg p-3">
          <div className="text-[var(--text-muted)]">Tiempo dedicado</div>
          <div className="text-sm font-bold text-[var(--text)] mt-0.5">{formatTime(stats.minutosTotal)}</div>
        </div>
      </div>

      {/* Building breakdown */}
      {stats.edificiosData.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[var(--text)] mb-2">Desglose por edificio — Incidencias</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50">
                <th className="text-left py-2 px-3 font-semibold">Edificio</th>
                <th className="text-right py-2 px-2 font-semibold">Incidencias</th>
                <th className="text-right py-2 px-2 font-semibold">Completadas</th>
                <th className="text-right py-2 px-2 font-semibold">Costo</th>
                <th className="text-right py-2 px-3 font-semibold">Tiempo</th>
              </tr>
            </thead>
            <tbody>
              {stats.edificiosData.map((ed) => (
                <tr key={ed.edificio} className="border-b border-stone-100">
                  <td className="py-2 px-3 font-medium">{ed.edificio}</td>
                  <td className="py-2 px-2 text-right">{ed.incidencias}</td>
                  <td className="py-2 px-2 text-right">{ed.completadas}</td>
                  <td className="py-2 px-2 text-right">{ed.costo > 0 ? `${ed.costo.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€` : "—"}</td>
                  <td className="py-2 px-3 text-right">{formatTime(ed.minutos)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-300 font-bold">
                <td className="py-2 px-3">Total</td>
                <td className="py-2 px-2 text-right">{stats.total}</td>
                <td className="py-2 px-2 text-right">{stats.completadas}</td>
                <td className="py-2 px-2 text-right">{stats.costoTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€</td>
                <td className="py-2 px-3 text-right">{formatTime(stats.minutosTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Compras breakdown */}
      {filteredCompras.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[var(--text)] mb-2">Compras y suministros</h2>
          <p className="text-[11px] text-[var(--text-muted)] mb-2">{stats.comprasTotal} solicitudes · Presupuestado: {stats.comprasPresupTotal.toLocaleString("es-ES")}€ · Gastado: {stats.comprasGastoTotal.toLocaleString("es-ES")}€</p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50">
                <th className="text-left py-2 px-3 font-semibold">Solicitud</th>
                <th className="text-left py-2 px-2 font-semibold">Edificio</th>
                <th className="text-right py-2 px-2 font-semibold">Presup.</th>
                <th className="text-right py-2 px-2 font-semibold">Gastado</th>
                <th className="text-right py-2 px-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompras.map((c) => (
                <tr key={c.id} className="border-b border-stone-100">
                  <td className="py-2 px-3 font-medium">{c.solicitud}</td>
                  <td className="py-2 px-2 text-[var(--text-muted)]">{c.edificio.join(", ") || "—"}</td>
                  <td className="py-2 px-2 text-right">{c.presupuestoEstimado ? `${c.presupuestoEstimado.toLocaleString("es-ES")}€` : "—"}</td>
                  <td className="py-2 px-2 text-right">{c.montoGastado ? `${c.montoGastado.toLocaleString("es-ES")}€` : "—"}</td>
                  <td className="py-2 px-3 text-right">{c.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
