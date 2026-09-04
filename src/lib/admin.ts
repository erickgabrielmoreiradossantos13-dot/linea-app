import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { DEMO_BUSINESS } from "@/lib/demo/data";
import * as demoSite from "@/lib/demo/site";
import type { Business, Site } from "@/lib/types";

export interface SiteWithBusiness extends Site {
  business_name: string;
}

export async function getAllSitesForStaff(): Promise<SiteWithBusiness[]> {
  if (IS_DEMO_MODE) {
    const site = await demoSite.adapter.getSiteForBusiness(DEMO_BUSINESS.id);
    return site ? [{ ...site, business_name: DEMO_BUSINESS.name }] : [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("*, business:businesses(name)")
    .order("created_at", { ascending: false });

  return ((data ?? []) as (Site & { business: { name: string } | null })[]).map((row) => ({
    ...row,
    business_name: row.business?.name ?? "—",
  }));
}

export async function getAllBusinessesForStaff(): Promise<Business[]> {
  if (IS_DEMO_MODE) return [DEMO_BUSINESS];

  const supabase = await createClient();
  const { data } = await supabase.from("businesses").select("*").order("name", { ascending: true });
  return (data as Business[]) ?? [];
}
