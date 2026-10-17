import { galleryTree } from "@/lib/gallery";
import { GalleryEditor } from "./GalleryEditor";
import { PageHeader } from "../../components/PageHeader";

/* The website's Gallery: its categories and the sub-categories inside each, hidden ones too.
   ?open=<sub-category id> (coming back from its Photos page) opens its category, scrolled to it. */
export default async function GalleryAdminPage({ searchParams }: PageProps<"/admin/gallery">) {
  const { open } = await searchParams;
  const initial = await galleryTree();

  return (
    <div>
      <PageHeader
        title="Gallery"
        intro="The categories on the website's Gallery page, and the sub-categories (kinds of shoot) inside each, in the order shown here. Each sub-category's photos are added on its Photos page."
      >
        <a
          href="/gallery"
          target="_blank"
          rel="noopener"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[0.84rem] font-medium text-slate-700 transition-colors hover:border-brand hover:text-accent-deep"
        >
          View the gallery &#8599;
        </a>
      </PageHeader>
      <GalleryEditor initial={initial} openSub={typeof open === "string" ? open : undefined} />
    </div>
  );
}
