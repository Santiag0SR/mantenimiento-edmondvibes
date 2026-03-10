import Image from "next/image";
import { isOperativaAuthenticated } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import LogoutButton from "@/components/LogoutButton";
import OperativaPanel from "@/components/OperativaPanel";

export const dynamic = "force-dynamic";

export default async function OperativaPage() {
  const authenticated = await isOperativaAuthenticated();

  if (!authenticated) {
    return <LoginForm panel="operativa" />;
  }

  return (
    <main className="min-h-screen">
      <div className="px-4 pt-6 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Image
              src="/LogoEdmond5.png"
              alt="EdmondVibes"
              width={220}
              height={72}
              className="h-14 sm:h-16 w-auto"
            />
            <div className="flex items-center gap-3">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-t-3xl min-h-[calc(100vh-100px)] px-4 pt-5 pb-20">
        <div className="max-w-4xl mx-auto">
          <OperativaPanel />
        </div>
      </div>
    </main>
  );
}
