"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { addLeadNoteAction } from "@/app/dashboard/leads/actions";
import { formatDate } from "@/lib/utils";
import type { LeadNote } from "@/lib/types";

export function LeadNotes({ leadId, initialNotes }: { leadId: string; initialNotes: LeadNote[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    const text = draft.trim();
    if (!text) return;

    startTransition(async () => {
      const result = await addLeadNoteAction(leadId, text);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotes((prev) => [
        { id: `local-${Date.now()}`, lead_id: leadId, business_id: "", author_email: "Tú", note: text, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setDraft("");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Añade una nota sobre este contacto…"
          rows={2}
          className="flex-1"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !draft.trim()}
          className="inline-flex h-fit items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Guardar
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {notes.length === 0 ? (
        <p className="text-sm text-ink-400">Todavía no hay notas sobre este contacto.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-ink-100 bg-ink-50/40 p-3.5">
              <p className="whitespace-pre-wrap text-sm text-ink-900">{note.note}</p>
              <p className="mt-1.5 text-xs text-ink-400">
                {note.author_email ?? "Línea Sur"} · {formatDate(note.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
