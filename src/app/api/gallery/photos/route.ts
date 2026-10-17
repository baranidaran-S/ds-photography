import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { albumPage } from "@/lib/gallery";
import { GalleryCategory, GallerySub } from "@/models";

/* "Show more" on a kind of shoot's album page: its next photos, newest first, after the photo
   `before`. Only a live kind in a live category answers. */

const PAGE = 24;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const subId = params.get("sub") ?? "";
  if (!Types.ObjectId.isValid(subId)) return NextResponse.json({ photos: [], more: false }, { status: 404 });
  try {
    await connectDB();
    const sub = await GallerySub.findOne({ _id: subId, active: true }, { category: 1 }).lean();
    const live = sub && (await GalleryCategory.exists({ _id: sub.category, active: true }));
    if (!live) return NextResponse.json({ photos: [], more: false }, { status: 404 });
    return NextResponse.json(await albumPage(subId, PAGE, params.get("before") ?? undefined));
  } catch {
    return NextResponse.json({ photos: [], more: false, error: "Could not load the photos." }, { status: 503 });
  }
}
