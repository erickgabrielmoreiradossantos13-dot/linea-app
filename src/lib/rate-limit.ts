/**
 * Rate limiting en memoria para los endpoints públicos de ingesta
 * (/api/track, /api/lead). Suficiente para el volumen de un negocio local;
 * si el tráfico crece, esto se sustituye por Redis/Upstash sin cambiar la
 * firma de `checkRateLimit`.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) return false;

  entry.count += 1;
  return true;
}
