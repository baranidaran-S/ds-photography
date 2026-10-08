import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Story } from "@/models";
import { bool, cleanPhoto, replaceAll, requireAdmin, str } from "@/lib/admin-api";

export async function PUT(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let incoming: unknown[];
  try {
    const body = await request.json();
    incoming = Array.isArray(body?.stories) ? body.stories : [];
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rows = incoming.map((raw, i) => {
    const s = (raw ?? {}) as Record<string, unknown>;
    const photos = Array.isArray(s.photos) ? s.photos : [];
    return {
      category: str(s.category, "Wedding"),
      title: str(s.title, "Untitled"),
      place: str(s.place),
      date: str(s.date),
      note: str(s.note),
      cover: cleanPhoto(s.cover),
      /* The album page lays out exactly two prints side by side, so the pair is
         padded or trimmed here rather than letting the layout break. */
      photos: [cleanPhoto(photos[0]), cleanPhoto(photos[1])],
      order: i,
      active: bool(s.active),
    };
  });

  await replaceAll(Story, rows);
  revalidatePath("/");
  return NextResponse.json({ ok: true, count: rows.length });
}
