import { Client } from "@notionhq/client";
import type { Incidencia, IncidenciaInput, IncidenciaUpdate } from "@/types";
import type { Estado, Urgencia, Categoria, Especialidad } from "./buildings";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Mapeo de categorías a database IDs
const databaseIds: Record<string, string> = {
  "Turístico": process.env.NOTION_DATABASE_ID!,
  "Corporativo": process.env.NOTION_DATABASE_ID_CORPORATIVO!,
  "Vitarooms": process.env.NOTION_DATABASE_ID_VITAROOMS!,
};

// Mapeo inverso: database ID -> categoría
const databaseIdToCategoria: Record<string, Categoria> = {};
for (const [cat, id] of Object.entries(databaseIds)) {
  if (id) {
    // Normalizar sin guiones para comparación
    databaseIdToCategoria[id.replace(/-/g, "")] = cat as Categoria;
  }
}

function getCategoriaFromDbId(dbId: string): Categoria {
  const normalized = dbId.replace(/-/g, "");
  return databaseIdToCategoria[normalized] || "Turístico";
}

// Mapear respuesta de Notion a nuestro tipo Incidencia
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotionToIncidencia(page: any): Incidencia {
  const props = page.properties;
  const parentDbId = page.parent?.database_id || "";

  return {
    id: page.id,
    titulo: props["Incidencia"]?.title?.[0]?.plain_text || "Sin título",
    edificio: props["Edificio"]?.select?.name || props["Edificio"]?.rich_text?.[0]?.plain_text || "",
    apartamento: props["Apartamento"]?.rich_text?.[0]?.plain_text || "",
    descripcion: props["Descripción"]?.rich_text?.[0]?.plain_text || "",
    urgencia: (props["Urgencia de reparación"]?.multi_select?.[0]?.name || "Media") as Urgencia,
    estado: (props["Estado"]?.status?.name || "Pendiente") as Estado,
    categoria: getCategoriaFromDbId(parentDbId),
    fotos: props["Fotos"]?.files?.map((f: { file?: { url: string }; external?: { url: string } }) => f.file?.url || f.external?.url) || [],
    fechaReporte: props["Fecha de Reporte"]?.date?.start || "",
    fechaReparacion: props["Fecha de Reparación"]?.date?.start,
    fechaProgramada: props["Fecha programada de reparacion"]?.date?.start,
    horaProgramada: props["Hora programada"]?.rich_text?.[0]?.plain_text,
    tecnicoResponsable: props["Técnico Responsable"]?.select?.name || props["Técnico Responsable"]?.rich_text?.[0]?.plain_text,
    tiempoReparacion: props["Tiempo de Reparación"]?.rich_text?.[0]?.plain_text,
    costoReparacion: props["Costo de Reparación"]?.number,
    sugerencias: props["Sugerencias"]?.rich_text?.[0]?.plain_text,
    contactoTecnico: props["Contacto técnico"]?.rich_text?.[0]?.plain_text,
    facturas: props["Factura correspondiente"]?.files?.map((f: { file?: { url: string }; external?: { url: string } }) => f.file?.url || f.external?.url) || [],
    especialidadRequerida: (props["Especialidad requerida"]?.select?.name || undefined) as Especialidad | undefined,
    notasJavier: props["Notas de Javier"]?.rich_text?.[0]?.plain_text,
    empresaExterna: props["Empresa/Tecnico externo"]?.rich_text?.[0]?.plain_text,
    contactoExterno: props["Contacto externo"]?.rich_text?.[0]?.plain_text,
    presupuestoExterno: props["Presupuesto externo"]?.number ?? undefined,
    presupuestoAprobado: props["Presupuesto aprobado"]?.checkbox ?? false,
  };
}

// Caché en memoria para getIncidencias (30s TTL)
let incidenciasCache: { data: Incidencia[]; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 segundos

function invalidateCache() {
  incidenciasCache = null;
}

// Obtener todas las incidencias de todas las bases de datos
export async function getIncidencias(): Promise<Incidencia[]> {
  // Devolver caché si está fresca
  if (incidenciasCache && Date.now() - incidenciasCache.timestamp < CACHE_TTL) {
    return incidenciasCache.data;
  }

  const activeDbIds = Object.values(databaseIds).filter(Boolean);

  const queries = activeDbIds.map((dbId) =>
    notion.databases.query({
      database_id: dbId,
      sorts: [
        {
          property: "Fecha de Reporte",
          direction: "descending",
        },
      ],
    })
  );

  const results = await Promise.all(queries);
  const all = results.flatMap((r) => r.results.map(mapNotionToIncidencia));

  // Ordenar por fecha más reciente
  const sorted = all.sort((a, b) => {
    const dateA = a.fechaReporte ? new Date(a.fechaReporte).getTime() : 0;
    const dateB = b.fechaReporte ? new Date(b.fechaReporte).getTime() : 0;
    return dateB - dateA;
  });

  // Guardar en caché
  incidenciasCache = { data: sorted, timestamp: Date.now() };

  return sorted;
}

// Obtener una incidencia por ID
export async function getIncidencia(id: string): Promise<Incidencia | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    return mapNotionToIncidencia(page);
  } catch {
    return null;
  }
}

