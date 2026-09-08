import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const VALID_SOURCES = ["google", "google_maps", "instagram", "facebook", "directo", "referido"];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Registra una visita real desde la web publicada de un cliente.
 *
 * Body: { site_id: string, source?: string }
 * `site_id` es el id (uuid) de la fila en `sites` — no es un secreto: solo
 * permite ATRIBUIR una visita a ese sitio, nunca leer datos. La resolución
 * de business_id ocurre aquí, server-side, con service_role (por eso puede
 * escribir aunque no haya sesión de usuario ni policy de INSERT pública).
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`track:${ip}`)) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429, headers: CORS_HEADERS });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase no está configurado en este despliegue." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  let body: { site_id?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400, headers: CORS_HEADERS });
  }

  const siteId = typeof body.site_id === "string" ? body.site_id : null;
  if (!siteId) {
    return NextResponse.json({ error: "site_id es obligatorio" }, { status: 400, headers: CORS_HEADERS });
  }

  const source = VALID_SOURCES.includes(String(body.source)) ? String(body.source) : "directo";

  const { data: site } = await supabase.from("sites").select("business_id").eq("id", siteId).maybeSingle();
  if (!site) {
    return NextResponse.json({ error: "site_id desconocido" }, { status: 404, headers: CORS_HEADERS });
  }

  const { error } = await supabase.from("analytics_events").insert({
    business_id: site.business_id,
    event_type: "visit",
    source,
  });

  if (error) {
    return NextResponse.json({ error: "No se pudo registrar la visita" }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: CORS_HEADERS });
}
