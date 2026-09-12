import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createSupabaseAdminClient();
  const { data: websites, error } = await supabase.from("websites").select("id")
    .eq("status", "ACTIVE").not("publish_at", "is", null).lte("publish_at", new Date().toISOString()).limit(50);
  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });
  const outcomes = await Promise.all((websites ?? []).map(async (website) => {
    const { error: publishError } = await supabase.rpc("publish_website_draft", { target_website: website.id, scheduled_run: true });
    return { id: website.id, ok: !publishError };
  }));
  return NextResponse.json({ processed: outcomes.length, published: outcomes.filter((outcome) => outcome.ok).length, failed: outcomes.filter((outcome) => !outcome.ok).map((outcome) => outcome.id) });
}
