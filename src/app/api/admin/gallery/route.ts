import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { GalleryCategory, GalleryPhoto, GallerySub, Media } from "@/models";
import { bool, requireAdmin, str } from "@/lib/admin-api";
import { galleryTree } from "@/lib/gallery";
import { deleteFiles } from "@/lib/photoStore";
import { slugOf } from "@/lib/slug";

/* Saves the whole gallery as the admin's editor holds it: categories in order, each with its
   kinds of shoot in order. Unlike the other lists this never wipes and refills: what's already
   saved keeps its id (a kind's photos will hang off it), what's new is added, and what's no longer
   in the list is deleted, its kinds with it (and their photos). Addresses are made from the names
   here, so two with the same name are turned back with a message rather than one quietly getting
   "-2". Files no longer used (a replaced or removed cover, a deleted kind's photos) are deleted
   from the photo store too, so they don't take up its space. */

type Incoming = {
  id: string;
  name: string;
  cover: { src: string; publicId: string; width: number; height: number };
  active: boolean;
  subs: { id: string; name: string; local: string; cover: Incoming["cover"]; active: boolean }[];
};

const rec = (v: unknown) => (v ?? {}) as Record<string, unknown>;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : 0);

function cleanCover(input: unknown) {
  const p = rec(input);
  const src = str(p.src);
  // (only photos uploaded to the photo store; anything else is left out)
  if (!src.startsWith("https://")) return { src: "", publicId: "", width: 0, height: 0 };
  return { src, publicId: str(p.publicId), width: num(p.width), height: num(p.height) };
}

function clean(raw: unknown): Incoming {
  const c = rec(raw);
  return {
    id: str(c.id),
    name: str(c.name).trim().slice(0, 80),
    cover: cleanCover(c.cover),
    active: bool(c.active),
    subs: (Array.isArray(c.subs) ? c.subs : []).map((raw) => {
      const s = rec(raw);
      return {
        id: str(s.id),
        name: str(s.name).trim().slice(0, 80),
        local: str(s.local).trim().slice(0, 80),
        cover: cleanCover(s.cover),
        active: bool(s.active),
      };
    }),
  };
}

/** What's wrong with the names, in words for the admin; nothing if they're fine */
function problemWith(categories: Incoming[]) {
  const seen = new Map<string, string>();
  for (const c of categories) {
    if (!c.name) return "A category has no name. Give it one, or delete it.";
    const slug = slugOf(c.name);
    if (slug && seen.has(slug)) return `Two categories are called “${c.name}”. Give one of them another name.`;
    seen.set(slug, c.name);
    const subs = new Set<string>();
    for (const s of c.subs) {
      if (!s.name) return `“${c.name}” has a sub-category with no name. Give it one, or delete it.`;
      const sub = slugOf(s.name);
      if (sub && subs.has(sub)) return `“${c.name}” has two sub-categories called “${s.name}”. Give one of them another name.`;
      subs.add(sub);
    }
  }
  return "";
}

export async function PUT(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let categories: Incoming[];
  try {
    const body = await request.json();
    categories = (Array.isArray(body?.categories) ? body.categories : []).map(clean);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const problem = problemWith(categories);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  // what's saved now: an id from the editor counts only if it's one of these
  const [oldCategories, oldSubs] = await Promise.all([
    GalleryCategory.find({}, { _id: 1, cover: 1 }).lean(),
    GallerySub.find({}, { _id: 1, cover: 1 }).lean(),
  ]);
  const savedCategory = new Set(oldCategories.map((c) => String(c._id)));
  const savedSub = new Set(oldSubs.map((s) => String(s._id)));
  const idFor = (id: string, saved: Set<string>) =>
    Types.ObjectId.isValid(id) && saved.has(id) ? { id, isNew: false } : { id: String(new Types.ObjectId()), isNew: true };

  const write = <T extends object>(id: string, isNew: boolean, fields: T) =>
    isNew
      ? { insertOne: { document: { _id: new Types.ObjectId(id), ...fields } } }
      : { updateOne: { filter: { _id: new Types.ObjectId(id) }, update: { $set: fields } } };
  const categoryWrites: object[] = [];
  const subWrites: object[] = [];
  const keptCategories: Types.ObjectId[] = [];
  const keptSubs: Types.ObjectId[] = [];
  categories.forEach((c, i) => {
    const { id, isNew } = idFor(c.id, savedCategory);
    keptCategories.push(new Types.ObjectId(id));
    categoryWrites.push(
      write(id, isNew, {
        name: c.name,
        // (a name with no English letters or numbers can't make an address: the id stands in)
        slug: slugOf(c.name) || `category-${id.slice(-6)}`,
        cover: c.cover,
        order: i,
        active: c.active,
      }),
    );
    c.subs.forEach((s, j) => {
      const sub = idFor(s.id, savedSub);
      keptSubs.push(new Types.ObjectId(sub.id));
      subWrites.push(
        write(sub.id, sub.isNew, {
          category: new Types.ObjectId(id),
          name: s.name,
          local: s.local,
          slug: slugOf(s.name) || `kind-${sub.id.slice(-6)}`,
          cover: s.cover,
          order: j,
          active: s.active,
        }),
      );
    });
  });

  // the files the gallery will no longer use: covers replaced or removed, or of what's deleted,
  // and the photos of the kinds deleted (any file still used as a cover is kept)
  const stillUsed = new Set(categories.flatMap((c) => [c.cover.publicId, ...c.subs.map((s) => s.cover.publicId)]));
  const goneSubs = { sub: { $nin: keptSubs } };
  const goneFiles = [
    ...[...oldCategories, ...oldSubs].map((d) => String((d.cover as { publicId?: string } | undefined)?.publicId ?? "")),
    ...(await GalleryPhoto.find(goneSubs, { publicId: 1 }).lean()).map((p) => String(p.publicId ?? "")),
  ].filter((id) => id && !stillUsed.has(id));

  try {
    // (the bulk writes take mongoose's loose shapes; each one is built above from cleaned fields)
    if (categoryWrites.length) await GalleryCategory.bulkWrite(categoryWrites as never[]);
    if (subWrites.length) await GallerySub.bulkWrite(subWrites as never[]);
    // what's no longer in the list goes, a deleted category's kinds with it, and their photos
    await GalleryPhoto.deleteMany(goneSubs);
    await GallerySub.deleteMany({ _id: { $nin: keptSubs } });
    await GalleryCategory.deleteMany({ _id: { $nin: keptCategories } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save the gallery." },
      { status: 500 },
    );
  }

  // the unused files go from the photo store (and from the Media Library, where a cover uploaded
  // before may be listed)
  if (goneFiles.length) {
    await deleteFiles(goneFiles);
    await Media.deleteMany({ publicId: { $in: goneFiles } }).catch(() => {});
  }

  // every gallery page, and the search's list, are made again on their next visit (a pattern
  // names the folder the pages are in, route group and all)
  revalidatePath("/gallery");
  revalidatePath("/(site)/gallery/[category]", "page");
  revalidatePath("/(site)/gallery/[category]/[sub]", "page");
  revalidatePath("/search.json");
  revalidatePath("/sitemap.xml");
  // the editor takes back what was saved, new ones with their ids
  return NextResponse.json({ ok: true, categories: await galleryTree() });
}
