import type { PhotoValue } from "@/app/admin/components/PhotoField";

/** Mongo subdocument → the plain shape the editors and the site both use. */
export function toPhotoValue(p: unknown): PhotoValue {
  const v = (p ?? {}) as Record<string, unknown>;
  return {
    src: String(v.src ?? ""),
    alt: String(v.alt ?? ""),
    position: String(v.position ?? "50% 50%"),
    mobilePosition: String(v.mobilePosition ?? ""),
    publicId: String(v.publicId ?? ""),
  };
}

export function s(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
