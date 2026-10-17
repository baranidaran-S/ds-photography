import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { dropUnused } from "../files";

/* POST { publicIds }: photos uploaded in a post's form but not kept (replaced, removed, or the form
   left without saving) are deleted from the photo store, so they don't sit there unused. Only the
   blog's own files, and only ones no post uses. */
export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let ids: string[];
  try {
    const body = await request.json();
    ids = (Array.isArray(body?.publicIds) ? body.publicIds : [])
      .filter((id: unknown): id is string => typeof id === "string")
      .slice(0, 500);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, deleted: await dropUnused(ids) });
}
