import { getPublishedPage } from "@/features/editor/public";
import type { EditorBlock } from "@/features/editor/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function routePath(slug?: string[]) { return slug?.length ? `/${slug.join("/")}` : "/"; }
function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }

function entry(block: EditorBlock, suffix: string) {
  return escapeHtml(block.entries.find((item) => item.key.endsWith(`.${suffix}`))?.value ?? "");
}

function renderGenericBlocks(blocks: EditorBlock[]) {
  return blocks.map((block) => {
    const heading = entry(block, "heading");
    const body = entry(block, "body");
    const headingTag = block.config.headingLevel === "h1" ? "h1" : "h2";
    if (block.type === "text") return `<section class="site-block ${block.config.tone === "accent" ? "site-block-accent" : ""}"><div class="site-block-inner"><${headingTag}>${heading}</${headingTag}><p>${body}</p></div></section>`;
    if (block.type === "image_text") return `<section class="site-block"><div class="site-block-inner site-split"><div class="site-image-slot">${block.config.imageUrl ? `<img src="${escapeHtml(block.config.imageUrl)}" alt="${escapeHtml(block.config.imageAlt ?? "")}">` : ""}</div><div><${headingTag}>${heading}</${headingTag}><p>${body}</p></div></div></section>`;
    if (block.type === "cards") return `<section class="site-block"><div class="site-block-inner"><${headingTag}>${heading}</${headingTag}><div class="site-card-grid">${(block.config.items ?? []).map((item) => `<article class="site-card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></article>`).join("")}</div></div></section>`;
    if (block.type === "cta") return `<section class="site-block site-block-cta"><div class="site-block-inner site-cta-inner"><div><${headingTag}>${heading}</${headingTag}><p>${body}</p></div><a class="site-cta-button" href="${entry(block, "button_url") || "#contacto"}">${entry(block, "button_label")}</a></div></section>`;
    return "";
  }).join("");
}

const genericStyles = `*{box-sizing:border-box}html,body{margin:0;background:#f7f2ea;color:#14202a;font-family:Arial,sans-serif}.site-block-inner{max-width:1100px;margin:auto;padding:clamp(54px,8vw,112px) clamp(24px,6vw,72px)}.site-block h1,.site-block h2{margin:0;font-family:Georgia,serif;font-weight:500;line-height:1.03}.site-block h1{font-size:clamp(44px,7vw,88px)}.site-block h2{font-size:clamp(34px,5vw,62px)}.site-block p{max-width:760px;margin:24px 0 0;color:#54616a;font-size:clamp(17px,2vw,21px);line-height:1.65}.site-block-accent{background:#14232e;color:#fff}.site-block-accent h1,.site-block-accent h2{color:#fff}.site-split{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}.site-image-slot{aspect-ratio:4/3;overflow:hidden;background:#e7ddd0}.site-image-slot img{width:100%;height:100%;object-fit:cover}.site-card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:46px}.site-card{padding:30px;border:1px solid #d8cbbb;background:#fffaf3}.site-cta-inner{display:flex;justify-content:space-between;align-items:center}.site-block-cta{background:#ee6047}.site-cta-button{padding:16px 24px;background:#12212c;color:white;text-decoration:none}@media(max-width:700px){.site-split,.site-card-grid{grid-template-columns:1fr}.site-cta-inner{align-items:flex-start;flex-direction:column}}`;

export async function GET(_request: Request, { params }: { params: Promise<{ websiteId: string; slug?: string[] }> }) {
  const { websiteId, slug } = await params;
  const path = routePath(slug);
  const supabase = createSupabaseAdminClient();
  const { data: website } = await supabase.from("websites").select("organization_id, source_mode")
    .eq("id", websiteId).eq("status", "ACTIVE").maybeSingle();
  if (!website) return new Response("Site não encontrado.", { status: 404 });
  if (website.source_mode === "IMPORTED") {
    const { data: page } = await supabase.from("pages").select("published_html")
      .eq("website_id", websiteId).eq("organization_id", website.organization_id).eq("path", path).eq("editor_mode", "IMPORTED").maybeSingle();
    if (!page?.published_html) return new Response("Página não publicada.", { status: 404 });
    return new Response(page.published_html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=60",
        "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-popups allow-modals",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  const page = await getPublishedPage(websiteId, path);
  if (!page) return new Response("Página não encontrada.", { status: 404 });
  const body = renderGenericBlocks(page.blocks);
  const robots = page.indexable ? "index,follow" : "noindex,nofollow";
  const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(page.title)}</title>${page.description ? `<meta name="description" content="${escapeHtml(page.description)}">` : ""}<meta name="robots" content="${robots}"><style>${genericStyles}</style></head><body>${body}</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=60" } });
}
