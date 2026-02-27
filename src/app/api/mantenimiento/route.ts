import { NextResponse } from "next/server";
import { getMantenimientos } from "@/lib/mantenimiento";

export async function GET() {
  try {
    const mantenimientos = await getMantenimientos();
    return NextResponse.json(mantenimientos);
  } catch (error) {
    console.error("Error fetching mantenimientos:", error);
    return NextResponse.json(
      { error: "Error al obtener mantenimientos" },
      { status: 500 }
    );
  }
}
