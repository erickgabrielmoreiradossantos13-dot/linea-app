import type { SiteAdapter } from "@/lib/site";
import type { Site, SiteChangeLogEntry, SiteContent, SiteSchema } from "@/lib/types";
import { DEMO_BUSINESS } from "@/lib/demo/data";
import {
  getDemoSiteOverrides,
  getDemoSiteChangeLog,
  addDemoSiteChangeLogEntry,
  setDemoSiteOverrides,
} from "@/lib/demo/store";

export const DEMO_SITE_ID = "demo-site-clinica-aurora";
const PAGE_ID = "demo-page-inicio";
const HERO_SECTION_ID = "demo-section-hero";
const CONTACT_SECTION_ID = "demo-section-contact";

export const DEMO_FIELD_TITLE = "demo-field-title";
export const DEMO_FIELD_SUBTITLE = "demo-field-subtitle";
export const DEMO_FIELD_CTA = "demo-field-cta";
export const DEMO_FIELD_PHONE = "demo-field-phone";
export const DEMO_FIELD_WHATSAPP = "demo-field-whatsapp";

const INITIAL_VALUES: Record<string, string> = {
  [DEMO_FIELD_TITLE]: "Cuida tu sonrisa con los mejores especialistas de Málaga",
  [DEMO_FIELD_SUBTITLE]:
    "En Clínica Aurora combinamos tecnología avanzada y trato cercano para ofrecerte tratamientos dentales de máxima calidad.",
  [DEMO_FIELD_CTA]: "Pide tu cita",
  [DEMO_FIELD_PHONE]: "+34 951 234 567",
  [DEMO_FIELD_WHATSAPP]: "+34 611 222 333",
};

const DEMO_SITE: Site = {
  id: DEMO_SITE_ID,
  business_id: DEMO_BUSINESS.id,
  name: "Clínica Aurora",
  domain: "auroraclinica.es",
  preview_url: null,
  production_url: "https://auroraclinica.es",
  framework: "linea-nextjs",
  status: "published",
  last_published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
};

const DEMO_SCHEMA: SiteSchema = {
  site: DEMO_SITE,
  pages: [
    {
      id: PAGE_ID,
      site_id: DEMO_SITE_ID,
      slug: "inicio",
      name: "Inicio",
      position: 1,
      sections: [
        {
          id: HERO_SECTION_ID,
          page_id: PAGE_ID,
          key: "hero",
          name: "Hero",
          position: 1,
          fields: [
            {
              id: DEMO_FIELD_TITLE,
              section_id: HERO_SECTION_ID,
              key: "title",
              label: "Título principal",
              field_type: "text",
              position: 1,
              config: { maxLength: 80 },
              editable_by_client: true,
            },
            {
              id: DEMO_FIELD_SUBTITLE,
              section_id: HERO_SECTION_ID,
              key: "subtitle",
              label: "Descripción",
              field_type: "textarea",
              position: 2,
              config: { maxLength: 280 },
              editable_by_client: true,
            },
            {
              id: DEMO_FIELD_CTA,
              section_id: HERO_SECTION_ID,
              key: "ctaLabel",
              label: "Texto del botón",
              field_type: "text",
              position: 3,
              config: { maxLength: 30 },
              editable_by_client: true,
            },
          ],
        },
        {
          id: CONTACT_SECTION_ID,
          page_id: PAGE_ID,
          key: "contact",
          name: "Contacto",
          position: 2,
          fields: [
            {
              id: DEMO_FIELD_PHONE,
              section_id: CONTACT_SECTION_ID,
              key: "phone",
              label: "Teléfono",
              field_type: "phone",
              position: 1,
              config: {},
              editable_by_client: true,
            },
            {
              id: DEMO_FIELD_WHATSAPP,
              section_id: CONTACT_SECTION_ID,
              key: "whatsapp",
              label: "WhatsApp",
              field_type: "phone",
              position: 2,
              config: {},
              editable_by_client: true,
            },
          ],
        },
      ],
    },
  ],
};

async function getContent(): Promise<SiteContent> {
  const overrides = await getDemoSiteOverrides();
  const draft = { ...INITIAL_VALUES, ...overrides.draft };
  const published = { ...INITIAL_VALUES, ...overrides.published };

  const values: SiteContent["values"] = {};
  for (const fieldId of Object.keys(INITIAL_VALUES)) {
    values[fieldId] = {
      field_id: fieldId,
      draft_value: draft[fieldId],
      published_value: published[fieldId],
      updated_at: new Date().toISOString(),
      published_at: overrides.lastPublishedAt ?? DEMO_SITE.last_published_at,
    };
  }

  const site: Site = {
    ...DEMO_SITE,
    last_published_at: overrides.lastPublishedAt ?? DEMO_SITE.last_published_at,
  };

  return {
    schema: { ...DEMO_SCHEMA, site },
    values,
    collectionItems: {},
  };
}

export const adapter: SiteAdapter = {
  async getSiteForBusiness(businessId) {
    if (businessId !== DEMO_BUSINESS.id) return null;
    const content = await getContent();
    return content.schema.site;
  },

  async getContent(siteId) {
    if (siteId !== DEMO_SITE_ID) return null;
    return getContent();
  },

  async saveFieldDraft(fieldId, value) {
    await setDemoSiteOverrides({ draft: { [fieldId]: value as string } });
  },

  async discardDraft() {
    const overrides = await getDemoSiteOverrides();
    await setDemoSiteOverrides({ draft: { ...overrides.published } });
  },

  async publish(_siteId, actorEmail) {
    const overrides = await getDemoSiteOverrides();
    const draft = { ...INITIAL_VALUES, ...overrides.draft };
    const now = new Date().toISOString();

    await setDemoSiteOverrides({ published: draft, lastPublishedAt: now });
    await addDemoSiteChangeLogEntry({
      summary: `${actorEmail ?? "Alguien"} publicó cambios en Inicio`,
      created_at: now,
      snapshot: draft,
    });
  },

  async getChangeLog(): Promise<SiteChangeLogEntry[]> {
    const entries = await getDemoSiteChangeLog();
    return entries.map((entry, index) => ({
      id: `demo-log-${index}`,
      site_id: DEMO_SITE_ID,
      actor_email: null,
      summary: entry.summary,
      snapshot: entry.snapshot ?? null,
      created_at: entry.created_at,
    }));
  },

  async restoreVersion(_siteId, snapshot) {
    await setDemoSiteOverrides({ draft: snapshot as Record<string, string> });
  },
};
