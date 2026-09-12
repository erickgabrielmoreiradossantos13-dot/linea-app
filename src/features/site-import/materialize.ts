import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { ImportedBlockValue, ImportedListItem } from "./parser";

export type ImportedBlockRecord = {
  id: string;
  type: "html_text" | "html_image" | "html_list";
  selector: string;
  draftVisible: boolean;
  value: ImportedBlockValue;
};

function asImageValue(value: ImportedBlockValue) {
  return typeof value === "object" && "src" in value ? value : { src: "", alt: "" };
}

function asListItems(value: ImportedBlockValue) {
  return typeof value === "object" && "items" in value && Array.isArray(value.items) ? value.items : [];
}

function applyListItem($: cheerio.CheerioAPI, itemElement: Element, item: ImportedListItem) {
  item.fields.forEach((field) => {
    const target = $(itemElement).find(`[data-linea-field="${field.id}"]`).first();
    if (!target.length) return;
    if (field.kind === "image") target.attr("src", field.value).attr("alt", field.alt ?? "");
    else target.text(field.value);
  });
}

export function materializeImportedHtml(templateHtml: string, blocks: ImportedBlockRecord[], stripEditorMarkers = false) {
  const $ = cheerio.load(templateHtml);
  for (const block of blocks) {
    const element = $(block.selector).first();
    if (!element.length) continue;
    if (!block.draftVisible) {
      element.remove();
      continue;
    }
    if (block.type === "html_text") {
      element.text(typeof block.value === "string" ? block.value : "");
    } else if (block.type === "html_image") {
      const image = asImageValue(block.value);
      element.attr("src", image.src).attr("alt", image.alt);
    } else {
      const items = asListItems(block.value);
      element.children("[data-linea-item]").each((index, itemElement) => {
        const item = items[index];
        if (!item) $(itemElement).remove();
        else applyListItem($, itemElement, item);
      });
    }
  }
  if (stripEditorMarkers) {
    $("[data-linea-block]").removeAttr("data-linea-block").removeAttr("data-linea-kind");
    $("[data-linea-item]").removeAttr("data-linea-item");
    $("[data-linea-field]").removeAttr("data-linea-field");
  }
  return $.html();
}

export function applyImportedSeo(html: string, input: { title: string; description: string | null; indexable: boolean }) {
  const $ = cheerio.load(html);
  if ($("title").length) $("title").first().text(input.title);
  else $("head").append(`<title>${input.title}</title>`);
  const description = $("meta[name='description']").first();
  if (input.description) {
    if (description.length) description.attr("content", input.description);
    else $("head").append('<meta name="description">').find("meta[name='description']").last().attr("content", input.description);
  } else description.remove();
  const robots = $("meta[name='robots']").first();
  const robotsValue = input.indexable ? "index,follow" : "noindex,nofollow";
  if (robots.length) robots.attr("content", robotsValue);
  else $("head").append('<meta name="robots">').find("meta[name='robots']").last().attr("content", robotsValue);
  return $.html();
}

export function setImportedListField(value: ImportedBlockValue, itemId: string, fieldId: string, nextValue: string, alt?: string) {
  const items = asListItems(value).map((item) => item.id !== itemId ? item : {
    ...item,
    fields: item.fields.map((field) => field.id !== fieldId ? field : { ...field, value: nextValue, ...(alt === undefined ? {} : { alt }) }),
  });
  return { items } satisfies ImportedBlockValue;
}

export function removeImportedListItem(value: ImportedBlockValue, itemId: string) {
  return { items: asListItems(value).filter((item) => item.id !== itemId) } satisfies ImportedBlockValue;
}
