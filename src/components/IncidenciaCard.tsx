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
  Cancelada: { bg: "bg-stone-100", text: "text-stone-500", dot: "bg-stone-400" },
};

const urgenciaColors: Record<string, string> = {
  Baja: "bg-emerald-500",
  Media: "bg-amber-500",
  Alta: "bg-orange-500",
  Urgente: "bg-red-500",
};

const urgenciaBorderColors: Record<string, string> = {
  Baja: "border-l-emerald-400",
  Media: "border-l-amber-400",
  Alta: "border-l-orange-400",
  Urgente: "border-l-red-400",
};

const categoriaStyles: Record<string, string> = {
  "Turístico": "bg-indigo-50 text-indigo-600",
  "Corporativo": "bg-violet-50 text-violet-600",
  "Vitarooms": "bg-teal-50 text-teal-600",
};


export default function IncidenciaCard({ incidencia, basePath = "/admin" }: IncidenciaCardProps) {
  const estado = estadoConfig[incidencia.estado] || estadoConfig.Pendiente;
  const catStyle = categoriaStyles[incidencia.categoria] || "bg-stone-50 text-stone-500";

  return (
    <Link href={`${basePath}/${incidencia.id}`}>
      <div className={`bg-[var(--surface-raised)] rounded-2xl border border-[var(--border-light)] border-l-[3px] ${urgenciaBorderColors[incidencia.urgencia] || "border-l-stone-300"} p-4 hover:shadow-md hover:border-[var(--border)] transition-all cursor-pointer active:scale-[0.99]`}>
        {/* Top row: location + status */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgenciaColors[incidencia.urgencia] || "bg-stone-400"}`}
            />
            <span className="text-sm font-semibold text-[var(--text)]">
              {incidencia.edificio}
            </span>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="text-sm text-[var(--text-secondary)]">{incidencia.apartamento}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full flex-shrink-0 ${estado.bg}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
            <span className={`text-[11px] font-semibold ${estado.text}`}>
              {incidencia.estado}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed">
          {incidencia.descripcion}
        </p>

        {/* Footer: metadata */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium ${catStyle}`}>
            {incidencia.categoria}
          </span>
          {incidencia.fechaProgramada && (
            <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(incidencia.fechaProgramada)}{incidencia.horaProgramada ? ` ${incidencia.horaProgramada}` : ""}
            </span>
          )}
          {incidencia.tecnicoResponsable && (
            <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {incidencia.tecnicoResponsable}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
