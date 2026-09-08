export interface SeoCheck {
  id: string;
  label: string;
  passed: boolean;
  priority: "alta" | "media" | "baja";
  problem: string;
  impact: string;
  action: string;
}

export interface SeoAudit {
  analyzed: boolean;
  url: string | null;
  score: number;
  checks: SeoCheck[];
  error?: string;
}

function extractTag(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Auditoría SEO real (Fase SEO/GEO): descarga el HTML publicado de
 * `productionUrl` y analiza title/description/H1/alt/canonical/robots/
 * sitemap/schema con expresiones regulares (sin librerías de parsing HTML,
 * suficiente para las comprobaciones que necesitamos). Si el sitio no
 * responde, se informa honestamente en vez de inventar un resultado.
 */
export async function getSeoAudit(productionUrl: string | null): Promise<SeoAudit> {
  if (!productionUrl) {
    return { analyzed: false, url: null, score: 0, checks: [], error: "not_connected" };
  }

  let html: string;
  try {
    const res = await fetch(productionUrl, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!res.ok) {
      return { analyzed: false, url: productionUrl, score: 0, checks: [], error: `http_${res.status}` };
    }
    html = await res.text();
  } catch {
    return { analyzed: false, url: productionUrl, score: 0, checks: [], error: "fetch_failed" };
  }

  const title = extractTag(html, /<title[^>]*>([^<]*)<\/title>/i);
  const description = extractTag(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  const canonical = extractTag(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  const hasNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  const hasSchema = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);

  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const imgsWithAlt = imgTags.filter((tag) => /\balt=["'][^"']+["']/i.test(tag)).length;
  const altCoverage = imgTags.length > 0 ? imgsWithAlt / imgTags.length : 1;

  let robotsOk = false;
  let sitemapOk = false;
  try {
    const base = new URL(productionUrl);
    const [robotsRes, sitemapRes] = await Promise.all([
      fetch(new URL("/robots.txt", base), { signal: AbortSignal.timeout(5000), cache: "no-store" }).catch(
        () => null
      ),
      fetch(new URL("/sitemap.xml", base), { signal: AbortSignal.timeout(5000), cache: "no-store" }).catch(
        () => null
      ),
    ]);
    robotsOk = !!robotsRes?.ok;
    sitemapOk = !!sitemapRes?.ok;
  } catch {
    // si la URL base no es válida, ambos quedan en false (se reporta como pendiente, no como error fatal)
  }

  const checks: SeoCheck[] = [
    {
      id: "title",
      label: "Título de página (title)",
      passed: !!title && title.length >= 10 && title.length <= 60,
      priority: "alta",
      problem: title
        ? `El título tiene ${title.length} caracteres (recomendado: 10-60).`
        : "La página no tiene etiqueta <title>.",
      impact: "El título es lo primero que se ve en Google: si falta o es genérico, bajan los clics desde búsquedas.",
      action: "Escribe un título claro con tu servicio y ciudad, de 10 a 60 caracteres.",
    },
    {
      id: "description",
      label: "Meta descripción",
      passed: !!description && description.length >= 50 && description.length <= 160,
      priority: "alta",
      problem: description
        ? `La descripción tiene ${description.length} caracteres (recomendado: 50-160).`
        : "No hay meta descripción.",
      impact: "Es el texto que aparece bajo el título en Google. Sin ella, Google elige uno automático (peor conversión).",
      action: "Añade una descripción de 50-160 caracteres que resuma qué ofreces y a quién.",
    },
    {
      id: "h1",
      label: "Un único H1 por página",
      passed: h1Count === 1,
      priority: "media",
      problem: h1Count === 0 ? "No hay ningún H1." : `Hay ${h1Count} etiquetas H1 (debería haber exactamente 1).`,
      impact: "El H1 le dice a Google el tema principal de la página. Sin uno claro, cuesta más posicionar.",
      action: "Deja un único H1 con el mensaje principal de la página.",
    },
    {
      id: "alt",
      label: "Texto alternativo en imágenes",
      passed: altCoverage >= 0.8,
      priority: "media",
      problem: `${Math.round(altCoverage * 100)}% de las imágenes tienen texto alternativo.`,
      impact: "Las imágenes sin descripción no aportan a SEO de imágenes y son un problema de accesibilidad.",
      action: "Añade una descripción corta (alt) a cada imagen desde Mi Web.",
    },
    {
      id: "canonical",
      label: "URL canónica",
      passed: !!canonical,
      priority: "baja",
      problem: canonical ? "Configurada correctamente." : "No hay etiqueta canonical.",
      impact: "Evita que Google trate versiones duplicadas de la misma página como contenido distinto.",
      action: "Pide al equipo técnico que añada la etiqueta canonical (cambio técnico, vía Solicitudes).",
    },
    {
      id: "noindex",
      label: "La página es indexable",
      passed: !hasNoindex,
      priority: "alta",
      problem: hasNoindex ? "La página tiene noindex: Google no la mostrará en resultados." : "Indexable.",
      impact: "Si está bloqueada, tu web no puede aparecer en búsquedas de Google aunque todo lo demás esté bien.",
      action: "Pide al equipo técnico que quite el noindex (vía Solicitudes) si no es intencionado.",
    },
    {
      id: "robots",
      label: "robots.txt accesible",
      passed: robotsOk,
      priority: "baja",
      problem: robotsOk ? "Accesible." : "No se encontró /robots.txt.",
      impact: "Ayuda a los buscadores a rastrear tu web correctamente.",
      action: "Pide al equipo técnico que publique un robots.txt básico.",
    },
    {
      id: "sitemap",
      label: "sitemap.xml accesible",
      passed: sitemapOk,
      priority: "media",
      problem: sitemapOk ? "Accesible." : "No se encontró /sitemap.xml.",
      impact: "El sitemap ayuda a Google a descubrir todas tus páginas más rápido.",
      action: "Pide al equipo técnico que genere y publique un sitemap.xml.",
    },
    {
      id: "schema",
      label: "Datos estructurados (schema.org)",
      passed: hasSchema,
      priority: "baja",
      problem: hasSchema ? "Detectados." : "No se detectaron datos estructurados.",
      impact: "Ayudan a que Google (y las IAs) entiendan mejor tu negocio: dirección, horario, tipo de servicio.",
      action: "Pide al equipo técnico que añada el schema.org adecuado a tu sector.",
    },
  ];

  const score = Math.round((checks.filter((c) => c.passed).length / checks.length) * 100);

  return { analyzed: true, url: productionUrl, score, checks };
}
