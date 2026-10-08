import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Service } from "@/models";
import { bool, cleanPhoto, replaceAll, requireAdmin, str } from "@/lib/admin-api";

export async function PUT(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let incoming: unknown[];
  try {
    const body = await request.json();
    incoming = Array.isArray(body?.services) ? body.services : [];
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rows = incoming.map((raw, i) => {
    const s = (raw ?? {}) as Record<string, unknown>;
    const exif = (s.exif ?? {}) as Record<string, unknown>;
    return {
      name: str(s.name, "Untitled"),
      wide: cleanPhoto(s.wide),
      tall: cleanPhoto(s.tall),
      exif: {
        lens: str(exif.lens, "50mm"),
        aperture: str(exif.aperture, "f/2.8"),
        shutter: str(exif.shutter, "1/250"),
        iso: str(exif.iso, "ISO 400"),
      },
      order: i,
      active: bool(s.active),
    };
  });

  if (!rows.some((r) => r.active)) {
    return NextResponse.json(
      { error: "Keep at least one service live — the viewfinder needs something to show." },
      { status: 400 },
    );
  }

  await replaceAll(Service, rows);
  revalidatePath("/");
  return NextResponse.json({ ok: true, count: rows.length });
}
