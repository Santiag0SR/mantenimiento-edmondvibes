import { NextResponse } from "next/server";
import { getMantenimiento, updateMantenimiento, completarMantenimiento } from "@/lib/mantenimiento";
import type { MantenimientoUpdate } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mantenimiento = await getMantenimiento(id);

    if (!mantenimiento) {
      return NextResponse.json(
        { error: "Mantenimiento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(mantenimiento);
  } catch (error) {
    console.error("Error fetching mantenimiento:", error);
    return NextResponse.json(
      { error: "Error al obtener mantenimiento" },
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

    // Si viene con action: "completar", usar la función especial
    if (body.action === "completar") {
      const mantenimiento = await completarMantenimiento(
        id,
        body.notasEjecucion,
        body.fotos
      );
      return NextResponse.json(mantenimiento);
    }

    const update: MantenimientoUpdate = body;
    const mantenimiento = await updateMantenimiento(id, update);
    return NextResponse.json(mantenimiento);
  } catch (error) {
    console.error("Error updating mantenimiento:", error);
    return NextResponse.json(
      { error: "Error al actualizar mantenimiento" },
      { status: 500 }
    );
  }
}
