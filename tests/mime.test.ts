import { describe, expect, it } from "vitest";
import { isSupportedImageMime, mimeForPath } from "../src/lib/mime";

describe("image upload validation", () => {
  it("derives only supported image MIME types from filenames", () => {
    expect(mimeForPath("hero.JPEG")).toBe("image/jpeg");
    expect(mimeForPath("team.webp")).toBe("image/webp");
    expect(mimeForPath("payload.svg")).toBeNull();
  });

  it("rejects arbitrary declared MIME values", () => {
    expect(isSupportedImageMime("image/png")).toBe(true);
    expect(isSupportedImageMime("image/svg+xml")).toBe(false);
  });
});
