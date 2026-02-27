import { NextResponse } from "next/server";
import { getIncidencia, updateIncidencia } from "@/lib/notion";
import type { IncidenciaUpdate } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incidencia = await getIncidencia(id);

    if (!incidencia) {
      return NextResponse.json(
        { error: "Incidencia no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(incidencia);
  } catch (error) {
    console.error("Error fetching incidencia:", error);
    return NextResponse.json(
      { error: "Error al obtener incidencia" },
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
    const body: IncidenciaUpdate = await request.json();

    // Nunca reenviar facturas existentes — solo archivos nuevos de Vercel Blob
    if (body.facturas) {
      body.facturas = body.facturas.filter(
        (url) => url.includes("vercel-storage.com") || url.includes("blob.vercel-storage.com")
      );
      if (body.facturas.length === 0) {
        delete body.facturas;
      }
    }

    const incidencia = await updateIncidencia(id, body);
    return NextResponse.json(incidencia);
  } catch (error) {
    console.error("Error updating incidencia:", error);
    return NextResponse.json(
      { error: "Error al actualizar incidencia" },
      { status: 500 }
    );
  }
}
