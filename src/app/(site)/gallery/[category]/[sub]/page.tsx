import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { galleryAddresses } from "@/lib/gallery";
import { storyView } from "@/lib/storyView";
import { CategoryStory } from "@/components/gallery/CategoryStory";

// The kinds there are when the site is built are made ahead; one added later in the admin is made
// on its first visit. An address that isn't a live kind of shoot is a 404.
export async function generateStaticParams() {
  return (await galleryAddresses()).flatMap((c) => c.subs.map((s) => ({ category: c.slug, sub: s.slug })));
}

export async function generateMetadata({ params }: PageProps<"/gallery/[category]/[sub]">): Promise<Metadata> {
  const { category, sub } = await params;
  const view = await storyView(category, sub);
  return view
    ? {
        title: `${view.kind.name} | ${view.category.name} | DS Photography`,
        description: `${view.kind.name} photos by DS Photography (${view.category.name}).`,
      }
    : {};
}

/* A kind of shoot's page: one album of all its photos */
export default async function KindPage({ params }: PageProps<"/gallery/[category]/[sub]">) {
  const { category, sub } = await params;
  const view = await storyView(category, sub);
  if (!view) notFound();
  return <CategoryStory key={`${category}/${sub}`} view={view} />;
}
