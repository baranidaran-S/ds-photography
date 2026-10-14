import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { galleryCategories } from "@/content/gallery";
import { findKind, storyView } from "@/lib/storyView";
import { CategoryStory } from "@/components/gallery/CategoryStory";

// Only the kinds of shoot listed in content/gallery.ts have pages; any other address is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return galleryCategories.flatMap((c) =>
    c.subs.map((s) => ({ category: c.slug, sub: s.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/gallery/[category]/[sub]">): Promise<Metadata> {
  const { category, sub } = await params;
  const view = await storyView(category, sub);
  return view
    ? {
        title: `${view.kind.name} | ${view.category.name} | DS Photography`,
        description:
          view.story.description[0] ?? findKind(category, sub)?.category.intro,
      }
    : {};
}

/* A kind of shoot's page: its story, with photos from its folder and words from stories.ts */
export default async function KindPage({
  params,
}: PageProps<"/gallery/[category]/[sub]">) {
  const { category, sub } = await params;
  const view = await storyView(category, sub);
  if (!view) notFound();
  return <CategoryStory key={`${category}/${sub}`} view={view} />;
}
