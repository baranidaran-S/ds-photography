// The gallery (/gallery): its categories, and the kinds of shoot (sub-categories) inside each
// (/gallery/<category>), each one album of photos (/gallery/<category>/<kind>). They're all made
// in the admin's Gallery section and read from the database (lib/gallery.ts); these are their shapes.

import type { Photo } from "./photos";

export type GallerySub = {
  /** its id in the database (the admin's gallery), to fetch more of its photos */
  id?: string;
  slug: string;
  name: string;
  /** The Tamil or traditional name, shown with the English one */
  local?: string;
  /** Its cover photo (its card on the category's page, and the photo that opens its album) */
  cover?: Photo;
  /** That photo's width ÷ height, filled in with it */
  shape?: number;
  /** How many photos its album has */
  count?: number;
};

export type GalleryCategory = {
  /** The category's address: /gallery/<slug> */
  slug: string;
  name: string;
  /** Its photo on the gallery page. An empty src shows it with "Photos coming soon". */
  cover: Photo;
  /** That photo's width ÷ height, filled in with it */
  shape?: number;
  subs: GallerySub[];
};
