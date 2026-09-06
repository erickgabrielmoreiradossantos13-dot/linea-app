import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { DEMO_SUPPORT_REQUESTS } from "@/lib/demo/data";
import { getDemoExtraSupportRequests, addDemoSupportRequest } from "@/lib/demo/store";
import type { SupportCategory, SupportPriority, SupportRequest } from "@/lib/types";

export interface CreateSupportRequestInput {
  title: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
}

export async function getSupportRequests(businessId: string): Promise<SupportRequest[]> {
  if (IS_DEMO_MODE) {
    const extra = await getDemoExtraSupportRequests();
    return [...extra, ...DEMO_SUPPORT_REQUESTS].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("support_requests")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  return (data as SupportRequest[]) ?? [];
}

export async function createSupportRequest(
  businessId: string,
  input: CreateSupportRequestInput
): Promise<void> {
  if (IS_DEMO_MODE) {
    const now = new Date().toISOString();
    await addDemoSupportRequest({
      id: `demo-support-${Date.now()}`,
      business_id: businessId,
      created_by: null,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: "recibida",
      response_notes: null,
      created_at: now,
      updated_at: now,
    });
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("support_requests").insert({
    business_id: businessId,
    created_by: user?.id ?? null,
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
  });

  if (error) throw new Error(error.message);
}