// Crear nueva incidencia
export async function createIncidencia(input: IncidenciaInput): Promise<Incidencia> {
  const titulo = `${input.edificio} - ${input.apartamento} - ${new Date().toLocaleDateString("es-ES")}`;
  const dbId = databaseIds[input.categoria] || databaseIds["Turístico"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any = {
    "Incidencia": {
      title: [{ text: { content: titulo } }],
    },
    "Edificio": input.categoria === "Turístico"
      ? { select: { name: input.edificio } }
      : { rich_text: [{ text: { content: input.edificio } }] },
    "Apartamento": {
      rich_text: [{ text: { content: input.apartamento } }],
    },
    "Descripción": {
      rich_text: [{ text: { content: input.descripcion } }],
    },
    "Urgencia de reparación": {
      multi_select: [{ name: input.urgencia }],
    },
    "Estado": {
      status: { name: "Pendiente" },
    },
    "Fecha de Reporte": {
      date: { start: new Date().toISOString().split("T")[0] },
    },
  };

  // Agregar técnico responsable si se indica
  if (input.tecnicoAsignado) {
    properties["Técnico Responsable"] = {
      rich_text: [{ text: { content: input.tecnicoAsignado } }],
    };
  }

  // Agregar fotos si existen
  if (input.fotos && input.fotos.length > 0) {
    properties["Fotos"] = {
      files: input.fotos.map((url) => ({
        type: "external",
        name: "Foto",
        external: { url },
      })),
    };
  }

  const page = await notion.pages.create({
    parent: { database_id: dbId },
    properties,
  });

  invalidateCache();
  return mapNotionToIncidencia(page);
}

// Actualizar incidencia
export async function updateIncidencia(
  id: string,
  update: IncidenciaUpdate
): Promise<Incidencia> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any = {};

  if (update.estado) {
    properties["Estado"] = { status: { name: update.estado } };
  }
  if (update.fechaReparacion) {
    properties["Fecha de Reparación"] = { date: { start: update.fechaReparacion } };
  }
  if (update.fechaProgramada) {
    // Solo enviar la fecha (sin hora) para evitar conversiones de zona horaria
    const dateOnly = update.fechaProgramada.split("T")[0];
    properties["Fecha programada de reparacion"] = {
      date: { start: dateOnly },
    };
  }
  if (update.horaProgramada !== undefined) {
    properties["Hora programada"] = {
      rich_text: update.horaProgramada
        ? [{ text: { content: update.horaProgramada } }]
        : [],
    };
  }
  if (update.tecnicoResponsable) {
    properties["Técnico Responsable"] = {
      rich_text: [{ text: { content: update.tecnicoResponsable } }],
    };
  }
  if (update.tiempoReparacion) {
    properties["Tiempo de Reparación"] = {
      rich_text: [{ text: { content: update.tiempoReparacion } }],
    };
  }
  if (update.costoReparacion !== undefined) {
    properties["Costo de Reparación"] = { number: update.costoReparacion };
  }
  if (update.sugerencias) {
    properties["Sugerencias"] = {
      rich_text: [{ text: { content: update.sugerencias } }],
    };
  }
  if (update.contactoTecnico) {
    properties["Contacto técnico"] = {
      rich_text: [{ text: { content: update.contactoTecnico } }],
    };
  }
  if (update.especialidadRequerida) {
    properties["Especialidad requerida"] = {
      select: { name: update.especialidadRequerida },
    };
  }
  if (update.notasJavier !== undefined) {
    properties["Notas de Javier"] = {
      rich_text: update.notasJavier
        ? [{ text: { content: update.notasJavier } }]
        : [],
    };
  }
  if (update.empresaExterna !== undefined) {
    properties["Empresa/Tecnico externo"] = {
      rich_text: update.empresaExterna
        ? [{ text: { content: update.empresaExterna } }]
        : [],
    };
  }
  if (update.contactoExterno !== undefined) {
    properties["Contacto externo"] = {
      rich_text: update.contactoExterno
        ? [{ text: { content: update.contactoExterno } }]
        : [],
    };
  }
  if (update.presupuestoExterno !== undefined) {
    properties["Presupuesto externo"] = { number: update.presupuestoExterno };
  }
  if (update.presupuestoAprobado !== undefined) {
    properties["Presupuesto aprobado"] = { checkbox: update.presupuestoAprobado };
  }
  if (update.facturas && update.facturas.length > 0) {
    // Filtrar URLs internas de Notion (no se pueden reenviar como external)
    const externalOnly = update.facturas.filter(
      (url) => !url.includes("prod-files-secure.notion") && !url.includes("s3.us-west-2.amazonaws.com/secure.notion")
    );
    if (externalOnly.length > 0) {
      properties["Factura correspondiente"] = {
        files: externalOnly.map((url) => ({
          type: "external",
          name: "Factura",
          external: { url },
        })),
      };
    }
  }

  const page = await notion.pages.update({
    page_id: id,
    properties,
  });

  invalidateCache();
  return mapNotionToIncidencia(page);
}
