"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface LoginFormProps {
  panel?: "admin" | "gestion" | "gobernanta" | "administracion" | "operativa";
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

      fetch("/api/incidencias");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<string, string> = {
    admin: "Técnico",
    gestion: "Gestión Operativa",
    gobernanta: "Gobernanta",
    administracion: "Administración",
    operativa: "Agenda Operativa",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-8">
            <Image
              src="/LogoEdmond5.png"
              alt="EdmondVibes"
              width={320}
              height={104}
              className="h-20 sm:h-28 w-auto"
              priority
            />
          </div>
          <h1 className="text-xl font-semibold text-white mb-1">
            {titles[panel]}
          </h1>
          <p className="text-sm text-slate-400">Introduce tu contraseña</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-white/10 shadow-lg shadow-black/10 p-6 space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-stone-50 text-stone-900"
              placeholder="••••••••"
            />
          </div>

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
            disabled={loading}
            className="w-full bg-[var(--accent)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--accent-light)] disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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

        <p className="text-center text-xs text-slate-400 mt-6">
          <a href="/" className="text-[var(--accent)] hover:underline font-medium">
            Volver al inicio
          </a>
        </p>
        {panel === "admin" && (
          <p className="text-center text-[11px] text-slate-400 mt-2">
            ¿Eres administrador?{" "}
            <a href="/gestion" className="hover:underline">
              Acceder a gestión
            </a>
          </p>
        )}
        {panel === "gestion" && (
          <p className="text-center text-[11px] text-slate-400 mt-2">
            ¿Eres técnico?{" "}
            <a href="/admin" className="hover:underline">
              Acceder como técnico
            </a>
            {" · "}
            <a href="/administracion" className="hover:underline">
              Administración
            </a>
          </p>
        )}
        {panel === "administracion" && (
          <p className="text-center text-[11px] text-slate-400 mt-2">
            <a href="/gestion" className="hover:underline">
              Gestión operativa
            </a>
            {" · "}
            <a href="/admin" className="hover:underline">
              Técnico
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
