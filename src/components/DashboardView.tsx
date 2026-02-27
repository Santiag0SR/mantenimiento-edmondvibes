"use client";

import { useMemo } from "react";
import type { Incidencia } from "@/types";

interface DashboardViewProps {
  incidencias: Incidencia[];
}

interface MonthData {
  month: string;
  count: number;
  maxCount: number;
}

interface BuildingCost {
  edificio: string;
  total: number;
  count: number;
}

export default function DashboardView({ incidencias }: DashboardViewProps) {
  const stats = useMemo(() => {
    // Incidencias por estado
    const pendientes = incidencias.filter((i) => i.estado === "Pendiente").length;
    const enProceso = incidencias.filter((i) => i.estado === "En proceso").length;
    const derivaciones = incidencias.filter((i) => i.estado === "Derivar a especialista").length;
    const completadas = incidencias.filter((i) => i.estado === "Completada").length;
    const canceladas = incidencias.filter((i) => i.estado === "Cancelada").length;

    // Tiempo promedio de resolución (en días)
    const resueltas = incidencias.filter(
      (i) => i.estado === "Completada" && i.fechaReporte && i.fechaReparacion
    );

    let tiempoPromedioResolucion = 0;
    if (resueltas.length > 0) {
      const tiempos = resueltas.map((i) => {
        const inicio = new Date(i.fechaReporte!);
        const fin = new Date(i.fechaReparacion!);
        return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      }).filter((t) => t >= 0 && t < 365); // Filtrar valores raros

      if (tiempos.length > 0) {
        tiempoPromedioResolucion = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      }
    }

    // Costos por edificio
    const costosPorEdificio: Record<string, { total: number; count: number }> = {};
    incidencias.forEach((i) => {
      if (i.costoReparacion && i.costoReparacion > 0) {
        if (!costosPorEdificio[i.edificio]) {
          costosPorEdificio[i.edificio] = { total: 0, count: 0 };
        }
        costosPorEdificio[i.edificio].total += i.costoReparacion;
        costosPorEdificio[i.edificio].count += 1;
      }
    });

    const edificiosCostos: BuildingCost[] = Object.entries(costosPorEdificio)
      .map(([edificio, data]) => ({ edificio, ...data }))
      .sort((a, b) => b.total - a.total);

    const costoTotal = edificiosCostos.reduce((acc, e) => acc + e.total, 0);

    // Incidencias por mes (últimos 6 meses)
    const ahora = new Date();
    const meses: MonthData[] = [];

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      const mesLabel = fecha.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");

      const count = incidencias.filter((inc) => {
        if (!inc.fechaReporte) return false;
        const incFecha = new Date(inc.fechaReporte);
        return (
          incFecha.getFullYear() === fecha.getFullYear() &&
          incFecha.getMonth() === fecha.getMonth()
        );
      }).length;

      meses.push({ month: mesLabel, count, maxCount: 0 });
    }

    const maxMes = Math.max(...meses.map((m) => m.count), 1);
    meses.forEach((m) => (m.maxCount = maxMes));

    // Tipos de problemas más frecuentes (palabras clave en descripción)
    const palabrasClave: Record<string, number> = {};
    const keywords = [
      "agua", "fuga", "gotea", "humedad",
      "luz", "electricidad", "enchufe", "interruptor",
      "puerta", "cerradura", "llave",
      "ventana", "persiana", "cristal",
      "calefacción", "radiador", "caldera",
      "aire acondicionado", "clima",
      "desagüe", "atasco", "tubería", "wc", "baño",
      "nevera", "electrodoméstico", "lavadora",
      "pintura", "pared", "techo",
      "ruido", "vecino"
    ];

    incidencias.forEach((i) => {
      const desc = i.descripcion.toLowerCase();
      keywords.forEach((kw) => {
        if (desc.includes(kw)) {
          // Agrupar palabras relacionadas
          let categoria = kw;
          if (["agua", "fuga", "gotea", "humedad"].includes(kw)) categoria = "Agua/Fugas";
          else if (["luz", "electricidad", "enchufe", "interruptor"].includes(kw)) categoria = "Electricidad";
          else if (["puerta", "cerradura", "llave"].includes(kw)) categoria = "Puertas/Cerraduras";
          else if (["ventana", "persiana", "cristal"].includes(kw)) categoria = "Ventanas";
          else if (["calefacción", "radiador", "caldera"].includes(kw)) categoria = "Calefacción";
          else if (["aire acondicionado", "clima"].includes(kw)) categoria = "Climatización";
          else if (["desagüe", "atasco", "tubería", "wc", "baño"].includes(kw)) categoria = "Fontanería";
          else if (["nevera", "electrodoméstico", "lavadora"].includes(kw)) categoria = "Electrodomésticos";
          else if (["pintura", "pared", "techo"].includes(kw)) categoria = "Pintura/Paredes";

          palabrasClave[categoria] = (palabrasClave[categoria] || 0) + 1;
        }
      });
    });

    const tiposProblemas = Object.entries(palabrasClave)
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Por urgencia
    const urgencias = {
      Urgente: incidencias.filter((i) => i.urgencia === "Urgente" && i.estado !== "Completada" && i.estado !== "Cancelada").length,
      Alta: incidencias.filter((i) => i.urgencia === "Alta" && i.estado !== "Completada" && i.estado !== "Cancelada").length,
      Media: incidencias.filter((i) => i.urgencia === "Media" && i.estado !== "Completada" && i.estado !== "Cancelada").length,
      Baja: incidencias.filter((i) => i.urgencia === "Baja" && i.estado !== "Completada" && i.estado !== "Cancelada").length,
    };

    return {
      pendientes,
      enProceso,
      derivaciones,
      completadas,
      canceladas,
      total: incidencias.length,
      tiempoPromedioResolucion,
      edificiosCostos,
      costoTotal,
      meses,
      tiposProblemas,
      urgencias,
    };
  }, [incidencias]);

  return (
    <div className="space-y-4">
      {/* Resumen general */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.pendientes}</div>
          <div className="text-xs text-amber-700 font-medium">Pendientes</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.enProceso}</div>
          <div className="text-xs text-blue-700 font-medium">En proceso</div>
        </div>
        <div className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/50 border border-fuchsia-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-fuchsia-600">{stats.derivaciones}</div>
          <div className="text-xs text-fuchsia-700 font-medium">Derivaciones</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.completadas}</div>
          <div className="text-xs text-emerald-700 font-medium">Completadas</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-slate-600">{stats.total}</div>
          <div className="text-xs text-slate-600 font-medium">Total</div>
        </div>
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {stats.tiempoPromedioResolucion.toFixed(1)} días
              </div>
              <div className="text-sm text-slate-500">Tiempo promedio resolución</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {stats.costoTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
              </div>
              <div className="text-sm text-slate-500">Costo total reparaciones</div>
            </div>
          </div>
        </div>
      </div>

      {/* Urgencias activas */}
      {(stats.urgencias.Urgente > 0 || stats.urgencias.Alta > 0) && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold text-red-800">Incidencias que requieren atención</span>
          </div>
          <div className="flex gap-4">
            {stats.urgencias.Urgente > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-sm text-red-700 font-medium">{stats.urgencias.Urgente} urgentes</span>
              </div>
            )}
            {stats.urgencias.Alta > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="text-sm text-orange-700 font-medium">{stats.urgencias.Alta} prioridad alta</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gráfico de incidencias por mes */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Incidencias por mes
        </h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {stats.meses.map((mes, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center justify-end h-24">
                <span className="text-xs font-semibold text-slate-700 mb-1">{mes.count}</span>
                <div
                  className="w-full max-w-[40px] bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all"
                  style={{ height: `${Math.max((mes.count / mes.maxCount) * 100, 8)}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 capitalize">{mes.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Costos por edificio */}
      {stats.edificiosCostos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Costos por edificio
          </h3>
          <div className="space-y-3">
            {stats.edificiosCostos.map((edificio, index) => {
              const percentage = (edificio.total / stats.costoTotal) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{edificio.edificio}</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {edificio.total.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {edificio.count} reparaciones • {percentage.toFixed(0)}% del total
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tipos de problemas más frecuentes */}
      {stats.tiposProblemas.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Problemas más frecuentes
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.tiposProblemas.map((problema, index) => {
              const colors = [
                "bg-blue-100 text-blue-700 border-blue-200",
                "bg-purple-100 text-purple-700 border-purple-200",
                "bg-pink-100 text-pink-700 border-pink-200",
                "bg-indigo-100 text-indigo-700 border-indigo-200",
                "bg-cyan-100 text-cyan-700 border-cyan-200",
              ];
              return (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${colors[index % colors.length]}`}
                >
                  {problema.tipo}
                  <span className="bg-white/50 px-1.5 py-0.5 rounded text-xs font-bold">
                    {problema.count}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
