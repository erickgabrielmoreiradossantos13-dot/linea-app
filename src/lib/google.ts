import { IS_DEMO_MODE } from "@/lib/demo/config";
import { DEMO_GOOGLE_VISIBILITY } from "@/lib/demo/data";

export type GoogleVisibility =
  | { connected: false }
  | {
      connected: true;
      impressions: number;
      impressionsDelta: number;
      clicksFromGoogle: number;
      topQueries: string[];
    };

/**
 * Línea App todavía no integra Google Search Console (fuera del alcance del V0).
 * En modo real devolvemos "no conectado" en vez de inventar cifras; en modo demo
 * mostramos datos ilustrativos claramente separados (ver src/lib/demo/data.ts)
 * para poder enseñar cómo se verá la sección una vez conectada.
 */
export async function getGoogleVisibility(): Promise<GoogleVisibility> {
  if (IS_DEMO_MODE) {
    return { connected: true, ...DEMO_GOOGLE_VISIBILITY };
  }

  return { connected: false };
}
