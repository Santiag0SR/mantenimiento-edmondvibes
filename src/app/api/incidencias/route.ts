import { NextResponse } from "next/server";
import { getIncidencias, createIncidencia } from "@/lib/notion";
import type { IncidenciaInput } from "@/types";

export async function GET() {
  try {
    const incidencias = await getIncidencias();
    return NextResponse.json(incidencias);
  } catch (error) {
    console.error("Error fetching incidencias:", error);
    return NextResponse.json(
      { error: "Error al obtener incidencias" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: IncidenciaInput = await request.json();

    // Validación básica
    if (!body.edificio || !body.apartamento || !body.descripcion || !body.urgencia || !body.categoria) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const incidencia = await createIncidencia(body);
    return NextResponse.json(incidencia, { status: 201 });
  } catch (error) {
    console.error("Error creating incidencia:", error);
    return NextResponse.json(
      { error: "Error al crear incidencia" },
      { status: 500 }
    );
  }
}
