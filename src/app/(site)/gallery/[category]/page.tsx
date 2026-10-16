import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { galleryCategories } from "@/content/gallery";
import { withCovers } from "@/lib/kindPhotos";
import { CategoryWall } from "@/components/gallery/CategoryWall";

// Only the categories listed in content/gallery.ts have pages; any other address is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return galleryCategories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/gallery/[category]">): Promise<Metadata> {
  const { category } = await params;
  const c = galleryCategories.find((x) => x.slug === category);
  return c ? { title: `${c.name} | Gallery | DS Photography`, description: c.intro } : {};
}

export default async function CategoryPage({ params }: PageProps<"/gallery/[category]">) {
  const { category } = await params;
  const i = galleryCategories.findIndex((c) => c.slug === category);
  if (i < 0) notFound();

  const total = galleryCategories.length;
  const near = (k: number) => {
    const c = galleryCategories[(k + total) % total];
    return { slug: c.slug, name: c.name };
  };

  return (
    <CategoryWall
      key={category}
      // each kind's card shows the cover photo from its folder, in that photo's own shape
      category={await withCovers(galleryCategories[i])}
      number={i + 1}
      total={total}
      prev={near(i - 1)}
      next={near(i + 1)}
    />
  );
}
