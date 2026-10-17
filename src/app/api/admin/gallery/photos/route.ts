import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { GalleryCategory, GalleryPhoto, GallerySub } from "@/models";
import { requireAdmin, str } from "@/lib/admin-api";
import { albumPage } from "@/lib/gallery";
import { deleteFiles, isGalleryFile } from "@/lib/photoStore";

/* A kind of shoot's photos, for its Photos page in the admin.
   GET  ?sub=<id>&before=<photo id>: the next page of them, newest first.
   POST { sub, add: [photos uploaded], remove: [photo ids] }: what Save sends. The new photos are
   recorded, the removed ones deleted (from the photo store too), and the kind's page on the site
   is made again on its next visit. */

const PAGE = 60;
// most photos one save takes (the upload window takes 200 at a time)
const MOST = 1000;

export async function GET(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const params = new URL(request.url).searchParams;
  return NextResponse.json(await albumPage(params.get("sub") ?? "", PAGE, params.get("before") ?? undefined));
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : 0);

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let subId: string;
  let add: { src: string; publicId: string; width: number; height: number }[];
  let remove: string[];
  try {
    const body = await request.json();
    subId = str(body?.sub);
    add = (Array.isArray(body?.add) ? body.add : []).slice(0, MOST).map((raw: unknown) => {
      const p = (raw ?? {}) as Record<string, unknown>;
      return { src: str(p.src), publicId: str(p.publicId), width: num(p.width), height: num(p.height) };
    });
    remove = (Array.isArray(body?.remove) ? body.remove : []).map((id: unknown) => str(id)).filter((id: string) => Types.ObjectId.isValid(id));
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sub = Types.ObjectId.isValid(subId) ? await GallerySub.findById(subId).lean() : null;
  if (!sub) return NextResponse.json({ error: "This sub-category no longer exists. Go back to the Gallery." }, { status: 404 });
  const category = await GalleryCategory.findById(sub.category).lean();

  // only photos uploaded into the gallery's folder, with their size, and each one once
  const known = new Set(
    (await GalleryPhoto.find({ publicId: { $in: add.map((p) => p.publicId) } }, { publicId: 1 }).lean()).map((p) =>
      String(p.publicId),
    ),
  );
  const fresh = add.filter(
    (p, i) =>
      p.src.startsWith("https://") &&
      isGalleryFile(p.publicId) &&
      p.width > 0 &&
      p.height > 0 &&
      !known.has(p.publicId) &&
      add.findIndex((q) => q.publicId === p.publicId) === i,
  );

  const going = await GalleryPhoto.find(
    { _id: { $in: remove.map((id) => new Types.ObjectId(id)) }, sub: sub._id },
    { publicId: 1 },
  ).lean();

  try {
    // (inserted one after another, so the last uploaded has the newest id: newest first on the site)
    if (fresh.length) await GalleryPhoto.insertMany(fresh.map((p) => ({ ...p, sub: sub._id })), { ordered: true });
    if (going.length) await GalleryPhoto.deleteMany({ _id: { $in: going.map((p) => p._id) } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save the photos." }, { status: 500 });
  }
  if (going.length) await deleteFiles(going.map((p) => String(p.publicId ?? "")));

  // its page on the site, and the search (which suggests the fullest kinds), are made again
  if (category) revalidatePath(`/gallery/${category.slug}/${sub.slug}`);
  revalidatePath("/search.json");
  // (an album's first photos put it in the sitemap; its last ones deleted take it out)
  revalidatePath("/sitemap.xml");

  return NextResponse.json({
    ok: true,
    added: fresh.length,
    removed: going.length,
    count: await GalleryPhoto.countDocuments({ sub: sub._id }),
  });
}
