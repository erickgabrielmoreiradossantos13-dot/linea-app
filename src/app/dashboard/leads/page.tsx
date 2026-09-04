import type { Metadata } from "next";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getLeads } from "@/lib/leads";
import { PageHeader } from "@/components/dashboard/page-header";
import { LeadsTable } from "@/components/leads/leads-table";

export const metadata: Metadata = {
  title: "Contactos · Línea App",
};

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const { business } = await getCurrentBusiness();
  const leads = await getLeads(business.id);

  return (
    <div>
      <PageHeader
        title="Contactos"
        description={`${leads.length} contactos recibidos por ${business.name}.`}
      />
      <LeadsTable leads={leads} />
    </div>
  );
}
