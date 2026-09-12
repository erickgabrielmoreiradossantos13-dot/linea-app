import { ActionForm } from "@/components/action-form";
import { Image as ImageIcon, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getSessionContext } from "@/features/session/context";
import { getMedia } from "@/features/media/data";
import { canEditContent } from "@/lib/authz";
import { archiveMediaAction, updateMediaAltAction, uploadMediaAction } from "./actions";
import { requireFeature } from "@/lib/features";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MediaPage() {
  const session = await getSessionContext();
  requireFeature(session, "media");
  const media = await getMedia(session);
  const editable = canEditContent(session.role);

  return (
    <div>
      <PageHeader eyebrow="Biblioteca" title="Biblioteca" description="Imágenes de tu negocio, organizadas y accesibles para tu equipo."/>
      {editable && (
        <ActionForm action={uploadMediaAction} className="panel mb-5 grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="text-sm font-bold">Imagen<input name="file" className="input mt-1.5 py-2" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required/><span className="mt-1 block text-xs muted">Se redimensiona y convierte automáticamente a WebP.</span></label>
          <label className="text-sm font-bold">Texto alternativo<input name="altText" className="input mt-1.5" placeholder="Describe la imagen"/></label>
          <button className="btn btn-primary inline-flex items-center gap-2"><Upload size={15}/> Subir imagen</button>
        </ActionForm>
      )}
      {media.length === 0 ? (
        <div className="panel grid min-h-72 place-items-center p-8 text-center">
          <div><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-neutral-100"><ImageIcon/></div><h2 className="mt-4 font-black">Tu biblioteca empieza aquí</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">JPEG, PNG, WebP o AVIF. Hasta 12 MB; se optimizan al subir.</p></div>
        </div>
      ) : (
        <div className="panel table-wrap"><table><thead><tr><th>Archivo</th><th>Formato</th><th>Tamaño</th><th>Texto alternativo</th><th>Acciones</th></tr></thead><tbody>
          {media.map(item => <tr key={item.id}><td><div className="font-bold">{item.filename}</div><div className="mt-1 text-xs muted">{new Intl.DateTimeFormat("es-ES",{dateStyle:"medium"}).format(new Date(item.createdAt))}</div></td><td>{item.mimeType}</td><td>{formatBytes(item.bytes)}</td><td>{editable ? <ActionForm action={updateMediaAltAction} className="flex min-w-72 gap-2"><input type="hidden" name="id" value={item.id}/><input name="altText" className="input" defaultValue={item.altText ?? ""} placeholder="Describe la imagen"/><button className="btn">Guardar</button></ActionForm> : <span className="muted">{item.altText ?? "—"}</span>}</td><td><div className="flex gap-2">{item.previewUrl && <a className="btn" href={item.previewUrl} target="_blank" rel="noreferrer">Ver</a>}{editable && <ActionForm action={archiveMediaAction}><input type="hidden" name="id" value={item.id}/><button className="btn">Retirar</button></ActionForm>}</div></td></tr>)}
        </tbody></table></div>
      )}
    </div>
  );
}
