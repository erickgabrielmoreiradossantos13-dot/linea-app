"use client";
import { useActionState } from "react";
export type ActionResult = { error?: string; success?: string } | void;
export function ActionForm({action,children,className}:{action:(data:FormData)=>Promise<ActionResult>;children:React.ReactNode;className?:string}) {
  const [state,formAction,pending]=useActionState(async (_:ActionResult,data:FormData)=>action(data),undefined);
  return <form action={formAction} className={className} aria-busy={pending}>
    <fieldset className="action-fieldset" disabled={pending}>{children}</fieldset>
    {pending&&<div className="form-status" role="status">Guardando…</div>}
    {state?.error&&<div className="form-status error" role="alert">{state.error}</div>}
    {state?.success&&<div className="form-status success" role="status">{state.success}</div>}
  </form>;
}
