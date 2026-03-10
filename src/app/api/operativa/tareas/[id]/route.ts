import { NextResponse } from "next/server";
import { getProyecto, updateProyectoEstado } from "@/lib/operativa";

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
    const { estado } = await request.json();

    if (estado) {
      await updateProyectoEstado(id, estado);
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
