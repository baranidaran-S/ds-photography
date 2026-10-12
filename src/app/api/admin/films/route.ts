import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Film } from "@/models";
import { bool, cleanPhoto, replaceAll, requireAdmin, str } from "@/lib/admin-api";

/** Accepts watch?v=, youtu.be/, shorts/, embed/ and live/ links — same as Films.tsx. */
const YT = /(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed|live)\/)([\w-]{11})/;

export async function PUT(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let incoming: unknown[];
  try {
    const body = await request.json();
    incoming = Array.isArray(body?.films) ? body.films : [];
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rows = incoming.map((raw, i) => {
    const f = (raw ?? {}) as Record<string, unknown>;
    return {
      title: str(f.title, "Untitled"),
      label: str(f.label),
      url: str(f.url).trim(),
      thumbnail: cleanPhoto(f.thumbnail),
      order: i,
      active: bool(f.active),
    };
  });

  /* A link that does not parse means the card shows "coming soon" with no way to
     play it — far better to say so now than to let it ship silently broken. */
  const bad = rows.find((r) => r.active && r.url && !YT.test(r.url));
  if (bad) {
    return NextResponse.json(
      { error: `"${bad.title}" does not look like a YouTube link. Paste the full address from the browser.` },
      { status: 400 },
    );
  }

  await replaceAll(Film, rows);
  revalidatePath("/");
  return NextResponse.json({ ok: true, count: rows.length });
}
