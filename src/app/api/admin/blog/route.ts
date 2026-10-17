import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { BlogPost, GalleryCategory } from "@/models";
import { requireAdmin, str } from "@/lib/admin-api";
import type { BlogCoverValue, BlogPhotoValue } from "@/lib/blog";
import { isStoredPhoto } from "@/lib/photoStore";
import { slugOf } from "@/lib/slug";
import { dropUnused } from "./files";

/* The admin's blog posts: POST makes a new one, PUT (?id=…) saves one, DELETE (?id=…) deletes one.
   Every save is live: there are no drafts. A post's address is made when it's first saved (from
   the one typed, or its title) and never changes after, so links to it keep working; two posts
   can't share one. Saving makes the blog page and the post's page again on their next visit, and
   deletes from the photo store the photo files the post no longer uses. */

type Fields = {
  title: string;
  slug: string;
  category: string;
  place: string;
  date: string;
  description: string;
  cover: BlogCoverValue;
  storyCover: BlogCoverValue;
  tone: string;
  photos: BlogPhotoValue[];
};

// the most photos one post can have (they're kept in the post's own record)
const MOST_PHOTOS = 200;

const NO_COVER: BlogCoverValue = { src: "", publicId: "", width: 0, height: 0, position: "50% 50%" };
const size = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : 0);
const percent = (v: string) => Math.min(100, Math.max(0, Math.round(Number(v))));
/** One of the website's uploads, or a photo the post already had */
const allowed = (src: string, had: Set<string>) => isStoredPhoto(src) || had.has(src);

/** A cover as sent, with its size and focus point ("x% y%"); a photo from anywhere else counts as
    none */
function coverOf(raw: unknown, had: Set<string>): BlogCoverValue {
  const c = (raw ?? {}) as Record<string, unknown>;
  const src = str(c.src);
  if (!src || !allowed(src, had)) return NO_COVER;
  const at = /^(\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%$/.exec(str(c.position));
  return {
    src,
    publicId: str(c.publicId),
    width: size(c.width),
    height: size(c.height),
    position: at ? `${percent(at[1])}% ${percent(at[2])}%` : "50% 50%",
  };
}

/** The story's photos as sent, in order: each once, with its size (the page lays them out by
    shape); a photo from anywhere else, or without its size, is left out */
function photosOf(raw: unknown, had: Set<string>): BlogPhotoValue[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.slice(0, MOST_PHOTOS * 2).flatMap((item) => {
    const p = (item ?? {}) as Record<string, unknown>;
    const photo = { src: str(p.src), publicId: str(p.publicId), width: size(p.width), height: size(p.height) };
    if (!photo.src || !photo.width || !photo.height || !allowed(photo.src, had) || seen.has(photo.src)) return [];
    seen.add(photo.src);
    return [photo];
  });
}

/** `had`: the photos the post has now (kept even if they're no longer where uploads go) */
function clean(raw: unknown, had = new Set<string>()): Fields {
  const b = (raw ?? {}) as Record<string, unknown>;
  const tone = str(b.tone).trim();
  return {
    title: str(b.title).trim().slice(0, 140),
    slug: slugOf(str(b.slug) || str(b.title)),
    category: str(b.category),
    place: str(b.place).trim().slice(0, 80),
    date: str(b.date).trim(),
    // (line breaks kept: an empty line starts a new paragraph on the website)
    description: str(b.description).replace(/\r\n?/g, "\n").trim().slice(0, 30_000),
    cover: coverOf(b.cover, had),
    storyCover: coverOf(b.storyCover, had),
    tone: /^#[0-9a-f]{6}$/i.test(tone) ? tone.toLowerCase() : "",
    photos: photosOf(b.photos, had),
  };
}

const realDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));

