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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [comentario, setComentario] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const [incRes, comprasRes] = await Promise.all([
        fetch("/api/incidencias"),
        fetch(`/api/gobernanta/compras?jefes=${JEFES.join(",")}`),
      ]);
      if (incRes.ok) setIncidencias(await incRes.json());
      if (comprasRes.ok) setCompras(await comprasRes.json());
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
            <DashboardView incidencias={incidencias} />
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
            compras.map((c) => (
              <div
                key={c.id}
                className="bg-[var(--surface-raised)] rounded-2xl border border-[var(--border-light)] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[var(--text)]">{c.solicitud}</h4>
                    {c.responsableAprobacion && (
                      <span className="text-[11px] text-emerald-600 font-medium">
                        Jefe: {c.responsableAprobacion}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      estadoColors[c.estado] || "bg-stone-50 text-stone-500"
                    }`}
                  >
                    {c.estado}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
                  {c.solicitante && (
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">
                      {c.solicitante}
                    </span>
                  )}
                  {c.cantidad && <span>Cant: {c.cantidad}</span>}
                  {c.edificio.length > 0 && <span>{c.edificio.join(", ")}</span>}
                  {c.presupuestoEstimado && <span>~{c.presupuestoEstimado}€</span>}
                  {c.fechaSolicitud && (
                    <span>
                      {new Date(c.fechaSolicitud).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                  {c.links && (
                    <a
                      href={c.links}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      Ver enlace
                    </a>
                  )}
                </div>

                {c.comentariosAprobacion && (
                  <p className="text-[11px] text-[var(--text-muted)] italic bg-stone-50 rounded-lg p-2">
                    {c.comentariosAprobacion}
                  </p>
                )}

                {/* Approval actions */}
                {c.estado !== "Comprado" && (
                  <div className="space-y-2 pt-1 border-t border-[var(--border-light)]">
                    <input
                      type="text"
                      placeholder="Comentario (opcional)"
                      value={comentario[c.id] || ""}
                      onChange={(e) => setComentario((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)]"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {ESTADOS_COMPRA.filter((e) => e !== c.estado).map((est) => (
                        <button
                          key={est}
                          onClick={() => handleUpdateEstado(c.id, est)}
                          disabled={updatingId === c.id}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 ${
                            est === "Aprobado"
                              ? "bg-emerald-500 text-white hover:bg-emerald-600"
                              : est === "Rechazado"
                              ? "bg-red-500 text-white hover:bg-red-600"
                              : estadoColors[est] || "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {est}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
