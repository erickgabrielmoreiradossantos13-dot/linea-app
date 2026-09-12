"use client";

import { useEffect, useRef } from "react";
import { mutateImportedBlock, removeImportedListItemAction } from "@/app/(app)/site/[id]/edit/actions";
import type { EditorActionResult } from "@/app/(app)/site/[id]/edit/actions";
import type { EditorData } from "@/features/editor/types";

export type ImportedMediaTarget = { blockId: string; itemId?: string; fieldId?: string };
export type ImportedTextChange = { blockId: string; itemId?: string; fieldId?: string; before: string; after: string };

type BridgeMessage = {
  source?: string;
  type?: string;
  blockId?: string;
  itemId?: string;
  fieldId?: string;
  action?: "up" | "down" | "duplicate" | "remove";
  before?: string;
  value?: string;
};

export function ImportedSiteCanvas({
  data,
  mode,
  viewport,
  pending,
  run,
  onTextChange,
  onImage,
}: {
  data: EditorData;
  mode: "edit" | "preview";
  viewport: "desktop" | "mobile";
  pending: boolean;
  run: (operation: () => Promise<EditorActionResult>, refresh?: boolean) => void;
  onTextChange: (change: ImportedTextChange) => void;
  onImage: (target: ImportedMediaTarget) => void;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const page = data.currentPage;

  useEffect(() => {
    function receive(event: MessageEvent<BridgeMessage>) {
      if (event.source !== iframe.current?.contentWindow || event.data?.source !== "linea-editor") return;
      const message = event.data;
      if (!message.blockId) return;
      if (message.type === "save-text" && typeof message.value === "string") {
        onTextChange({ blockId: message.blockId, itemId: message.itemId, fieldId: message.fieldId, before: message.before ?? "", after: message.value });
      } else if (message.type === "pick-image") {
        onImage({ blockId: message.blockId, itemId: message.itemId, fieldId: message.fieldId });
      } else if (message.type === "block-action" && message.action) {
        run(() => mutateImportedBlock({ blockId: message.blockId!, action: message.action! }));
      } else if (message.type === "remove-list-item" && message.itemId) {
        run(() => removeImportedListItemAction({ blockId: message.blockId!, itemId: message.itemId! }));
      }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onImage, onTextChange, run]);

  if (!page) return null;
  const src = `/api/editor-preview/${data.website.id}/${page.id}?edit=${mode === "edit" && data.canEdit ? "1" : "0"}&v=${encodeURIComponent(page.updatedAt)}`;
  return <div className={`editor-frame imported ${viewport}`}>
    <iframe
      ref={iframe}
      key={src}
      src={src}
      title={`Editor de ${page.title}`}
      sandbox="allow-scripts allow-forms allow-popups allow-modals"
      aria-busy={pending}
    />
  </div>;
}
