import { randomUUID } from "node:crypto";
import path from "node:path";
import * as cheerio from "cheerio";
import { isTag, type Element } from "domhandler";
import JSZip from "jszip";

export type ImportedField = {
  id: string;
  kind: "text" | "image";
  value: string;
  alt?: string;
};

export type ImportedListItem = {
  id: string;
  fields: ImportedField[];
};

export type ImportedBlockValue = string | { src: string; alt: string } | { items: ImportedListItem[] };

export type ParsedSiteBlock = {
  id: string;
  type: "html_text" | "html_image" | "html_list";
  position: number;
  selector: string;
  attributeName: string | null;
  originalValue: ImportedBlockValue;
};

export type ParsedSitePage = {
  id: string;
  path: string;
  sourceFilePath: string;
  title: string;
  metaDescription: string | null;
  originalHtml: string;
  templateHtml: string;
  blocks: ParsedSiteBlock[];
};

export type ParsedSiteFile = {
  path: string;
  bytes: Uint8Array;
  mimeType: string;
};

export type ParsedSiteArchive = {
  pages: ParsedSitePage[];
  files: ParsedSiteFile[];
};

const MAX_FILES = 2_000;
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024;
const TEXT_SELECTOR = "h1,h2,h3,h4,h5,h6,p,button,a,span,div,li,label,blockquote,figcaption";

const MIME_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8", xml: "application/xml; charset=utf-8", txt: "text/plain; charset=utf-8",
  svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", avif: "image/avif", ico: "image/x-icon", bmp: "image/bmp",
  woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf",
  mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", wav: "audio/wav", pdf: "application/pdf",
};

function mimeForSitePath(filePath: string) {
  const extension = filePath.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[extension] ?? "application/octet-stream";
}

function safeArchivePath(rawPath: string) {
  const normalized = rawPath.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || /^[a-z]:/i.test(normalized)) throw new Error("O ZIP contém um caminho absoluto inválido.");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "..")) throw new Error("O ZIP contém uma tentativa de sair da pasta do site.");
  return segments.join("/");
}

function stripSharedRoot(paths: string[]) {
  const firstSegments = paths.map((item) => item.split("/")[0]);
  const shared = firstSegments[0] && firstSegments.every((segment) => segment === firstSegments[0]) && paths.every((item) => item.includes("/"));
  return shared ? `${firstSegments[0]}/` : "";
}

function publicPagePath(filePath: string) {
  const withoutExtension = filePath.replace(/\.(?:html?|HTML?)$/, "");
  const clean = withoutExtension.replace(/(^|\/)index$/i, "$1").replace(/\/$/, "");
  return clean ? `/${clean}` : "/";
}

function encodedPath(filePath: string) {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

function resolveRelativeFile(pageFile: string, rawUrl: string) {
  const clean = rawUrl.split("#")[0].split("?")[0];
  if (clean.startsWith("/")) return clean.replace(/^\/+/, "");
  const pageDirectory = path.posix.dirname(pageFile);
  return path.posix.normalize(path.posix.join(pageDirectory === "." ? "" : pageDirectory, clean)).replace(/^\.\//, "");
}

function rewritePageLink(value: string, pageFile: string, websiteId: string, importId: string) {
  const raw = value.trim();
  if (!raw || isExternalUrl(raw)) return value;
  const clean = raw.split("#")[0].split("?")[0];
  const suffix = raw.slice(clean.length);
  const resolved = resolveRelativeFile(pageFile, raw);
  if (/\.html?$/i.test(resolved)) return `/sites/${websiteId}${publicPagePath(resolved)}${suffix}`;
  if (clean.startsWith("/") || !path.posix.extname(resolved)) return `/sites/${websiteId}/${resolved.replace(/^\/+/, "")}${suffix}`.replace(/\/$/, "");
  return rewriteAssetUrl(value, pageFile, websiteId, importId);
}

function isExternalUrl(value: string) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value.trim());
}

function rewriteAssetUrl(value: string, pageFile: string, websiteId: string, importId: string) {
  const raw = value.trim();
  if (!raw || isExternalUrl(raw)) return value;
  const suffix = raw.slice(raw.split("#")[0].split("?")[0].length);
  const resolved = resolveRelativeFile(pageFile, raw);
  if (/\.html?$/i.test(resolved)) return `/sites/${websiteId}${publicPagePath(resolved)}${suffix}`;
  return `/site-assets/${websiteId}/${importId}/${encodedPath(resolved)}${suffix}`;
}

