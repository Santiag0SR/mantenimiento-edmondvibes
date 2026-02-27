"use client";

import { useState } from "react";
import { EDIFICIOS_POR_CATEGORIA, CATEGORIAS, URGENCIAS } from "@/lib/buildings";
import type { Urgencia, Categoria } from "@/lib/buildings";
import ImageUpload from "./ImageUpload";
import CustomSelect from "./CustomSelect";

const categoriaConfig: Record<string, { bg: string; bgActive: string; text: string; border: string }> = {
  "Turístico": {
    bg: "bg-white",
    bgActive: "bg-indigo-500",
    text: "text-indigo-700",
    border: "border-indigo-300",
  },
  "Corporativo": {
    bg: "bg-white",
    bgActive: "bg-violet-500",
    text: "text-violet-700",
    border: "border-violet-300",
  },
  "Vitarooms": {
    bg: "bg-white",
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
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Incidencia reportada
        </h3>
        <p className="text-slate-600 mb-6">
          Tu incidencia ha sido registrada correctamente. Nos pondremos en contacto contigo pronto.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 active:scale-[0.98]"
        >
          Reportar otra incidencia
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Categoría */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Categoría <span className="text-amber-500">*</span>
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
                className={`py-3 px-3 rounded-xl text-sm font-semibold border-2 active:scale-[0.97] transition-all ${
                  isActive
                    ? `${config.bgActive} border-transparent text-white shadow-lg`
                    : `${config.bg} border-slate-200 text-slate-700 hover:${config.border} hover:${config.text}`
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Edificio */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Edificio <span className="text-amber-500">*</span>
        </label>
        <CustomSelect
          value={edificio}
          onChange={(value) => {
            setEdificio(value);
            setApartamento("");
          }}
          options={Object.keys(edificios)}
          placeholder={categoria ? "Selecciona edificio" : "Selecciona categoría primero"}
          disabled={!categoria}
        />
      </div>

      {/* Apartamento */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Apartamento <span className="text-amber-500">*</span>
        </label>
        <CustomSelect
          value={apartamento}
          onChange={setApartamento}
          options={apartamentos}
          placeholder="Selecciona apartamento"
          disabled={!edificio}
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Descripción del problema <span className="text-amber-500">*</span>
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          rows={4}
          placeholder="Describe el problema con detalle..."
          className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none bg-white text-slate-800 placeholder:text-slate-400"
        />
      </div>

      {/* Urgencia */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Urgencia <span className="text-amber-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {URGENCIAS.map((urg) => (
            <button
              key={urg}
              type="button"
              onClick={() => setUrgencia(urg)}
              className={`py-3 px-3 rounded-xl text-sm font-semibold border-2 active:scale-[0.97] ${
                urgencia === urg
                  ? urg === "Urgente"
                    ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30"
                    : urg === "Alta"
                    ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30"
                    : urg === "Media"
                    ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30"
                    : "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {urg}
            </button>
          ))}
        </div>
      </div>

      {/* Técnico (solo Vitarooms) */}
      {categoria === "Vitarooms" && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Técnico asignado
          </label>
          <div className="grid grid-cols-2 gap-2">
            {["Javier", "Otro"].map((tec) => (
              <button
                key={tec}
                type="button"
                onClick={() => setTecnicoAsignado(tecnicoAsignado === tec ? "" : tec)}
                className={`py-3 px-3 rounded-xl text-sm font-semibold border-2 active:scale-[0.97] transition-all ${
                  tecnicoAsignado === tec
                    ? "bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/30"
                    : "bg-white border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-700"
                }`}
              >
                {tec}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fotos */}
      <ImageUpload onImagesChange={setFotos} />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !categoria || !edificio || !apartamento || !descripcion}
        className="w-full bg-gradient-to-r from-slate-800 to-slate-700 text-white py-4 rounded-xl font-semibold hover:from-slate-700 hover:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-slate-800/20"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
