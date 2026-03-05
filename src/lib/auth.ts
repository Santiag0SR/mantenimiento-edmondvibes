import { cookies } from "next/headers";

export type UserRole = "tecnico" | "gestion" | "gobernanta" | null;

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const role = cookieStore.get("user_role")?.value;
  return role === "tecnico" || role === "gestion" || role === "gobernanta";
}

export async function isTecnicoAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("user_role")?.value === "tecnico";
}

export async function isGestionAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("user_role")?.value === "gestion";
}

export async function isGobernantaAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("user_role")?.value === "gobernanta";
}

export async function getUserRole(): Promise<UserRole> {
  const cookieStore = await cookies();
  const role = cookieStore.get("user_role")?.value;
  if (role === "tecnico" || role === "gestion" || role === "gobernanta") {
    return role;
  }
  return null;
}
