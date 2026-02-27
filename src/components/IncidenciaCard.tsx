import Link from "next/link";
import type { Incidencia } from "@/types";
import { formatDate } from "@/lib/dates";

interface IncidenciaCardProps {
  incidencia: Incidencia;
  basePath?: string;
}

const estadoConfig: Record<string, { bg: string; text: string; dot: string }> = {
  Pendiente: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "En proceso": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "Derivar a especialista": { bg: "bg-fuchsia-50", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  Completada: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Cancelada: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

const urgenciaColors: Record<string, string> = {
  Baja: "bg-emerald-500",
  Media: "bg-amber-500",
  Alta: "bg-orange-500",
  Urgente: "bg-red-500",
};

const urgenciaBorderColors: Record<string, string> = {
  Baja: "border-l-emerald-500",
  Media: "border-l-amber-500",
  Alta: "border-l-orange-500",
  Urgente: "border-l-red-500",
};

const categoriaStyles: Record<string, string> = {
  "Turístico": "bg-indigo-100 text-indigo-700",
  "Corporativo": "bg-violet-100 text-violet-700",
  "Vitarooms": "bg-teal-100 text-teal-700",
};


export default function IncidenciaCard({ incidencia, basePath = "/admin" }: IncidenciaCardProps) {
  const estado = estadoConfig[incidencia.estado] || estadoConfig.Pendiente;
  const catStyle = categoriaStyles[incidencia.categoria] || "bg-slate-100 text-slate-600";

  return (
    <Link href={`${basePath}/${incidencia.id}`}>
      <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${urgenciaBorderColors[incidencia.urgencia] || "border-l-slate-300"} p-4 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all cursor-pointer active:scale-[0.99]`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div
                className={`w-2 h-2 rounded-full ${urgenciaColors[incidencia.urgencia] || "bg-slate-400"}`}
              />
              <span className="font-semibold text-slate-800">
                {incidencia.edificio}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-medium text-slate-600">{incidencia.apartamento}</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${catStyle}`}>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
                {incidencia.categoria}
              </span>
            </div>

            {/* Descripción */}
            <p className="text-sm font-semibold text-slate-700 line-clamp-2 mb-3">
              {incidencia.descripcion}
            </p>

            {/* Footer */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {incidencia.fechaProgramada && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(incidencia.fechaProgramada)}{incidencia.horaProgramada ? ` ${incidencia.horaProgramada}` : ""}
                </span>
              )}
              {incidencia.tecnicoResponsable && (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {incidencia.tecnicoResponsable}
                </span>
              )}
            </div>
          </div>

          {/* Badge estado */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${estado.bg}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
            <span className={`text-xs font-semibold ${estado.text}`}>
              {incidencia.estado}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
