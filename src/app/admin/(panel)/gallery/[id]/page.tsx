import Link from "next/link";
import { notFound } from "next/navigation";
import { albumPage, findSub } from "@/lib/gallery";
import { PhotosEditor } from "./PhotosEditor";
import { PageHeader } from "../../../components/PageHeader";

/* One sub-category's photos (opened from its "Photos" button on the Gallery page) */
export default async function SubPhotosPage({ params }: PageProps<"/admin/gallery/[id]">) {
  const { id } = await params;
  const sub = await findSub(id);
  if (!sub) notFound();
  const first = await albumPage(sub.id, 60);

  return (
    <div>
      <Link
        href={`/admin/gallery?open=${sub.id}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[0.84rem] text-slate-500 transition-colors hover:text-accent-deep"
      >
        &larr; Gallery
      </Link>
      <PageHeader
        title={sub.name}
        intro={`Photos in ${sub.category} › ${sub.name}. They show on its album page on the website, the newest first.`}
      >
        <a
          href={sub.href}
          target="_blank"
          rel="noopener"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[0.84rem] font-medium text-slate-700 transition-colors hover:border-brand hover:text-accent-deep"
        >
          View the album &#8599;
        </a>
      </PageHeader>
      <PhotosEditor sub={{ id: sub.id, name: sub.name, count: sub.count }} initial={first} />
    </div>
  );
}
