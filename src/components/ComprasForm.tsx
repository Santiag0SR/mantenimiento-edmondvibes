"use client";

import { useState } from "react";
import type { SolicitudCompra, SolicitudCompraInput } from "@/types";

const EDIFICIOS_COMPRAS = [
  "ABADA",
  "Juan Bravo",
  "GMC",
  "ANDRES OBISPO",
  "MADERA",
  "VILLANUEVA",
  "FOMENTO",
  "CONDE DE VILCHES",
  "Mantenimiento",
];

const URGENCIAS_COMPRA = ["Baja", "Media", "Alta"];

const estadoColors: Record<string, string> = {
  Pendiente: "bg-amber-50 text-amber-700",
  "En revisión": "bg-blue-50 text-blue-700",
  Rechazado: "bg-red-50 text-red-600",
  Aprobado: "bg-emerald-50 text-emerald-700",
  Comprado: "bg-stone-50 text-stone-500",
};

interface ComprasFormProps {
  compras: SolicitudCompra[];
  onCrear: (input: SolicitudCompraInput) => Promise<void>;
  showSolicitante?: boolean;
}

export default function ComprasForm({ compras, onCrear, showSolicitante = false }: ComprasFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [solicitud, setSolicitud] = useState("");
  const [cantidad, setCantidad] = useState<number | "">("");
  const [urgencia, setUrgencia] = useState("Media");
  const [edificio, setEdificio] = useState<string[]>([]);
  const [presupuesto, setPresupuesto] = useState<number | "">("");
  const [links, setLinks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onCrear({
        solicitud,
        cantidad: cantidad || undefined,
        urgencia,
        edificio,
        presupuestoEstimado: presupuesto || undefined,
        links: links || undefined,
      });
      setSolicitud("");
      setCantidad("");
      setUrgencia("Media");
      setEdificio([]);
      setPresupuesto("");
      setLinks("");
      setShowForm(false);
    } catch {
      setError("Error al crear solicitud");
    } finally {
      setLoading(false);
    }
  };

  const toggleEdificio = (ed: string) => {
    setEdificio((prev) =>
      prev.includes(ed) ? prev.filter((e) => e !== ed) : [...prev, ed]
    );
  };

  return (
    <div className="space-y-4">
      {/* New request button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--primary-light)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
        </svg>
        {showForm ? "Cancelar" : "Nueva solicitud de compra"}
      </button>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--surface-raised)] rounded-2xl border border-[var(--border-light)] p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Producto / Material <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={solicitud}
              onChange={(e) => setSolicitud(e.target.value)}
              required
              placeholder="Ej: Detergente para pisos"
              className="w-full px-4 py-3 text-base border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : "")}
                min={1}
                placeholder="Uds"
                className="w-full px-4 py-3 text-base border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Presupuesto est.</label>
              <input
                type="number"
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value ? Number(e.target.value) : "")}
                min={0}
                step={0.01}
                placeholder="0.00 EUR"
                className="w-full px-4 py-3 text-base border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Urgencia <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {URGENCIAS_COMPRA.map((urg) => (
                <button
                  key={urg}
                  type="button"
                  onClick={() => setUrgencia(urg)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    urgencia === urg
                      ? urg === "Alta"
                        ? "bg-red-500 border-red-500 text-white"
                        : urg === "Media"
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {urg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Edificio</label>
            <div className="flex flex-wrap gap-1.5">
              {EDIFICIOS_COMPRAS.map((ed) => (
                <button
                  key={ed}
                  type="button"
                  onClick={() => toggleEdificio(ed)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                    edificio.includes(ed)
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-stone-300"
                  }`}
                >
                  {ed}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Link (referencia)</label>
            <input
              type="url"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 text-base border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !solicitud}
            className="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--primary-light)] disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>
      )}

      {/* Request list */}
      <div className="space-y-2">
        {compras.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">
            No hay solicitudes de compras
          </div>
        ) : (
          compras.map((c) => (
            <div
              key={c.id}
              className="bg-[var(--surface-raised)] rounded-2xl border border-[var(--border-light)] p-3.5 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium text-[var(--text)]">{c.solicitud}</h4>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    estadoColors[c.estado] || "bg-stone-50 text-stone-500"
                  }`}
                >
                  {c.estado}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
                {showSolicitante && c.solicitante && (
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">
                    {c.solicitante}
                  </span>
                )}
                {c.cantidad && <span>Cant: {c.cantidad}</span>}
                {c.edificio.length > 0 && (
                  <span>{c.edificio.join(", ")}</span>
                )}
                {c.presupuestoEstimado && (
                  <span>~{c.presupuestoEstimado}EUR</span>
                )}
                {c.fechaSolicitud && (
                  <span>
                    {new Date(c.fechaSolicitud).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
              {c.comentariosAprobacion && (
                <p className="text-[11px] text-[var(--text-muted)] italic bg-stone-50 rounded-lg p-2">
                  {c.comentariosAprobacion}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
