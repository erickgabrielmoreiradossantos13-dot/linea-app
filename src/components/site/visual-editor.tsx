/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Check, Clock, Copy, Eye, History, Image as ImageIcon, Loader2, Monitor, Pencil, Plus, Redo2, RotateCcw, Save, Send, Settings2, Smartphone, Trash2, Undo2, X } from "lucide-react";
import type { BlockConfig, EditorBlock, EditorData, EditorEntry } from "@/features/editor/types";
import { PageBlockRenderer } from "@/components/site/page-block-renderer";
import { addBlock, duplicateBlock, moveBlock, publishWebsite, removeBlock, restoreOriginal, restoreVersion, saveBlockDraftConfig, saveContentDraft, savePageSeoDraft, scheduleSitePublish, selectBlockImage, uploadEditorImage, type EditorActionResult } from "@/app/(app)/site/[id]/edit/actions";

type Change =
  | { kind: "entry"; entryId: string; before: string; after: string }
  | { kind: "config"; blockId: string; before: BlockConfig; after: BlockConfig };

const blockLabels = { text: "Texto", image_text: "Imagen + texto", cards: "Tarjetas", cta: "Llamada a la acción" } as const;

function cleanConfig(config: BlockConfig): BlockConfig {
  const stored = { ...config };
  delete stored.imageUrl;
  delete stored.imageAlt;
  return stored;
}

