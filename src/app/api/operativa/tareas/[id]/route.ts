import { NextResponse } from "next/server";
import { getProyecto, updateProyectoEstado, updateProyectoFechaTope, addTaskUpdate } from "@/lib/operativa";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proyecto = await getProyecto(id);
    return NextResponse.json(proyecto);
  } catch (error) {
    console.error("Error fetching proyecto:", error);
    return NextResponse.json(
      { error: "Error al obtener proyecto" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.estado) {
      await updateProyectoEstado(id, body.estado);
    }

    if (body.fechaTope !== undefined) {
      const oldFechaTope = body.oldFechaTope;
      await updateProyectoFechaTope(id, body.fechaTope || null);

      // Log the change as an update
      if (body.author) {
        const formatDate = (d: string) => new Date(d).toLocaleDateString("es-ES");
        const oldLabel = oldFechaTope ? formatDate(oldFechaTope) : "sin fecha";
        const newLabel = body.fechaTope ? formatDate(body.fechaTope) : "sin fecha";
        await addTaskUpdate(
          id,
          `Fecha tope cambiada: ${oldLabel} → ${newLabel}`,
          body.author
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating proyecto:", error);
    return NextResponse.json(
      { error: "Error al actualizar proyecto" },
      { status: 500 }
    );
  }
}
