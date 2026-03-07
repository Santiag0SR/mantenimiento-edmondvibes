import Image from "next/image";
import { isAdministracionAuthenticated } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import LogoutButton from "@/components/LogoutButton";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdministracionPage() {
  const authenticated = await isAdministracionAuthenticated();

  if (!authenticated) {
    return <LoginForm panel="administracion" />;
  }

  return (
    <main className="min-h-screen">
      <div className="px-4 pt-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Image
              src="/LogoEdmond5.png"
              alt="EdmondVibes"
              width={220}
              height={72}
              className="h-14 sm:h-16 w-auto"
            />
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold rounded-full">
                Admin
              </span>
              <LogoutButton />
            </div>
          </div>
          <h1 className="text-lg font-semibold text-white">
            Administración
          </h1>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-t-3xl min-h-[calc(100vh-120px)] px-4 pt-5 pb-20">
        <div className="max-w-2xl mx-auto">
          <AdminPanel />
        </div>
      </div>
    </main>
  );
}
