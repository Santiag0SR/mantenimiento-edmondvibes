"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface LoginFormProps {
  panel?: "admin" | "gestion";
}

export default function LoginForm({ panel = "admin" }: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, panel }),
      });

      if (!res.ok) {
        throw new Error("Contraseña incorrecta");
      }

      // Prefetch: calentar caché del servidor mientras se recarga la página
      fetch("/api/incidencias");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-8">
            <Image
              src="/LogoEdmond.png"
              alt="EdmondVibes"
              width={260}
              height={85}
              className="h-20 sm:h-24 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            {panel === "gestion" ? "Panel de Gestión" : "Panel del Técnico"}
          </h1>
          <p className="text-slate-500">Introduce la contraseña para acceder</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-slate-800"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-red-700 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-slate-800 to-slate-700 text-white py-3 rounded-xl font-semibold hover:from-slate-700 hover:to-slate-600 disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-slate-800/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Accediendo...
              </span>
            ) : (
              "Acceder"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          <a href="/" className="text-amber-600 hover:text-amber-700 font-semibold hover:underline">
            ← Volver al inicio
          </a>
        </p>
        {panel === "admin" && (
          <p className="text-center text-xs text-slate-400 mt-2">
            ¿Eres administrador?{" "}
            <a href="/gestion" className="text-slate-500 hover:text-slate-700 hover:underline">
              Ir al panel de gestión
            </a>
          </p>
        )}
        {panel === "gestion" && (
          <p className="text-center text-xs text-slate-400 mt-2">
            ¿Eres técnico?{" "}
            <a href="/admin" className="text-slate-500 hover:text-slate-700 hover:underline">
              Ir al panel del técnico
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
