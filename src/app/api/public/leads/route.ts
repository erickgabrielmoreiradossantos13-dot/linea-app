import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { corsHeaders, getIngestionWebsite, isAllowedOrigin } from "@/features/ingestion/site";

const payloadSchema = z.object({
  siteKey: z.string().min(20).max(200),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().max(4000).optional(),
  pagePath: z.string().trim().max(500).default("/"),
  source: z.string().trim().max(80).default("Website"),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
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
  const { error } = await supabase.from("leads").insert({
    organization_id: website.organization_id,
    website_id: website.id,
    name: parsed.data.name,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message ?? null,
    page_path: parsed.data.pagePath,
    source: parsed.data.source,
    utm_source: parsed.data.utmSource ?? null,
    utm_medium: parsed.data.utmMedium ?? null,
    utm_campaign: parsed.data.utmCampaign ?? null,
    status: "NEW",
  });

  if (error) return NextResponse.json({ error: "persist_failed" }, { status: 500, headers: corsHeaders(origin!) });
  return NextResponse.json({ ok: true }, { status: 201, headers: corsHeaders(origin!) });
}
