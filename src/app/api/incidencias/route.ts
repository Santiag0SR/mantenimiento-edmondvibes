import { NextResponse } from "next/server";
import { getIncidencias, createIncidencia } from "@/lib/notion";
import { sendIncidenciaNotification } from "@/lib/email";
import type { IncidenciaInput } from "@/types";

export async function GET(request: Request) {
  try {
    let incidencias = await getIncidencias();

    const { searchParams } = new URL(request.url);
    const tecnico = searchParams.get("tecnico");
    if (tecnico) {
      incidencias = incidencias.filter(
        (i) => i.tecnicoResponsable?.toLowerCase() === tecnico.toLowerCase()
      );
    }

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

    // Send email notification to Romina (non-blocking)
    sendIncidenciaNotification({
      edificio: body.edificio,
      apartamento: body.apartamento,
      descripcion: body.descripcion,
      urgencia: body.urgencia,
      categoria: body.categoria,
    }).catch((err) => console.error("Error sending notification email:", err));

    return NextResponse.json(incidencia, { status: 201 });
  } catch (error) {
    console.error("Error creating incidencia:", error);
    return NextResponse.json(
      { error: "Error al crear incidencia" },
      { status: 500 }
    );
  }
}
