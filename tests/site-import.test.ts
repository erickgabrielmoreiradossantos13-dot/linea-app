import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { materializeImportedHtml } from "../src/features/site-import/materialize";
import { parseSiteZip } from "../src/features/site-import/parser";

const WEBSITE_ID = "11111111-1111-4111-8111-111111111111";
const IMPORT_ID = "22222222-2222-4222-8222-222222222222";

async function exampleSiteZip() {
  const zip = new JSZip();
  zip.file("cliente/index.html", `<!doctype html><html><head><title>Clínica real</title><link rel="stylesheet" href="assets/site.css"></head><body><main><h1>Texto original</h1><img src="assets/hero.jpg" alt="Recepção"><section class="benefits-grid"><article><h2>Um</h2><p>Primeiro</p></article><article><h2>Dois</h2><p>Segundo</p></article><article><h2>Três</h2><p>Terceiro</p></article></section></main></body></html>`);
  zip.file("cliente/sobre.html", "<!doctype html><html><head><title>Sobre</title></head><body><p>Nossa história</p></body></html>");
  zip.file("cliente/assets/site.css", "body{color:#123} .benefits-grid{display:grid}");
  zip.file("cliente/assets/hero.jpg", new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
  return new Uint8Array(await zip.generateAsync({ type: "arraybuffer" }));
}

describe("site ZIP ingestion", () => {
  it("maps real HTML nodes while preserving the pristine source", async () => {
    const parsed = await parseSiteZip(await exampleSiteZip(), WEBSITE_ID, IMPORT_ID);
    expect(parsed.pages.map((page) => page.path)).toEqual(["/", "/sobre"]);
    const home = parsed.pages[0];
    expect(home.originalHtml).toContain('<img src="assets/hero.jpg"');
    expect(home.originalHtml).not.toContain("data-linea-block");
    expect(home.templateHtml).toContain(`/site-assets/${WEBSITE_ID}/${IMPORT_ID}/assets/hero.jpg`);
    expect(new TextDecoder().decode(parsed.files.find((file) => file.path === "assets/site.css")?.bytes)).toContain(".benefits-grid");
    expect(home.blocks.some((block) => block.type === "html_text" && block.originalValue === "Texto original")).toBe(true);
    expect(home.blocks.some((block) => block.type === "html_image")).toBe(true);
    expect(home.blocks.some((block) => block.type === "html_list")).toBe(true);
  });

  it("applies a draft to the original design and removes editor markers for publication", async () => {
    const parsed = await parseSiteZip(await exampleSiteZip(), WEBSITE_ID, IMPORT_ID);
    const home = parsed.pages[0];
    const heading = home.blocks.find((block) => block.type === "html_text" && block.originalValue === "Texto original");
    const image = home.blocks.find((block) => block.type === "html_image");
    expect(heading && image).toBeTruthy();
    const html = materializeImportedHtml(home.templateHtml, home.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      selector: block.selector,
      draftVisible: true,
      value: block.id === heading?.id ? "Texto publicado" : block.id === image?.id ? { src: "/site-media/site/image", alt: "Imagem nova" } : block.originalValue,
    })), true);
    expect(html).toContain("Texto publicado");
    expect(html).toContain('/site-media/site/image');
    expect(html).toContain('alt="Imagem nova"');
    expect(html).toContain("benefits-grid");
    expect(html).not.toContain("data-linea-");
  });

  it("rejects ZIP path traversal", async () => {
    const zip = new JSZip();
    zip.file("../index.html", "<h1>unsafe</h1>");
    const bytes = new Uint8Array(await zip.generateAsync({ type: "arraybuffer" }));
    await expect(parseSiteZip(bytes, WEBSITE_ID, IMPORT_ID)).rejects.toThrow(/caminho|ZIP/i);
  });
});
