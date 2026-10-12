import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";

/* Only the two calls replaceAll makes. Matching mongoose's full Model type here
   would drag its generics back in, which is what blew up the type-checker. */
type Writable = {
  deleteMany: (filter: object) => unknown;
  insertMany: (docs: object[]) => unknown;
};

/** Every admin route starts the same way: verify the session, then open the DB. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }
  try {
    await connectDB();
  } catch (err) {
    return {
      error: NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "Could not reach the database.",
        },
        { status: 503 },
      ),
    };
  }
  return { session };
}

/* Section editors send the whole list back on save. For lists this small that is
   simpler and less error-prone than per-row create/update/delete calls, and it
   makes reordering and deleting fall out for free. The swap runs as
   delete-then-insert, so a failure mid-way is visible rather than silent. */
export async function replaceAll(Model: Writable, rows: object[]) {
  await Model.deleteMany({});
  if (rows.length) await Model.insertMany(rows);
}

/** Normalises a photo coming from the admin into the shape the schema stores. */
export function cleanPhoto(input: unknown) {
  const p = (input ?? {}) as Record<string, unknown>;
  return {
    src: String(p.src ?? ""),
    alt: String(p.alt ?? ""),
    position: String(p.position ?? "50% 50%"),
    mobilePosition: String(p.mobilePosition ?? ""),
    publicId: String(p.publicId ?? ""),
  };
}

export function str(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

export function bool(v: unknown, fallback = true) {
  return typeof v === "boolean" ? v : fallback;
}
