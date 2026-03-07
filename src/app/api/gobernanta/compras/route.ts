import { NextResponse } from "next/server";
import {
  getSolicitudesCompras,
  createSolicitudCompra,
  updateSolicitudCompra,
} from "@/lib/gobernanta";
import type { SolicitudCompraInput } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const solicitante = searchParams.get("solicitante") || undefined;
    const jefesParam = searchParams.get("jefes") || undefined;
    const jefes = jefesParam ? jefesParam.split(",") : undefined;
    const compras = await getSolicitudesCompras({ solicitante, jefes });
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

export async function PATCH(request: Request) {
  try {
    const { id, estado, comentariosAprobacion, presupuestoAprobado } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Falta ID" }, { status: 400 });
    }
    await updateSolicitudCompra(id, { estado, comentariosAprobacion, presupuestoAprobado });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating solicitud:", error);
    return NextResponse.json(
      { error: "Error al actualizar solicitud" },
      { status: 500 }
    );
  }
}
