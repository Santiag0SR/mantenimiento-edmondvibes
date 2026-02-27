import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { password, panel } = await request.json();

    const cookieStore = await cookies();

    // Panel de gestión
    if (panel === "gestion") {
      if (password === process.env.GESTION_PASSWORD) {
        cookieStore.set("user_role", "gestion", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7, // 1 semana
        });
        return NextResponse.json({ success: true });
      }
    }

    // Panel de técnico (admin)
    if (panel === "admin" || !panel) {
      if (password === process.env.ADMIN_PASSWORD) {
        cookieStore.set("user_role", "tecnico", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7, // 1 semana
        });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Error en autenticación:", error);
    return NextResponse.json(
      { error: "Error de autenticación" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("user_role");
  return NextResponse.json({ success: true });
}
