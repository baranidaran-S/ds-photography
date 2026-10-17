import { cache } from "react";
import { Types } from "mongoose";
import { DEFAULT_TONE, type BlogPost } from "@/content/blog";
import type { Photo } from "@/content/photos";
import { connectDB } from "@/lib/db";
import { BlogPost as Post, GalleryCategory, type BlogPhotoDoc } from "@/models";

/* The blog as the site shows it, read from the database (the admin's Blog section): every post,
   newest first, and the categories for its tabs, which are the gallery's (the blog has none of its
   own), in the gallery's order. Nothing is made up when it's empty: an empty blog shows as empty.
   Read once per page, however many parts of the page ask (React's cache). If the database can't
   be reached this throws, so a page is never published empty by mistake; a page already out stays
   as it was. */

/** The first words of the description, for a card when the admin wrote no summary: links as plain
    words, cut at a word near `max` letters */
function summaryOf(description: string, max = 160) {
  const text = description.replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[\s,.;:–-]+$/, "")}…`;
}

type Cover = Partial<BlogPhotoDoc> & { position?: string };

type Row = {
  slug?: string;
  title?: string;
  category?: unknown;
  place?: string;
  date?: string;
  cover?: Cover;
  storyCover?: Cover;
  tone?: string;
  excerpt?: string;
  description?: string;
  photos?: Partial<BlogPhotoDoc>[];
  seoTitle?: string;
  seoDescription?: string;
};

/** A cover as the pages take it (none: an empty one) */
const coverOf = (c: Cover | undefined, title: string): Photo =>
  c?.src
    ? { src: String(c.src), alt: String(c.alt ?? "") || title, ...(c.position ? { position: String(c.position) } : {}) }
    : { src: "", alt: "" };

/** A post from the database as the pages take it, its category given by name */
function postOf(r: Row, categoryName: string): BlogPost {
  const title = String(r.title ?? "");
  const description = String(r.description ?? "");
  const excerpt = String(r.excerpt ?? "").trim() || summaryOf(description);
  const cover = coverOf(r.cover, title);
  const storyCover = coverOf(r.storyCover, title);
  return {
    slug: String(r.slug ?? ""),
    title,
    category: categoryName,
    place: String(r.place ?? ""),
    date: String(r.date ?? ""),
    cover,
    storyCover: storyCover.src ? storyCover : cover,
    tone: String(r.tone ?? "") || DEFAULT_TONE,
    excerpt,
    description,
    photos: (r.photos ?? [])
      .filter((p) => p.src && p.width && p.height)
      .map((p, i) => ({
        src: String(p.src),
        alt: String(p.alt ?? "") || `${title}, photo ${i + 1}`,
        w: Number(p.width),
        h: Number(p.height),
      })),
    seo: {
      title: String(r.seoTitle ?? "").trim() || `${title} | DS Photography`,
      description: String(r.seoDescription ?? "").trim() || excerpt,
    },
  };
}

export const getBlog = cache(async (): Promise<{ posts: BlogPost[]; categories: string[] }> => {
  await connectDB();
  const [categories, rows] = await Promise.all([
    GalleryCategory.find({}, { name: 1, active: 1 }).sort({ order: 1 }).lean(),
    Post.find({}).sort({ date: -1, _id: -1 }).lean(),
  ]);
  const names = new Map(categories.map((c) => [String(c._id), String(c.name)]));
  return {
    posts: rows.map((r) => postOf(r as Row, names.get(String(r.category)) ?? "")),
    // (a category hidden in the gallery has no tab, but its posts still show)
    categories: categories.filter((c) => c.active !== false).map((c) => String(c.name)),
  };
});

/** A post by its address, and the three stories shown under it: from the same category first,
    then the newest of the rest (undefined if there's no such post) */
export async function findPost(slug: string) {
  const { posts } = await getBlog();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return undefined;
  const others = posts.filter((p) => p !== post);
  const more = [
    ...others.filter((p) => p.category && p.category === post.category),
    ...others.filter((p) => !p.category || p.category !== post.category),
  ].slice(0, 3);
  return { post, more };
}

/* ── The admin's side ── */

/** A post as the admin's list shows it */
export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  /** its gallery category's name ("" if it has none) */
  category: string;
  place: string;
  date: string;
  /** its cover photo ("" if it has none) */
  cover: string;
  /** how many story photos it has */
  photos: number;
};

/** Every post for the admin's list, newest first */
export async function blogPostList(): Promise<BlogPostRow[]> {
  await connectDB();
  const [categories, rows] = await Promise.all([
    GalleryCategory.find({}, { name: 1 }).lean(),
    Post.find({}, { slug: 1, title: 1, category: 1, place: 1, date: 1, cover: 1, photos: 1 })
      .sort({ date: -1, _id: -1 })
      .lean(),
  ]);
  const names = new Map(categories.map((c) => [String(c._id), String(c.name)]));
  return rows.map((r) => ({
    id: String(r._id),
    slug: String(r.slug ?? ""),
    title: String(r.title ?? ""),
    category: names.get(String(r.category)) ?? "",
    place: String(r.place ?? ""),
    date: String(r.date ?? ""),
    cover: String((r.cover as Cover | undefined)?.src ?? ""),
    photos: Array.isArray(r.photos) ? r.photos.length : 0,
  }));
}

/** A cover as the form works on it ("" src: none) */
export type BlogCoverValue = {
  src: string;
  /** its name in the photo store, to delete it when it's replaced */
  publicId: string;
  width: number;
  height: number;
  /** the point kept in view when it's trimmed to a window's shape, as "x% y%" */
  position: string;
};

/** A post as its form in the admin works on it ("" id: a new one) */
export type BlogPostValue = {
  id: string;
  /** its address, set when it's first saved and never changed after */
  slug: string;
  title: string;
  /** its gallery category's id ("" for none) */
  category: string;
  place: string;
  /** yyyy-mm-dd */
  date: string;
  description: string;
  cover: BlogCoverValue;
  /** a different photo for the top of its own page (none: the cover is used) */
  storyCover: BlogCoverValue;
  /** its card's colour, found from the cover ("" until one is) */
  tone: string;
  /** the shoot's photos, in the order the story's page shows them */
  photos: BlogPhotoValue[];
};

/** One of a story's photos as the form works on it (its words for search engines are made from the
    post's title) */
export type BlogPhotoValue = { src: string; publicId: string; width: number; height: number };

const coverValueOf = (c: Cover | undefined): BlogCoverValue => ({
  src: String(c?.src ?? ""),
  publicId: String(c?.publicId ?? ""),
  width: Number(c?.width ?? 0),
  height: Number(c?.height ?? 0),
  position: String(c?.position ?? "") || "50% 50%",
});

/** One post for its form (undefined if there's no such post) */
export async function blogPostValue(id: string): Promise<BlogPostValue | undefined> {
  if (!Types.ObjectId.isValid(id)) return undefined;
  await connectDB();
  const r = await Post.findById(id).lean();
  if (!r) return undefined;
  return {
    id: String(r._id),
    slug: String(r.slug ?? ""),
    title: String(r.title ?? ""),
    category: r.category ? String(r.category) : "",
    place: String(r.place ?? ""),
    date: String(r.date ?? ""),
    description: String(r.description ?? ""),
    cover: coverValueOf(r.cover as Cover | undefined),
    storyCover: coverValueOf(r.storyCover as Cover | undefined),
    tone: String(r.tone ?? ""),
    photos: ((r.photos ?? []) as Partial<BlogPhotoDoc>[]).map((p) => ({
      src: String(p.src ?? ""),
      publicId: String(p.publicId ?? ""),
      width: Number(p.width ?? 0),
      height: Number(p.height ?? 0),
    })),
  };
}

/** A gallery category, for a post's category dropdown */
export type CategoryOption = { id: string; name: string; hidden: boolean };

/** The gallery's categories, in the gallery's order, hidden ones included */
export async function categoryOptions(): Promise<CategoryOption[]> {
  await connectDB();
  const rows = await GalleryCategory.find({}, { name: 1, active: 1 }).sort({ order: 1 }).lean();
  return rows.map((c) => ({ id: String(c._id), name: String(c.name ?? ""), hidden: c.active === false }));
}

/** Every post's address, for making their pages ahead (none if the database can't be reached:
    they're then made on their first visit) */
export async function blogAddresses() {
  try {
    return (await getBlog()).posts.map((p) => ({ slug: p.slug }));
  } catch (err) {
    console.warn("[blog] pages will be made on first visit:", err instanceof Error ? err.message : err);
    return [];
  }
}
