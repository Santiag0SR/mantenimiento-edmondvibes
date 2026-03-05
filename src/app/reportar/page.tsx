import Image from "next/image";
import ReportForm from "@/components/ReportForm";

export default function ReportarPage() {
  return (
    <main className="min-h-screen py-6 px-5 sm:py-10">
      <div className="max-w-lg mx-auto w-full">
        <div className="text-center mb-8">
          <a href="/" className="inline-block mb-6">
            <Image
              src="/LogoEdmond5.png"
              alt="EdmondVibes"
              width={320}
              height={104}
              className="h-20 sm:h-28 w-auto"
              priority
            />
          </a>
          <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1">
            Reportar Incidencia
          </h1>
          <p className="text-sm text-slate-400">
            Completa el formulario para reportar un problema
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-white/10 shadow-lg shadow-black/10 p-5 sm:p-7">
          <ReportForm />
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-[var(--accent)] transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </main>
  );
}
