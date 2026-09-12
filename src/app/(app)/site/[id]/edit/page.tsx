import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { VisualEditor } from "@/components/site/visual-editor";
import { getEditorData } from "@/features/editor/data";
import { getSessionContext } from "@/features/session/context";
import { requireFeature } from "@/lib/features";
import { initializeWebsiteEditor } from "./actions";

export default async function SiteEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const session = await getSessionContext();
  requireFeature(session, "site");
  const pageId = typeof query.page === "string" ? query.page : undefined;
  const data = await getEditorData(session, id, pageId);
  if (!data) notFound();
  if (!data.currentPage) return <div className="editor-setup"><div><span>Línea Editor</span><h1>Prepara tu primera página</h1><p>Crearemos una portada con un bloque editable. Después podrás construirla visualmente, sección a sección.</p>{data.canEdit ? <ActionForm action={initializeWebsiteEditor}><input type="hidden" name="websiteId" value={data.website.id}/><button className="btn btn-primary">Crear página inicial</button></ActionForm> : <p>Tu perfil es de solo lectura. Pide a un editor que prepare la página.</p>}</div></div>;
  const editorKey = `${data.currentPage.id}:${data.blocks.map((block) => `${block.id}-${block.position}`).join(":")}:${data.history[0]?.id ?? 0}`;
  return <VisualEditor data={data} key={editorKey}/>;
}
