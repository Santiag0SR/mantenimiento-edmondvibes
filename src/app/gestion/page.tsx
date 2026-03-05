import Image from "next/image";
import { isGestionAuthenticated } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import AutoRefreshWrapper from "@/components/AutoRefreshWrapper";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function GestionPage() {
  const authenticated = await isGestionAuthenticated();

  if (!authenticated) {
    return <LoginForm panel="gestion" />;
  }

  return (
    <main className="min-h-screen">
      {/* Header on navy */}
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
              <span className="px-2.5 py-1 bg-[var(--accent)]/20 text-[var(--accent-light)] text-[11px] font-semibold rounded-full">
                Admin
              </span>
              <LogoutButton />
            </div>
          </div>
          <h1 className="text-lg font-semibold text-white">
            Gestión
          </h1>
        </div>
      </div>

      {/* Content on white */}
      <div className="bg-[var(--surface)] rounded-t-3xl min-h-[calc(100vh-120px)] px-4 pt-5 pb-20">
        <div className="max-w-2xl mx-auto">
          <AutoRefreshWrapper showDashboard={true} basePath="/gestion" />
        </div>
      </div>
    </main>
  );
}
