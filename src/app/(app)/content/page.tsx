import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getContentWebsite } from "@/features/content/data";
import { getSessionContext } from "@/features/session/context";
import { requireFeature } from "@/lib/features";

export default async function ContentPage() {
  const session = await getSessionContext();
  requireFeature(session, "content");
  const website = await getContentWebsite(session);
  if (website) redirect(`/site/${website.id}/edit`);
  return <div><PageHeader eyebrow="Editor visual" title="Contenido" description="Conecta primero una web para abrir su editor visual."/><div className="panel p-8 text-center text-sm text-neutral-500">No hay una web activa asociada a esta organización.</div></div>;
}
