"use client";

import { useState } from "react";
import Link from "next/link";
import type { Incidencia } from "@/types";
import { ESTADOS, ESPECIALIDADES } from "@/lib/buildings";
import ImageGallery from "./ImageGallery";
import FileUpload from "./FileUpload";
import CustomSelect from "./CustomSelect";
import type { Estado, Especialidad } from "@/lib/buildings";
import { formatDate } from "@/lib/dates";

interface IncidenciaDetailProps {
  incidencia: Incidencia;
  backUrl?: string;
  role?: "tecnico" | "gestion";
}

const categoriaStyles: Record<string, string> = {
  "Turístico": "bg-indigo-400/20 text-indigo-200",
  "Corporativo": "bg-violet-400/20 text-violet-200",
  "Vitarooms": "bg-teal-400/20 text-teal-200",
};

const urgenciaConfig: Record<string, { bg: string; text: string; border: string }> = {
  Baja: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Media: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Alta: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Urgente: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const estadoStyles: Record<string, { active: string; inactive: string }> = {
  Pendiente: {
    active: "bg-amber-500 text-white shadow-lg shadow-amber-500/30",
    inactive: "bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700",
  },
  "En proceso": {
    active: "bg-blue-500 text-white shadow-lg shadow-blue-500/30",
    inactive: "bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700",
  },
  "Derivar a especialista": {
    active: "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30",
    inactive: "bg-slate-100 text-slate-600 hover:bg-fuchsia-100 hover:text-fuchsia-700",
  },
  Completada: {
    active: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
    inactive: "bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700",
  },
  Cancelada: {
    active: "bg-slate-500 text-white shadow-lg shadow-slate-500/30",
    inactive: "bg-slate-100 text-slate-600 hover:bg-slate-200",
  },
};

export default function IncidenciaDetail({ incidencia, backUrl = "/admin", role = "tecnico" }: IncidenciaDetailProps) {
  const isGestion = role === "gestion";
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [estado, setEstado] = useState<Estado>(incidencia.estado);
  const [fechaReparacion, setFechaReparacion] = useState(incidencia.fechaReparacion || "");
  const [fechaProgramada, setFechaProgramada] = useState(
    incidencia.fechaProgramada ? incidencia.fechaProgramada.split("T")[0] : ""
  );
  const [horaProgramada, setHoraProgramada] = useState(incidencia.horaProgramada || "");
  const [tecnicoResponsable, setTecnicoResponsable] = useState(incidencia.tecnicoResponsable || "");
  const [tiempoReparacion, setTiempoReparacion] = useState(incidencia.tiempoReparacion || "");
  const [costoReparacion, setCostoReparacion] = useState(incidencia.costoReparacion?.toString() || "");
  const [sugerencias, setSugerencias] = useState(incidencia.sugerencias || "");
  const [contactoTecnico, setContactoTecnico] = useState(incidencia.contactoTecnico || "");
  const [facturas, setFacturas] = useState<string[]>(incidencia.facturas || []);
  const [especialidadRequerida, setEspecialidadRequerida] = useState<Especialidad | "">(incidencia.especialidadRequerida || "");
  const [notasJavier, setNotasJavier] = useState(incidencia.notasJavier || "");
  const [empresaExterna, setEmpresaExterna] = useState(incidencia.empresaExterna || "");
  const [contactoExterno, setContactoExterno] = useState(incidencia.contactoExterno || "");
  const [presupuestoExterno, setPresupuestoExterno] = useState(incidencia.presupuestoExterno?.toString() || "");
  const [presupuestoAprobado, setPresupuestoAprobado] = useState(incidencia.presupuestoAprobado || false);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/incidencias/${incidencia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado,
          fechaReparacion: fechaReparacion || undefined,
          fechaProgramada: fechaProgramada || undefined,
          horaProgramada: horaProgramada || "",
          tecnicoResponsable: tecnicoResponsable || undefined,
          tiempoReparacion: tiempoReparacion || undefined,
          costoReparacion: costoReparacion ? parseFloat(costoReparacion) : undefined,
          sugerencias: sugerencias || undefined,
          contactoTecnico: contactoTecnico || undefined,
          especialidadRequerida: especialidadRequerida || undefined,
          notasJavier: notasJavier || undefined,
          empresaExterna: empresaExterna || undefined,
          contactoExterno: contactoExterno || undefined,
          presupuestoExterno: presupuestoExterno ? parseFloat(presupuestoExterno) : undefined,
          presupuestoAprobado,
          facturas: JSON.stringify(facturas) !== JSON.stringify(incidencia.facturas || [])
            ? (facturas.length > 0 ? facturas : undefined)
            : undefined,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setLoading(false);
    }
  };

  const urgencia = urgenciaConfig[incidencia.urgencia] || urgenciaConfig.Media;

  // Generar opciones de hora (cada 5 minutos)
  const horaOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const hora = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      horaOptions.push(hora);
    }
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header con navegación */}
      <div className="flex items-center gap-3">
        <Link
          href={backUrl}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Volver</span>
        </Link>
      </div>

      {/* Info de la incidencia */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Cabecera con ubicación */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4">
          <div className="flex items-center gap-2 text-slate-300 text-sm mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {incidencia.edificio} • {incidencia.apartamento}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${categoriaStyles[incidencia.categoria] || "bg-slate-400/20 text-slate-300"}`}>
              {incidencia.categoria}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {incidencia.titulo}
          </h2>
        </div>

        <div className="p-5 space-y-4">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Reportado: {formatDate(incidencia.fechaReporte)}
            </div>
            {incidencia.fechaProgramada && (
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Programada: {formatDate(incidencia.fechaProgramada)}{incidencia.horaProgramada ? ` ${incidencia.horaProgramada}` : ""}
              </div>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${urgencia.bg} ${urgencia.text} ${urgencia.border}`}>
              <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
              {incidencia.urgencia}
            </span>
          </div>

          {/* Descripción */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Descripción
            </div>
            <p className="text-slate-600 leading-relaxed">{incidencia.descripcion}</p>
          </div>

          {/* Fotos */}
          {incidencia.fotos && incidencia.fotos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fotos ({incidencia.fotos.length})
              </div>
              <ImageGallery images={incidencia.fotos} />
            </div>
          )}
        </div>
      </div>

      {/* Formulario de actualización */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Actualizar incidencia
          </h3>
        </div>

        <div className="p-5 space-y-5">
          {/* Estado */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Estado
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ESTADOS.map((est) => {
                const styles = estadoStyles[est] || estadoStyles.Pendiente;
                const isActive = estado === est;
                const isDerivacion = est === "Derivar a especialista";
                return (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setEstado(est)}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                      isDerivacion ? "col-span-2" : ""
                    } ${isActive ? styles.active : styles.inactive}`}
                  >
                    {isDerivacion && (
                      <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414" />
                      </svg>
                    )}
                    {est}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección derivación a especialista */}
          {(estado === "Derivar a especialista" || especialidadRequerida) && (
            <div className="bg-fuchsia-50 rounded-xl p-4 border border-fuchsia-200 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414" />
                </svg>
                Derivación a especialista
              </div>

              {/* Especialidad requerida */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Especialidad requerida
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ESPECIALIDADES.map((esp) => (
                    <button
                      key={esp}
                      type="button"
                      onClick={() => setEspecialidadRequerida(especialidadRequerida === esp ? "" : esp)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                        especialidadRequerida === esp
                          ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30"
                          : "bg-white border-2 border-slate-200 text-slate-600 hover:border-fuchsia-300 hover:text-fuchsia-700"
                      }`}
                    >
                      {esp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas de Javier */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notas de Javier
                </label>
                <textarea
                  value={notasJavier}
                  onChange={(e) => setNotasJavier(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 resize-none bg-white text-slate-800 transition-colors"
                  placeholder="Diagnóstico y observaciones..."
                />
              </div>

              {/* Empresa/Técnico externo + Contacto */}
              {isGestion ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Empresa/Tecnico externo
                      </label>
                      <input
                        type="text"
                        value={empresaExterna}
                        onChange={(e) => setEmpresaExterna(e.target.value)}
                        className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-white text-slate-800 transition-colors"
                        placeholder="Nombre empresa o técnico"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Contacto externo
                      </label>
                      <input
                        type="text"
                        value={contactoExterno}
                        onChange={(e) => setContactoExterno(e.target.value)}
                        className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-white text-slate-800 transition-colors"
                        placeholder="Teléfono o email"
                      />
                    </div>
                  </div>

                  {/* Presupuesto externo + Aprobado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Presupuesto externo
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={presupuestoExterno}
                          onChange={(e) => setPresupuestoExterno(e.target.value)}
                          className="w-full px-4 py-3 pr-10 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-white text-slate-800 transition-colors"
                          placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <span className="text-slate-400 font-medium">€</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setPresupuestoAprobado(!presupuestoAprobado)}
                        className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          presupuestoAprobado
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-white border-2 border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={presupuestoAprobado ? "M5 13l4 4L19 7" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                        </svg>
                        {presupuestoAprobado ? "Presupuesto aprobado" : "Aprobar presupuesto"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Vista solo lectura para técnico: empresa, contacto, presupuesto */
                (empresaExterna || presupuestoExterno) && (
                  <div className="bg-white rounded-xl p-3 border border-fuchsia-100 space-y-2">
                    {empresaExterna && (
                      <div className="flex items-center gap-2 text-sm text-fuchsia-700">
                        <span className="font-medium">Empresa:</span> {empresaExterna}
                      </div>
                    )}
                    {contactoExterno && (
                      <div className="flex items-center gap-2 text-sm text-fuchsia-700">
                        <span className="font-medium">Contacto:</span> {contactoExterno}
                      </div>
                    )}
                    {presupuestoExterno && (
                      <div className="flex items-center gap-2 text-sm text-fuchsia-700">
                        <span className="font-medium">Presupuesto:</span> {presupuestoExterno}€
                        {presupuestoAprobado && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Aprobado
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* Fecha programada, hora y técnico — editable solo para gestión */}
          {isGestion ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Fecha programada
                  </label>
                  <input
                    type="date"
                    value={fechaProgramada}
                    onChange={(e) => setFechaProgramada(e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-slate-800 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Hora programada
                  </label>
                  <CustomSelect
                    value={horaProgramada}
                    onChange={setHoraProgramada}
                    options={horaOptions}
                    placeholder="Seleccionar hora"
                    allowClear
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Técnico responsable
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={tecnicoResponsable}
                    onChange={(e) => setTecnicoResponsable(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-slate-800 transition-colors"
                    placeholder="Nombre del técnico"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Vista solo lectura para el técnico */
            (fechaProgramada || tecnicoResponsable) && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Asignación
                </div>
                {incidencia.fechaProgramada && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Programada:</span> {formatDate(incidencia.fechaProgramada)}{incidencia.horaProgramada ? ` ${incidencia.horaProgramada}` : ""}
                  </div>
                )}
                {tecnicoResponsable && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Técnico:</span> {tecnicoResponsable}
                  </div>
                )}
              </div>
            )
          )}

          {/* Fecha de reparación completada */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha de reparación completada
            </label>
            <input
              type="date"
              value={fechaReparacion}
              onChange={(e) => setFechaReparacion(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-slate-800 transition-colors"
            />
          </div>

          {/* Tiempo y costo en grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tiempo de reparación
              </label>
              <CustomSelect
                value={tiempoReparacion ? `${tiempoReparacion} min` : ""}
                onChange={(val) => setTiempoReparacion(val.replace(" min", ""))}
                options={Array.from({ length: 48 }, (_, i) => `${(i + 1) * 5} min`)}
                placeholder="Seleccionar tiempo"
                allowClear
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Costo de reparación
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={costoReparacion}
                  onChange={(e) => setCostoReparacion(e.target.value)}
                  className="w-full px-4 py-3 pr-10 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-slate-800 transition-colors"
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-medium">€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Facturas */}
          <FileUpload
            files={facturas}
            onFilesChange={setFacturas}
            label="Facturas"
            accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
          />

          {/* Contacto técnico */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Contacto técnico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                type="text"
                value={contactoTecnico}
                onChange={(e) => setContactoTecnico(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-slate-800 transition-colors"
                placeholder="Teléfono o email"
              />
            </div>
          </div>

          {/* Sugerencias */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notas / Sugerencias
            </label>
            <textarea
              value={sugerencias}
              onChange={(e) => setSugerencias(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none bg-white text-slate-800 transition-colors"
              placeholder="Notas adicionales sobre la reparación..."
            />
          </div>

          {/* Botón guardar */}
          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98] ${
              saved
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-gradient-to-r from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600 shadow-lg shadow-slate-800/20"
            } disabled:opacity-50`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </span>
            ) : saved ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardado
              </span>
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
