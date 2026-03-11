import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = "a08fdfa9-38a0-4c47-97dc-1e9f1bdc1dce";

// Mapeo de nombres a IDs de Notion People
export const TEAM_MEMBERS: Record<string, string> = {
  "Bruno Olmo": "206d872b-594c-81d8-a297-00029dbadbc7",
  "Pablo": "16fd872b-594c-81c6-aff7-000259d7a1fc",
  "Ricardo Collado": "2bed872b-594c-8181-9fba-0002d16c240d",
  "Romina Natali": "2c4d872b-594c-81aa-bd51-0002f70b0559",
  "Santiago SR": "1e4d872b-594c-81d1-a948-00023e2e9cfa",
};

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
  updatesCount?: number;
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

const REMINDER_PREFIX = "📅 RECORDATORIO";

function extractText(richText: Array<{ plain_text: string }>): string {
  return richText.map((t) => t.plain_text).join("");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToProyecto(page: any): ProyectoSemanal {
  const props = page.properties;
  return {
    id: page.id,
    tarea: props["Tarea"]?.title?.map((t: { plain_text: string }) => t.plain_text).join("") || "",
    estado: props["Estado"]?.select?.name || "",
    categoria: props["Categoría"]?.multi_select?.map((s: { name: string }) => s.name) || [],
    encargados: props["Encargado "]?.people?.map((p: { id: string; name: string }) => ({
      id: p.id,
      name: p.name || "Sin nombre",
    })) || [],
    fechaInicio: props["Fecha inicio"]?.date?.start || null,
    fechaTope: props["Fecha tope"]?.date?.start || null,
    descripcion: extractText(props["Descripción"]?.rich_text || []),
    comentarios: extractText(props["Comentarios"]?.rich_text || []),
    infoExtra: extractText(props["Info extra"]?.rich_text || []),
  };
}

export async function getRemindersForPerson(taskIds: string[], person: string): Promise<Record<string, { date: string; note: string }>> {
  const remindersMap: Record<string, { date: string; note: string }> = {};

  // Fetch blocks for all tasks in parallel (batched)
  const results = await Promise.all(
    taskIds.map(async (taskId) => {
      try {
        const response = await notion.blocks.children.list({
          block_id: taskId,
          page_size: 100,
        });
        for (const block of response.results) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const b = block as any;
          if (b.type === "bulleted_list_item") {
            const text = extractText(b.bulleted_list_item.rich_text || []);
            if (text.startsWith(REMINDER_PREFIX)) {
              // Format: "📅 RECORDATORIO | Person | Date | Note (optional)"
              const parts = text.split(" | ");
              if (parts.length >= 3 && parts[1].trim() === person) {
                return { taskId, date: parts[2].trim(), note: parts.slice(3).join(" | ").trim() };
              }
            }
          }
        }
      } catch {
        // Skip tasks that fail
      }
      return null;
    })
  );

  for (const result of results) {
    if (result) {
      remindersMap[result.taskId] = { date: result.date, note: result.note };
    }
  }
  return remindersMap;
}

export async function getProyectos(personNotionId?: string): Promise<ProyectoSemanal[]> {
  const filter: Record<string, unknown> = personNotionId
    ? {
        property: "Encargado ",
        people: { contains: personNotionId },
      }
    : {};

  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: personNotionId ? filter as Parameters<typeof notion.databases.query>[0]["filter"] : undefined,
    sorts: [
      { property: "Fecha tope", direction: "ascending" },
    ],
  });

  return response.results.map(pageToProyecto);
}

export interface CreateProyectoInput {
  tarea: string;
  descripcion?: string;
  categoria?: string[];
  fechaTope?: string;
  encargadoIds: string[];
}

export async function createProyecto(input: CreateProyectoInput): Promise<ProyectoSemanal> {
  const properties: Record<string, unknown> = {
    Tarea: {
      title: [{ text: { content: input.tarea } }],
    },
    Estado: {
      select: { name: "Pendiente" },
    },
    "Fecha inicio": {
      date: { start: new Date().toISOString().split("T")[0] },
    },
    "Encargado ": {
      people: input.encargadoIds.map((id) => ({ id })),
    },
  };

  if (input.descripcion) {
    properties["Descripción"] = {
      rich_text: [{ text: { content: input.descripcion } }],
    };
  }

  if (input.categoria && input.categoria.length > 0) {
    properties["Categoría"] = {
      multi_select: input.categoria.map((name) => ({ name })),
    };
  }

  if (input.fechaTope) {
    properties["Fecha tope"] = {
      date: { start: input.fechaTope },
    };
  }

  const page = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: properties as Parameters<typeof notion.pages.create>[0]["properties"],
  });

  return pageToProyecto(page);
}

export async function getProyecto(id: string): Promise<ProyectoSemanal> {
  const page = await notion.pages.retrieve({ page_id: id });
  return pageToProyecto(page);
}

export async function updateProyectoEstado(id: string, estado: string): Promise<void> {
  await notion.pages.update({
    page_id: id,
    properties: {
      Estado: {
        select: { name: estado },
      },
    },
  });
}

export async function getTaskUpdatesAndReminders(pageId: string): Promise<{
  updates: TaskUpdate[];
  reminders: TaskReminder[];
}> {
  const response = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });

  const updates: TaskUpdate[] = [];
  const reminders: TaskReminder[] = [];

  for (const block of response.results) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = block as any;
    if (b.type === "bulleted_list_item") {
      const text = extractText(b.bulleted_list_item.rich_text || []);

      if (text.startsWith(REMINDER_PREFIX)) {
        // Parse: "📅 RECORDATORIO | Person | Date | Note (optional)"
        const parts = text.split(" | ");
        if (parts.length >= 3) {
          reminders.push({
            blockId: b.id,
            person: parts[1].trim(),
            date: parts[2].trim(),
            note: parts.slice(3).join(" | ").trim(),
          });
        }
      } else {
        updates.push({
          id: b.id,
          text,
          author: "",
          createdAt: b.created_time,
        });
      }
    }
  }
  return { updates, reminders };
}

export async function setTaskReminder(pageId: string, person: string, date: string, note?: string): Promise<void> {
  // First, find and delete existing reminder for this person
  const { reminders } = await getTaskUpdatesAndReminders(pageId);
  const existing = reminders.find((r) => r.person === person);
  if (existing) {
    await notion.blocks.delete({ block_id: existing.blockId });
  }

  // Add new reminder block
  if (date) {
    const content = note
      ? `${REMINDER_PREFIX} | ${person} | ${date} | ${note}`
      : `${REMINDER_PREFIX} | ${person} | ${date}`;

    await notion.blocks.children.append({
      block_id: pageId,
      children: [
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: { content },
              },
            ],
          },
        },
      ],
    });
  }
}

export async function removeTaskReminder(pageId: string, person: string): Promise<void> {
  const { reminders } = await getTaskUpdatesAndReminders(pageId);
  const existing = reminders.find((r) => r.person === person);
  if (existing) {
    await notion.blocks.delete({ block_id: existing.blockId });
  }
}

export async function addTaskUpdate(pageId: string, text: string, author: string): Promise<void> {
  const now = new Date().toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  await notion.blocks.children.append({
    block_id: pageId,
    children: [
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              type: "text",
              text: { content: `${author} · ${now}\n${text}` },
            },
          ],
        },
      },
    ],
  });
}
