import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCategory, galleryAddresses } from "@/lib/gallery";
import { CategoryWall } from "@/components/gallery/CategoryWall";

// The categories there are when the site is built are made ahead; one added later in the admin is
// made on its first visit. An address that isn't a live category is a 404.
export async function generateStaticParams() {
  return (await galleryAddresses()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/gallery/[category]">): Promise<Metadata> {
  const { category } = await params;
  const c = (await findCategory(category))?.category;
  return c
    ? { title: `${c.name} | Gallery | DS Photography`, description: `${c.name} photos by DS Photography.` }
    : {};
}

export default async function CategoryPage({ params }: PageProps<"/gallery/[category]">) {
  const { category } = await params;
  const found = await findCategory(category);
  if (!found) notFound();
  const { gallery, index } = found;

  const total = gallery.length;
  const near = (k: number) => {
    const c = gallery[(k + total) % total];
    return { slug: c.slug, name: c.name };
  };

  return (
    <CategoryWall
      key={category}
      category={found.category}
      number={index + 1}
      total={total}
      prev={near(index - 1)}
      next={near(index + 1)}
    />
  );
}
