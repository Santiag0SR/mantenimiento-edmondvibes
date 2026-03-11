"use client";

import { useState } from "react";

const TEAM_MEMBERS = [
  "Bruno Olmo",
  "Pablo",
  "Ricardo Collado",
  "Romina Natali",
  "Santiago SR",
];

const CATEGORIAS = ["Marketing", "Operaciones", "Mantenimiento", "Finanzas"];

interface NewTaskFormProps {
  currentUser: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function NewTaskForm({ currentUser, onClose, onCreated }: NewTaskFormProps) {
  const [tarea, setTarea] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<string[]>([]);
  const [fechaTope, setFechaTope] = useState("");
  const [encargados, setEncargados] = useState<string[]>([currentUser]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleCategoria = (cat: string) => {
    setCategoria((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleEncargado = (name: string) => {
    setEncargados((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarea.trim()) return;
    if (encargados.length === 0) {
      setError("Selecciona al menos un encargado");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/operativa/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tarea: tarea.trim(),
          descripcion: descripcion.trim() || undefined,
          categoria: categoria.length > 0 ? categoria : undefined,
          fechaTope: fechaTope || undefined,
          encargados,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear");
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear proyecto");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-bold text-stone-900">Nuevo proyecto</h2>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Tarea */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              Nombre del proyecto *
            </label>
            <input
              type="text"
              value={tarea}
              onChange={(e) => setTarea(e.target.value)}
              placeholder="Ej: Instalar cerraduras en Madera..."
              required
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-stone-50 text-stone-700 placeholder-stone-400 focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles del proyecto..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-stone-50 text-stone-700 placeholder-stone-400 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 resize-none"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              Categoría
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategoria(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    categoria.includes(cat)
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha tope */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              Fecha tope
            </label>
            <input
              type="date"
              value={fechaTope}
              onChange={(e) => setFechaTope(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-stone-50 text-stone-700 focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            />
          </div>

          {/* Encargados */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              Encargados *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TEAM_MEMBERS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleEncargado(name)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    encargados.includes(name)
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    encargados.includes(name) ? "bg-blue-500 text-white" : "bg-stone-200 text-stone-500"
                  }`}>
                    {name.charAt(0)}
                  </span>
                  {name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!tarea.trim() || submitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Creando..." : "Crear proyecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
