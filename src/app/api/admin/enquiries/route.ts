import { NextResponse } from "next/server";
import { Enquiry } from "@/models";
import { requireAdmin, str } from "@/lib/admin-api";

const STATUSES = [
  "new",
  "contacted",
  "confirmed",
  "closed",
  "cancelled",
] as const;

/** End states: the lead is done with, one way or the other. */
const FINAL: readonly string[] = ["closed", "cancelled"];

/** Updates one enquiry's status or internal notes. */
export async function PATCH(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = str(body.id);
  if (!/^[a-f0-9]{24}$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.status === "string") {
    if (!(STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "Unknown status" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (typeof body.notes === "string") patch.notes = body.notes.slice(0, 2000);

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  /* Closed and cancelled are the end of the line: once a lead reaches one its
     status is fixed, so a stray click cannot drag a finished job back into the
     pipeline and skew the dashboard. Reopening is a deliberate, separate
     action, which the admin sends as `reopen`. Enforced here and not only in
     the buttons, or the rule would last exactly as long as the page did. */
  if (patch.status) {
    const current = await Enquiry.findById(id).select("status").lean();
    if (!current) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }
    if (
      FINAL.includes(current.status) &&
      patch.status !== current.status &&
      body.reopen !== true
    ) {
      return NextResponse.json(
        {
          error: `This lead is ${current.status}. Reopen it before changing the status.`,
        },
        { status: 409 },
      );
    }
  }

  const updated = await Enquiry.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[a-f0-9]{24}$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await Enquiry.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
