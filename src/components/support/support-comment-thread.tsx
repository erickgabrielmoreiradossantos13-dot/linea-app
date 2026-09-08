"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { addSupportCommentAction } from "@/app/dashboard/support/actions";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SupportComment } from "@/lib/types";

export function SupportCommentThread({
  requestId,
  initialComments,
}: {
  requestId: string;
  initialComments: SupportComment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    const text = draft.trim();
    if (!text) return;

    startTransition(async () => {
      const result = await addSupportCommentAction(requestId, text);
      if (result.error) {
        setError(result.error);
        return;
      }
      setComments((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          request_id: requestId,
          business_id: "",
          author_email: "Tú",
          is_staff: false,
          comment: text,
          created_at: new Date().toISOString(),
        },
      ]);
      setDraft("");
    });
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-ink-400">Todavía no hay mensajes en esta solicitud.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className={cn(
                "rounded-lg border p-3.5 text-sm",
                c.is_staff ? "border-brand-100 bg-brand-50/50" : "border-ink-100 bg-ink-50/40"
              )}
            >
              <p className="whitespace-pre-wrap text-ink-900">{c.comment}</p>
              <p className="mt-1.5 text-xs text-ink-400">
                {c.is_staff ? "Línea Sur" : c.author_email ?? "Tú"} · {formatDate(c.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje…"
          rows={2}
          className="w-full flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition-all duration-150 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !draft.trim()}
          className="inline-flex h-fit items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Enviar
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
