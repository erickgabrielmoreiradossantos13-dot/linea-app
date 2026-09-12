"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileArchive, Loader2, Upload } from "lucide-react";
import { beginSiteImport, finishSiteImport } from "@/app/(app)/site/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SiteImportForm({ websiteId }: { websiteId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing">("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = input.current?.files?.[0];
    if (!file) return setMessage("Escolhe o arquivo .zip do site.");
    if (!file.name.toLowerCase().endsWith(".zip") || file.size > 50 * 1024 * 1024) return setMessage("Usa um .zip de até 50 MB.");
    setMessage(null);
    setProgress(5);
    setStatus("uploading");
    const started = await beginSiteImport({ websiteId, filename: file.name, bytes: file.size });
    if (started.error || !started.storagePath || !started.token || !started.importId) {
      setStatus("idle");
      return setMessage(started.error ?? "Não foi possível iniciar o upload.");
    }
    const supabase = createSupabaseBrowserClient();
    const { error: uploadError } = await supabase.storage.from("sites").uploadToSignedUrl(started.storagePath, started.token, file, {
      contentType: "application/zip",
    });
    if (uploadError) {
      setStatus("idle");
      return setMessage("O upload do ZIP falhou. Tenta novamente.");
    }
    setProgress(60);
    setStatus("processing");
    const finished = await finishSiteImport({ websiteId, importId: started.importId, storagePath: started.storagePath });
    setStatus("idle");
    if (finished.error) return setMessage(finished.error);
    setProgress(100);
    setMessage(finished.success ?? "Site importado.");
    if (input.current) input.current.value = "";
    router.push(`/site/${websiteId}/edit`);
    router.refresh();
  }

  const busy = status !== "idle";
  return <form className="panel p-5" onSubmit={submit}>
    <div className="flex items-start gap-3"><span className="rounded-xl bg-neutral-900 p-2.5 text-white"><FileArchive size={18}/></span><div><div className="kicker">Fluxo principal</div><h2 className="mt-1 text-lg font-black">Importar o site real</h2><p className="mt-1 text-sm text-neutral-500">Envia o .zip com HTML, CSS, scripts e imagens. Línea preserva o design e transforma o conteúdo em pontos editáveis.</p></div></div>
    <label className="mt-4 block text-sm font-bold">Arquivo do site<input ref={input} className="input mt-1.5" type="file" accept=".zip,application/zip" disabled={busy} required/></label>
    {busy && <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-neutral-200"><span className="block h-full bg-neutral-900 transition-all" style={{ width: `${progress}%` }}/></div><p className="mt-2 flex items-center gap-2 text-sm text-neutral-600"><Loader2 className="spin" size={14}/>{status === "uploading" ? "Enviando direto para o Storage…" : "Analisando HTML e criando os blocos editáveis…"}</p></div>}
    {message && <p className="mt-3 text-sm font-semibold" aria-live="polite">{message}</p>}
    <button className="btn btn-primary mt-4 inline-flex items-center gap-2" disabled={busy}>{busy ? <Loader2 className="spin" size={15}/> : <Upload size={15}/>} Importar e preparar editor</button>
  </form>;
}
