"use client";

import { Upload } from "tus-js-client";

const CHUNK_BYTES = 6 * 1024 * 1024;
const STALL_TIMEOUT_MS = 120_000;

export type SiteUploadProgress = {
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
};

export type SiteUploadController = {
  done: Promise<void>;
  abort: () => Promise<void>;
};

export function getSupabaseTusEndpoint(supabaseUrl: string) {
  const endpoint = new URL(supabaseUrl);
  if (endpoint.hostname.endsWith(".supabase.co") && !endpoint.hostname.includes(".storage.supabase.co")) {
    endpoint.hostname = endpoint.hostname.replace(/\.supabase\.co$/, ".storage.supabase.co");
  }
  endpoint.pathname = "/storage/v1/upload/resumable";
  endpoint.search = "";
  endpoint.hash = "";
  return endpoint.toString().replace(/\/$/, "");
}

export function startResumableSiteUpload(input: {
  file: File;
  storagePath: string;
  supabaseUrl: string;
  publishableKey: string;
  accessToken: string;
  onProgress: (progress: SiteUploadProgress) => void;
}): SiteUploadController {
  let upload: Upload;
  let settled = false;
  let rejectDone: (reason: Error) => void = () => undefined;
  let lastProgressAt = Date.now();
  let stallTimer: ReturnType<typeof setInterval> | undefined;

  const cleanup = () => {
    if (stallTimer) clearInterval(stallTimer);
    stallTimer = undefined;
  };

  const done = new Promise<void>((resolve, reject) => {
    rejectDone = reject;
    upload = new Upload(input.file, {
      endpoint: getSupabaseTusEndpoint(input.supabaseUrl),
      chunkSize: CHUNK_BYTES,
      retryDelays: [0, 1_000, 3_000, 5_000, 10_000, 20_000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      storeFingerprintForResuming: true,
      fingerprint: async () => [
        "linea-site",
        input.storagePath,
        input.file.name,
        input.file.size,
        input.file.lastModified,
      ].join("-"),
      headers: {
        authorization: `Bearer ${input.accessToken}`,
        apikey: input.publishableKey,
        "x-upsert": "false",
      },
      metadata: {
        bucketName: "sites",
        objectName: input.storagePath,
        contentType: "application/zip",
        cacheControl: "3600",
      },
      onProgress(bytesUploaded, bytesTotal) {
        lastProgressAt = Date.now();
        input.onProgress({
          bytesUploaded,
          bytesTotal,
          percentage: bytesTotal ? Math.round((bytesUploaded / bytesTotal) * 100) : 0,
        });
      },
      onError(error) {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error instanceof Error ? error : new Error("O upload foi interrompido."));
      },
      onSuccess() {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      },
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (settled) return;
      if (previousUploads[0]) upload.resumeFromPreviousUpload(previousUploads[0]);
      upload.start();
    }).catch((error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error instanceof Error ? error : new Error("Não foi possível preparar o upload."));
    });
  });

  stallTimer = setInterval(() => {
    if (settled || Date.now() - lastProgressAt < STALL_TIMEOUT_MS) return;
    settled = true;
    cleanup();
    void upload.abort(false);
    rejectDone(new Error("O upload ficou sem progresso por 2 minutos. Verifica a ligação e tenta novamente."));
  }, 5_000);

  return {
    done,
    async abort() {
      if (settled) return;
      settled = true;
      cleanup();
      await upload.abort(true);
      rejectDone(new Error("Upload cancelado."));
    },
  };
}
