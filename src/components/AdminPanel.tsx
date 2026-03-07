"use client";

import { useState, useEffect, useCallback } from "react";
import type { Incidencia, SolicitudCompra, EstadoCompra } from "@/types";
import DashboardView from "./DashboardView";

type View = "dashboard" | "compras";

const JEFES = ["Jaime", "Santiago", "Pablo"];

const estadoColors: Record<string, string> = {
  Pendiente: "bg-amber-50 text-amber-700",
  "En revisión": "bg-blue-50 text-blue-700",
  Rechazado: "bg-red-50 text-red-600",
  Aprobado: "bg-emerald-50 text-emerald-700",
  Comprado: "bg-stone-50 text-stone-500",
};

const ESTADOS_COMPRA: EstadoCompra[] = ["Pendiente", "En revisión", "Aprobado", "Rechazado", "Comprado"];

export default function AdminPanel() {
  const [view, setView] = useState<View>("dashboard");
  const [incidencias, setIncidencias] = useState<Incidencia[] | null>(null);
  const [compras, setCompras] = useState<SolicitudCompra[] | null>(null);
  const [allCompras, setAllCompras] = useState<SolicitudCompra[] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [comentario, setComentario] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const [incRes, comprasJefesRes, allComprasRes] = await Promise.all([
        fetch("/api/incidencias"),
        fetch(`/api/gobernanta/compras?jefes=${JEFES.join(",")}`),
        fetch("/api/gobernanta/compras"),
      ]);
      if (incRes.ok) setIncidencias(await incRes.json());
      if (comprasJefesRes.ok) setCompras(await comprasJefesRes.json());
      if (allComprasRes.ok) setAllCompras(await allComprasRes.json());
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateEstado = async (id: string, estado: EstadoCompra) => {
    setUpdatingId(id);
    try {
      const body: Record<string, unknown> = { id, estado };
      const comment = comentario[id];
      if (comment) {
        body.comentariosAprobacion = comment;
      }
      await fetch("/api/gobernanta/compras", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setComentario((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      fetchData();
    } catch (error) {
      console.error("Error updating compra:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="pb-20 pb-safe">
      {/* View switcher */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView("dashboard")}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
            view === "dashboard"
              ? "bg-emerald-600 text-white"
              : "bg-[var(--surface-raised)] border border-[var(--border-light)] text-[var(--text-secondary)]"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setView("compras")}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all relative ${
            view === "compras"
              ? "bg-emerald-600 text-white"
              : "bg-[var(--surface-raised)] border border-[var(--border-light)] text-[var(--text-secondary)]"
          }`}
        >
          Compras
          {compras && compras.filter((c) => c.estado === "Pendiente" || c.estado === "En revisión").length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
              {compras.filter((c) => c.estado === "Pendiente" || c.estado === "En revisión").length}
            </span>
          )}
        </button>
      </div>

      {view === "dashboard" && (
        <div className="animate-fadeIn">
          {incidencias ? (
            <DashboardView incidencias={incidencias} compras={allCompras || []} />
          ) : (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-stone-100 rounded-2xl h-24" />
              ))}
            </div>
          )}
        </div>
      )}

      {view === "compras" && (
        <div className="animate-fadeIn space-y-3">
          {!compras ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-stone-100 rounded-2xl h-24" />
              ))}
            </div>
          ) : compras.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-muted)] text-sm">
              No hay solicitudes de compras asignadas
            </div>
          ) : (
            compras.map((c) => {
              const needsDecision = c.estado === "Pendiente" || c.estado === "En revisión";
              return (
                <div
                  key={c.id}
                  className={`bg-[var(--surface-raised)] rounded-2xl border overflow-hidden ${
                    needsDecision ? "border-amber-200 border-l-[3px] border-l-amber-400" : "border-[var(--border-light)]"
                  }`}
                >
                  {/* Header */}
                  <div className="p-4 pb-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-[var(--text)] leading-tight">{c.solicitud}</h4>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                          estadoColors[c.estado] || "bg-stone-50 text-stone-500"
                        }`}
                      >
                        {c.estado}
                      </span>
                    </div>

                    {/* Detail grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-stone-50 rounded-lg p-2.5">
                        <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wide">Solicitante</span>
                        <div className="font-semibold text-[var(--text-secondary)] mt-0.5">{c.solicitante || "—"}</div>
                      </div>
                      <div className="bg-stone-50 rounded-lg p-2.5">
                        <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wide">Responsable</span>
                        <div className="font-semibold text-emerald-700 mt-0.5">{c.responsableAprobacion || "—"}</div>
                      </div>
                      {c.cantidad && (
                        <div className="bg-stone-50 rounded-lg p-2.5">
                          <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wide">Cantidad</span>
                          <div className="font-semibold text-[var(--text-secondary)] mt-0.5">{c.cantidad} uds</div>
                        </div>
                      )}
                      <div className="bg-stone-50 rounded-lg p-2.5">
                        <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wide">Urgencia</span>
                        <div className={`font-semibold mt-0.5 ${
                          c.urgencia === "Alta" ? "text-red-600" : c.urgencia === "Media" ? "text-amber-600" : "text-emerald-600"
                        }`}>{c.urgencia}</div>
                      </div>
                      {c.edificio.length > 0 && (
                        <div className="bg-stone-50 rounded-lg p-2.5">
                          <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wide">Edificio</span>
                          <div className="font-semibold text-[var(--text-secondary)] mt-0.5">{c.edificio.join(", ")}</div>
                        </div>
                      )}
                      <div className="bg-stone-50 rounded-lg p-2.5">
                        <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wide">Presup. estimado</span>
                        <div className="font-semibold text-[var(--text-secondary)] mt-0.5">
                          {c.presupuestoEstimado ? `${c.presupuestoEstimado.toLocaleString("es-ES")}€` : "—"}
                        </div>
                      </div>
                      {c.presupuestoAprobado !== undefined && c.presupuestoAprobado !== null && (
                        <div className="bg-emerald-50 rounded-lg p-2.5">
                          <span className="text-emerald-600 text-[10px] uppercase tracking-wide">Presup. aprobado</span>
                          <div className="font-semibold text-emerald-700 mt-0.5">{c.presupuestoAprobado.toLocaleString("es-ES")}€</div>
                        </div>
                      )}
                      {c.fechaSolicitud && (
                        <div className="bg-stone-50 rounded-lg p-2.5">
                          <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wide">Fecha solicitud</span>
                          <div className="font-semibold text-[var(--text-secondary)] mt-0.5">
                            {new Date(c.fechaSolicitud).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                      )}
                      {c.fechaCompra && (
                        <div className="bg-stone-50 rounded-lg p-2.5">
                          <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wide">Fecha compra</span>
                          <div className="font-semibold text-[var(--text-secondary)] mt-0.5">
                            {new Date(c.fechaCompra).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                      )}
                      {c.montoGastado !== undefined && c.montoGastado !== null && (
                        <div className="bg-stone-50 rounded-lg p-2.5">
                          <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wide">Monto gastado</span>
                          <div className="font-semibold text-[var(--text-secondary)] mt-0.5">{c.montoGastado.toLocaleString("es-ES")}€</div>
                        </div>
                      )}
                    </div>

                    {/* Link */}
                    {c.links && (
                      <a
                        href={c.links}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mb-3"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Ver referencia / producto
                      </a>
                    )}

                    {/* Previous comments */}
                    {c.comentariosAprobacion && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 mb-3">
                        <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Comentario previo</span>
                        <p className="text-xs text-amber-800 mt-0.5">{c.comentariosAprobacion}</p>
                      </div>
                    )}
                  </div>

                  {/* Decision section */}
                  {c.estado !== "Comprado" && c.estado !== "Rechazado" && (
                    <div className="bg-stone-50 border-t border-[var(--border-light)] p-4 space-y-3">
                      <textarea
                        placeholder="Añadir comentario o motivo..."
                        value={comentario[c.id] || ""}
                        onChange={(e) => setComentario((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 text-xs border border-[var(--border)] rounded-lg bg-white text-[var(--text)] resize-none placeholder:text-stone-400"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateEstado(c.id, "Aprobado")}
                          disabled={updatingId === c.id}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleUpdateEstado(c.id, "Rechazado")}
                          disabled={updatingId === c.id}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Rechazar
                        </button>
                      </div>
                      {c.estado !== "En revisión" && (
                        <button
                          onClick={() => handleUpdateEstado(c.id, "En revisión")}
                          disabled={updatingId === c.id}
                          className="w-full py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all disabled:opacity-50"
                        >
                          Marcar en revisión
                        </button>
                      )}
                    </div>
                  )}

                  {/* Already decided - allow changing to Comprado */}
                  {c.estado === "Aprobado" && (
                    <div className="bg-emerald-50 border-t border-emerald-100 p-3">
                      <button
                        onClick={() => handleUpdateEstado(c.id, "Comprado")}
                        disabled={updatingId === c.id}
                        className="w-full py-2 rounded-lg text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-all disabled:opacity-50"
                      >
                        Marcar como comprado
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
