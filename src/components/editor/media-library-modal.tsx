"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, Trash2, ImageOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { MEDIA_BUCKET } from "@/lib/media-constants";
import { registerMediaAsset, deleteMediaAsset } from "@/app/dashboard/website/edit/media-actions";
import { Button } from "@/components/ui/button";
import type { MediaAsset } from "@/lib/types";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface LocalAsset {
  id: string;
  url: string;
  filename: string;
  isSessionOnly: boolean;
  storagePath?: string;
}

interface MediaLibraryModalProps {
  businessId: string;
  initialAssets: MediaAsset[];
  onSelect: (url: string) => void;
  onClose: () => void;
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(file);
  });
}

export function MediaLibraryModal({
  businessId,
  initialAssets,
  onSelect,
  onClose,
}: MediaLibraryModalProps) {
  const [assets, setAssets] = useState<LocalAsset[]>(
    initialAssets.map((a) => ({ id: a.id, url: a.url, filename: a.filename, isSessionOnly: false, storagePath: a.storage_path }))
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Solo se admiten archivos de imagen.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("La imagen pesa demasiado (máximo 5 MB).");
      return;
    }

    const { width, height } = await getImageDimensions(file);
    if (width && height && (width / height > 4 || height / width > 4)) {
      setError("Esta imagen tiene una proporción poco habitual para este espacio, pero puedes usarla igualmente.");
    }

    setUploading(true);
    try {
      if (IS_DEMO_MODE) {
        const url = URL.createObjectURL(file);
        setAssets((prev) => [
          { id: `session-${Date.now()}`, url, filename: file.name, isSessionOnly: true },
          ...prev,
        ]);
      } else {
        const supabase = createClient();
        const path = `${businessId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
        const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

        await registerMediaAsset({
          businessId,
          storagePath: path,
          url: publicUrl,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          width: width || null,
          height: height || null,
        });

        setAssets((prev) => [
          { id: path, url: publicUrl, filename: file.name, isSessionOnly: false, storagePath: path },
          ...prev,
        ]);
      }
    } catch {
      setError("No se pudo subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(asset: LocalAsset) {
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    if (!asset.isSessionOnly && asset.storagePath) {
      try {
        await deleteMediaAsset(asset.id, asset.storagePath);
      } catch {
        // el elemento ya se quitó de la vista; un fallo aquí no bloquea al usuario
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-popover">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-ink-900">Biblioteca de imágenes</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-ink-100 p-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <Button variant="secondary" onClick={() => inputRef.current?.click()} loading={uploading}>
            <Upload className="h-4 w-4" /> Subir imagen
          </Button>
          {IS_DEMO_MODE && (
            <p className="mt-2 text-xs text-ink-400">
              Modo demo: las imágenes que subas solo se ven en esta sesión, no se guardan de forma permanente.
            </p>
          )}
          {error && <p className="mt-2 text-xs text-amber-600">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-ink-400">
              <ImageOff className="h-8 w-8" strokeWidth={1.5} />
              <p className="mt-3 text-sm">Todavía no hay imágenes en tu biblioteca.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-ink-100"
                >
                  <button
                    onClick={() => onSelect(asset.url)}
                    className="absolute inset-0 h-full w-full"
                    title={asset.filename}
                  >
                    <Image
                      src={asset.url}
                      alt={asset.filename}
                      fill
                      sizes="150px"
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized={asset.isSessionOnly}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(asset)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-950/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
