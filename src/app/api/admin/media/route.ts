import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Media } from "@/models";
import { ROOT_FOLDER, deleteImage } from "@/lib/cloudinary";

/** Library listing for the picker and the Media page. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 60), 200);

  await connectDB();
  const items = await Media.find(folder ? { folder } : {})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    items: items.map((m) => ({
      id: String(m._id),
      publicId: m.publicId,
      url: m.url,
      width: m.width,
      height: m.height,
      format: m.format,
      bytes: m.bytes,
      folder: m.folder,
      originalName: m.originalName,
    })),
  });
}

/** Records an upload the widget has already completed. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const publicId = String(body.publicId ?? "");
  const url = String(body.url ?? "");
  if (!publicId || !url) {
    return NextResponse.json(
      { error: "publicId and url are required" },
      { status: 400 },
    );
  }

  await connectDB();
  // the widget can re-send on retry, so upsert rather than insert
  const doc = await Media.findOneAndUpdate(
    { publicId },
    {
      publicId,
      url,
      width: Number(body.width ?? 0),
      height: Number(body.height ?? 0),
      format: String(body.format ?? ""),
      bytes: Number(body.bytes ?? 0),
      folder: String(body.folder ?? "misc").replace(`${ROOT_FOLDER}/`, ""),
      originalName: String(body.originalName ?? ""),
    },
    { upsert: true, new: true },
  ).lean();

  return NextResponse.json({ ok: true, id: String(doc?._id ?? "") });
}

/** Removes a file from Cloudinary and the library. Sections already using it keep
    their copied src, so a delete never blanks a live page without warning. */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const publicId = searchParams.get("publicId");
  if (!publicId) {
    return NextResponse.json({ error: "publicId is required" }, { status: 400 });
  }

  await connectDB();
  await deleteImage(publicId).catch(() => {});
  await Media.deleteOne({ publicId });

  return NextResponse.json({ ok: true });
}
