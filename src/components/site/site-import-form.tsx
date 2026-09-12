"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleStop, FileArchive, Loader2, RefreshCw, Upload } from "lucide-react";
import {
  beginSiteImport,
  cancelSiteImport,
  finishSiteImport,
  reportSiteImportFailure,
} from "@/app/(app)/site/actions";
import { startResumableSiteUpload, type SiteUploadController } from "@/features/site-import/resumable-upload";
import { createSupabaseBrowserClient, getSupabaseBrowserConfig } from "@/lib/supabase/browser";

type ImportStatus = "idle" | "uploading" | "processing" | "cancelling";
type ActiveImport = { websiteId: string; importId: string };

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes}m ${String(remainder).padStart(2, "0")}s` : `${remainder}s`;
}

function readableUploadError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "Upload cancelado.") return message;
  if (/401|403|unauthorized|jwt/i.test(message)) return "A sessão expirou. Recarrega a página, entra novamente e repete o upload.";
  if (/413|too large|maximum size/i.test(message)) return "O arquivo supera o limite aceito pelo Storage.";
  if (/network|fetch|offline|connection/i.test(message)) return "A ligação foi interrompida. O upload tentou retomar automaticamente, mas não conseguiu.";
  return message || "O upload falhou após várias tentativas automáticas.";
}

export function SiteImportForm({ websiteId }: { websiteId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<SiteUploadController | null>(null);
  const activeImport = useRef<ActiveImport | null>(null);
  const cancelled = useRef(false);
  const startedAt = useRef(0);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);

  useEffect(() => {
    if (status === "idle") return;
    const timer = setInterval(() => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt.current) / 1_000))), 1_000);
    return () => clearInterval(timer);
  }, [status]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = input.current?.files?.[0];
    if (!file) return setMessage("Escolhe o arquivo .zip do site.");
    if (!file.name.toLowerCase().endsWith(".zip") || file.size > 50 * 1024 * 1024) return setMessage("Usa um .zip de até 50 MB.");

    cancelled.current = false;
    startedAt.current = Date.now();
    setElapsed(0);
    setMessage(null);
    setProgress(0);
    setUploadedBytes(0);
    setTotalBytes(file.size);
    setStatus("uploading");

    let started: Awaited<ReturnType<typeof beginSiteImport>> | null = null;
    try {
      started = await beginSiteImport({ websiteId, filename: file.name, bytes: file.size });
      if (started.error || !started.storagePath || !started.importId) throw new Error(started.error ?? "Não foi possível iniciar o upload.");
      activeImport.current = { websiteId, importId: started.importId };

      const supabase = createSupabaseBrowserClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) throw new Error("A sessão expirou. Recarrega a página e entra novamente.");
      const config = getSupabaseBrowserConfig();
      const upload = startResumableSiteUpload({
        file,
        storagePath: started.storagePath,
        supabaseUrl: config.url,
        publishableKey: config.key,
        accessToken: sessionData.session.access_token,
        onProgress(next) {
          setUploadedBytes(next.bytesUploaded);
          setTotalBytes(next.bytesTotal);
          setProgress(next.percentage);
        },
      });
      controller.current = upload;
      await upload.done;
      controller.current = null;
      if (cancelled.current) return;

      setProgress(100);
      setStatus("processing");
      const finished = await finishSiteImport({ websiteId, importId: started.importId, storagePath: started.storagePath });
      if (finished.error) throw new Error(finished.error);

      setStatus("idle");
      setMessage(finished.success ?? "Site importado.");
      activeImport.current = null;
      if (input.current) input.current.value = "";
      setHasFile(false);
      router.push(`/site/${websiteId}/edit`);
      router.refresh();
    } catch (error) {
      controller.current = null;
      if (cancelled.current) return;
      const readable = readableUploadError(error);
      if (started?.importId) {
        await reportSiteImportFailure({ websiteId, importId: started.importId, message: readable }).catch(() => undefined);
      }
      activeImport.current = null;
      setStatus("idle");
      setMessage(readable);
    }
  }

  async function cancel() {
    if (status !== "uploading") return;
    cancelled.current = true;
    setStatus("cancelling");
    await controller.current?.abort().catch(() => undefined);
    controller.current = null;
    const current = activeImport.current;
    if (current) await cancelSiteImport(current).catch(() => undefined);
    activeImport.current = null;
    setProgress(0);
    setUploadedBytes(0);
    setStatus("idle");
    setMessage("Upload cancelado. Podes escolher o arquivo e tentar novamente.");
  }

  const busy = status !== "idle";
  const uploadRate = elapsed > 0 ? uploadedBytes / elapsed : 0;
  return <form className="panel p-5" onSubmit={submit}>
    <div className="flex items-start gap-3"><span className="rounded-xl bg-neutral-900 p-2.5 text-white"><FileArchive size={18}/></span><div><div className="kicker">Fluxo principal</div><h2 className="mt-1 text-lg font-black">Importar o site real</h2><p className="mt-1 text-sm text-neutral-500">Upload retomável em partes, com validação do ZIP e preservação do HTML, CSS e imagens originais.</p></div></div>
    <label className="mt-4 block text-sm font-bold">Arquivo do site<input ref={input} className="input mt-1.5" type="file" accept=".zip,application/zip" disabled={busy} required onChange={(event) => setHasFile(Boolean(event.currentTarget.files?.length))}/></label>
    {busy && <div className="mt-4 rounded-xl border border-neutral-700 bg-neutral-950/30 p-4" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs font-bold"><span>{status === "processing" ? "Processando o site" : status === "cancelling" ? "Cancelando" : `Enviando ${progress}%`}</span><span>{formatElapsed(elapsed)}</span></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-700"><span className={`block h-full bg-[#ff5f46] transition-all ${status === "processing" ? "animate-pulse" : ""}`} style={{ width: status === "processing" ? "100%" : `${progress}%` }}/></div>
      <p className="mt-3 flex items-center gap-2 text-sm text-neutral-300"><Loader2 className="spin" size={14}/>{status === "uploading" ? `${formatBytes(uploadedBytes)} de ${formatBytes(totalBytes)}${uploadRate ? ` · ${formatBytes(uploadRate)}/s` : ""} · retomada automática ativa` : status === "processing" ? "Extraindo, validando e criando os elementos editáveis. Em sites grandes pode demorar alguns minutos." : "Interrompendo o envio e limpando a tentativa…"}</p>
      {status === "uploading" && <button type="button" className="btn mt-3 inline-flex items-center gap-2" onClick={cancel}><CircleStop size={15}/> Cancelar upload</button>}
    </div>}
    {message && <div className="mt-3 rounded-xl border border-neutral-700 p-3 text-sm font-semibold" role="status"><p>{message}</p>{status === "idle" && hasFile ? <p className="mt-1 flex items-center gap-1 text-xs font-normal text-neutral-400"><RefreshCw size={12}/> O mesmo arquivo pode ser enviado novamente.</p> : null}</div>}
    <button className="btn btn-primary mt-4 inline-flex items-center gap-2" disabled={busy}>{busy ? <Loader2 className="spin" size={15}/> : <Upload size={15}/>} {busy ? "Importação em curso" : "Importar e preparar editor"}</button>
  </form>;
}
