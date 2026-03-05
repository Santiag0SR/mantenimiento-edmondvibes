import { NextResponse } from "next/server";
import {
  getSolicitudesCompras,
  createSolicitudCompra,
} from "@/lib/gobernanta";
import type { SolicitudCompraInput } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const solicitante = searchParams.get("solicitante") || undefined;
    const compras = await getSolicitudesCompras(solicitante);
    return NextResponse.json(compras);
  } catch (error) {
    console.error("Error fetching compras:", error);
    return NextResponse.json(
      { error: "Error al obtener solicitudes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: SolicitudCompraInput = await request.json();
    if (!body.solicitud || !body.urgencia) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }
    const compra = await createSolicitudCompra(body);
    return NextResponse.json(compra, { status: 201 });
  } catch (error) {
    console.error("Error creating solicitud:", error);
    return NextResponse.json(
      { error: "Error al crear solicitud" },
      { status: 500 }
    );
  }
}
