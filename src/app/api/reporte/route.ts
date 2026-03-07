import { NextResponse } from "next/server";
import crypto from "crypto";

const SECRET = process.env.CRON_SECRET || "default-secret";

function generateToken(params: { mes: string; edificio: string; expires: number }): string {
  const payload = JSON.stringify(params);
  const hmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  const data = Buffer.from(payload).toString("base64url");
  return `${data}.${hmac}`;
}

export function verifyToken(token: string): { mes: string; edificio: string; expires: number } | null {
  try {
    const [data, hmac] = token.split(".");
    if (!data || !hmac) return null;
    const payload = Buffer.from(data, "base64url").toString();
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (hmac !== expected) return null;
    const parsed = JSON.parse(payload);
    if (parsed.expires < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { mes, edificio } = await request.json();
    const expires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    const token = generateToken({ mes: mes || "all", edificio: edificio || "all", expires });

    const baseUrl = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    const url = `${baseUrl}/reporte/${token}`;

    return NextResponse.json({ url, token });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Error generating report" }, { status: 500 });
  }
}
