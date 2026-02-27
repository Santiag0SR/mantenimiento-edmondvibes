import Image from "next/image";
import { isTecnicoAuthenticated } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import AutoRefreshWrapper from "@/components/AutoRefreshWrapper";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isTecnicoAuthenticated();

  if (!authenticated) {
    return <LoginForm panel="admin" />;
  }

  return (
    <main className="min-h-screen py-6 px-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Image
              src="/LogoEdmond.png"
              alt="EdmondVibes"
              width={200}
              height={65}
              className="h-14 sm:h-16 w-auto"
            />
            <LogoutButton />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Panel del Técnico
            </h1>
          </div>
        </div>

        <AutoRefreshWrapper />
      </div>
    </main>
  );
}
