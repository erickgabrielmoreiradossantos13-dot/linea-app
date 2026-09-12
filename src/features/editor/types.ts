import type { Role } from "@/lib/types";
import type { ImportedBlockValue } from "@/features/site-import/parser";

export type BlockType = "text" | "image_text" | "cards" | "cta" | "html_text" | "html_image" | "html_list";

export type CardItem = { id: string; title: string; body: string };

export type BlockConfig = {
  eyebrow?: string;
  headingLevel?: "h1" | "h2";
  imageId?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imagePosition?: "left" | "right";
  items?: CardItem[];
  tone?: "light" | "accent";
};

export type EditorEntry = {
  id: string;
  key: string;
  label: string;
  kind: string;
  value: string;
};

export type EditorBlock = {
  id: string;
  type: BlockType;
  position: number;
  config: BlockConfig;
  entries: EditorEntry[];
  isPublished: boolean;
  hasUnpublishedChanges: boolean;
  selector: string | null;
  importedValue: ImportedBlockValue | null;
};

export type EditorPage = {
  id: string;
  path: string;
  title: string;
  metaDescription: string;
  isIndexable: boolean;
  hasUnpublishedChanges: boolean;
  editorMode: "BLOCKS" | "IMPORTED";
  updatedAt: string;
};

export type EditorMedia = {
  id: string;
  filename: string;
  altText: string | null;
  url: string | null;
};

export type EditorHistoryEntry = {
  id: number;
  action: string;
  label: string;
  versionId: string | null;
  createdAt: string;
};

export type EditorData = {
  website: {
    id: string;
    name: string;
    domain: string;
    publishedAt: string | null;
    publishAt: string | null;
    sourceMode: "BLOCKS" | "IMPORTED";
  };
  pages: EditorPage[];
  currentPage: EditorPage | null;
  blocks: EditorBlock[];
  media: EditorMedia[];
  history: EditorHistoryEntry[];
  role: Role;
  canEdit: boolean;
  canPublish: boolean;
  hasDraft: boolean;
};
