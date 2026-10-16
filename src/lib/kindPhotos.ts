import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { GalleryCategory } from "@/content/gallery";
import { stories } from "@/content/stories";

/* Each kind of shoot's photos come from its own folder, public/images/stories/<kind>/:
   cover.jpg (or .png, .webp) is its card on the category page, hero.jpg (if there is one) opens
   its own page (otherwise the cover does), and every other photo there is shown in name order
   (01, 02, … 10 comes after 9). Read on the server whenever a page is built. */

const FOLDER = path.join(process.cwd(), "public", "images", "stories");
const IMAGE = /\.(jpe?g|png|webp|avif)$/i;
const COVER = /^cover\./i;
const HERO = /^hero\./i;

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

/** A kind's page photo (its hero, or else its cover) and its other photos, each with its shape */
export async function kindPhotos(kind: string) {
  const files = filesOf(kind);
  const heroFile = files.find((f) => HERO.test(f)) ?? files.find((f) => COVER.test(f));
  const [cover, ...photos] = await Promise.all(
    [heroFile, ...files.filter((f) => !HERO.test(f) && !COVER.test(f))].map((f) =>
      f ? measure(kind, f) : undefined,
    ),
  );
  return { cover, photos: photos.filter((p): p is FolderPhoto => !!p) };
}

/** The shape (width ÷ height) of a photo in public/, as it shows; nothing if it can't be read
    (a photo from elsewhere carries its own) */
async function shapeOf(src: string) {
  if (!src.startsWith("/")) return undefined;
  const m = await sharp(path.join(process.cwd(), "public", decodeURIComponent(src)))
    .metadata()
    .catch(() => undefined);
  if (!m?.width || !m.height) return undefined;
  return (m.orientation ?? 1) >= 5 ? m.height / m.width : m.width / m.height;
}

/** Every category with its cover photo's shape, so the gallery page can show each one whole
    (GalleryRows) */
export async function withShapes(categories: GalleryCategory[]): Promise<GalleryCategory[]> {
  return Promise.all(
    categories.map(async (c) => (c.cover.src && !c.shape ? { ...c, shape: await shapeOf(c.cover.src) } : c)),
  );
}

/** A category with each kind's cover photo filled in from its folder, and its shape, so the
    category page can show each one whole (CategoryWall) */
export async function withCovers(category: GalleryCategory): Promise<GalleryCategory> {
  const subs = await Promise.all(
    category.subs.map(async (s) => {
      const file = filesOf(s.slug).find((f) => COVER.test(f));
      if (!file) return s;
      const { src, w, h } = await measure(s.slug, file);
      const about = stories[s.slug]?.cover;
      return { ...s, cover: { src, alt: about?.alt ?? s.name, position: about?.position }, shape: w / h };
    }),
  );
  return { ...category, subs };
}
