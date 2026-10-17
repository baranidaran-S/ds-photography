import { NextResponse } from "next/server";
import { GalleryCategory, GalleryPhoto, GallerySub } from "@/models";
import { requireAdmin } from "@/lib/admin-api";
import { deleteFiles, isGalleryFile } from "@/lib/photoStore";

/* Discard on a Photos page: the photos uploaded but never saved are deleted from the photo store,
   so they don't sit there unused. Only the gallery's own files, and only ones nothing uses. */
export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let ids: string[];
  try {
    const body = await request.json();
    ids = (Array.isArray(body?.publicIds) ? body.publicIds : [])
      .map((id: unknown) => (typeof id === "string" ? id : ""))
      .filter(isGalleryFile)
      .slice(0, 1000);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!ids.length) return NextResponse.json({ ok: true, deleted: 0 });

  const used = new Set(
    (
      await Promise.all([
        GalleryPhoto.find({ publicId: { $in: ids } }, { publicId: 1 }).lean(),
        GalleryCategory.find({ "cover.publicId": { $in: ids } }, { cover: 1 }).lean(),
        GallerySub.find({ "cover.publicId": { $in: ids } }, { cover: 1 }).lean(),
      ])
    )
      .flat()
      .map((d) => String((d as { publicId?: string }).publicId ?? (d as { cover?: { publicId?: string } }).cover?.publicId ?? "")),
  );
  const deleted = await deleteFiles(ids.filter((id) => !used.has(id)));
  return NextResponse.json({ ok: true, deleted });
}
