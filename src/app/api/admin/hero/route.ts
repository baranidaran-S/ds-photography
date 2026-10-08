import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { HeroSlide } from "@/models";
import { bool, cleanPhoto, replaceAll, requireAdmin, str } from "@/lib/admin-api";

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const slides = await HeroSlide.find({}).sort({ order: 1 }).lean();
  return NextResponse.json({ slides });
}

export async function PUT(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let incoming: unknown[];
  try {
    const body = await request.json();
    incoming = Array.isArray(body?.slides) ? body.slides : [];
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rows = incoming.map((raw, i) => {
    const s = (raw ?? {}) as Record<string, unknown>;
    return {
      label: str(s.label, "Untitled"),
      photo: cleanPhoto(s.photo),
      order: i,
      active: bool(s.active),
    };
  });

  const live = rows.filter((r) => r.active && r.photo.src);
  if (live.length === 0) {
    return NextResponse.json(
      { error: "Keep at least one active slide with a photo — it is the first thing visitors see." },
      { status: 400 },
    );
  }

  await replaceAll(HeroSlide, rows);
  revalidatePath("/");

  return NextResponse.json({ ok: true, count: rows.length });
}
