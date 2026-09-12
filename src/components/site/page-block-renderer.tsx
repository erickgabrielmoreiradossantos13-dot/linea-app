/* eslint-disable @next/next/no-img-element */
import type { EditorBlock, EditorEntry } from "@/features/editor/types";

type Props = {
  block: EditorBlock;
  renderEntry?: (entry: EditorEntry, className: string) => React.ReactNode;
  renderImage?: (block: EditorBlock) => React.ReactNode;
  renderCardText?: (block: EditorBlock, itemId: string, field: "title" | "body", value: string, className: string) => React.ReactNode;
};

function entryBySuffix(block: EditorBlock, suffix: string) {
  return block.entries.find((entry) => entry.key.endsWith(`.${suffix}`)) ?? block.entries.find((entry) => entry.label.toLowerCase().includes(suffix));
}

export function PageBlockRenderer({ block, renderEntry, renderImage, renderCardText }: Props) {
  const heading = entryBySuffix(block, "heading");
  const body = entryBySuffix(block, "body");
  const buttonLabel = entryBySuffix(block, "button_label");
  const buttonUrl = entryBySuffix(block, "button_url")?.value || "#contacto";
  const entry = (item: EditorEntry | undefined, className: string) => item ? (renderEntry?.(item, className) ?? <span className={className}>{item.value}</span>) : null;
  const HeadingTag = block.config.headingLevel === "h1" ? "h1" : "h2";

  if (block.type === "text") return (
    <section className={`site-block site-block-text ${block.config.tone === "accent" ? "site-block-accent" : ""}`}>
      <div className="site-block-inner site-copy-narrow">
        {block.config.eyebrow && <p className="site-eyebrow">{block.config.eyebrow}</p>}
        <HeadingTag>{entry(heading, "site-heading")}</HeadingTag>
        <p>{entry(body, "site-body")}</p>
      </div>
    </section>
  );

  if (block.type === "image_text") return (
    <section className="site-block site-block-image-text">
      <div className={`site-block-inner site-split ${block.config.imagePosition === "right" ? "image-right" : ""}`}>
        <div className="site-image-slot">{renderImage?.(block) ?? (block.config.imageUrl ? <img src={block.config.imageUrl} alt={block.config.imageAlt ?? ""}/> : <div className="site-image-placeholder">Añade una imagen</div>)}</div>
        <div className="site-copy"><HeadingTag>{entry(heading, "site-heading")}</HeadingTag><p>{entry(body, "site-body")}</p></div>
      </div>
    </section>
  );

  if (block.type === "cards") return (
    <section className="site-block site-block-cards"><div className="site-block-inner">
      <HeadingTag>{entry(heading, "site-heading")}</HeadingTag>
      <div className="site-card-grid">{(block.config.items ?? []).map((item) => <article className="site-card" key={item.id}>
        <h3>{renderCardText?.(block, item.id, "title", item.title, "site-card-title") ?? item.title}</h3>
        <p>{renderCardText?.(block, item.id, "body", item.body, "site-card-body") ?? item.body}</p>
      </article>)}</div>
    </div></section>
  );

  return (
    <section className="site-block site-block-cta"><div className="site-block-inner site-cta-inner">
      <div><HeadingTag>{entry(heading, "site-heading")}</HeadingTag><p>{entry(body, "site-body")}</p></div>
      <a className="site-cta-button" href={buttonUrl}>{entry(buttonLabel, "site-button-label")}</a>
    </div></section>
  );
}

export function SiteDocument({ blocks }: { blocks: EditorBlock[] }) {
  return <div className="site-document">{blocks.map((block) => <PageBlockRenderer block={block} key={block.id}/>)}</div>;
}
