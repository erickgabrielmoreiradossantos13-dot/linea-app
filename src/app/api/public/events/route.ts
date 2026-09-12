import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { corsHeaders, getIngestionWebsite, isAllowedOrigin } from "@/features/ingestion/site";

const eventTypes = [
  "page_view", "service_page_view", "whatsapp_click", "phone_click",
  "form_start", "form_submit", "booking_click", "booking_complete",
  "email_click", "map_click", "cta_click"
] as const;

const payloadSchema = z.object({
  siteKey: z.string().min(20).max(200),
  eventType: z.enum(eventTypes),
  pagePath: z.string().max(500).default("/"),
  sessionId: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
  medium: z.string().max(100).optional(),
  campaign: z.string().max(120).optional(),
});

export async function OPTIONS(request: Request) {
  const siteKey = new URL(request.url).searchParams.get("siteKey");
  const origin = request.headers.get("origin");
  if (!siteKey || siteKey.length < 20) return new NextResponse(null, { status: 400 });

  const website = await getIngestionWebsite(siteKey);
  if (!website || !isAllowedOrigin(origin, website.allowed_origin)) return new NextResponse(null, { status: 403 });

  return new NextResponse(null, { status: 204, headers: corsHeaders(origin!) });
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 422 });

  const website = await getIngestionWebsite(parsed.data.siteKey);
  const origin = request.headers.get("origin");
  if (!website) return NextResponse.json({ error: "invalid_site" }, { status: 401 });
  if (!isAllowedOrigin(origin, website.allowed_origin)) {
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("analytics_events").insert({
    organization_id: website.organization_id,
    website_id: website.id,
    event_type: parsed.data.eventType,
    page_path: parsed.data.pagePath,
    session_id: parsed.data.sessionId ?? null,
    source: parsed.data.source ?? null,
    medium: parsed.data.medium ?? null,
    campaign: parsed.data.campaign ?? null,
  });

  if (error) return NextResponse.json({ error: "persist_failed" }, { status: 500, headers: corsHeaders(origin!) });
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin!) });
}
