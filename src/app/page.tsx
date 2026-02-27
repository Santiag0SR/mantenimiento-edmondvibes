import Image from "next/image";
import Link from "next/link";

function WrenchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 4 4-10" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-10 animate-slideUp">
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
            Mantenimiento
          </h1>
          <p className="text-slate-500">
            Selecciona a dónde quieres acceder
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3 animate-slideUp" style={{ animationDelay: '0.1s' }}>

          {/* Reportar Incidencia */}
          <Link
            href="/reportar"
            className="group bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 flex items-center gap-4 hover:shadow-xl hover:border-amber-200 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
              <div className="text-amber-600">
                <AlertIcon />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">
                Reportar Incidencia
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Notificar un problema de mantenimiento
              </p>
            </div>
            <svg className="w-5 h-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Técnico */}
          <Link
            href="/admin"
            className="group bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 flex items-center gap-4 hover:shadow-xl hover:border-blue-200 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
              <div className="text-blue-600">
                <WrenchIcon />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                Técnico de Mantenimiento
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Gestionar incidencias y reparaciones
              </p>
            </div>
            <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Gestión */}
          <Link
            href="/gestion"
            className="group bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 flex items-center gap-4 hover:shadow-xl hover:border-violet-200 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
              <div className="text-violet-600">
                <ChartIcon />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
                Administración
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Supervisión, costes y métricas
              </p>
            </div>
            <svg className="w-5 h-5 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

        </div>

      </div>
    </main>
  );
}
