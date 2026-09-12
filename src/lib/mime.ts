const imageMimeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export function mimeForPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return imageMimeByExtension[extension] ?? null;
}

export function isSupportedImageMime(value: string): value is "image/jpeg" | "image/png" | "image/webp" | "image/avif" {
  return Object.values(imageMimeByExtension).includes(value);
}
