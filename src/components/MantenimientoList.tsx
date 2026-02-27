"use client";

import { useState, useMemo, useEffect } from "react";
import type { Mantenimiento, EstadoMantenimiento } from "@/types";
import type { Urgencia, Categoria } from "@/lib/buildings";
import { EDIFICIOS_POR_CATEGORIA, EDIFICIO_ALIASES, URGENCIAS } from "@/lib/buildings";
import { formatDate } from "@/lib/dates";

interface MantenimientoListProps {
  mantenimientos: Mantenimiento[];
  role?: "tecnico" | "gestion";
}

const ESTADOS_MANTENIMIENTO: EstadoMantenimiento[] = [
  "Pendiente de programación",
  "Programado",
  "En curso",
  "Completado",
];

const estadoStyles: Record<string, { badge: string; dot: string }> = {
  "Pendiente de programación": { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  "Programado": { badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  "En curso": { badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  "Completado": { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

const frecuenciaStyles: Record<string, string> = {
  "Semanal": "bg-red-50 text-red-600",
  "Mensual": "bg-orange-50 text-orange-600",
  "Trimestral": "bg-amber-50 text-amber-600",
  "Semestral": "bg-cyan-50 text-cyan-600",
  "Anual": "bg-slate-50 text-slate-600",
  "cada 5 años": "bg-slate-50 text-slate-500",
};

// Resolver alias de edificio a nombre completo, categoría y apartamentos
function resolveEdificio(edificioName: string): { nombre: string; categoria: Categoria; apartamentos: string[] } | null {
  if (!edificioName) return null;

  // 1. Buscar en alias (JB, AO, GMC, CDV, etc.)
  const alias = EDIFICIO_ALIASES[edificioName];
  if (alias) {
    const apts = EDIFICIOS_POR_CATEGORIA[alias.categoria]?.[alias.nombre] || [];
    return { nombre: alias.nombre, categoria: alias.categoria, apartamentos: apts };
  }

  // 2. Buscar directo en EDIFICIOS_POR_CATEGORIA (match exacto o parcial)
  const search = edificioName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  for (const [cat, edificios] of Object.entries(EDIFICIOS_POR_CATEGORIA)) {
    for (const [nombre, apts] of Object.entries(edificios)) {
      const norm = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (norm === search) return { nombre, categoria: cat as Categoria, apartamentos: apts };
      const nameAlias = norm.split(" - ")[0];
      const searchAlias = search.split(" - ")[0];
      if (nameAlias === searchAlias) return { nombre, categoria: cat as Categoria, apartamentos: apts };
      if (norm.includes(search) || search.includes(norm)) return { nombre, categoria: cat as Categoria, apartamentos: apts };
    }
  }

  return null;
}

function parseCompletados(str?: string): string[] {
  if (!str) return [];
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

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

export default function MantenimientoList({ mantenimientos }: MantenimientoListProps) {
  const [filtroEstado, setFiltroEstado] = useState<EstadoMantenimiento | "">("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [soloVencidas, setSoloVencidas] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [completando, setCompletando] = useState<string | null>(null);
  const [notasCompletar, setNotasCompletar] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Estado local de apartamentos completados (actualización instantánea, se sincroniza con servidor)
  const [localCompletados, setLocalCompletados] = useState<Record<string, string>>({});
  // IDs que están guardando (bloquea clics durante el save)
  const [savingAptIds, setSavingAptIds] = useState<Set<string>>(new Set());

  // Cuando llegan datos frescos del servidor que coinciden con nuestro estado local, limpiar
  useEffect(() => {
    setLocalCompletados((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const m of mantenimientos) {
        if (next[m.id] !== undefined && (m.apartamentosCompletados || "") === next[m.id]) {
          delete next[m.id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [mantenimientos]);

  // Estado para crear incidencia inline
  const [creandoIncidencia, setCreandoIncidencia] = useState<string | null>(null);
  const [incApartamento, setIncApartamento] = useState("");
  const [incDescripcion, setIncDescripcion] = useState("");
  const [incUrgencia, setIncUrgencia] = useState<Urgencia>("Media");
  const [incSaving, setIncSaving] = useState(false);
  const [incSuccess, setIncSuccess] = useState<string | null>(null);

  const tipos = useMemo(() => {
    const set = new Set(mantenimientos.map((m) => m.tipo).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [mantenimientos]);

  const stats = useMemo(() => {
    const vencidas = mantenimientos.filter(isOverdue).length;
    const proximaSemana = mantenimientos.filter(isDueSoon).length;
    const pendientes = mantenimientos.filter((m) => m.estado !== "Completado").length;
    return { vencidas, proximaSemana, pendientes };
  }, [mantenimientos]);

  const filtrados = useMemo(() => {
    let items = mantenimientos;
    if (filtroEstado) items = items.filter((m) => m.estado === filtroEstado);
    if (filtroTipo) items = items.filter((m) => m.tipo === filtroTipo);
    if (soloVencidas) items = items.filter(isOverdue);

    return [...items].sort((a, b) => {
      const aOverdue = isOverdue(a) ? 0 : 1;
      const bOverdue = isOverdue(b) ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      const aDate = a.fechaProgramada ? new Date(a.fechaProgramada).getTime() : Infinity;
      const bDate = b.fechaProgramada ? new Date(b.fechaProgramada).getTime() : Infinity;
      return aDate - bDate;
    });
  }, [mantenimientos, filtroEstado, filtroTipo, soloVencidas]);

  const handleCompletarEdificio = async (id: string) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/mantenimiento/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "completar",
          notasEjecucion: notasCompletar || undefined,
        }),
      });
      if (res.ok) {
        setCompletando(null);
        setNotasCompletar("");
        window.dispatchEvent(new CustomEvent("mantenimiento-updated"));
      }
    } catch (error) {
      console.error("Error completing:", error);
    } finally {
      setSavingId(null);
    }
  };

  // Leer completados: prefiere estado local (instantáneo) sobre prop del servidor
  const getCompletados = (m: Mantenimiento): string[] => {
    const str = localCompletados[m.id] !== undefined
      ? localCompletados[m.id]
      : (m.apartamentosCompletados || "");
    return parseCompletados(str);
  };

  const handleToggleApartamento = async (m: Mantenimiento, apartamento: string) => {
    if (savingAptIds.has(m.id)) return;

    const completados = getCompletados(m);
    const nuevos = completados.includes(apartamento)
      ? completados.filter((a) => a !== apartamento)
      : [...completados, apartamento];

    const nuevosStr = nuevos.join(", ");

    // 1. Actualización visual instantánea
    setLocalCompletados((prev) => ({ ...prev, [m.id]: nuevosStr }));
    // 2. Bloquear más clics mientras se guarda
    setSavingAptIds((prev) => new Set(prev).add(m.id));

    try {
      const update: Record<string, unknown> = { apartamentosCompletados: nuevosStr };
      if (m.estado === "Pendiente de programación" || m.estado === "Programado") {
        update.estado = "En curso";
      }
      await fetch(`/api/mantenimiento/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      window.dispatchEvent(new CustomEvent("mantenimiento-updated"));
    } catch (error) {
      console.error("Error updating apartamento:", error);
      // Revertir estado local en caso de error
      setLocalCompletados((prev) => {
        const next = { ...prev };
        delete next[m.id];
        return next;
      });
    } finally {
      setSavingAptIds((prev) => {
        const next = new Set(prev);
        next.delete(m.id);
        return next;
      });
    }
  };

  const handleUpdateEstado = async (id: string, estado: EstadoMantenimiento) => {
    setSavingId(id);
    try {
      await fetch(`/api/mantenimiento/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      window.dispatchEvent(new CustomEvent("mantenimiento-updated"));
    } catch (error) {
      console.error("Error updating:", error);
    } finally {
      setSavingId(null);
    }
  };

  const handleCrearIncidencia = async (m: Mantenimiento) => {
    const resolved = resolveEdificio(m.edificio || "");
    if (!resolved || !incDescripcion || !incApartamento) return;

    setIncSaving(true);
    try {
      const res = await fetch("/api/incidencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria: resolved.categoria,
          edificio: resolved.nombre,
          apartamento: incApartamento,
          descripcion: incDescripcion,
          urgencia: incUrgencia,
        }),
      });
      if (res.ok) {
        setIncSuccess(m.id);
        setCreandoIncidencia(null);
        setIncApartamento("");
        setIncDescripcion("");
        setIncUrgencia("Media");
        setTimeout(() => setIncSuccess(null), 3000);
      }
    } catch (error) {
      console.error("Error creating incidencia:", error);
    } finally {
      setIncSaving(false);
    }
  };

  const openCrearIncidencia = (mId: string) => {
    setCreandoIncidencia(mId);
    setIncApartamento("");
    setIncDescripcion("");
    setIncUrgencia("Media");
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => { setSoloVencidas(!soloVencidas); setFiltroEstado(""); }}
          className={`rounded-2xl p-3 text-center transition-all ${
            soloVencidas
              ? "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 scale-[1.02]"
              : "bg-gradient-to-br from-red-50 to-red-100/80 border border-red-200"
          }`}
        >
          <div className={`text-2xl font-bold ${soloVencidas ? "text-white" : "text-red-600"}`}>{stats.vencidas}</div>
          <div className={`text-[11px] font-semibold ${soloVencidas ? "text-white/80" : "text-red-600/70"}`}>Vencidas</div>
        </button>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-200 rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.proximaSemana}</div>
          <div className="text-[11px] font-semibold text-amber-600/70">Esta semana</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200 rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-slate-600">{stats.pendientes}</div>
          <div className="text-[11px] font-semibold text-slate-500">Pendientes</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value as EstadoMantenimiento | ""); setSoloVencidas(false); }}
          className="px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_MANTENIMIENTO.map((est) => (
            <option key={est} value={est}>{est}</option>
          ))}
        </select>
        {tipos.length > 1 && (
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">Todos los tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="font-medium">No hay tareas de mantenimiento</p>
          <p className="text-sm">con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((m) => {
            const overdue = isOverdue(m);
            const dueSoon = isDueSoon(m);
            const estStyles = estadoStyles[m.estado] || estadoStyles["Pendiente de programación"];
            const isExpanded = expandedId === m.id;
            const isCompleting = completando === m.id;
            const resolved = resolveEdificio(m.edificio || "");
            const allApts = resolved?.apartamentos || [];
            const completados = getCompletados(m);
            const hasApartamentos = allApts.length > 0;
            const aptProgress = hasApartamentos ? completados.length : 0;
            const isCreatingInc = creandoIncidencia === m.id;

            return (
              <div
                key={m.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all border-l-4 ${
                  overdue
                    ? "border-l-red-500 border-red-200 shadow-lg shadow-red-100/50"
                    : dueSoon
                    ? "border-l-amber-500 border-amber-200 shadow-md shadow-amber-100/50"
                    : m.estado === "En curso"
                    ? "border-l-indigo-500 border-slate-100 shadow-sm"
                    : m.estado === "Completado"
                    ? "border-l-emerald-500 border-slate-100 shadow-sm"
                    : "border-l-slate-300 border-slate-100 shadow-sm"
                }`}
              >
                {/* Card header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  className="w-full text-left p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {overdue && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                        <h3 className="font-bold text-slate-800 text-base leading-tight truncate">
                          {m.tarea}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${estStyles.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${estStyles.dot}`} />
                          {m.estado}
                        </span>
                        {m.frecuenciaRevision && (
                          <span className={`px-2 py-0.5 rounded-full font-medium ${frecuenciaStyles[m.frecuenciaRevision] || "bg-slate-50 text-slate-500"}`}>
                            {m.frecuenciaRevision}
                          </span>
                        )}
                        {m.tipo && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                            {m.tipo}
                          </span>
                        )}
                      </div>

                      {m.edificio && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {m.edificio}{resolved ? ` (${resolved.nombre})` : ""}
                          {hasApartamentos && m.estado !== "Completado" && aptProgress > 0 && (
                            <span className="ml-1 text-indigo-600 font-semibold">
                              ({aptProgress}/{allApts.length})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      {m.fechaProgramada ? (
                        <div className={`text-xs font-semibold ${overdue ? "text-red-600" : dueSoon ? "text-amber-600" : "text-slate-500"}`}>
                          {overdue && "VENCIDA "}
                          {formatDate(m.fechaProgramada)}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">Sin fecha</div>
                      )}
                      {m.tecnico && (
                        <div className="text-xs text-slate-400 mt-0.5">{m.tecnico}</div>
                      )}
                      <svg className={`w-4 h-4 ml-auto mt-1 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {m.fechaUltimaInspeccion && (
                        <div className="bg-slate-50 rounded-lg p-2">
                          <span className="text-slate-500">Última inspección</span>
                          <div className="font-semibold text-slate-700">{formatDate(m.fechaUltimaInspeccion)}</div>
                        </div>
                      )}
                      {m.contacto && (
                        <div className="bg-slate-50 rounded-lg p-2">
                          <span className="text-slate-500">Contacto</span>
                          <div className="font-semibold text-slate-700">{m.contacto}</div>
                        </div>
                      )}
                    </div>

                    {m.notasEjecucion && (
                      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                        <span className="font-semibold text-slate-700 text-xs">Notas:</span>
                        <p className="mt-1">{m.notasEjecucion}</p>
                      </div>
                    )}

                    {/* Incidencia success message */}
                    {incSuccess === m.id && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Incidencia creada correctamente
                      </div>
                    )}

                    {/* Actions for non-completed tasks */}
                    {m.estado !== "Completado" && (
                      <div className="space-y-3">
                        {/* Quick estado change */}
                        <div className="flex flex-wrap gap-2">
                          {ESTADOS_MANTENIMIENTO.filter((e) => e !== m.estado && e !== "Completado").map((est) => (
                            <button
                              key={est}
                              onClick={() => handleUpdateEstado(m.id, est)}
                              disabled={savingId === m.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${estadoStyles[est]?.badge || "bg-slate-100 text-slate-600"} hover:opacity-80 disabled:opacity-50`}
                            >
                              {est}
                            </button>
                          ))}
                        </div>

                        {/* Apartment-level checklist */}
                        {hasApartamentos && (
                          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-indigo-800">
                                Progreso por apartamento
                              </span>
                              <span className="text-xs font-bold text-indigo-600">
                                {aptProgress}/{allApts.length}
                              </span>
                            </div>
                            <div className="w-full bg-indigo-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-3 rounded-full transition-all"
                                style={{ width: `${allApts.length > 0 ? (aptProgress / allApts.length) * 100 : 0}%` }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 mt-2">
                              {allApts.map((apt) => {
                                const isDone = completados.includes(apt);
                                const isSavingApt = savingAptIds.has(m.id);
                                return (
                                  <button
                                    key={apt}
                                    onClick={() => handleToggleApartamento(m, apt)}
                                    disabled={isSavingApt}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                                      isDone
                                        ? "bg-indigo-500 text-white"
                                        : "bg-white border border-indigo-200 text-slate-700 hover:border-indigo-400"
                                    } ${isSavingApt ? "opacity-50 cursor-wait" : ""}`}
                                  >
                                    <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isDone ? "bg-white border-white/50 scale-110" : "border-slate-300"
                                    }`}>
                                      {isDone && (
                                        <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </span>
                                    <span className="truncate">{apt}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Crear incidencia inline */}
                        {resolved && !isCreatingInc && (
                          <button
                            onClick={() => openCrearIncidencia(m.id)}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-amber-300 text-amber-700 hover:bg-amber-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Reportar incidencia
                          </button>
                        )}

                        {isCreatingInc && resolved && (
                          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Nueva incidencia en {resolved.nombre}
                            </div>

                            {/* Apartamento */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Apartamento *</label>
                              {allApts.length > 0 ? (
                                <select
                                  value={incApartamento}
                                  onChange={(e) => setIncApartamento(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-slate-800"
                                >
                                  <option value="">Seleccionar apartamento</option>
                                  <option value="Zonas comunes">Zonas comunes</option>
                                  {allApts.map((apt) => (
                                    <option key={apt} value={apt}>{apt}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={incApartamento}
                                  onChange={(e) => setIncApartamento(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-slate-800"
                                  placeholder="Ej: Zonas comunes, Planta 2..."
                                />
                              )}
                            </div>

                            {/* Descripción */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción *</label>
                              <textarea
                                value={incDescripcion}
                                onChange={(e) => setIncDescripcion(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none bg-white text-slate-800"
                                placeholder="Describe el problema encontrado..."
                              />
                            </div>

                            {/* Urgencia */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Urgencia</label>
                              <div className="grid grid-cols-4 gap-1.5">
                                {URGENCIAS.map((urg) => (
                                  <button
                                    key={urg}
                                    type="button"
                                    onClick={() => setIncUrgencia(urg)}
                                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                                      incUrgencia === urg
                                        ? urg === "Urgente" ? "bg-red-500 text-white"
                                          : urg === "Alta" ? "bg-orange-500 text-white"
                                          : urg === "Media" ? "bg-amber-500 text-white"
                                          : "bg-emerald-500 text-white"
                                        : "bg-white border border-slate-200 text-slate-600"
                                    }`}
                                  >
                                    {urg}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCrearIncidencia(m)}
                                disabled={incSaving || !incApartamento || !incDescripcion}
                                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-all"
                              >
                                {incSaving ? (
                                  <span className="flex items-center justify-center gap-1">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creando...
                                  </span>
                                ) : "Crear incidencia"}
                              </button>
                              <button
                                onClick={() => setCreandoIncidencia(null)}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Complete whole building */}
                        {!isCompleting ? (
                          <button
                            onClick={() => { setCompletando(m.id); setNotasCompletar(""); }}
                            className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Marcar completado
                          </button>
                        ) : (
                          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 space-y-2">
                            <textarea
                              value={notasCompletar}
                              onChange={(e) => setNotasCompletar(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white text-slate-800"
                              placeholder="Notas de la revisión (opcional)..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCompletarEdificio(m.id)}
                                disabled={savingId === m.id}
                                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-all"
                              >
                                {savingId === m.id ? (
                                  <span className="flex items-center justify-center gap-1">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Guardando...
                                  </span>
                                ) : "Confirmar"}
                              </button>
                              <button
                                onClick={() => setCompletando(null)}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completed info */}
                    {m.estado === "Completado" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completado
                          {m.fechaUltimaInspeccion && ` el ${formatDate(m.fechaUltimaInspeccion)}`}
                          {m.fechaProgramada && (
                            <span className="text-slate-500 font-normal">
                              · Próxima: {formatDate(m.fechaProgramada)}
                            </span>
                          )}
                        </div>
                        {/* Reportar incidencia also available for completed tasks */}
                        {resolved && !isCreatingInc && (
                          <button
                            onClick={() => openCrearIncidencia(m.id)}
                            className="w-full py-2 rounded-xl text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Reportar incidencia encontrada
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
