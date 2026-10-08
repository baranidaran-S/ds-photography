import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { InstagramPhoto } from "@/models";
import { bool, cleanPhoto, replaceAll, requireAdmin, str } from "@/lib/admin-api";

export async function PUT(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let incoming: unknown[];
  try {
    const body = await request.json();
    incoming = Array.isArray(body?.photos) ? body.photos : [];
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rows = incoming.map((raw, i) => {
    const p = (raw ?? {}) as Record<string, unknown>;
    return {
      photo: cleanPhoto(p.photo),
      likes: str(p.likes),
      order: i,
      active: bool(p.active),
    };
  });

  /* The strip repeats its photos four times to fill the loop. Below six the
     repetition becomes obvious on a wide screen. */
  const live = rows.filter((r) => r.active && r.photo.src).length;
  if (live < 6) {
    return NextResponse.json(
      { error: `The strip needs at least 6 live photos to loop smoothly — there are ${live}.` },
      { status: 400 },
    );
  }

  await replaceAll(InstagramPhoto, rows);
  revalidatePath("/");
  return NextResponse.json({ ok: true, count: rows.length });
}
