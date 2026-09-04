import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { DEMO_WEBSITE_CONTENT } from "@/lib/demo/data";
import { getDemoWebsiteOverrides } from "@/lib/demo/store";
import type { WebsiteContent } from "@/lib/types";

export async function getWebsiteContent(businessId: string): Promise<WebsiteContent | null> {
  if (IS_DEMO_MODE) {
    const overrides = await getDemoWebsiteOverrides();
    return { ...DEMO_WEBSITE_CONTENT, ...overrides };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("website_content")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  return (data as WebsiteContent) ?? null;
}
