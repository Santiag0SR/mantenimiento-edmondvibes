import type { Urgencia, Estado, Categoria, Especialidad } from "@/lib/buildings";

export interface Incidencia {
  id: string;
  titulo: string;
  edificio: string;
  apartamento: string;
  descripcion: string;
  urgencia: Urgencia;
  estado: Estado;
  categoria: Categoria;
  fotos: string[];
  fechaReporte: string;
  fechaReparacion?: string;
  fechaProgramada?: string;
  horaProgramada?: string;
  tecnicoResponsable?: string;
  tiempoReparacion?: string;
  costoReparacion?: number;
  sugerencias?: string;
  contactoTecnico?: string;
  facturas?: string[];
  especialidadRequerida?: Especialidad;
  notasJavier?: string;
  empresaExterna?: string;
  contactoExterno?: string;
  presupuestoExterno?: number;
  presupuestoAprobado?: boolean;
}

export interface IncidenciaInput {
  edificio: string;
  apartamento: string;
  descripcion: string;
  urgencia: Urgencia;
  categoria: Categoria;
  fotos?: string[];
  tecnicoAsignado?: string;
}

export interface IncidenciaUpdate {
  estado?: Estado;
  fechaReparacion?: string;
  fechaProgramada?: string;
  horaProgramada?: string;
  tecnicoResponsable?: string;
  tiempoReparacion?: string;
  costoReparacion?: number;
  sugerencias?: string;
  contactoTecnico?: string;
  facturas?: string[];
  especialidadRequerida?: Especialidad;
  notasJavier?: string;
  empresaExterna?: string;
  contactoExterno?: string;
  presupuestoExterno?: number;
  presupuestoAprobado?: boolean;
}

// Mantenimiento preventivo

export type EstadoMantenimiento =
  | "Pendiente de programación"
  | "Programado"
  | "En curso"
  | "Completado";

export interface Mantenimiento {
  id: string;
  tarea: string;
  estado: EstadoMantenimiento;
  fechaUltimaInspeccion?: string;
  fechaProgramada?: string;
  frecuenciaRevision?: string;
  tipo?: string;
  tecnico?: string;
  contacto?: string;
  edificio?: string;
  apartamento?: string;
  notasEjecucion?: string;
  fotos?: string[];
  apartamentosCompletados?: string;
}

export interface MantenimientoUpdate {
  estado?: EstadoMantenimiento;
  fechaUltimaInspeccion?: string;
  fechaProgramada?: string;
  tecnico?: string;
  contacto?: string;
  notasEjecucion?: string;
  fotos?: string[];
  apartamentosCompletados?: string;
}
