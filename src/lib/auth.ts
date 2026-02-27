import { cookies } from "next/headers";

export type UserRole = "tecnico" | "gestion" | null;

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const role = cookieStore.get("user_role")?.value;
  return role === "tecnico" || role === "gestion";
}

export async function isTecnicoAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("user_role")?.value === "tecnico";
}

export async function isGestionAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("user_role")?.value === "gestion";
}

export async function getUserRole(): Promise<UserRole> {
  const cookieStore = await cookies();
  const role = cookieStore.get("user_role")?.value;
  if (role === "tecnico" || role === "gestion") {
    return role;
  }
  return null;
}
