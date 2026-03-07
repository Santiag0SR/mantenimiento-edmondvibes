import { verifyToken } from "@/app/api/reporte/route";
import { getIncidencias } from "@/lib/notion";
import { getSolicitudesCompras } from "@/lib/gobernanta";
import ReportPage from "./ReportPage";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ReportePublicPage({ params }: Props) {
  const { token } = await params;
  const parsed = verifyToken(token);

  if (!parsed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-stone-800 mb-2">Enlace no válido</h1>
          <p className="text-sm text-stone-500">Este enlace de reporte ha expirado o no es válido.</p>
        </div>
      </div>
    );
  }

  const [incidencias, compras] = await Promise.all([
    getIncidencias(),
    getSolicitudesCompras({}),
  ]);

  return <ReportPage incidencias={incidencias} compras={compras} mes={parsed.mes} edificio={parsed.edificio} />;
}