/** What's wrong with a post, in words for the admin; nothing if it's fine */
async function problemWith(f: Fields) {
  if (!f.title) return "Give the post a title.";
  if (!f.category) return "Choose a category.";
  if (!Types.ObjectId.isValid(f.category) || !(await GalleryCategory.exists({ _id: f.category })))
    return "That category isn't in the gallery any more. Choose another.";
  if (!realDate(f.date)) return "Choose the date it was published.";
  if (!f.cover.src) return "Add a cover photo.";
  if (f.photos.length > MOST_PHOTOS) return `A post can have up to ${MOST_PHOTOS} photos. Remove ${f.photos.length - MOST_PHOTOS}.`;
  return "";
}

/** The fields saved for a post (its address apart) */
const saved = (f: Fields) => ({
  title: f.title,
  category: new Types.ObjectId(f.category),
  place: f.place,
  date: f.date,
  description: f.description,
  cover: f.cover,
  storyCover: f.storyCover,
  tone: f.tone,
  photos: f.photos,
});

function refresh() {
  revalidatePath("/blog");
  revalidatePath("/(site)/blog/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

/** Deletes the files no post uses any more; a failure only leaves them in the store */
const tidy = (publicIds: (string | undefined)[]) =>
  dropUnused(publicIds.map((id) => id ?? "")).catch((err) =>
    console.warn("[blog] unused photos left in the store:", err instanceof Error ? err.message : err),
  );

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let f: Fields;
  try {
    f = clean(await request.json());
  } catch {
    return bad("Invalid request");
  }
  const problem = await problemWith(f);
  if (problem) return bad(problem);
  if (!f.slug) return bad("The address needs English letters or numbers. Type one under Address.");

  const taken = await BlogPost.findOne({ slug: f.slug }, { title: 1 }).lean();
  if (taken) return bad(`The address /blog/${f.slug} is already used by “${taken.title}”. Change the title or the address.`);

  try {
    const post = await BlogPost.create({ slug: f.slug, ...saved(f) });
    refresh();
    return NextResponse.json({ ok: true, id: String(post._id), slug: f.slug });
  } catch (err) {
    // (two saves at the same moment: the second finds the address taken)
    if ((err as { code?: number }).code === 11000) return bad(`The address /blog/${f.slug} is already used. Change the title or the address.`);
    return bad(err instanceof Error ? err.message : "Could not save the post.", 500);
  }
}

export async function PUT(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!Types.ObjectId.isValid(id)) return bad("Which post?");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request");
  }
  const before = await BlogPost.findById(id, { cover: 1, storyCover: 1, photos: 1 }).lean();
  if (!before) return bad("That post was deleted.", 404);
  const photosBefore = (before.photos ?? []) as { src?: string; publicId?: string }[];
  const f = clean(body, new Set([before.cover?.src, before.storyCover?.src, ...photosBefore.map((p) => p.src)].filter(Boolean) as string[]));
  const problem = await problemWith(f);
  if (problem) return bad(problem);

  // (its address stays as it was first saved)
  const post = await BlogPost.findByIdAndUpdate(id, { $set: saved(f) }, { projection: { slug: 1 } }).lean();
  if (!post) return bad("That post was deleted.", 404);
  refresh();
  // a cover or photo replaced or removed goes from the photo store
  await tidy([before.cover?.publicId, before.storyCover?.publicId, ...photosBefore.map((p) => p.publicId)]);
  return NextResponse.json({ ok: true, id, slug: String(post.slug) });
}

/* Deletes one post for good. Its page is gone at once, and its photo files from the photo store. */
export async function DELETE(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!Types.ObjectId.isValid(id)) return bad("Which post?");

  const gone = await BlogPost.findByIdAndDelete(id, { projection: { slug: 1, cover: 1, storyCover: 1, photos: 1 } }).lean();
  if (!gone) return bad("That post was already deleted.", 404);
  refresh();
  await tidy([gone.cover?.publicId, gone.storyCover?.publicId, ...(gone.photos ?? []).map((p: { publicId?: string }) => p.publicId)]);
  return NextResponse.json({ ok: true });
}
