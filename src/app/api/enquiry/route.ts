import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Enquiry } from "@/models";

/* The only route on the site that accepts writes from the public, so everything
   here assumes the caller is hostile until proven otherwise. */

const MAX = { name: 80, phone: 24, email: 120, eventType: 60, eventDate: 40, message: 1200 };

/** Trims, caps the length, and drops control characters. */
function clean(value: unknown, limit: number) {
  let out = "";
  for (const ch of String(value ?? "")) {
    const code = ch.codePointAt(0) ?? 0;
    // a newline is fine in the message box; the rest would corrupt the record
    out += code === 10 || (code >= 32 && code !== 127) ? ch : " ";
  }
  return out.trim().slice(0, limit);
}

function clientIp(request: Request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  /* Honeypot: a field hidden from people but visible to form-filling bots.
     Anything in it is a bot, so answer 200 — a bot that is told it failed just
     tries again with the field left blank. */
  if (clean(body.website, 50)) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name, MAX.name);
  const phone = clean(body.phone, MAX.phone);
  const email = clean(body.email, MAX.email);
  const eventType = clean(body.eventType, MAX.eventType);
  const eventDate = clean(body.eventDate, MAX.eventDate);
  const message = clean(body.message, MAX.message);
  const source = clean(body.source, 60);

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Please tell us your name." },
      { status: 400 },
    );
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    return NextResponse.json(
      { error: "Please enter a phone number we can reach you on." },
      { status: 400 },
    );
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json(
      { error: "That email address does not look right." },
      { status: 400 },
    );
  }

  try {
    await connectDB();
  } catch {
    return NextResponse.json(
      { error: "We could not save that just now. Please message us on WhatsApp instead." },
      { status: 503 },
    );
  }

  /* Rate limit against the database rather than memory, so it still holds when
     the site runs on more than one instance. */
  const ip = clientIp(request);
  if (ip) {
    const recent = await Enquiry.countDocuments({
      ip,
      createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) },
    });
    if (recent >= 5) {
      return NextResponse.json(
        {
          error:
            "That is a lot of enquiries from one place. Please message us on WhatsApp instead.",
        },
        { status: 429 },
      );
    }
  }

  const doc = await Enquiry.create({
    name,
    phone,
    email,
    eventType,
    eventDate,
    message,
    source,
    status: "new",
    openedWhatsapp: false,
    ip,
  });

  return NextResponse.json({ ok: true, id: String(doc._id) });
}

/** Marks that the visitor went on to WhatsApp after submitting. */
export async function PATCH(request: Request) {
  let id = "";
  try {
    const body = await request.json();
    id = clean(body.id, 40);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!/^[a-f0-9]{24}$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await connectDB();
    /* Only ever flips this one flag on a row that already exists, so a guessed
       id cannot be used to change anything that matters. */
    await Enquiry.updateOne({ _id: id }, { openedWhatsapp: true });
  } catch {
    // best effort — the enquiry is already saved, which is the part that counts
  }

  return NextResponse.json({ ok: true });
}