function rewriteCssReferences(css: string, cssFile: string, websiteId: string, importId: string) {
  return css.replace(/url\((['"]?)([^)'"\s]+)\1\)/gi, (_match, quote: string, url: string) => {
    if (isExternalUrl(url)) return `url(${quote}${url}${quote})`;
    const resolved = resolveRelativeFile(cssFile, url);
    return `url(${quote}/site-assets/${websiteId}/${importId}/${encodedPath(resolved)}${quote})`;
  });
}

function rewriteHtmlReferences($: cheerio.CheerioAPI, pageFile: string, websiteId: string, importId: string) {
  $("meta[http-equiv]").filter((_, element) => ($(element).attr("http-equiv") ?? "").toLowerCase() === "content-security-policy").remove();
  $("[src]").each((_, element) => {
    const value = $(element).attr("src");
    if (value) $(element).attr("src", rewriteAssetUrl(value, pageFile, websiteId, importId));
  });
  $("link[href]").each((_, element) => {
    const value = $(element).attr("href");
    if (value) $(element).attr("href", rewriteAssetUrl(value, pageFile, websiteId, importId));
  });
  $("a[href]").each((_, element) => {
    const value = $(element).attr("href");
    if (value) $(element).attr("href", rewritePageLink(value, pageFile, websiteId, importId));
  });
  $("[poster]").each((_, element) => {
    const value = $(element).attr("poster");
    if (value) $(element).attr("poster", rewriteAssetUrl(value, pageFile, websiteId, importId));
  });
  $("[srcset]").each((_, element) => {
    const value = $(element).attr("srcset");
    if (!value) return;
    const rewritten = value.split(",").map((candidate) => {
      const [url, descriptor] = candidate.trim().split(/\s+/, 2);
      return `${rewriteAssetUrl(url, pageFile, websiteId, importId)}${descriptor ? ` ${descriptor}` : ""}`;
    }).join(", ");
    $(element).attr("srcset", rewritten);
  });
  $("[style]").each((_, element) => {
    const style = $(element).attr("style");
    if (!style) return;
    $(element).attr("style", style.replace(/url\((['"]?)([^)'"\s]+)\1\)/gi, (_match, quote: string, url: string) => `url(${quote}${rewriteAssetUrl(url, pageFile, websiteId, importId)}${quote})`));
  });
}

function isHidden($: cheerio.CheerioAPI, element: Element) {
  const own = $(element);
  const style = (own.attr("style") ?? "").replaceAll(" ", "").toLowerCase();
  return own.attr("hidden") !== undefined || own.attr("aria-hidden") === "true" || style.includes("display:none") || style.includes("visibility:hidden") || own.closest("script,style,noscript,template,svg,head").length > 0;
}

function directStructure($: cheerio.CheerioAPI, element: Element) {
  return `${element.tagName}:${$(element).children().toArray().filter(isTag).map((child) => child.tagName).join(",")}`;
}

function hasEditableText($: cheerio.CheerioAPI, element: Element) {
  const text = $(element).text().replace(/\s+/g, " ").trim();
  if (!text || text.length > 4_000 || isHidden($, element)) return false;
  return $(element).find(TEXT_SELECTOR).length === 0;
}

function parsePage(originalHtml: string, sourceFilePath: string, websiteId: string, importId: string): ParsedSitePage {
  const $ = cheerio.load(originalHtml);
  rewriteHtmlReferences($, sourceFilePath, websiteId, importId);
  const pageId = randomUUID();
  const blocks: ParsedSiteBlock[] = [];
  const groupedElements = new Set<Element>();
  let position = 0;

  $("ul,ol,[class*='grid'],[class*='cards'],[class*='features'],[class*='benefits'],[class*='services'],[class*='list']").each((_, parent) => {
    if (groupedElements.has(parent) || $(parent).closest("nav,header,footer").length) return;
    const children = $(parent).children().toArray().filter(isTag);
    if (children.length < 3 || children.length > 24) return;
    const signature = directStructure($, children[0]);
    if (!children.every((child) => directStructure($, child) === signature)) return;
    const items: ImportedListItem[] = [];
    children.forEach((child) => {
      const fields: ImportedField[] = [];
      $(child).find(`${TEXT_SELECTOR},img`).addBack(TEXT_SELECTOR).each((__, field) => {
        if (!isTag(field)) return;
        if (field.tagName === "img") {
          const id = randomUUID();
          $(field).attr("data-linea-field", id);
          fields.push({ id, kind: "image", value: $(field).attr("src") ?? "", alt: $(field).attr("alt") ?? "" });
        } else if (hasEditableText($, field)) {
          const id = randomUUID();
          $(field).attr("data-linea-field", id);
          fields.push({ id, kind: "text", value: $(field).text().replace(/\s+/g, " ").trim() });
        }
      });
      if (fields.length) {
        const id = randomUUID();
        $(child).attr("data-linea-item", id);
        items.push({ id, fields });
      }
    });
    if (items.length < 3) return;
    const id = randomUUID();
    $(parent).attr("data-linea-block", id).attr("data-linea-kind", "html_list");
    $(parent).find("*").addBack().each((__, node) => { if (isTag(node)) groupedElements.add(node); });
    blocks.push({ id, type: "html_list", position: position++, selector: `[data-linea-block="${id}"]`, attributeName: null, originalValue: { items } });
  });

  $(TEXT_SELECTOR).each((_, element) => {
    if (groupedElements.has(element) || !hasEditableText($, element)) return;
    const id = randomUUID();
    $(element).attr("data-linea-block", id).attr("data-linea-kind", "html_text");
    blocks.push({
      id, type: "html_text", position: position++, selector: `[data-linea-block="${id}"]`, attributeName: "textContent",
      originalValue: $(element).text().replace(/\s+/g, " ").trim(),
    });
  });

  $("img").each((_, element) => {
    if (groupedElements.has(element) || isHidden($, element)) return;
    const id = randomUUID();
    $(element).attr("data-linea-block", id).attr("data-linea-kind", "html_image");
    blocks.push({
      id, type: "html_image", position: position++, selector: `[data-linea-block="${id}"]`, attributeName: "src",
      originalValue: { src: $(element).attr("src") ?? "", alt: $(element).attr("alt") ?? "" },
    });
  });

  const title = $("title").first().text().trim() || $("h1").first().text().trim() || publicPagePath(sourceFilePath);
  const metaDescription = $("meta[name='description']").attr("content")?.trim() || null;
  return {
    id: pageId,
    path: publicPagePath(sourceFilePath),
    sourceFilePath,
    title: title.slice(0, 180),
    metaDescription: metaDescription?.slice(0, 320) ?? null,
    originalHtml,
    templateHtml: $.html(),
    blocks,
  };
}

export async function parseSiteZip(input: Uint8Array, websiteId: string, importId: string): Promise<ParsedSiteArchive> {
  const zip = await JSZip.loadAsync(input, { checkCRC32: true, createFolders: false });
  const entries = Object.values(zip.files).filter((entry) => !entry.dir && !entry.name.startsWith("__MACOSX/"));
  const originalName = (entry: JSZip.JSZipObject) => (entry as JSZip.JSZipObject & { unsafeOriginalName?: string }).unsafeOriginalName ?? entry.name;
  const rawPaths = entries.map((entry) => safeArchivePath(originalName(entry)));
  if (!rawPaths.length) throw new Error("O ZIP está vazio.");
  if (rawPaths.length > MAX_FILES) throw new Error(`O ZIP supera o limite de ${MAX_FILES} arquivos.`);
  const sharedRoot = stripSharedRoot(rawPaths);
  const files: ParsedSiteFile[] = [];
  let totalBytes = 0;
  for (const entry of entries) {
    const archivePath = safeArchivePath(originalName(entry));
    const filePath = sharedRoot && archivePath.startsWith(sharedRoot) ? archivePath.slice(sharedRoot.length) : archivePath;
    if (!filePath) continue;
    let bytes = await entry.async("uint8array");
    if (/\.css$/i.test(filePath)) bytes = new TextEncoder().encode(rewriteCssReferences(new TextDecoder().decode(bytes), filePath, websiteId, importId));
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_UNCOMPRESSED_BYTES) throw new Error("O conteúdo descomprimido supera 100 MB.");
    files.push({ path: filePath, bytes, mimeType: mimeForSitePath(filePath) });
  }
  const htmlFiles = files.filter((file) => /\.html?$/i.test(file.path));
  if (!htmlFiles.length) throw new Error("O ZIP não contém nenhuma página HTML.");
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const pages = htmlFiles.map((file) => parsePage(decoder.decode(file.bytes), file.path, websiteId, importId));
  const paths = new Set<string>();
  for (const page of pages) {
    if (paths.has(page.path)) throw new Error(`Duas páginas do ZIP geram a mesma rota: ${page.path}`);
    paths.add(page.path);
  }
  return { pages, files };
}
