export interface ProyectoSemanal {
  id: string;
  tarea: string;
  estado: string;
  categoria: string[];
  encargados: { id: string; name: string }[];
  fechaInicio: string | null;
  fechaTope: string | null;
  descripcion: string;
  comentarios: string;
  infoExtra: string;
}

export interface TaskUpdate {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface TaskReminder {
  blockId: string;
  person: string;
  date: string;
  note: string;
}
