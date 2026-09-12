import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseTusEndpoint } from "../src/features/site-import/resumable-upload";
import { getSupabaseBrowserConfig } from "../src/lib/supabase/browser";

afterEach(() => vi.unstubAllEnvs());

describe("resumable site upload", () => {
  it("uses the direct Supabase Storage hostname for resumable uploads", () => {
    expect(getSupabaseTusEndpoint("https://vozneizszafdokckotwv.supabase.co")).toBe(
      "https://vozneizszafdokckotwv.storage.supabase.co/storage/v1/upload/resumable",
    );
  });

  it("supports custom Supabase domains without changing their hostname", () => {
    expect(getSupabaseTusEndpoint("https://supabase.example.com/base")).toBe(
      "https://supabase.example.com/storage/v1/upload/resumable",
    );
  });

  it("uses the legacy anon key when the publishable key is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-in-production");
    expect(getSupabaseBrowserConfig()).toEqual({
      url: "https://project.supabase.co",
      key: "anon-key-in-production",
    });
  });
});
