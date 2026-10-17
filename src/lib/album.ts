/* A kind of shoot's album as its page shows it: the pieces both the server (storyView.ts) and the
   page in the browser (CategoryStory, fetching more) use, so nothing here touches the database. */

// photos that come with the page, and that "Show more" adds each time
export const ALBUM_PAGE = 24;

/** A photo with its shape */
export type ShownPhoto = {
  /** its id in the album, to fetch the ones after it */
  id?: string;
  src: string;
  alt: string;
  position?: string;
  caption?: string;
  w: number;
  h: number;
};

/** An album photo as the page shows it (the `n`th of the kind's photos) */
export const shownOf = (p: { id: string; src: string; width: number; height: number }, kind: string, n: number): ShownPhoto => ({
  id: p.id,
  src: p.src,
  alt: `${kind} photo ${n} by DS Photography`,
  // (a photo whose size wasn't recorded shows as a portrait)
  w: p.width || 4,
  h: p.height || 5,
});
