import { NextResponse } from "next/server";
import { getSolicitudesCompras } from "@/lib/gobernanta";
import { sendResumenCompras } from "@/lib/email";

export async function GET(request: Request) {
  // Verify cron secret (Vercel Cron sends this header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get compras assigned to Jaime that are not yet completed
    const compras = await getSolicitudesCompras({ jefes: ["Jaime"] });

    const pendientes = compras.filter(
      (c) => c.estado !== "Comprado" && c.estado !== "Rechazado"
    );

    if (pendientes.length > 0) {
      await sendResumenCompras(pendientes);
    }

    return NextResponse.json({
      success: true,
      sent: pendientes.length > 0,
      count: pendientes.length,
    });
  } catch (error) {
    console.error("Error in compras cron:", error);
    return NextResponse.json({ error: "Error processing cron" }, { status: 500 });
  }
}
