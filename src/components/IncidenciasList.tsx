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
    active: "bg-indigo-600 text-white",
    inactive: "bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-indigo-300",
  },
  "Corporativo": {
    active: "bg-violet-600 text-white",
    inactive: "bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-violet-300",
  },
  "Vitarooms": {
    active: "bg-teal-600 text-white",
    inactive: "bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-teal-300",
  },
};

export default function IncidenciasList({ incidencias, basePath = "/admin" }: IncidenciasListProps) {
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | "">("");
  const [filtroEdificio, setFiltroEdificio] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [soloUrgentes, setSoloUrgentes] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState<OrdenTipo>("fecha");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

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

    filtered = [...filtered].sort((a, b) => {
      switch (ordenarPor) {
        case "urgencia":
          return (urgenciaPrioridad[a.urgencia] || 99) - (urgenciaPrioridad[b.urgencia] || 99);
        case "estado":
          return (estadoPrioridad[a.estado] || 99) - (estadoPrioridad[b.estado] || 99);
        case "fecha":
        default:
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

  const resetAndSet = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const cargarMas = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex gap-3">
        <div className="flex-1 bg-[var(--surface-raised)] border border-[var(--border-light)] rounded-2xl p-3.5">
          <div className="text-2xl font-bold text-amber-600">{pendientes}</div>
          <div className="text-[11px] font-medium text-[var(--text-muted)]">Pendientes</div>
        </div>
        <div className="flex-1 bg-[var(--surface-raised)] border border-[var(--border-light)] rounded-2xl p-3.5">
          <div className="text-2xl font-bold text-blue-600">{enProceso}</div>
          <div className="text-[11px] font-medium text-[var(--text-muted)]">En proceso</div>
        </div>
        {urgentesCount > 0 && (
          <div className="flex-1 bg-red-50 border border-red-100 rounded-2xl p-3.5">
            <div className="text-2xl font-bold text-red-600">{urgentesCount}</div>
            <div className="text-[11px] font-medium text-red-400">Urgentes</div>
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={() => {
            setFiltroCategoria("");
            setFiltroEdificio("");
            setVisibleCount(ITEMS_PER_PAGE);
          }}
          className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
            filtroCategoria === ""
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)]"
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
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                filtroCategoria === cat ? styles.active : styles.inactive
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="space-y-2">
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

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              setSoloUrgentes(!soloUrgentes);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              soloUrgentes
                ? "bg-red-500 text-white"
                : "bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-red-300"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Solo urgentes
            {urgentesCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                soloUrgentes ? "bg-white/20" : "bg-red-100 text-red-600"
              }`}>
                {urgentesCount}
              </span>
            )}
          </button>

          <div className="flex-1 flex items-center gap-1.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-3 py-1">
            <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">Ordenar:</span>
            <div className="flex gap-1 flex-1">
              {[
                { key: "fecha", label: "Fecha" },
                { key: "urgencia", label: "Urgencia" },
                { key: "estado", label: "Estado" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setOrdenarPor(opt.key as OrdenTipo)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
                    ordenarPor === opt.key
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--text-muted)] hover:bg-stone-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result count */}
      {(filtroCategoria || filtroEdificio || filtroEstado || soloUrgentes) && (
        <div className="text-[11px] text-[var(--text-muted)] px-1">
          {incidenciasFiltradas.length} de {incidencias.length} incidencias
        </div>
      )}

      {/* List */}
      <div className="space-y-2.5">
        {incidenciasFiltradas.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">{soloUrgentes ? "No hay incidencias urgentes" : "No hay incidencias"}</p>
          </div>
        ) : (
          <>
            {incidenciasVisibles.map((inc) => (
              <IncidenciaCard key={inc.id} incidencia={inc} basePath={basePath} />
            ))}

            {hayMas && (
              <button
                onClick={cargarMas}
                className="w-full py-2.5 bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
