import type { Metadata } from "next";
import { GalleryRows } from "@/components/gallery/GalleryRows";
import { galleryCategories } from "@/content/gallery";
import { withShapes } from "@/lib/kindPhotos";

export const metadata: Metadata = {
  title: "Gallery | DS Photography",
};

/* Gallery: every category in even rows of whole photos. Each one opens its category, then
   its kinds of shoots, then a couple or family's story. */
export default async function GalleryPage() {
  return <GalleryRows categories={await withShapes(galleryCategories)} />;
}
