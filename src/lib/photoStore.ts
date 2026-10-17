import { v2 as cloudinary } from "cloudinary";

/* Where the gallery's photo files live, and the only code that touches them there (Cloudinary
   for now; moving to another store, such as AWS S3, means changing this file and the upload
   window). It only ever deletes inside the gallery's own folder, so the site's other photos
   (hero, services, reviews…) can't be touched from the gallery. */

export const GALLERY_FOLDER = "ds-photography/gallery";

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

/** Deletes gallery files for good (others are skipped), a hundred at a time. A file that's
    already gone counts as done; one that can't be deleted now is left in the store (unused). */
export async function deleteFiles(publicIds: string[]) {
  const ids = [...new Set(publicIds.filter(isGalleryFile))];
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
