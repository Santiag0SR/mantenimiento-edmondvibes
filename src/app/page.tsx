import Image from "next/image";
import Link from "next/link";

const panels = [
  {
    href: "/reportar",
    title: "Reportar Incidencia",
    subtitle: "Notificar un problema en un inmueble",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    accent: "from-amber-600 to-orange-600",
    hoverBorder: "hover:border-stone-300",
  },
  {
    href: "/admin",
    title: "Técnico",
    subtitle: "Incidencias, preventivo y reparaciones",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    accent: "from-stone-700 to-stone-900",
    hoverBorder: "hover:border-stone-300",
  },
  {
    href: "/gestion",
    title: "Gestión Operativa",
    subtitle: "Supervisión y seguimiento",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-8 4 4 4-10" />
      </svg>
    ),
    accent: "from-[#b8956a] to-[#9a7a54]",
    hoverBorder: "hover:border-[#d4b896]",
  },
  {
    href: "/administracion",
    title: "Administración",
    subtitle: "Estadísticas, costes y aprobaciones",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    accent: "from-emerald-600 to-teal-600",
    hoverBorder: "hover:border-emerald-200",
  },
  {
    href: "/gobernanta",
    title: "Gobernanta",
    subtitle: "Planificación, limpieza y compras",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    accent: "from-rose-500 to-pink-600",
    hoverBorder: "hover:border-rose-200",
  },
  {
    href: "/operativa",
    title: "Agenda Operativa",
    subtitle: "Proyectos semanales y seguimiento",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
    accent: "from-blue-500 to-cyan-600",
    hoverBorder: "hover:border-blue-200",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="flex justify-center mb-8">
            <Image
              src="/LogoEdmond5.png"
              alt="EdmondVibes"
              width={320}
              height={104}
              className="h-20 sm:h-28 w-auto"
              priority
            />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white mb-1">
            Operativa
          </h1>
          <p className="text-sm text-slate-400">
            Selecciona tu panel
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3 animate-slideUp">
          {panels.map((panel) => (
            <Link
              key={panel.href}
              href={panel.href}
              className={`group bg-white rounded-2xl border border-white/10 p-4 flex items-center gap-4 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 active:scale-[0.98] transition-all`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${panel.accent} flex items-center justify-center flex-shrink-0 text-white shadow-sm`}>
                {panel.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-stone-900">
                  {panel.title}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {panel.subtitle}
                </p>
              </div>
              <svg className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
