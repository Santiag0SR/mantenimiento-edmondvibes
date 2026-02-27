import Image from "next/image";
import ReportForm from "@/components/ReportForm";

export default function Home() {
  return (
    <main className="min-h-screen py-6 px-4 sm:py-10">
      <div className="max-w-lg mx-auto w-full">
        {/* Header con logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/LogoEdmond.png"
              alt="EdmondVibes"
              width={280}
              height={90}
              className="h-20 sm:h-24 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
            Reportar Incidencia
          </h1>
          <p className="text-slate-600">
            Completa el formulario para reportar un problema de mantenimiento
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 sm:p-7">
          <ReportForm />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            ¿Eres técnico?{" "}
            <a
              href="/admin"
              className="text-amber-600 hover:text-amber-700 font-semibold hover:underline"
            >
              Acceder al panel
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
