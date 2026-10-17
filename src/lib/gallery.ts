import { cache } from "react";
import { Types } from "mongoose";
import type { GalleryCategory as Category, GallerySub } from "@/content/gallery";
import { connectDB } from "@/lib/db";
import { GalleryCategory, GalleryPhoto, GallerySub as Sub, type GalleryPhotoDoc } from "@/models";

/* The gallery as the site shows it, read from the database (the admin's Gallery section): the
   categories that are live, in the admin's order, each with its live kinds of shoot, their cover
   photos and how many photos each kind has. Nothing is made up when it's empty: an empty gallery
   shows as empty. Read once per page, however many parts of the page ask (React's cache). If the
   database can't be reached this throws, so a page is never published empty by mistake; a page
   already out stays as it was. */

/** A gallery photo as the pages take it, and its shape (width ÷ height) when it's known */
function photoOf(p: Partial<GalleryPhotoDoc> | undefined, alt: string) {
  const src = p?.src ?? "";
  const shape = p?.width && p.height ? p.width / p.height : undefined;
  return { photo: { src, alt: src ? alt : "" }, shape };
}

/** How many photos each kind of shoot has, by its id */
async function photoCounts() {
  const rows: { _id: Types.ObjectId; n: number }[] = await GalleryPhoto.aggregate([
    { $group: { _id: "$sub", n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

export const getGallery = cache(async (): Promise<Category[]> => {
  await connectDB();
  const [categories, subs, counts] = await Promise.all([
    GalleryCategory.find({ active: true }).sort({ order: 1 }).lean(),
    Sub.find({ active: true }).sort({ order: 1 }).lean(),
    photoCounts(),
  ]);
  return categories.map((c) => {
    const cover = photoOf(c.cover as GalleryPhotoDoc, `${c.name} by DS Photography`);
    return {
      slug: String(c.slug),
      name: String(c.name),
      cover: cover.photo,
      shape: cover.shape,
      subs: subs
        .filter((s) => String(s.category) === String(c._id))
        .map((s): GallerySub => {
          const sub = photoOf(s.cover as GalleryPhotoDoc, `${s.name} by DS Photography`);
          return {
            id: String(s._id),
            slug: String(s.slug),
            name: String(s.name),
            ...(s.local ? { local: String(s.local) } : {}),
            ...(sub.photo.src ? { cover: sub.photo, shape: sub.shape } : {}),
            count: counts.get(String(s._id)) ?? 0,
          };
        }),
    };
  });
});

/** One category and where it sits among the others (undefined if there's no such one live) */
export async function findCategory(slug: string) {
  const gallery = await getGallery();
  const index = gallery.findIndex((c) => c.slug === slug);
  return index < 0 ? undefined : { gallery, index, category: gallery[index] };
}

export type AlbumPhoto = { id: string; src: string; width: number; height: number };

/** A kind of shoot's photos, newest first, a page at a time: the `limit` after the photo `before`
    (from the start without it), and whether there are more after those */
export async function albumPage(subId: string, limit: number, before?: string) {
  if (!Types.ObjectId.isValid(subId)) return { photos: [] as AlbumPhoto[], more: false };
  await connectDB();
  const rows = await GalleryPhoto.find({
    sub: new Types.ObjectId(subId),
    ...(before && Types.ObjectId.isValid(before) ? { _id: { $lt: new Types.ObjectId(before) } } : {}),
  })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
  return {
    photos: rows.slice(0, limit).map(
      (r): AlbumPhoto => ({
        id: String(r._id),
        src: String(r.src),
        width: Number(r.width ?? 0),
        height: Number(r.height ?? 0),
      }),
    ),
    more: rows.length > limit,
  };
}

/* ── The admin's side: the whole gallery as its editor works on it, hidden ones included ── */

export type GalleryCoverValue = { src: string; publicId: string; width: number; height: number };
export type GallerySubValue = {
  /** "" until it's first saved */
  id: string;
  name: string;
  local: string;
  cover: GalleryCoverValue;
  /** how many photos it has (shown only; its photos are saved on their own page) */
  count: number;
  active: boolean;
};
export type GalleryCategoryValue = {
  /** "" until it's first saved */
  id: string;
  name: string;
  cover: GalleryCoverValue;
  active: boolean;
  subs: GallerySubValue[];
};

const coverValue = (raw: unknown): GalleryCoverValue => {
  const p = (raw ?? {}) as Partial<GalleryPhotoDoc>;
  return {
    src: String(p.src ?? ""),
    publicId: String(p.publicId ?? ""),
    width: Number(p.width ?? 0),
    height: Number(p.height ?? 0),
  };
};

export async function galleryTree(): Promise<GalleryCategoryValue[]> {
  await connectDB();
  const [categories, subs, counts] = await Promise.all([
    GalleryCategory.find({}).sort({ order: 1 }).lean(),
    Sub.find({}).sort({ order: 1 }).lean(),
    photoCounts(),
  ]);
  return categories.map((c) => ({
    id: String(c._id),
    name: String(c.name ?? ""),
    cover: coverValue(c.cover),
    active: c.active !== false,
    subs: subs
      .filter((s) => String(s.category) === String(c._id))
      .map((s) => ({
        id: String(s._id),
        name: String(s.name ?? ""),
        local: String(s.local ?? ""),
        cover: coverValue(s.cover),
        count: counts.get(String(s._id)) ?? 0,
        active: s.active !== false,
      })),
  }));
}

/** A kind of shoot for its Photos page in the admin, with its category and where it shows */
export async function findSub(subId: string) {
  if (!Types.ObjectId.isValid(subId)) return undefined;
  await connectDB();
  const sub = await Sub.findById(subId).lean();
  if (!sub) return undefined;
  const category = await GalleryCategory.findById(sub.category).lean();
  if (!category) return undefined;
  return {
    id: String(sub._id),
    name: String(sub.name),
    category: String(category.name),
    href: `/gallery/${category.slug}/${sub.slug}`,
    count: await GalleryPhoto.countDocuments({ sub: sub._id }),
  };
}

/** Every category's and kind's address, for building the pages ahead (none if the database
    can't be reached then: each page is made when it's first visited instead) */
export async function galleryAddresses() {
  try {
    return await getGallery();
  } catch (err) {
    console.warn("[gallery] pages will be made on first visit:", err instanceof Error ? err.message : err);
    return [];
  }
}
