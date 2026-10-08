import { Schema } from "mongoose";

/* A photo as a section uses it. `src`/`alt`/`position` match the `Photo` type the
   components already expect (src/content/photos.ts), so nothing downstream changes.

   alt and position live here rather than on Media on purpose: the same file is reused
   in different places with different wording and a different focus point — e.g.
   services/wedding.jpg appears in both the Services viewfinder and the Instagram strip. */
export const photoSchema = new Schema(
  {
    /** Cloudinary delivery URL (or /images/... for the originals kept in public/) */
    src: { type: String, default: "" },
    alt: { type: String, default: "" },
    /** Focus point "x% y%" kept when the photo is cropped */
    position: { type: String, default: "50% 50%" },
    /** Focus point on phones, where the crop is taller */
    mobilePosition: { type: String, default: "" },
    /** Cloudinary public_id, so the file can be replaced or deleted later */
    publicId: { type: String, default: "" },
  },
  { _id: false },
);

export type PhotoDoc = {
  src: string;
  alt: string;
  position?: string;
  mobilePosition?: string;
  publicId?: string;
};

/** Strips Mongoose/Mongo-only fields so the result matches the `Photo` type exactly. */
export function toPhoto(p?: PhotoDoc | null) {
  if (!p?.src) return { src: "", alt: "" };
  return {
    src: p.src,
    alt: p.alt ?? "",
    ...(p.position ? { position: p.position } : {}),
    ...(p.mobilePosition ? { mobilePosition: p.mobilePosition } : {}),
  };
}

/** Every content collection orders rows in the admin and hides rows without deleting them. */
export const orderable = {
  order: { type: Number, default: 0, index: true },
  active: { type: Boolean, default: true, index: true },
};
