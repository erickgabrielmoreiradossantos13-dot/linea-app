"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

function buildSnippet(origin: string, siteId: string): string {
  return `<script>
(function () {
  var LINEA_ENDPOINT = "${origin}/api/track";
  var LINEA_LEAD_ENDPOINT = "${origin}/api/lead";
  var LINEA_SITE_ID = "${siteId}";

  function track(source) {
    navigator.sendBeacon
      ? navigator.sendBeacon(LINEA_ENDPOINT, new Blob([JSON.stringify({ site_id: LINEA_SITE_ID, source: source })], { type: "application/json" }))
      : fetch(LINEA_ENDPOINT, { method: "POST", body: JSON.stringify({ site_id: LINEA_SITE_ID, source: source }), keepalive: true });
  }

  var params = new URLSearchParams(window.location.search);
  track(params.get("utm_source") || document.referrer ? "referido" : "directo");

  // Marca cualquier formulario de contacto con data-linea-lead-form para
  // que Línea App registre el contacto automáticamente al enviarlo.
  document.addEventListener("submit", function (e) {
    var form = e.target.closest("[data-linea-lead-form]");
    if (!form) return;
    var data = Object.fromEntries(new FormData(form).entries());
    fetch(LINEA_LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site_id: LINEA_SITE_ID,
        name: data.name,
        phone: data.phone,
        email: data.email,
        service: data.service,
        source: "formulario",
        landing_page: window.location.pathname,
      }),
    });
  });
})();
</script>`;
}

export function TrackingSnippet({ siteId }: { siteId: string | null }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!siteId) {
    return (
      <p className="text-sm text-ink-500">
        Todavía no tienes una web conectada como proyecto. Pídele al equipo de Línea Sur que la dé de
        alta desde Sitios (equipo) para poder generar tu código de seguimiento.
      </p>
    );
  }

  const snippet = origin ? buildSnippet(origin, siteId) : "";

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-500">
        Pega este código antes de <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">{"</body>"}</code> en
        tu web para que Línea App reciba visitas y contactos reales.
      </p>
      <div className="relative">
        <pre className="max-h-64 overflow-auto rounded-lg bg-ink-950 p-4 text-xs leading-relaxed text-ink-100">
          {snippet}
        </pre>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(snippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-ink-400">
        Para que un formulario de contacto también genere un contacto en Línea App, añade el atributo{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5">data-linea-lead-form</code> a la etiqueta{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5">{"<form>"}</code> (con campos{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5">name</code>,{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5">phone</code>,{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5">email</code>).
      </p>
    </div>
  );
}
