"use client";

import { useState } from "react";
import { EDIFICIOS_POR_CATEGORIA, CATEGORIAS, URGENCIAS } from "@/lib/buildings";
import type { Urgencia, Categoria } from "@/lib/buildings";
import ImageUpload from "./ImageUpload";
import CustomSelect from "./CustomSelect";

const categoriaConfig: Record<string, { bgActive: string; border: string; text: string }> = {
  "Turístico": {
    bgActive: "bg-indigo-500",
    text: "text-indigo-700",
    border: "border-indigo-300",
  },
  "Corporativo": {
    bgActive: "bg-violet-500",
    text: "text-violet-700",
    border: "border-violet-300",
  },
  "Vitarooms": {
    bgActive: "bg-teal-500",
    text: "text-teal-700",
    border: "border-teal-300",
  },
};

export default function ReportForm() {
  const [categoria, setCategoria] = useState<Categoria | "">("");
  const [edificio, setEdificio] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [urgencia, setUrgencia] = useState<Urgencia>("Media");
  const [tecnicoAsignado, setTecnicoAsignado] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const edificios = categoria ? EDIFICIOS_POR_CATEGORIA[categoria] : {};
  const apartamentos = edificio ? edificios[edificio] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/incidencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria,
          edificio,
          apartamento,
          descripcion,
          urgencia,
          fotos,
          ...(categoria === "Vitarooms" && tecnicoAsignado ? { tecnicoAsignado } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar incidencia");
      }

      setSuccess(true);
      setCategoria("");
      setEdificio("");
      setApartamento("");
      setDescripcion("");
      setUrgencia("Media");
      setTecnicoAsignado("");
      setFotos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar incidencia");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">
          Incidencia reportada
        </h3>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Tu incidencia ha sido registrada correctamente.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="bg-[var(--primary)] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[var(--primary-light)] active:scale-[0.98] transition-all"
        >
          Reportar otra incidencia
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
          Categoria <span className="text-[var(--accent)]">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIAS.map((cat) => {
            const config = categoriaConfig[cat] || categoriaConfig["Turístico"];
            const isActive = categoria === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategoria(cat);
                  setEdificio("");
                  setApartamento("");
                  setTecnicoAsignado("");
                }}
                className={`py-3 px-3 rounded-xl text-sm font-semibold border active:scale-[0.97] transition-all ${
                  isActive
                    ? `${config.bgActive} border-transparent text-white`
                    : `bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)] hover:${config.border} hover:${config.text}`
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
          Edificio <span className="text-[var(--accent)]">*</span>
        </label>
        <CustomSelect
          value={edificio}
          onChange={(value) => {
            setEdificio(value);
            setApartamento("");
          }}
          options={Object.keys(edificios)}
          placeholder={categoria ? "Selecciona edificio" : "Selecciona categoria primero"}
          disabled={!categoria}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
          Apartamento <span className="text-[var(--accent)]">*</span>
        </label>
        <CustomSelect
          value={apartamento}
          onChange={setApartamento}
          options={apartamentos}
          placeholder="Selecciona apartamento"
          disabled={!edificio}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
          Descripcion del problema <span className="text-[var(--accent)]">*</span>
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          rows={4}
          placeholder="Describe el problema con detalle..."
          className="w-full px-4 py-3 text-base border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-none bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
          Urgencia <span className="text-[var(--accent)]">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {URGENCIAS.map((urg) => (
            <button
              key={urg}
              type="button"
              onClick={() => setUrgencia(urg)}
              className={`py-3 px-3 rounded-xl text-sm font-semibold border active:scale-[0.97] transition-all ${
                urgencia === urg
                  ? urg === "Urgente"
                    ? "bg-red-500 border-red-500 text-white"
                    : urg === "Alta"
                    ? "bg-orange-500 border-orange-500 text-white"
                    : urg === "Media"
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)] hover:border-stone-300"
              }`}
            >
              {urg}
            </button>
          ))}
        </div>
      </div>

      {categoria === "Vitarooms" && (
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
            Tecnico asignado
          </label>
          <div className="grid grid-cols-2 gap-2">
            {["Javier", "Otro"].map((tec) => (
              <button
                key={tec}
                type="button"
                onClick={() => setTecnicoAsignado(tecnicoAsignado === tec ? "" : tec)}
                className={`py-3 px-3 rounded-xl text-sm font-semibold border active:scale-[0.97] transition-all ${
                  tecnicoAsignado === tec
                    ? "bg-teal-500 border-teal-500 text-white"
                    : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)] hover:border-teal-300"
                }`}
              >
                {tec}
              </button>
            ))}
          </div>
        </div>
      )}

      <ImageUpload onImagesChange={setFotos} />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !categoria || !edificio || !apartamento || !descripcion}
        className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-semibold hover:bg-[var(--primary-light)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando...
          </span>
        ) : (
          "Enviar incidencia"
        )}
      </button>
    </form>
  );
}
