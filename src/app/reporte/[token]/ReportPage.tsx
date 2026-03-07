"use client";

import { useMemo } from "react";
import Image from "next/image";
import type { Incidencia, SolicitudCompra } from "@/types";

interface ReportPageProps {
  incidencias: Incidencia[];
  compras: SolicitudCompra[];
  mes: string;
  edificio: string;
}

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

function getEdificioForReport(inc: Incidencia): string {
  if (inc.categoria === "Vitarooms") return "Vitarooms";
  return inc.edificio || "Sin edificio";
}

export default function ReportPage({ incidencias, compras, mes, edificio }: ReportPageProps) {
  const filteredInc = useMemo(() => {
    let items = incidencias;
    if (mes !== "all") items = items.filter((i) => i.fechaReporte && getMonthKey(i.fechaReporte) === mes);
    if (edificio !== "all") items = items.filter((i) => getEdificioForReport(i) === edificio);
    return items;
  }, [incidencias, mes, edificio]);

  const filteredCompras = useMemo(() => {
    let items = compras;
    if (mes !== "all") items = items.filter((c) => c.fechaSolicitud && getMonthKey(c.fechaSolicitud) === mes);
    if (edificio !== "all") items = items.filter((c) => c.edificio.some((e) => e === edificio));
    return items;
  }, [compras, mes, edificio]);

  const stats = useMemo(() => {
    const pendientes = filteredInc.filter((i) => i.estado === "Pendiente").length;
    const enProceso = filteredInc.filter((i) => i.estado === "En proceso").length;
    const completadas = filteredInc.filter((i) => i.estado === "Completada").length;

    const resueltas = filteredInc.filter((i) => i.estado === "Completada" && i.fechaReporte && i.fechaReparacion);
    let tiempoPromedio = 0;
    if (resueltas.length > 0) {
      const tiempos = resueltas
        .map((i) => (new Date(i.fechaReparacion!).getTime() - new Date(i.fechaReporte!).getTime()) / (1000 * 60 * 60 * 24))
        .filter((t) => t >= 0 && t < 365);
      if (tiempos.length > 0) tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
    }

    const porEdificio: Record<string, { incidencias: number; costo: number; minutos: number; completadas: number }> = {};
    filteredInc.forEach((i) => {
      const ed = getEdificioForReport(i);
      if (!porEdificio[ed]) porEdificio[ed] = { incidencias: 0, costo: 0, minutos: 0, completadas: 0 };
      porEdificio[ed].incidencias++;
      if (i.costoReparacion) porEdificio[ed].costo += i.costoReparacion;
      porEdificio[ed].minutos += parseMinutes(i.tiempoReparacion);
      if (i.estado === "Completada") porEdificio[ed].completadas++;
    });

    const edificiosData = Object.entries(porEdificio)
      .map(([ed, data]) => ({ edificio: ed, ...data }))
      .sort((a, b) => b.costo - a.costo);

    const costoTotal = edificiosData.reduce((s, e) => s + e.costo, 0);
    const minutosTotal = edificiosData.reduce((s, e) => s + e.minutos, 0);

    const comprasGastoTotal = filteredCompras.reduce((s, c) => s + (c.montoGastado || 0), 0);
    const comprasPresupTotal = filteredCompras.reduce((s, c) => s + (c.presupuestoEstimado || 0), 0);

    return { pendientes, enProceso, completadas, total: filteredInc.length, tiempoPromedio, edificiosData, costoTotal, minutosTotal, comprasGastoTotal, comprasPresupTotal, comprasTotal: filteredCompras.length };
  }, [filteredInc, filteredCompras]);

  const periodo = mes === "all" ? "Todos los períodos" : getMonthLabel(mes);
  const edificioLabel = edificio === "all" ? "Todos los edificios" : edificio;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-8 print:px-4 print:py-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-6 mb-6 print:pb-3 print:mb-4">
          <div>
            <Image src="/LogoEdmond5.png" alt="EdmondVibes" width={180} height={58} className="h-12 w-auto mb-3 print:h-8" />
            <h1 className="text-xl font-bold text-stone-800">Reporte de Mantenimiento</h1>
            <p className="text-sm text-stone-500 mt-0.5">{periodo} · {edificioLabel}</p>
            <p className="text-xs text-stone-400 mt-1">Generado el {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <button onClick={() => window.print()} className="print:hidden px-4 py-2 bg-stone-800 text-white text-sm font-semibold rounded-lg hover:bg-stone-700">
            Imprimir
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-6 print:mb-4">
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.pendientes}</div>
            <div className="text-xs text-amber-700 font-medium">Pendientes</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.enProceso}</div>
            <div className="text-xs text-blue-700 font-medium">En proceso</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.completadas}</div>
            <div className="text-xs text-emerald-700 font-medium">Completadas</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-stone-600">{stats.total}</div>
            <div className="text-xs text-stone-600 font-medium">Total</div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3 mb-8 print:mb-5">
          <div className="bg-stone-50 rounded-xl p-4">
            <div className="text-xs text-stone-500 mb-1">Tiempo promedio resolución</div>
            <div className="text-lg font-bold text-stone-800">{stats.tiempoPromedio.toFixed(1)} días</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-4">
            <div className="text-xs text-stone-500 mb-1">Costo total reparaciones</div>
            <div className="text-lg font-bold text-stone-800">{stats.costoTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-4">
            <div className="text-xs text-stone-500 mb-1">Tiempo dedicado</div>
            <div className="text-lg font-bold text-stone-800">{formatTime(stats.minutosTotal)}</div>
          </div>
        </div>

        {/* Building breakdown */}
        {stats.edificiosData.length > 0 && (
          <div className="mb-8 print:mb-5">
            <h2 className="text-sm font-bold text-stone-800 mb-3">Desglose por edificio — Incidencias</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-600">
                  <th className="text-left py-2.5 px-3 font-semibold text-xs rounded-l-lg">Edificio</th>
                  <th className="text-right py-2.5 px-2 font-semibold text-xs">Inc.</th>
                  <th className="text-right py-2.5 px-2 font-semibold text-xs">Completadas</th>
                  <th className="text-right py-2.5 px-2 font-semibold text-xs">Costo</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-xs rounded-r-lg">Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {stats.edificiosData.map((ed) => (
                  <tr key={ed.edificio} className="border-b border-stone-100">
                    <td className="py-2.5 px-3 font-medium text-stone-800">{ed.edificio}</td>
                    <td className="py-2.5 px-2 text-right text-stone-600">{ed.incidencias}</td>
                    <td className="py-2.5 px-2 text-right text-emerald-600">{ed.completadas}</td>
                    <td className="py-2.5 px-2 text-right font-semibold">{ed.costo > 0 ? `${ed.costo.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€` : "—"}</td>
                    <td className="py-2.5 px-3 text-right text-stone-500">{formatTime(ed.minutos)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-stone-300 font-bold text-stone-800">
                  <td className="py-2.5 px-3">Total</td>
                  <td className="py-2.5 px-2 text-right">{stats.total}</td>
                  <td className="py-2.5 px-2 text-right text-emerald-600">{stats.completadas}</td>
                  <td className="py-2.5 px-2 text-right">{stats.costoTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€</td>
                  <td className="py-2.5 px-3 text-right">{formatTime(stats.minutosTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Compras */}
        {filteredCompras.length > 0 && (
          <div className="mb-8 print:mb-5">
            <h2 className="text-sm font-bold text-stone-800 mb-1">Compras y suministros</h2>
            <p className="text-xs text-stone-500 mb-3">{stats.comprasTotal} solicitudes · Presupuestado: {stats.comprasPresupTotal.toLocaleString("es-ES")}€ · Gastado: {stats.comprasGastoTotal.toLocaleString("es-ES")}€</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-600">
                  <th className="text-left py-2.5 px-3 font-semibold text-xs rounded-l-lg">Solicitud</th>
                  <th className="text-left py-2.5 px-2 font-semibold text-xs">Edificio</th>
                  <th className="text-right py-2.5 px-2 font-semibold text-xs">Presup.</th>
                  <th className="text-right py-2.5 px-2 font-semibold text-xs">Gastado</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-xs rounded-r-lg">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompras.map((c) => (
                  <tr key={c.id} className="border-b border-stone-100">
                    <td className="py-2.5 px-3 font-medium text-stone-800">{c.solicitud}</td>
                    <td className="py-2.5 px-2 text-stone-500 text-xs">{edificio !== "all" ? edificio : (c.edificio.join(", ") || "—")}</td>
                    <td className="py-2.5 px-2 text-right">{c.presupuestoEstimado ? `${c.presupuestoEstimado.toLocaleString("es-ES")}€` : "—"}</td>
                    <td className="py-2.5 px-2 text-right font-semibold">{c.montoGastado ? `${c.montoGastado.toLocaleString("es-ES")}€` : "—"}</td>
                    <td className="py-2.5 px-3 text-right text-xs">{c.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-stone-200 pt-4 mt-8 print:mt-4 text-center">
          <p className="text-xs text-stone-400">EdmondVibes · Reporte de mantenimiento generado automáticamente</p>
        </div>
      </div>
    </div>
  );
}
