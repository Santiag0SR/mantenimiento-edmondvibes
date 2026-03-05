import { NextResponse } from "next/server";
import { getTareasGobernanta, updateEstadoTarea } from "@/lib/gobernanta";
import type { EstadoTareaGobernanta } from "@/types";

export async function GET() {
  try {
    const tareas = await getTareasGobernanta();
    return NextResponse.json(tareas);
  } catch (error) {
    console.error("Error fetching tareas gobernanta:", error);
    return NextResponse.json(
      { error: "Error al obtener tareas" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, estado } = await request.json();
    if (!id || !estado) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }
    await updateEstadoTarea(id, estado as EstadoTareaGobernanta);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating tarea:", error);
    return NextResponse.json(
      { error: "Error al actualizar tarea" },
      { status: 500 }
    );
  }
}
