"use client";

import { useState, useEffect, useCallback } from "react";
import type { TareaGobernanta, SolicitudCompra, EstadoTareaGobernanta, SolicitudCompraInput } from "@/types";
import TareasCalendario from "./TareasCalendario";
import ComprasForm from "./ComprasForm";
import ReportForm from "./ReportForm";

type Tab = "tareas" | "incidencia" | "compras";

export default function GobernantaPanel() {
  const [tab, setTab] = useState<Tab>("tareas");
  const [tareas, setTareas] = useState<TareaGobernanta[] | null>(null);
  const [compras, setCompras] = useState<SolicitudCompra[] | null>(null);

  const fetchTareas = useCallback(async () => {
    try {
      const res = await fetch("/api/gobernanta/tareas");
      if (res.ok) setTareas(await res.json());
    } catch (e) {
      console.error("Error fetching tareas:", e);
    }
  }, []);

  const fetchCompras = useCallback(async () => {
    try {
      const res = await fetch("/api/gobernanta/compras?solicitante=Scarlett");
      if (res.ok) setCompras(await res.json());
    } catch (e) {
      console.error("Error fetching compras:", e);
    }
  }, []);

  useEffect(() => {
    fetchTareas();
    fetchCompras();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateEstado = async (id: string, estado: EstadoTareaGobernanta) => {
    setTareas((prev) =>
      prev ? prev.map((t) => (t.id === id ? { ...t, estado } : t)) : prev
    );
    try {
      const res = await fetch("/api/gobernanta/tareas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado }),
      });
      if (!res.ok) throw new Error();
    } catch {
      fetchTareas();
    }
  };

  const handleCrearCompra = async (input: SolicitudCompraInput) => {
    const res = await fetch("/api/gobernanta/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, solicitante: "Scarlett" }),
    });
    if (!res.ok) throw new Error();
    fetchCompras();
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "tareas",
      label: "Tareas",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: "incidencia",
      label: "Incidencia",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: "compras",
      label: "Compras",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="pb-20 pb-safe">
      <div className="animate-fadeIn">
        {tab === "tareas" && (
          tareas === null ? (
            <LoadingSkeleton />
          ) : (
            <TareasCalendario tareas={tareas} onUpdateEstado={handleUpdateEstado} />
          )
        )}

        {tab === "incidencia" && (
          <div>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 mb-4">
              <p className="text-xs text-rose-600">
                Reporta cualquier problema que encuentres al revisar los edificios.
              </p>
            </div>
            <ReportForm />
          </div>
        )}

        {tab === "compras" && (
          compras === null ? (
            <LoadingSkeleton />
          ) : (
            <ComprasForm compras={compras} onCrear={handleCrearCompra} />
          )
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-stone-200 pb-safe z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors min-w-[64px] ${
                tab === t.id
                  ? "text-rose-600 bg-rose-50"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {t.icon}
              <span className="text-[10px] font-medium leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-14 bg-stone-100 rounded-xl" />
        ))}
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-stone-50 rounded-2xl h-20" />
      ))}
    </div>
  );
}
