import { describe, expect, it } from "vitest";
import { isUploadedPhoto, resolvePhotoContentType } from "./player-photo";

describe("resolvePhotoContentType", () => {
  it("keeps an allowed MIME type", () => {
    expect(resolvePhotoContentType({ type: "image/png", name: "a.png" })).toBe("image/png");
  });

  it("infers type from the filename when MIME is missing", () => {
    expect(resolvePhotoContentType({ type: "", name: "igrac.JPEG" })).toBe("image/jpeg");
  });

  it("rejects unknown types", () => {
    expect(resolvePhotoContentType({ type: "application/pdf", name: "x.pdf" })).toBeNull();
  });
});

describe("isUploadedPhoto", () => {
  it("accepts a non-empty File", () => {
    expect(isUploadedPhoto(new File(["x"], "igrac.jpg", { type: "image/jpeg" }))).toBe(true);
  });

  it("rejects empty files and plain strings", () => {
    expect(isUploadedPhoto(new File([], "empty.jpg"))).toBe(false);
    expect(isUploadedPhoto("https://example.com/a.jpg")).toBe(false);
  });
});
