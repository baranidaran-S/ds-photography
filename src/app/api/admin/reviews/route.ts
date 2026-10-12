import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Review } from "@/models";
import { bool, cleanPhoto, replaceAll, requireAdmin, str } from "@/lib/admin-api";

export async function PUT(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let incoming: unknown[];
  try {
    const body = await request.json();
    incoming = Array.isArray(body?.reviews) ? body.reviews : [];
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rows = incoming.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const messages = Array.isArray(r.messages) ? r.messages : [];
    return {
      name: str(r.name, "Someone"),
      shoot: str(r.shoot),
      status: str(r.status, "online"),
      date: str(r.date, "Today"),
      clock: str(r.clock, "9:41"),
      avatar: cleanPhoto(r.avatar),
      messages: messages
        .map((raw2) => {
          const m = (raw2 ?? {}) as Record<string, unknown>;
          const photo = cleanPhoto(m.photo);
          return {
            from: m.from === "studio" ? "studio" : "client",
            text: str(m.text),
            // an empty photo is dropped so the bubble does not reserve space for it
            photo: photo.src ? photo : undefined,
            time: str(m.time),
            reaction: str(m.reaction),
          };
        })
        // ChatShot already filters these out; dropping them here keeps the data clean
        .filter((m) => m.text || m.photo),
      order: i,
      active: bool(r.active),
    };
  });

  const empty = rows.find((r) => r.active && r.messages.length === 0);
  if (empty) {
    return NextResponse.json(
      { error: `"${empty.name}" has no messages. Add at least one, or set the review to hidden.` },
      { status: 400 },
    );
  }

  await replaceAll(Review, rows);
  revalidatePath("/");
  return NextResponse.json({ ok: true, count: rows.length });
}
