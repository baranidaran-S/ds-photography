import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Setting } from "@/models";
import { requireAdmin } from "@/lib/admin-api";

/* Blocks of copy that are edited as a whole: about, contact, footer, seo, site,
   heroOutro, films (the heading above the cards), instagram, logo, pagePhotos,
   portfolio (the album section). */
const ALLOWED = new Set([
  "site",
  "heroOutro",
  "about",
  "contact",
  "footer",
  "films",
  "instagram",
  "logo",
  "pagePhotos",
  "portfolio",
  "hero",
  "services",
  "reviews",
  "seo",
]);

export async function GET(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!ALLOWED.has(key)) {
    return NextResponse.json({ error: "Unknown setting" }, { status: 400 });
  }

  const doc = await Setting.findOne({ key }).lean();
  return NextResponse.json({ value: doc?.value ?? {} });
}

export async function PUT(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let key = "";
  let value: Record<string, unknown> = {};
  try {
    const body = await request.json();
    key = String(body?.key ?? "");
    value = (body?.value ?? {}) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!ALLOWED.has(key)) {
    return NextResponse.json({ error: "Unknown setting" }, { status: 400 });
  }

  /* The WhatsApp number is the one thing on the site that, if wrong, silently
     loses every enquiry — so it is checked rather than trusted. */
  if (key === "site") {
    const number = String(value.whatsappNumber ?? "").replace(/\D/g, "");
    if (number.length < 10 || number.length > 15) {
      return NextResponse.json(
        {
          error:
            "WhatsApp number must be country code + number, digits only (e.g. 919994824771).",
        },
        { status: 400 },
      );
    }
    value.whatsappNumber = number;
  }

  await Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true });
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
