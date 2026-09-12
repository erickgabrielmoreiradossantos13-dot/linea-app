import { canEditContent } from "@/lib/authz";
import { getSessionContext } from "@/features/session/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { injectEditorBridge } from "@/features/site-import/editor-bridge";
import { materializeImportedHtml } from "@/features/site-import/materialize";
import type { ImportedBlockValue } from "@/features/site-import/parser";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ websiteId: string; pageId: string }> }) {
  const [{ websiteId, pageId }, session] = await Promise.all([params, getSessionContext()]);
  const supabase = await createSupabaseServerClient();
  const { data: page } = await supabase.from("pages").select("draft_html")
    .eq("id", pageId).eq("website_id", websiteId).eq("organization_id", session.organizationId)
    .eq("editor_mode", "IMPORTED").maybeSingle();
  if (!page?.draft_html) return new Response("Página importada não encontrada.", { status: 404 });
  const { data: blocks, error: blocksError } = await supabase.from("page_blocks")
    .select("id, type, selector, draft_visible, current_value_draft")
    .eq("page_id", pageId).eq("website_id", websiteId).eq("organization_id", session.organizationId).not("selector", "is", null).order("position");
  if (blocksError) return new Response("Não foi possível carregar os elementos editáveis.", { status: 500 });
  const html = materializeImportedHtml(page.draft_html, (blocks ?? []).map((block) => ({
    id: block.id, type: block.type as "html_text" | "html_image" | "html_list", selector: block.selector as string,
    draftVisible: block.draft_visible, value: block.current_value_draft as ImportedBlockValue,
  })), false);
  const editable = new URL(request.url).searchParams.get("edit") === "1" && canEditContent(session.role) && !session.isDemo;
  return new Response(injectEditorBridge(html, editable), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Frame-Options": "SAMEORIGIN",
      "Referrer-Policy": "same-origin",
    },
  });
}
