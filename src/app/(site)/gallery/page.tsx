import type { Metadata } from "next";
import { GalleryRows } from "@/components/gallery/GalleryRows";
import { getGallery } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Gallery | DS Photography",
};

/* Gallery: every category in even rows of whole photos, as the admin's Gallery section has them
   (lib/gallery.ts). Each one opens its category, then its kinds of shoots, then each kind's album
   of photos. With none yet, it says the gallery is on its way. */
export default async function GalleryPage() {
  return <GalleryRows categories={await getGallery()} />;
}
