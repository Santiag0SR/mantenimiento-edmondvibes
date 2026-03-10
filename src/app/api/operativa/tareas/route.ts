import { NextResponse } from "next/server";
import { getProyectos, getRemindersForPerson, TEAM_MEMBERS } from "@/lib/operativa";

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
