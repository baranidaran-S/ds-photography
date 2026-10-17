// A blog post as the blog page and a story's page show it. The posts come from the database and the
// admin's Blog section, their categories from the gallery's (lib/blog.ts reads them).

import type { Photo } from "./photos";

export type BlogPost = {
  /** Its address: /blog/<slug> (an old site's post keeps its old name, so old links can follow it) */
  slug: string;
  title: string;
  /** Its gallery category's name ("" if it has none) */
  category: string;
  /** Where the shoot was */
  place: string;
  /** Published, as yyyy-mm-dd */
  date: string;
  /** Its card on the blog page */
  cover: Photo;
  /** The top of its own page: its own photo if it has one, otherwise the cover */
  storyCover: Photo;
  /** Its card's colour on the blog page: a deep shade of the cover photo's main colour */
  tone: string;
  /** Two lines or so, for its card on the blog page */
  excerpt: string;
  /** The story's words, all in one, as typed in the admin: an empty line starts a new paragraph,
      and [some words](/an/address) makes a link */
  description: string;
  /** The shoot's photos, in the admin's order, shown together under the words */
  photos: BlogPhoto[];
  /** What search engines show for it */
  seo: { title: string; description: string };
};

/** One of a story's photos, with its size so its shape is known before it loads */
export type BlogPhoto = { src: string; alt: string; w: number; h: number };

/** A card's colour when none was found for its photo: a warm dark brown */
export const DEFAULT_TONE = "#3b2a22";

/** Whether a photo is tall (or square): on a story's page it shows beside another tall one, or on
    its own narrower */
export const isTall = (p: { w: number; h: number }) => p.h >= p.w;

/** The photos in rows as a story's page shows them (and the admin's preview of it): two tall photos
    one after the other side by side, any other photo on its own. `n` is a photo's place in the list. */
export function photoRows<P extends { w: number; h: number }>(photos: P[]) {
  const rows: { photo: P; n: number }[][] = [];
  for (let n = 0; n < photos.length; n++) {
    const next = photos[n + 1];
    if (isTall(photos[n]) && next && isTall(next)) {
      rows.push([{ photo: photos[n], n }, { photo: next, n: n + 1 }]);
      n++;
    } else rows.push([{ photo: photos[n], n }]);
  }
  return rows;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-09-28" → "28 Sep 2026" (read from the text itself, so the server and the browser agree) */
export const dateOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : "";
};
