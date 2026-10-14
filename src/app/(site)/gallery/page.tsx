import type { Metadata } from "next";
import { GalleryBento } from "@/components/gallery/GalleryBento";
import { galleryCategories } from "@/content/gallery";

export const metadata: Metadata = {
  title: "Gallery | DS Photography",
};

/* Gallery: every category as a tile in a bento grid. Each one opens its category, then its
   kinds of shoots, then a couple or family's story. */
export default function GalleryPage() {
  return <GalleryBento categories={galleryCategories} />;
}
