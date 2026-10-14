import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { GalleryCategory } from "@/content/gallery";
import { stories } from "@/content/stories";

/* Each kind of shoot's photos come from its own folder, public/images/stories/<kind>/:
   cover.jpg (or .png, .webp) is the big photo, and every other photo there is shown in name
   order (01, 02, … 10 comes after 9). Read on the server whenever a page is built. */

const FOLDER = path.join(process.cwd(), "public", "images", "stories");
const IMAGE = /\.(jpe?g|png|webp|avif)$/i;
const COVER = /^cover\./i;

export type FolderPhoto = { src: string; w: number; h: number };

/** The photo files in a kind's folder, in name order */
function filesOf(kind: string) {
  try {
    return fs
      .readdirSync(path.join(FOLDER, kind))
      .filter((f) => IMAGE.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch {
    return [];
  }
}

const srcOf = (kind: string, file: string) => `/images/stories/${encodeURIComponent(kind)}/${encodeURIComponent(file)}`;

/** A photo's width and height as it shows (after any rotation saved in the file) */
async function measure(kind: string, file: string): Promise<FolderPhoto> {
  const m = await sharp(path.join(FOLDER, kind, file))
    .metadata()
    .catch(() => ({ width: 4, height: 5, orientation: 1 }));
  const w = m.width ?? 4;
  const h = m.height ?? 5;
  const turned = (m.orientation ?? 1) >= 5;
  return { src: srcOf(kind, file), w: turned ? h : w, h: turned ? w : h };
}

/** A kind's cover file, if its folder has one */
export function coverSrc(kind: string) {
  const file = filesOf(kind).find((f) => COVER.test(f));
  return file ? srcOf(kind, file) : undefined;
}

/** A kind's cover and its other photos, each with its shape */
export async function kindPhotos(kind: string) {
  const files = filesOf(kind);
  const coverFile = files.find((f) => COVER.test(f));
  const [cover, ...photos] = await Promise.all(
    [coverFile, ...files.filter((f) => f !== coverFile)].map((f) => (f ? measure(kind, f) : undefined)),
  );
  return { cover, photos: photos.filter((p): p is FolderPhoto => !!p) };
}

/** A category with each kind's cover photo filled in from its folder (for the category page) */
export function withCovers(category: GalleryCategory): GalleryCategory {
  return {
    ...category,
    subs: category.subs.map((s) => {
      const src = coverSrc(s.slug);
      const about = stories[s.slug]?.cover;
      return src ? { ...s, cover: { src, alt: about?.alt ?? s.name, position: about?.position } } : s;
    }),
  };
}
