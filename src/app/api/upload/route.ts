import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    // Validar que sea una imagen o PDF
    const allowedTypes = ["image/", "application/pdf"];
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
    if (!isAllowed) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen o PDF" },
        { status: 400 }
      );
    }

    // Limitar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen no puede superar 5MB" },
        { status: 400 }
      );
    }

    // Si tiene token de Vercel Blob, usarlo
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`incidencias/${Date.now()}-${file.name}`, file, {
        access: "public",
      });
      return NextResponse.json({ url: blob.url });
    }

    // En desarrollo local, guardar en public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    // Devolver URL relativa
    const url = `/uploads/${fileName}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    );
  }
}
