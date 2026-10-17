import { NextResponse } from "next/server";
import { requireAdmin, str } from "@/lib/admin-api";
import { lookAtCover } from "@/lib/coverLook";
import { isStoredPhoto } from "@/lib/photoStore";

/* POST { src }: a cover just uploaded in a post's form, looked at for its focus point (where the
   people are), its card's colour and its size (lib/coverLook.ts). Only the website's own uploads
   are fetched. */
export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let src: string;
  try {
    src = str((await request.json())?.src);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!isStoredPhoto(src)) return NextResponse.json({ error: "That photo isn't one of the website's uploads." }, { status: 400 });

  try {
    return NextResponse.json(await lookAtCover(src));
  } catch (err) {
    console.warn("[blog] couldn't look at a cover:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Couldn't look at the photo." }, { status: 502 });
  }
}
