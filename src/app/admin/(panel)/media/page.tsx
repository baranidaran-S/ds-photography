import { connectDB } from "@/lib/db";
import { Media } from "@/models";
import { MediaBrowser, type MediaItem } from "./MediaBrowser";
import { Pager } from "../../components/Pager";
import { PageHeader } from "../../components/PageHeader";

const PER_PAGE = 24;

export default async function MediaPage({
  searchParams,
}: PageProps<"/admin/media">) {
  const q = await searchParams;
  const folder = typeof q.folder === "string" ? q.folder : "";
  const page = Math.max(1, Number(typeof q.page === "string" ? q.page : 1) || 1);

  await connectDB();
  const where = folder ? { folder } : {};

  /* The counts come from their own aggregation rather than from the rows on
     screen: with only one page loaded, counting what is in front of us would
     label the "hero" chip 3 when the library holds 300. */
  const [rows, total, byFolder] = await Promise.all([
    Media.find(where)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PER_PAGE)
      .limit(PER_PAGE)
      .lean(),
    Media.countDocuments(where),
    Media.aggregate([{ $group: { _id: "$folder", n: { $sum: 1 } } }]),
  ]);

  const items: MediaItem[] = rows.map((m) => ({
    id: String(m._id),
    publicId: String(m.publicId ?? ""),
    url: String(m.url ?? ""),
    width: Number(m.width) || 0,
    height: Number(m.height) || 0,
    format: String(m.format ?? ""),
    bytes: Number(m.bytes) || 0,
    folder: String(m.folder ?? "misc"),
    originalName: String(m.originalName ?? ""),
  }));

  const counts: Record<string, number> = {};
  let everything = 0;
  for (const row of byFolder) {
    counts[String(row._id)] = Number(row.n);
    everything += Number(row.n);
  }

  return (
    <div>
      <PageHeader
        title="Media Library"
        intro="Every photo uploaded through the admin. Cloudinary handles resizing and format for you."
      />
      <MediaBrowser
        items={items}
        folder={folder}
        counts={counts}
        everything={everything}
      />
      <Pager
        page={page}
        pages={Math.max(1, Math.ceil(total / PER_PAGE))}
        total={total}
        base="/admin/media"
        params={folder ? { folder } : {}}
        noun="photos"
      />
    </div>
  );
}
