"use client";

import { useState, useEffect, useCallback } from "react";
import type { Incidencia, Mantenimiento } from "@/types";
import AdminTabs from "./AdminTabs";

interface AutoRefreshWrapperProps {
  initialIncidencias?: Incidencia[] | null;
  showDashboard?: boolean;
  basePath?: string;
}

const REFRESH_INTERVAL = 30000; // 30 segundos

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Fake filter bar */}
      <div className="flex gap-2">
        <div className="h-10 w-24 bg-slate-200 rounded-xl" />
        <div className="h-10 w-24 bg-slate-200 rounded-xl" />
        <div className="h-10 w-24 bg-slate-200 rounded-xl" />
      </div>
      {/* Fake stat pills */}
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-slate-100 rounded-full" />
        <div className="h-8 w-20 bg-slate-100 rounded-full" />
        <div className="h-8 w-20 bg-slate-100 rounded-full" />
      </div>
      {/* Fake cards */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
          </div>
          <div className="h-4 w-60 bg-slate-100 rounded" />
          <div className="flex gap-2">
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AutoRefreshWrapper({
  initialIncidencias = null,
  showDashboard = false,
  basePath = "/admin",
}: AutoRefreshWrapperProps) {
  const [incidencias, setIncidencias] = useState<Incidencia[] | null>(initialIncidencias);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[] | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [incRes, mantRes] = await Promise.all([
        fetch("/api/incidencias"),
        fetch("/api/mantenimiento"),
      ]);
      if (incRes.ok) {
        setIncidencias(await incRes.json());
      }
      if (mantRes.ok) {
        setMantenimientos(await mantRes.json());
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for mantenimiento updates (from MantenimientoList)
  useEffect(() => {
    const handleUpdate = () => fetchAll();
    window.addEventListener("mantenimiento-updated", handleUpdate);
    return () => window.removeEventListener("mantenimiento-updated", handleUpdate);
  }, [fetchAll]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (document.visibilityState === "visible") {
        intervalId = setInterval(fetchAll, REFRESH_INTERVAL);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAll();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchAll]);

  const formatLastUpdate = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);

    if (diff < 5) return "ahora";
    if (diff < 60) return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
    return lastUpdate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  // Show skeleton while loading initial data
  if (!incidencias) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Indicador de última actualización - discreto */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <div className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
        <span>{isRefreshing ? "Actualizando..." : formatLastUpdate()}</span>
      </div>

      <AdminTabs
        incidencias={incidencias}
        mantenimientos={mantenimientos || []}
        showDashboard={showDashboard}
        basePath={basePath}
      />
    </div>
  );
}
