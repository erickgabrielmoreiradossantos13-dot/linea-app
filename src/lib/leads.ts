import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { generateDemoLeads } from "@/lib/demo/data";
import { getDemoLeadOverrides } from "@/lib/demo/store";
import type { Lead, LeadStatus } from "@/lib/types";

export async function getLeads(businessId: string): Promise<Lead[]> {
  if (IS_DEMO_MODE) {
    const overrides = await getDemoLeadOverrides();
    return generateDemoLeads().map((lead) =>
      overrides[lead.id] ? { ...lead, status: overrides[lead.id] as LeadStatus } : lead
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(500);

  return (data as Lead[]) ?? [];
}
