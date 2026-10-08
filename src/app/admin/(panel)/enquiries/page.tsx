import { connectDB } from "@/lib/db";
import { Enquiry } from "@/models";
import { EnquiryList, type EnquiryRow } from "./EnquiryList";
import { Pager } from "../../components/Pager";
import { PageHeader } from "../../components/PageHeader";

const PER_PAGE = 20;
const STATUSES = [
  "new",
  "contacted",
  "confirmed",
  "closed",
  "cancelled",
] as const;

export default async function EnquiriesPage({
  searchParams,
}: PageProps<"/admin/enquiries">) {
  const q = await searchParams;
  const raw = typeof q.status === "string" ? q.status : "";
  const status = (STATUSES as readonly string[]).includes(raw) ? raw : "";
  const page = Math.max(1, Number(typeof q.page === "string" ? q.page : 1) || 1);

  await connectDB();
  const where = status ? { status } : {};

  /* The chip counts are their own aggregation. Counting the rows on screen
     would say "new (3)" when there are three on this page and ninety behind it. */
  const [rows, total, byStatus] = await Promise.all([
    Enquiry.find(where)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PER_PAGE)
      .limit(PER_PAGE)
      .lean(),
    Enquiry.countDocuments(where),
    Enquiry.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);

  // the visitor's IP is stored only to rate-limit the public form; it never leaves the server
  const items: EnquiryRow[] = rows.map((e) => ({
    id: String(e._id),
    name: String(e.name ?? ""),
    phone: String(e.phone ?? ""),
    email: String(e.email ?? ""),
    eventType: String(e.eventType ?? ""),
    eventDate: String(e.eventDate ?? ""),
    message: String(e.message ?? ""),
    status: (STATUSES as readonly string[]).includes(e.status)
      ? e.status
      : "new",
    notes: String(e.notes ?? ""),
    source: String(e.source ?? ""),
    openedWhatsapp: e.openedWhatsapp === true,
    createdAt: new Date(e.createdAt).toISOString(),
  }));

  const counts: Record<string, number> = {};
  let everything = 0;
  for (const row of byStatus) {
    counts[String(row._id)] = Number(row.n);
    everything += Number(row.n);
  }
  const fresh = counts.new ?? 0;

  return (
    <div>
      <PageHeader
        title="Enquiries & Leads"
        intro={
          fresh
            ? `${fresh} new ${fresh === 1 ? "enquiry" : "enquiries"} waiting for a reply.`
            : "Everyone who filled in the form on your site."
        }
      />
      <EnquiryList
        items={items}
        status={status}
        counts={counts}
        everything={everything}
      />
      <Pager
        page={page}
        pages={Math.max(1, Math.ceil(total / PER_PAGE))}
        total={total}
        base="/admin/enquiries"
        params={status ? { status } : {}}
        noun="enquiries"
        one="enquiry"
      />
    </div>
  );
}
