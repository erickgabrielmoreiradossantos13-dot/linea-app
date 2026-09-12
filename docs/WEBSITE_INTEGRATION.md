# Integração de websites com a Línea App

O identificador `siteKey` identifica o website, mas **não deve ser tratado como segredo forte no browser**. O endpoint também valida o `Origin` contra `websites.allowed_origin`. Em produção, adicionar rate limiting no edge antes de expor em escala.

## Evento comercial

```js
const LINEA_APP = "https://app.seudominio.es";
const SITE_KEY = "site_key_do_website";

async function trackLinea(eventType) {
  await fetch(`${LINEA_APP}/api/public/events?siteKey=${encodeURIComponent(SITE_KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      siteKey: SITE_KEY,
      eventType,
      pagePath: location.pathname,
      sessionId: sessionStorage.getItem("linea_session") || undefined,
      source: new URLSearchParams(location.search).get("utm_source") || undefined,
      medium: new URLSearchParams(location.search).get("utm_medium") || undefined,
      campaign: new URLSearchParams(location.search).get("utm_campaign") || undefined,
    }),
  });
}

document.querySelector("[data-linea-whatsapp]")?.addEventListener("click", () => {
  void trackLinea("whatsapp_click");
});
```

## Envio de lead

```js
await fetch(`${LINEA_APP}/api/public/leads?siteKey=${encodeURIComponent(SITE_KEY)}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    siteKey: SITE_KEY,
    name: form.name.value,
    email: form.email.value || undefined,
    phone: form.phone.value || undefined,
    message: form.message.value || undefined,
    pagePath: location.pathname,
    source: "Website",
  }),
});
```

## Regras atuais

- `allowed_origin` deve estar configurado no website.
- A origem do browser deve corresponder exatamente ao valor configurado.
- `siteKey` precisa ser rotacionável.
- O serviço deve receber rate limiting antes de alto volume.
- Não enviar dados pessoais em eventos de analytics quando não forem necessários.
