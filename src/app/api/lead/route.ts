import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const VALID_CONVERSION_SOURCES = ["whatsapp", "formulario", "llamada"];
const VALID_TRAFFIC_SOURCES = ["google", "google_maps", "instagram", "facebook", "directo", "referido"];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

interface LeadPayload {
  site_id?: unknown;
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  service?: unknown;
  source?: unknown;
  traffic_source?: unknown;
  campaign?: unknown;
  landing_page?: unknown;
  referrer?: unknown;
}

function str(value: unknown, maxLength = 300): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

/**
 * Crea un lead real a partir de un formulario/CTA de la web publicada de un
 * cliente. Mismo modelo de seguridad que /api/track: site_id es público
 * (solo permite escribir, nunca leer), la resolución de business_id ocurre
 * aquí con service_role.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`lead:${ip}`)) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429, headers: CORS_HEADERS });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase no está configurado en este despliegue." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  let body: LeadPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400, headers: CORS_HEADERS });
  }

  const siteId = str(body.site_id, 100);
  const name = str(body.name, 150);
  if (!siteId || !name) {
    return NextResponse.json({ error: "site_id y name son obligatorios" }, { status: 400, headers: CORS_HEADERS });
  }

  const source = VALID_CONVERSION_SOURCES.includes(String(body.source)) ? String(body.source) : "formulario";
  const trafficSourceRaw = str(body.traffic_source);
  const trafficSource = trafficSourceRaw && VALID_TRAFFIC_SOURCES.includes(trafficSourceRaw) ? trafficSourceRaw : null;

  const { data: site } = await supabase.from("sites").select("business_id").eq("id", siteId).maybeSingle();
  if (!site) {
    return NextResponse.json({ error: "site_id desconocido" }, { status: 404, headers: CORS_HEADERS });
  }

  const { error } = await supabase.from("leads").insert({
    business_id: site.business_id,
    name,
    phone: str(body.phone, 40),
    email: str(body.email, 150),
    service: str(body.service, 150),
    source,
    status: "nuevo",
    value_estimate: 0,
    traffic_source: trafficSource,
    campaign: str(body.campaign, 150),
    landing_page: str(body.landing_page, 300),
    referrer: str(body.referrer, 300),
  });

  if (error) {
    return NextResponse.json({ error: "No se pudo registrar el contacto" }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: CORS_HEADERS });
}
