import { v2 as cloudinary } from "cloudinary";

/* Where the gallery's and the blog's photo files live, and the only code that touches them there
   (Cloudinary for now; moving to another store, such as AWS S3, means changing this file and the
   upload window). It only ever deletes inside the gallery's or the blog's own folder, so the
   site's other photos (hero, services, reviews…) can't be touched from either. */

export const GALLERY_FOLDER = "ds-photography/gallery";
export const BLOG_FOLDER = "ds-photography/blog";

function store() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

/** Whether a file is one of the gallery's (its storage name starts with the gallery's folder) */
export const isGalleryFile = (publicId: string) => publicId.startsWith(`${GALLERY_FOLDER}/`);

/** Whether a file is one of the blog's */
export const isBlogFile = (publicId: string) => publicId.startsWith(`${BLOG_FOLDER}/`);

/** Whether an address is one of the photos uploaded through the admin (so the server may fetch it
    to look at it, and nothing else) */
export function isStoredPhoto(src: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return Boolean(cloud) && src.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`);
}

/** Deletes the files of one folder (the gallery's unless told; others are skipped) for good, a
    hundred at a time. A file that's already gone counts as done; one that can't be deleted now is
    left in the store (unused). */
export async function deleteFiles(publicIds: string[], folder = GALLERY_FOLDER) {
  const ids = [...new Set(publicIds.filter((id) => id.startsWith(`${folder}/`)))];
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 100) {
    try {
      const res = await store().api.delete_resources(ids.slice(i, i + 100), { invalidate: true });
      deleted += Object.values(res.deleted ?? {}).filter((v) => v === "deleted" || v === "not_found").length;
    } catch (err) {
      console.warn("[photos] some files couldn't be deleted now:", err instanceof Error ? err.message : err);
    }
  }
  return deleted;
}
