import { NextResponse } from "next/server";
import { Enquiry } from "@/models";
import { requireAdmin } from "@/lib/admin-api";

/* Polled by the sidebar badge, so it stays deliberately cheap: two counts and
   the newest name, nothing else. */
export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const [fresh, latest] = await Promise.all([
    Enquiry.countDocuments({ status: "new" }),
    Enquiry.findOne({ status: "new" })
      .sort({ createdAt: -1 })
      .select("name eventType createdAt")
      .lean(),
  ]);

  return NextResponse.json(
    {
      new: fresh,
      latest: latest
        ? {
            id: String(latest._id),
            name: String(latest.name ?? ""),
            eventType: String(latest.eventType ?? ""),
          }
        : null,
    },
    // never cached: a stale count is the one thing this must not return
    { headers: { "Cache-Control": "no-store" } },
  );
}