export function VisualEditor({ data }: { data: EditorData }) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(data.blocks);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [message, setMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mediaBlockId, setMediaBlockId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Change[]>([]);
  const [redoStack, setRedoStack] = useState<Change[]>([]);
  const editStarts = useRef(new Map<string, string>());
  const [pending, startTransition] = useTransition();

  const run = (operation: () => Promise<EditorActionResult>, refresh = true) => {
    setStatus("saving"); setMessage(null);
    startTransition(async () => {
      const result = await operation();
      if (result.error) { setStatus("error"); setMessage(result.error); return; }
      setStatus("saved"); setMessage(result.success ?? null);
      if (result.warnings) setWarnings(result.warnings);
      if (refresh) router.refresh();
    });
  };

  const updateEntryLocal = (entryId: string, value: string) => setBlocks((current) => current.map((block) => ({ ...block, entries: block.entries.map((entry) => entry.id === entryId ? { ...entry, value } : entry) })));

  const persistChange = (change: Change, target: "before" | "after") => {
    const value = change[target]; setStatus("saving");
    startTransition(async () => {
      const result = change.kind === "entry" ? await saveContentDraft({ entryId: change.entryId, value: value as string }) : await saveBlockDraftConfig({ blockId: change.blockId, config: cleanConfig(value as BlockConfig) });
      setStatus(result.error ? "error" : "saved"); if (result.error) setMessage(result.error);
    });
  };

  const undo = () => {
    const change = undoStack.at(-1); if (!change) return;
    setUndoStack((stack) => stack.slice(0, -1)); setRedoStack((stack) => [...stack, change]);
    if (change.kind === "entry") updateEntryLocal(change.entryId, change.before);
    else setBlocks((current) => current.map((block) => block.id === change.blockId ? { ...block, config: change.before } : block));
    persistChange(change, "before");
  };

  const redo = () => {
    const change = redoStack.at(-1); if (!change) return;
    setRedoStack((stack) => stack.slice(0, -1)); setUndoStack((stack) => [...stack, change]);
    if (change.kind === "entry") updateEntryLocal(change.entryId, change.after);
    else setBlocks((current) => current.map((block) => block.id === change.blockId ? { ...block, config: change.after } : block));
    persistChange(change, "after");
  };

  const editableText = (entry: EditorEntry, className: string) => <span className={`${className} ${mode === "edit" && data.canEdit ? "inline-editable" : ""}`} contentEditable={mode === "edit" && data.canEdit} suppressContentEditableWarning role={mode === "edit" ? "textbox" : undefined} aria-label={`Editar ${entry.label}`} onFocus={() => editStarts.current.set(entry.id, entry.value)} onInput={(event) => updateEntryLocal(entry.id, event.currentTarget.textContent ?? "")} onBlur={(event) => {
    const after = event.currentTarget.textContent ?? ""; const before = editStarts.current.get(entry.id) ?? entry.value;
    if (after === before) return; const change: Change = { kind: "entry", entryId: entry.id, before, after };
    setUndoStack((stack) => [...stack, change]); setRedoStack([]); persistChange(change, "after");
  }}>{entry.value}</span>;

  const editableCardText = (block: EditorBlock, itemId: string, field: "title" | "body", value: string, className: string) => {
    const key = `${block.id}:${itemId}:${field}`;
    return <span className={`${className} ${mode === "edit" && data.canEdit ? "inline-editable" : ""}`} contentEditable={mode === "edit" && data.canEdit} suppressContentEditableWarning role={mode === "edit" ? "textbox" : undefined} aria-label={`Editar ${field === "title" ? "título" : "texto"} de tarjeta`} onFocus={() => editStarts.current.set(key, value)} onInput={(event) => {
      const nextValue = event.currentTarget.textContent ?? "";
      setBlocks((current) => current.map((candidate) => candidate.id !== block.id ? candidate : ({ ...candidate, config: { ...candidate.config, items: (candidate.config.items ?? []).map((item) => item.id === itemId ? { ...item, [field]: nextValue } : item) } })));
    }} onBlur={(event) => {
      const afterText = event.currentTarget.textContent ?? ""; const beforeText = editStarts.current.get(key) ?? value; if (afterText === beforeText) return;
      const currentBlock = blocks.find((candidate) => candidate.id === block.id) ?? block;
      const change: Change = { kind: "config", blockId: block.id, before: block.config, after: currentBlock.config };
      setUndoStack((stack) => [...stack, change]); setRedoStack([]); persistChange(change, "after");
    }}>{value}</span>;
  };

  const updateCards = (block: EditorBlock, action: "add" | "remove", itemId?: string) => {
    const before = block.config;
    const items = action === "add" ? [...(block.config.items ?? []), { id: crypto.randomUUID(), title: "Nuevo beneficio", body: "Describe este punto." }] : (block.config.items ?? []).filter((item) => item.id !== itemId);
    const after = { ...block.config, items };
    setBlocks((current) => current.map((candidate) => candidate.id === block.id ? { ...candidate, config: after } : candidate));
    const change: Change = { kind: "config", blockId: block.id, before, after };
    setUndoStack((stack) => [...stack, change]); setRedoStack([]); persistChange(change, "after");
  };

  const renderImage = (block: EditorBlock) => <div className="editor-image-wrap">{block.config.imageUrl ? <img src={block.config.imageUrl} alt={block.config.imageAlt ?? ""}/> : <div className="site-image-placeholder"><ImageIcon size={34}/><span>Añade una imagen</span></div>}{mode === "edit" && data.canEdit && <button className="editor-image-action" onClick={() => setMediaBlockId(block.id)}><ImageIcon size={15}/> Reemplazar imagen</button>}</div>;

  const publish = (acceptWarnings = false) => {
    setStatus("saving"); setWarnings([]); setMessage(null);
    startTransition(async () => {
      const result = await publishWebsite({ websiteId: data.website.id, acceptWarnings });
      if (result.requiresConfirmation) { setWarnings(result.warnings ?? []); setStatus("saved"); return; }
      setStatus(result.error ? "error" : "saved"); setMessage(result.error ?? result.success ?? null); if (!result.error) router.refresh();
    });
  };

  const publicPath = data.currentPage?.path === "/" ? "" : data.currentPage?.path ?? "";

  return <div className="visual-editor">
    <div className="editor-toolbar" role="toolbar" aria-label="Herramientas del editor">
      <div className="editor-toolbar-group"><Link href="/site" className="editor-back">Línea <strong>Editor</strong></Link><select aria-label="Página" value={data.currentPage?.id} onChange={(event) => router.push(`/site/${data.website.id}/edit?page=${event.target.value}`)}>{data.pages.map((page) => <option value={page.id} key={page.id}>{page.path === "/" ? "Inicio" : page.path}</option>)}</select>{data.hasDraft && <span className="draft-badge">Borrador</span>}</div>
      <div className="editor-toolbar-group editor-toolbar-center"><button aria-label="Deshacer" disabled={!undoStack.length || pending} onClick={undo}><Undo2 size={17}/></button><button aria-label="Rehacer" disabled={!redoStack.length || pending} onClick={redo}><Redo2 size={17}/></button><button className={historyOpen ? "active" : ""} onClick={() => setHistoryOpen((open) => !open)}><History size={16}/> Historial</button><span className={`save-indicator ${status}`} aria-live="polite">{status === "saving" ? <><Loader2 className="spin" size={14}/> Guardando</> : status === "error" ? <><AlertTriangle size={14}/> Error</> : <><Check size={14}/> Guardado</>}</span></div>
      <div className="editor-toolbar-group"><div className="editor-segmented"><button className={mode === "edit" ? "active" : ""} onClick={() => setMode("edit")}><Pencil size={15}/> Editar</button><button className={mode === "preview" ? "active" : ""} onClick={() => setMode("preview")}><Eye size={15}/> Preview</button></div><div className="editor-segmented"><button aria-label="Vista escritorio" className={viewport === "desktop" ? "active" : ""} onClick={() => setViewport("desktop")}><Monitor size={16}/></button><button aria-label="Vista móvil" className={viewport === "mobile" ? "active" : ""} onClick={() => setViewport("mobile")}><Smartphone size={16}/></button></div><button onClick={() => setSettingsOpen((open) => !open)} aria-label="Ajustes de página"><Settings2 size={17}/></button>{data.canPublish && <button className="editor-publish" onClick={() => publish()} disabled={pending}><Send size={15}/> Publicar</button>}</div>
    </div>

    {(message || warnings.length > 0) && <div className={`editor-notice ${status === "error" ? "error" : ""}`}><div>{warnings.length > 0 ? <><strong>Checklist antes de publicar</strong><ul>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></> : message}</div>{warnings.length > 0 && data.canPublish && <button onClick={() => publish(true)} disabled={pending}>Publicar de todos modos</button>}<button aria-label="Cerrar aviso" onClick={() => { setMessage(null); setWarnings([]); }}><X size={15}/></button></div>}

    <div className="editor-workspace">
      {historyOpen && <aside className="editor-side-panel"><div className="editor-panel-title"><div><small>Versiones</small><h2>Historial</h2></div><button onClick={() => setHistoryOpen(false)} aria-label="Cerrar historial"><X size={17}/></button></div><button className="editor-panel-action" disabled={!data.canEdit || pending} onClick={() => run(() => restoreOriginal(data.website.id))}><RotateCcw size={15}/> Restaurar última publicación</button><div className="editor-history-list">{data.history.map((item) => <article key={item.id}><Clock size={15}/><div><strong>{item.label}</strong><time>{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time>{item.versionId && data.canEdit && <button onClick={() => run(() => restoreVersion({ websiteId: data.website.id, versionId: item.versionId! }))}>Recuperar como borrador</button>}</div></article>)}{data.history.length === 0 && <p className="editor-empty-copy">El primer punto del historial aparecerá al publicar.</p>}</div></aside>}
      <main className="editor-stage"><div className="editor-stage-meta"><span>{data.website.domain} · {data.currentPage?.path}</span><Link href={`/sites/${data.website.id}${publicPath}`} target="_blank">Abrir versión publicada</Link></div><div className={`editor-frame ${viewport}`}><div className="site-document">{blocks.map((block, index) => <div className={`editor-block ${mode === "edit" ? "is-editing" : ""}`} key={block.id}>{mode === "edit" && data.canEdit && <div className="editor-block-controls"><span>{blockLabels[block.type]}</span><button aria-label="Subir bloque" disabled={index === 0 || pending} onClick={() => run(() => moveBlock({ blockId: block.id, direction: "up" }))}><ArrowUp size={15}/></button><button aria-label="Bajar bloque" disabled={index === blocks.length - 1 || pending} onClick={() => run(() => moveBlock({ blockId: block.id, direction: "down" }))}><ArrowDown size={15}/></button><button aria-label="Duplicar bloque" disabled={pending} onClick={() => run(() => duplicateBlock(block.id))}><Copy size={15}/></button><button aria-label="Eliminar bloque" disabled={pending} onClick={() => run(() => removeBlock(block.id))}><Trash2 size={15}/></button></div>}<PageBlockRenderer block={block} renderEntry={editableText} renderImage={renderImage} renderCardText={editableCardText}/>{block.type === "cards" && mode === "edit" && data.canEdit && <div className="editor-card-actions"><button onClick={() => updateCards(block, "add")}><Plus size={14}/> Añadir tarjeta</button>{(block.config.items?.length ?? 0) > 1 && <select aria-label="Eliminar tarjeta" defaultValue="" onChange={(event) => { if (event.target.value) updateCards(block, "remove", event.target.value); event.target.value = ""; }}><option value="" disabled>Eliminar tarjeta…</option>{block.config.items?.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select>}</div>}</div>)}{blocks.length === 0 && <div className="editor-canvas-empty"><Plus size={28}/><h2>Construye esta página</h2><p>Añade el primer bloque y edita su contenido directamente.</p></div>}</div></div>{mode === "edit" && data.canEdit && <div className="editor-add-block"><span><Plus size={15}/> Añadir bloque</span>{(Object.keys(blockLabels) as (keyof typeof blockLabels)[]).map((type) => <button disabled={pending} key={type} onClick={() => run(() => addBlock({ pageId: data.currentPage!.id, type }))}>{blockLabels[type]}</button>)}</div>}</main>
      {settingsOpen && data.currentPage && <aside className="editor-side-panel editor-side-right"><div className="editor-panel-title"><div><small>Página</small><h2>SEO y publicación</h2></div><button onClick={() => setSettingsOpen(false)} aria-label="Cerrar ajustes"><X size={17}/></button></div><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run(() => savePageSeoDraft({ pageId: data.currentPage!.id, title: String(form.get("title")), metaDescription: String(form.get("metaDescription")), isIndexable: form.get("isIndexable") === "on" }), false); }}><label>Título SEO<input name="title" defaultValue={data.currentPage.title} required/></label><label>Meta description<textarea name="metaDescription" defaultValue={data.currentPage.metaDescription} maxLength={320}/></label><label className="editor-checkbox"><input type="checkbox" name="isIndexable" defaultChecked={data.currentPage.isIndexable}/> Permitir indexación</label><button className="editor-panel-action" disabled={!data.canEdit || pending}><Save size={15}/> Guardar borrador</button></form>{data.canPublish && <form className="editor-schedule" onSubmit={(event) => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get("publishAt")); run(() => scheduleSitePublish({ websiteId: data.website.id, publishAt: new Date(value).toISOString() }), false); }}><label>Publicación programada<input name="publishAt" type="datetime-local" required/></label><button className="editor-panel-action" disabled={pending}><Clock size={15}/> Programar</button>{data.website.publishAt && <p>Programada: {new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.website.publishAt))}</p>}</form>}</aside>}
    </div>

    {mediaBlockId && <div className="editor-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMediaBlockId(null); }}><section className="editor-media-modal" role="dialog" aria-modal="true" aria-labelledby="media-title"><div className="editor-panel-title"><div><small>Imagen del bloque</small><h2 id="media-title">Reemplazar imagen</h2></div><button onClick={() => setMediaBlockId(null)} aria-label="Cerrar"><X size={18}/></button></div><form className="editor-upload-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); form.set("blockId", mediaBlockId); run(() => uploadEditorImage(form)); setMediaBlockId(null); }}><label>Archivo<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required/></label><label>Texto alternativo<input name="altText" maxLength={500} placeholder="Describe lo que aporta la imagen"/></label><button className="editor-publish" disabled={pending}><ImageIcon size={15}/> Optimizar y usar</button></form><div className="editor-media-divider"><span>o elige de la biblioteca</span></div><div className="editor-media-grid">{data.media.map((item) => <button key={item.id} disabled={!item.url || pending} onClick={() => { run(() => selectBlockImage({ blockId: mediaBlockId, mediaId: item.id })); setMediaBlockId(null); }}><span>{item.url ? <img src={item.url} alt={item.altText ?? ""}/> : <ImageIcon/>}</span><strong>{item.filename}</strong><small>{item.altText || "Sin texto alternativo"}</small></button>)}{data.media.length === 0 && <p className="editor-empty-copy">Todavía no hay imágenes en la biblioteca.</p>}</div></section></div>}
  </div>;
}
