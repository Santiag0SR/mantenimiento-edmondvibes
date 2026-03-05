import { Client } from "@notionhq/client";
import type {
  TareaGobernanta,
  EstadoTareaGobernanta,
  SolicitudCompra,
  EstadoCompra,
  SolicitudCompraInput,
} from "@/types";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const tareasDbId = process.env.NOTION_DATABASE_ID_TAREAS_GOBERNANTA!;
const comprasDbId = process.env.NOTION_DATABASE_ID_COMPRAS!;

// ── Tareas de gobernanta ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotionToTarea(page: any): TareaGobernanta {
  const props = page.properties;
  return {
    id: page.id,
    tarea: props["Tarea"]?.title?.[0]?.plain_text || "",
    edificio: props["Edificio"]?.select?.name || "",
    dia: props["Día"]?.select?.name || "",
    horaInicio: props["Hora inicio"]?.rich_text?.[0]?.plain_text || "",
    duracion: props["Duración (min)"]?.number || 0,
    recurrente: props["Recurrente"]?.checkbox ?? false,
    estado: (props["Estado"]?.select?.name || "Pendiente") as EstadoTareaGobernanta,
    fechaEspecifica: props["Fecha específica"]?.date?.start,
    notas: props["Notas"]?.rich_text?.[0]?.plain_text,
  };
}

export async function getTareasGobernanta(): Promise<TareaGobernanta[]> {
  const res = await notion.databases.query({
    database_id: tareasDbId,
    sorts: [{ property: "Hora inicio", direction: "ascending" }],
  });
  return res.results.map(mapNotionToTarea);
}

export async function updateEstadoTarea(
  id: string,
  estado: EstadoTareaGobernanta
): Promise<void> {
  await notion.pages.update({
    page_id: id,
    properties: {
      Estado: { select: { name: estado } },
    },
  });
}

// ── Solicitudes de compras ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotionToCompra(page: any): SolicitudCompra {
  const props = page.properties;
  return {
    id: page.id,
    solicitud: props["Solicitud"]?.title?.[0]?.plain_text || "",
    cantidad: props["cantidad"]?.number ?? undefined,
    estado: (props["Estado"]?.status?.name || "Pendiente") as EstadoCompra,
    urgencia: props["Urgencia"]?.select?.name || "Baja",
    edificio:
      props["Edificio"]?.multi_select?.map(
        (s: { name: string }) => s.name
      ) || [],
    fechaSolicitud: props["Fecha de solicitud"]?.date?.start,
    fechaCompra: props["Fecha de compra"]?.date?.start,
    fechaEntrega: props["fecha entrega"]?.date?.start,
    presupuestoEstimado: props["Presupuesto estimado"]?.number ?? undefined,
    presupuestoAprobado: props["Presupuesto aprobado"]?.number ?? undefined,
    montoGastado: props["Monto gastado"]?.number ?? undefined,
    links: props["Links"]?.url ?? undefined,
    comentariosAprobacion:
      props["Comentarios de aprobación"]?.rich_text?.[0]?.plain_text,
    solicitante:
      props["Empleado solicitante"]?.rich_text?.[0]?.plain_text,
  };
}

export async function getSolicitudesCompras(solicitante?: string): Promise<SolicitudCompra[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {
    database_id: comprasDbId,
    sorts: [{ property: "Fecha de solicitud", direction: "descending" }],
  };

  if (solicitante) {
    query.filter = {
      property: "Empleado solicitante",
      rich_text: { equals: solicitante },
    };
  }

  const res = await notion.databases.query(query);
  return res.results.map(mapNotionToCompra);
}

export async function createSolicitudCompra(
  input: SolicitudCompraInput
): Promise<SolicitudCompra> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any = {
    Solicitud: {
      title: [{ text: { content: input.solicitud } }],
    },
    Urgencia: {
      select: { name: input.urgencia },
    },
    Edificio: {
      multi_select: input.edificio.map((e) => ({ name: e })),
    },
    "Fecha de solicitud": {
      date: { start: new Date().toISOString().split("T")[0] },
    },
    "Empleado solicitante": {
      rich_text: [{ text: { content: input.solicitante || "Scarlett" } }],
    },
  };

  if (input.cantidad) {
    properties["cantidad"] = { number: input.cantidad };
  }
  if (input.presupuestoEstimado) {
    properties["Presupuesto estimado"] = {
      number: input.presupuestoEstimado,
    };
  }
  if (input.links) {
    properties["Links"] = { url: input.links };
  }

  const page = await notion.pages.create({
    parent: { database_id: comprasDbId },
    properties,
  });

  return mapNotionToCompra(page);
}
