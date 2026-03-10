import { NextResponse } from "next/server";
import { getTaskUpdatesAndReminders, addTaskUpdate, setTaskReminder, removeTaskReminder } from "@/lib/operativa";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { updates, reminders } = await getTaskUpdatesAndReminders(id);
    return NextResponse.json({ updates, reminders });
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json(
      { error: "Error al obtener updates" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Handle reminder
    if (body.type === "reminder") {
      const { person, date, note } = body;
      if (!person) {
        return NextResponse.json({ error: "Persona obligatoria" }, { status: 400 });
      }
      if (date) {
        await setTaskReminder(id, person, date, note || "");
        // Also log as an update for the project timeline
        const dateFormatted = new Date(date).toLocaleDateString("es-ES");
        const updateText = note
          ? `📅 Recordatorio para ${dateFormatted}: ${note}`
          : `📅 Recordatorio puesto para ${dateFormatted}`;
        await addTaskUpdate(id, updateText, person);
      } else {
        await removeTaskReminder(id, person);
        await addTaskUpdate(id, "📅 Recordatorio eliminado", person);
      }
      return NextResponse.json({ success: true });
    }

    // Handle update
    const { text, author } = body;
    if (!text || !author) {
      return NextResponse.json(
        { error: "Texto y autor son obligatorios" },
        { status: 400 }
      );
    }

    await addTaskUpdate(id, text, author);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding update:", error);
    return NextResponse.json(
      { error: "Error al añadir update" },
      { status: 500 }
    );
  }
}
