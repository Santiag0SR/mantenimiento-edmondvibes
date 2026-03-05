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

// Tareas de gobernanta

export type EstadoTareaGobernanta = "Pendiente" | "Completada" | "No realizada";

export interface TareaGobernanta {
  id: string;
  tarea: string;
  edificio: string;
  dia: string;
  horaInicio: string;
  duracion: number;
  recurrente: boolean;
  estado: EstadoTareaGobernanta;
  fechaEspecifica?: string;
  notas?: string;
}

// Solicitudes de compras

export type EstadoCompra = "Pendiente" | "En revisión" | "Rechazado" | "Aprobado" | "Comprado";

export interface SolicitudCompra {
  id: string;
  solicitud: string;
  cantidad?: number;
  estado: EstadoCompra;
  urgencia: string;
  edificio: string[];
  fechaSolicitud?: string;
  fechaCompra?: string;
  fechaEntrega?: string;
  presupuestoEstimado?: number;
  presupuestoAprobado?: number;
  montoGastado?: number;
  links?: string;
  comentariosAprobacion?: string;
  solicitante?: string;
}

export interface SolicitudCompraInput {
  solicitud: string;
  cantidad?: number;
  urgencia: string;
  edificio: string[];
  presupuestoEstimado?: number;
  links?: string;
  solicitante?: string;
}
