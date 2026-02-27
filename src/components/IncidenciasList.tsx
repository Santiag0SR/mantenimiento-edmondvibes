"use client";

import { useState, useMemo } from "react";
import type { Incidencia } from "@/types";
import { EDIFICIOS, ESTADOS, CATEGORIAS, EDIFICIOS_POR_CATEGORIA } from "@/lib/buildings";
import type { Categoria } from "@/lib/buildings";
import IncidenciaCard from "./IncidenciaCard";
import CustomSelect from "./CustomSelect";

interface IncidenciasListProps {
  incidencias: Incidencia[];
  basePath?: string;
}

const ITEMS_PER_PAGE = 10;

type OrdenTipo = "fecha" | "urgencia" | "estado";

const urgenciaPrioridad: Record<string, number> = {
  Urgente: 0,
  Alta: 1,
  Media: 2,
  Baja: 3,
};

const estadoPrioridad: Record<string, number> = {
  Pendiente: 0,
  "En proceso": 1,
  "Derivar a especialista": 2,
  Completada: 3,
  Cancelada: 4,
};

const categoriaStyles: Record<string, { active: string; inactive: string }> = {
  "Turístico": {
    active: "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30",
    inactive: "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600",
  },
  "Corporativo": {
    active: "bg-violet-500 text-white shadow-lg shadow-violet-500/30",
    inactive: "bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600",
  },
  "Vitarooms": {
    active: "bg-teal-500 text-white shadow-lg shadow-teal-500/30",
    inactive: "bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-600",
  },
};

export default function IncidenciasList({ incidencias, basePath = "/admin" }: IncidenciasListProps) {
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | "">("");
  const [filtroEdificio, setFiltroEdificio] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [soloUrgentes, setSoloUrgentes] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState<OrdenTipo>("fecha");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Edificios filtrados por categoría seleccionada
  const edificiosFiltrados = useMemo(() => {
    if (filtroCategoria) {
      return Object.keys(EDIFICIOS_POR_CATEGORIA[filtroCategoria]);
    }
    return Object.keys(EDIFICIOS);
  }, [filtroCategoria]);

  const incidenciasFiltradas = useMemo(() => {
    let filtered = incidencias.filter((inc) => {
      if (filtroCategoria && inc.categoria !== filtroCategoria) return false;
      if (filtroEdificio && inc.edificio !== filtroEdificio) return false;
      if (filtroEstado && inc.estado !== filtroEstado) return false;
      if (soloUrgentes && inc.urgencia !== "Urgente" && inc.urgencia !== "Alta") return false;
      return true;
    });

    // Ordenar
    filtered = [...filtered].sort((a, b) => {
      switch (ordenarPor) {
        case "urgencia":
          return (urgenciaPrioridad[a.urgencia] || 99) - (urgenciaPrioridad[b.urgencia] || 99);
        case "estado":
          return (estadoPrioridad[a.estado] || 99) - (estadoPrioridad[b.estado] || 99);
        case "fecha":
        default:
          // Más recientes primero
          const fechaA = a.fechaReporte ? new Date(a.fechaReporte).getTime() : 0;
          const fechaB = b.fechaReporte ? new Date(b.fechaReporte).getTime() : 0;
          return fechaB - fechaA;
      }
    });

    return filtered;
  }, [incidencias, filtroCategoria, filtroEdificio, filtroEstado, soloUrgentes, ordenarPor]);

  const incidenciasVisibles = incidenciasFiltradas.slice(0, visibleCount);
  const hayMas = visibleCount < incidenciasFiltradas.length;

  const pendientes = incidencias.filter((i) => i.estado === "Pendiente").length;
  const enProceso = incidencias.filter((i) => i.estado === "En proceso").length;
  const urgentesCount = incidencias.filter(
    (i) => (i.urgencia === "Urgente" || i.urgencia === "Alta") &&
           i.estado !== "Completada" && i.estado !== "Cancelada"
  ).length;

  // Reset visible count when filters change
  const resetAndSet = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const cargarMas = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-600">{pendientes}</div>
          <div className="text-sm text-amber-700 font-medium">Pendientes</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">{enProceso}</div>
          <div className="text-sm text-blue-700 font-medium">En proceso</div>
        </div>
      </div>

      {/* Filtro de categoría */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => {
            setFiltroCategoria("");
            setFiltroEdificio("");
            setVisibleCount(ITEMS_PER_PAGE);
          }}
          className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
            filtroCategoria === ""
              ? "bg-slate-800 text-white shadow-lg"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Todas
        </button>
        {CATEGORIAS.map((cat) => {
          const styles = categoriaStyles[cat];
          return (
            <button
              key={cat}
              onClick={() => {
                setFiltroCategoria(cat);
                setFiltroEdificio("");
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
                filtroCategoria === cat ? styles.active : styles.inactive
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-full sm:flex-1">
            <CustomSelect
              value={filtroEdificio}
              onChange={resetAndSet(setFiltroEdificio)}
              options={edificiosFiltrados}
              placeholder="Todos los edificios"
              allowClear
            />
          </div>
          <div className="w-full sm:flex-1">
            <CustomSelect
              value={filtroEstado}
              onChange={resetAndSet(setFiltroEstado)}
              options={[...ESTADOS]}
              placeholder="Todos los estados"
              allowClear
            />
          </div>
        </div>

        {/* Ordenación y filtro urgentes */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Botón solo urgentes */}
          <button
            onClick={() => {
              setSoloUrgentes(!soloUrgentes);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              soloUrgentes
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-white border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Solo urgentes
            {urgentesCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                soloUrgentes ? "bg-white/20" : "bg-red-100 text-red-600"
              }`}>
                {urgentesCount}
              </span>
            )}
          </button>

          {/* Ordenar por */}
          <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1">
            <span className="text-sm text-slate-500 whitespace-nowrap">Ordenar:</span>
            <div className="flex gap-1 flex-1">
              {[
                { key: "fecha", label: "Fecha", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                { key: "urgencia", label: "Urgencia", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
                { key: "estado", label: "Estado", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setOrdenarPor(opt.key as OrdenTipo)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    ordenarPor === opt.key
                      ? "bg-slate-800 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} />
                  </svg>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      {(filtroCategoria || filtroEdificio || filtroEstado || soloUrgentes) && (
        <div className="text-sm text-slate-500 px-1">
          Mostrando {incidenciasFiltradas.length} de {incidencias.length} incidencias
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {incidenciasFiltradas.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {soloUrgentes ? "No hay incidencias urgentes" : "No hay incidencias"}
          </div>
        ) : (
          <>
            {incidenciasVisibles.map((inc) => (
              <IncidenciaCard key={inc.id} incidencia={inc} basePath={basePath} />
            ))}

            {/* Botón cargar más */}
            {hayMas && (
              <button
                onClick={cargarMas}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Cargar más ({incidenciasFiltradas.length - visibleCount} restantes)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
