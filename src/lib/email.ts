import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Mantenimiento EdmondVibes <mantenimiento@edmondvibes.com>";

export async function sendIncidenciaNotification(incidencia: {
  edificio: string;
  apartamento: string;
  descripcion: string;
  urgencia: string;
  categoria: string;
}) {
  const to = process.env.EMAIL_ROMINA || "romina@edmondvibes.com";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Nueva incidencia: ${incidencia.edificio} - ${incidencia.apartamento}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1a1a1a; margin-bottom: 16px;">Nueva Incidencia Reportada</h2>
          <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Categoría</p>
            <p style="margin: 0 0 16px; font-weight: 600;">${incidencia.categoria}</p>
            <p style="margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Ubicación</p>
            <p style="margin: 0 0 16px; font-weight: 600;">${incidencia.edificio} — ${incidencia.apartamento}</p>
            <p style="margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Urgencia</p>
            <p style="margin: 0 0 16px; font-weight: 600; color: ${
              incidencia.urgencia === "Urgente" ? "#ef4444" :
              incidencia.urgencia === "Alta" ? "#f97316" :
              incidencia.urgencia === "Media" ? "#f59e0b" : "#22c55e"
            };">${incidencia.urgencia}</p>
            <p style="margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Descripción</p>
            <p style="margin: 0; color: #333;">${incidencia.descripcion}</p>
          </div>
          <p style="color: #999; font-size: 11px;">Este email se ha enviado automáticamente desde el sistema de mantenimiento.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending incidencia email:", error);
  }
}

export async function sendResumenCompras(compras: {
  solicitud: string;
  estado: string;
  urgencia: string;
  edificio: string[];
  presupuestoEstimado?: number;
  solicitante?: string;
  fechaSolicitud?: string;
}[]) {
  const to = process.env.EMAIL_JAIME || "jaime@edmondvibes.com";

  if (compras.length === 0) return;

  const comprasHtml = compras.map((c) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-weight: 500;">${c.solicitud}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${c.estado}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${c.urgencia}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${c.edificio.join(", ") || "—"}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${c.presupuestoEstimado ? `${c.presupuestoEstimado}€` : "—"}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${c.solicitante || "—"}</td>
    </tr>
  `).join("");

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Resumen de compras pendientes — ${new Date().toLocaleDateString("es-ES")}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Resumen de Solicitudes de Compra</h2>
          <p style="color: #666; margin-bottom: 20px;">${compras.length} solicitud${compras.length !== 1 ? "es" : ""} asignada${compras.length !== 1 ? "s" : ""} a ti.</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f8f8f8;">
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Solicitud</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Estado</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Urgencia</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Edificio</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Presup.</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Solicitante</th>
              </tr>
            </thead>
            <tbody>
              ${comprasHtml}
            </tbody>
          </table>
          <p style="color: #999; font-size: 11px; margin-top: 20px;">Este email se ha enviado automáticamente desde el sistema de mantenimiento.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending compras summary email:", error);
  }
}
