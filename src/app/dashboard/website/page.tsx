import type { Metadata } from "next";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getWebsiteContent } from "@/lib/website";
import { PageHeader } from "@/components/dashboard/page-header";
import { WebsiteEditor } from "@/components/website/website-editor";

export const metadata: Metadata = {
  title: "Sitio web · Línea App",
};

export const dynamic = "force-dynamic";

export default async function WebsitePage() {
  const { business } = await getCurrentBusiness();
  const content = await getWebsiteContent(business.id);

  if (!content) {
    return (
      <div>
        <PageHeader title="Sitio web" description="Edita el contenido básico de tu web." />
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-sm text-ink-500">
          Todavía no hay contenido configurado para tu web. Contacta con tu gestor de Línea Sur
          para activarlo.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sitio web"
        description="Edita el título, la descripción y los datos de contacto de tu página."
      />
      <WebsiteEditor
        businessId={business.id}
        businessName={business.name}
        content={content}
      />
    </div>
  );
}
