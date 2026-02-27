import { redirect } from "next/navigation";
import { isTecnicoAuthenticated } from "@/lib/auth";
import { getIncidencia } from "@/lib/notion";
import IncidenciaDetail from "@/components/IncidenciaDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IncidenciaPage({ params }: Props) {
  const authenticated = await isTecnicoAuthenticated();

  if (!authenticated) {
    redirect("/admin");
  }

  const { id } = await params;
  const incidencia = await getIncidencia(id);

  if (!incidencia) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <IncidenciaDetail incidencia={incidencia} backUrl="/admin" />
      </div>
    </main>
  );
}
