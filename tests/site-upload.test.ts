import { describe, expect, it } from "vitest";
import { getSupabaseTusEndpoint } from "../src/features/site-import/resumable-upload";

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
});
