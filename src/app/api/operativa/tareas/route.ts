import { NextResponse } from "next/server";
import { getProyectos, getRemindersForPerson, createProyecto, TEAM_MEMBERS } from "@/lib/operativa";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const persona = searchParams.get("persona");
    const includeReminders = searchParams.get("reminders") === "1";

    const notionId = persona ? TEAM_MEMBERS[persona] : undefined;
    const proyectos = await getProyectos(notionId);

    if (includeReminders && persona) {
      const taskIds = proyectos.map((p) => p.id);
      const reminders = await getRemindersForPerson(taskIds, persona);
      return NextResponse.json({ proyectos, reminders });
    }

    return NextResponse.json(proyectos);
  } catch (error) {
    console.error("Error fetching proyectos:", error);
    return NextResponse.json(
      { error: "Error al obtener proyectos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tarea, descripcion, categoria, fechaTope, encargados } = body;

    if (!tarea || !encargados || encargados.length === 0) {
      return NextResponse.json(
        { error: "Tarea y encargados son obligatorios" },
        { status: 400 }
      );
    }

    // Map names to Notion IDs
    const encargadoIds = (encargados as string[])
      .map((name: string) => TEAM_MEMBERS[name])
      .filter(Boolean);

    if (encargadoIds.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron encargados válidos" },
        { status: 400 }
      );
    }

    const proyecto = await createProyecto({
      tarea,
      descripcion,
      categoria,
      fechaTope,
      encargadoIds,
    });

    return NextResponse.json(proyecto);
  } catch (error) {
    console.error("Error creating proyecto:", error);
    return NextResponse.json(
      { error: "Error al crear proyecto" },
      { status: 500 }
    );
  }
}
