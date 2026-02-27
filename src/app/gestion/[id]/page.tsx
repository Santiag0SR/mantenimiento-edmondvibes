import { redirect } from "next/navigation";
import { isGestionAuthenticated } from "@/lib/auth";
import { getIncidencia } from "@/lib/notion";
import IncidenciaDetail from "@/components/IncidenciaDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IncidenciaGestionPage({ params }: Props) {
  const authenticated = await isGestionAuthenticated();

  if (!authenticated) {
    redirect("/gestion");
  }

  const { id } = await params;
  const incidencia = await getIncidencia(id);

  if (!incidencia) {
    redirect("/gestion");
  }

  return (
    <main className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <IncidenciaDetail incidencia={incidencia} backUrl="/gestion" role="gestion" />
      </div>
    </main>
  );
}
