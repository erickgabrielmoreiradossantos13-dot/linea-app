import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = ["0001_foundation.sql", "0002_production_rls_hardening.sql", "0003_product_readiness.sql", "0004_visual_site_editor.sql", "0005_scheduled_site_publications.sql", "0006_imported_site_editor.sql"]
  .map((file) => readFileSync(join(process.cwd(), "supabase/migrations", file), "utf8"))
  .join("\n");

describe("database security invariants", () => {
  it("enables RLS on tenant-critical tables", () => {
    for (const table of ["organizations","organization_members","websites","pages","content_entries","media","leads","lead_notes","analytics_events","support_tickets"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("defines explicit CRUD policies for mutable tenant resources", () => {
    for (const table of ["leads", "lead_notes", "websites", "pages", "content_entries", "support_tickets", "site_change_log", "integrations"]) {
      for (const operation of ["select", "insert", "update", "delete"]) {
        expect(migration).toContain(`"${table}_${operation}_org"`);
      }
    }
  });

  it("enforces organization consistency for nested website and lead data", () => {
    expect(migration).toContain("pages_website_organization_fkey");
    expect(migration).toContain("content_entries_website_organization_fkey");
    expect(migration).toContain("lead_notes_lead_organization_fkey");
  });

  it("keeps SUPER_ADMIN outside tenant membership roles", () => {
    expect(migration).toContain("create type public.organization_role as enum ('OWNER','ADMIN','EDITOR','VIEWER');");
  });

  it("prevents a normal authenticated user from updating is_super_admin", () => {
    expect(migration).toContain("revoke update on public.profiles from authenticated;");
    expect(migration).toContain("grant update (full_name, locale) on public.profiles to authenticated;");
  });

  it("keeps the media bucket private", () => {
    expect(migration).toContain("values ('media', 'media', false");
  });

  it("creates organizations through authenticated server-side ownership flow", () => {
    expect(migration).toContain("create_organization_for_current_user");
    expect(migration).toContain("current_user_id uuid := auth.uid()");
    expect(migration).toContain("'OWNER', 'ACTIVE'");
  });

  it("keeps visual editor drafts tenant-scoped and versioned", () => {
    for (const table of ["page_blocks", "site_versions"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }
    for (const operation of ["select", "insert", "update", "delete"]) {
      expect(migration).toContain(`"page_blocks_${operation}_org"`);
    }
    expect(migration).toContain("content_entries_block_org_website_page_fkey");
    expect(migration).toContain("publish_requires_admin");
    expect(migration).toContain("publish_website_draft");
    expect(migration).toContain("restore_website_version");
  });

  it("runs scheduled publishing through a private database worker", () => {
    expect(migration).toContain("run_due_site_publications");
    expect(migration).toContain("revoke all on function public.run_due_site_publications() from public, anon, authenticated;");
    expect(migration).toContain("linea-site-publisher");
  });

  it("keeps imported sites private at rest and scoped by organization", () => {
    for (const table of ["site_imports", "site_files"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }
    expect(migration).toContain("values ('sites', 'sites', false");
    expect(migration).toContain('"site_objects_insert"');
    expect(migration).toContain("replace_website_import");
    expect(migration).toContain("current_value_published is distinct from old.current_value_published");
    expect(migration).toContain("published_html is distinct from old.published_html");
  });
});
