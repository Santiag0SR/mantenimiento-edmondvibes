import { Client } from "@notionhq/client";
import type { Mantenimiento, MantenimientoUpdate, EstadoMantenimiento } from "@/types";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID_MANTENIMIENTO!;

// Caché en memoria (30s TTL)
let mantenimientoCache: { data: Mantenimiento[]; timestamp: number } | null = null;
const CACHE_TTL = 30000;

function invalidateCache() {
  mantenimientoCache = null;
}

// Extraer título de cualquier propiedad tipo "title"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTitleFromPage(props: any): string {
  for (const key of Object.keys(props)) {
    if (props[key].type === "title") {
      return props[key].title?.[0]?.plain_text || "Sin título";
    }
  }
  return "Sin título";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotionToMantenimiento(page: any): Mantenimiento {
  const props = page.properties;

  return {
    id: page.id,
    tarea: getTitleFromPage(props),
    estado: (props["Estado"]?.status?.name || "Pendiente de programación") as EstadoMantenimiento,
    fechaUltimaInspeccion: props["Fecha de ultima inspeccion"]?.date?.start,
    fechaProgramada: props["Fecha programada"]?.date?.start,
    frecuenciaRevision: props["Frecuencia revision"]?.select?.name,
    tipo: props["Tipo"]?.select?.name,
    tecnico: props["Tecnico"]?.rich_text?.[0]?.plain_text || props["Tecnico"]?.select?.name,
    contacto: props["Contacto"]?.rich_text?.[0]?.plain_text,
    edificio: props["Edificio"]?.select?.name || props["Edificio"]?.rich_text?.[0]?.plain_text,
    apartamento: props["Apartamento"]?.rich_text?.[0]?.plain_text,
    notasEjecucion: props["Notas de ejecucion"]?.rich_text?.[0]?.plain_text,
    fotos: props["Fotos"]?.files?.map((f: { file?: { url: string }; external?: { url: string } }) => f.file?.url || f.external?.url) || [],
    apartamentosCompletados: props["Nro Apartamento"]?.rich_text?.[0]?.plain_text,
  };
}

export async function getMantenimientos(): Promise<Mantenimiento[]> {
  if (mantenimientoCache && Date.now() - mantenimientoCache.timestamp < CACHE_TTL) {
    return mantenimientoCache.data;
  }

  if (!databaseId) return [];

  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [
      {
        timestamp: "created_time",
        direction: "ascending",
      },
    ],
  });

  const data = response.results.map(mapNotionToMantenimiento);
  mantenimientoCache = { data, timestamp: Date.now() };
  return data;
}

export async function getMantenimiento(id: string): Promise<Mantenimiento | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    return mapNotionToMantenimiento(page);
  } catch {
    return null;
  }
}

// Calcular próxima fecha según frecuencia
function calcularProximaFecha(desde: string, frecuencia: string): string {
  const date = new Date(desde);
  switch (frecuencia) {
    case "Semanal":
      date.setDate(date.getDate() + 7);
      break;
    case "Mensual":
      date.setMonth(date.getMonth() + 1);
      break;
    case "Trimestral":
      date.setMonth(date.getMonth() + 3);
      break;
    case "Semestral":
      date.setMonth(date.getMonth() + 6);
      break;
    case "Anual":
      date.setFullYear(date.getFullYear() + 1);
      break;
    case "cada 5 años":
      date.setFullYear(date.getFullYear() + 5);
      break;
    default:
      date.setMonth(date.getMonth() + 3); // fallback trimestral
  }
  return date.toISOString().split("T")[0];
}

export async function updateMantenimiento(
  id: string,
  update: MantenimientoUpdate
): Promise<Mantenimiento> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any = {};

  if (update.estado) {
    properties["Estado"] = { status: { name: update.estado } };
  }
  if (update.fechaUltimaInspeccion) {
    properties["Fecha de ultima inspeccion"] = {
      date: { start: update.fechaUltimaInspeccion },
    };
  }
  if (update.fechaProgramada) {
    properties["Fecha programada"] = {
      date: { start: update.fechaProgramada.split("T")[0] },
    };
  }
  if (update.tecnico !== undefined) {
    properties["Tecnico"] = {
      rich_text: update.tecnico
        ? [{ text: { content: update.tecnico } }]
        : [],
    };
  }
  if (update.contacto !== undefined) {
    properties["Contacto"] = {
      rich_text: update.contacto
        ? [{ text: { content: update.contacto } }]
        : [],
    };
  }
  if (update.notasEjecucion !== undefined) {
    properties["Notas de ejecucion"] = {
      rich_text: update.notasEjecucion
        ? [{ text: { content: update.notasEjecucion } }]
        : [],
    };
  }
  if (update.apartamentosCompletados !== undefined) {
    properties["Nro Apartamento"] = {
      rich_text: update.apartamentosCompletados
        ? [{ text: { content: update.apartamentosCompletados } }]
        : [],
    };
  }
  if (update.fotos && update.fotos.length > 0) {
    const externalOnly = update.fotos.filter(
      (url) => !url.includes("prod-files-secure.notion") && !url.includes("s3.us-west-2.amazonaws.com/secure.notion")
    );
    if (externalOnly.length > 0) {
      properties["Fotos"] = {
        files: externalOnly.map((url) => ({
          type: "external",
          name: "Foto",
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
  return mapNotionToMantenimiento(page);
}

// Marcar como completado: actualiza estado, fecha última inspección, y auto-calcula próxima fecha
export async function completarMantenimiento(
  id: string,
  notasEjecucion?: string,
  fotos?: string[]
): Promise<Mantenimiento> {
  // Primero obtener el registro actual para saber la frecuencia
  const current = await getMantenimiento(id);
  const hoy = new Date().toISOString().split("T")[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any = {
    "Estado": { status: { name: "Completado" } },
    "Fecha de ultima inspeccion": { date: { start: hoy } },
  };

  // Auto-calcular próxima fecha programada si hay frecuencia
  if (current?.frecuenciaRevision) {
    const proximaFecha = calcularProximaFecha(hoy, current.frecuenciaRevision);
    properties["Fecha programada"] = { date: { start: proximaFecha } };
  }

  if (notasEjecucion) {
    properties["Notas de ejecucion"] = {
      rich_text: [{ text: { content: notasEjecucion } }],
    };
  }

  if (fotos && fotos.length > 0) {
    properties["Fotos"] = {
      files: fotos.map((url) => ({
        type: "external",
        name: "Foto",
        external: { url },
      })),
    };
  }

  const page = await notion.pages.update({
    page_id: id,
    properties,
  });

  invalidateCache();
  return mapNotionToMantenimiento(page);
}
