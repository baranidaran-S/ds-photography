import type { GalleryCategoryValue, GalleryCoverValue, GallerySubValue } from "@/lib/gallery";

/* The blanks the gallery editor starts new rows from (kept apart from lib/gallery.ts, which talks
   to the database and so can't be sent to the browser) */

export const NO_COVER: GalleryCoverValue = { src: "", publicId: "", width: 0, height: 0 };

export const newCategory = (): GalleryCategoryValue => ({
  id: "",
  name: "",
  cover: NO_COVER,
  active: true,
  subs: [],
});

export const newSub = (): GallerySubValue => ({ id: "", name: "", local: "", cover: NO_COVER, count: 0, active: true });
