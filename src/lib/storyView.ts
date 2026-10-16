import { galleryCategories } from "@/content/gallery";
import { stories } from "@/content/stories";
import { kindPhotos } from "./kindPhotos";

/* Everything a kind of shoot's page shows, put together on the server (CategoryStory renders
   it): the photos from its folder (kindPhotos.ts) and the words from stories.ts. Anything
   missing is filled with a placeholder, so the page can be seen before the real story arrives. */

/** A photo with its shape; `src` is "" for an empty placeholder frame */
export type ShownPhoto = {
  src: string;
  alt: string;
  position?: string;
  caption?: string;
  w: number;
  h: number;
};

export type StoryView = {
  category: { slug: string; name: string };
  kind: { slug: string; name: string; local?: string };
  story: {
    names: string;
    date: string;
    place: string;
    /** their experience in their own words, one paragraph each; empty until it's written */
    description: string[];
    cover: ShownPhoto;
    photos: ShownPhoto[];
    /** the photos they love most (up to five, from their photos); empty hides the section */
    loved: ShownPhoto[];
  };
  /** the kinds either side of this one in its category */
  prev: { slug: string; name: string };
  next: { slug: string; name: string };
};

// The photos are laid out with at least this many; empty frames make up the rest, in these
// shapes in turn
const MIN_PHOTOS = 6;
const FRAME_SHAPES: [number, number][] = [
  [4, 5],
  [3, 2],
  [4, 5],
  [1, 1],
  [4, 5],
  [3, 2],
];

// How many of their most-loved photos the page shows
const LOVED = 5;

// Who a story is about, until the real names are in
const NAMES: Record<string, string> = {
  weddings: "Bride & Groom",
  couple: "The Couple",
  "maternity-baby": "The Family",
  "kids-birthdays": "The Little One",
  "family-functions": "The Family",
  portraits: "Their Name",
  events: "The Event",
};

export function findKind(categorySlug: string, kindSlug: string) {
  const category = galleryCategories.find((c) => c.slug === categorySlug);
  const index = category?.subs.findIndex((s) => s.slug === kindSlug) ?? -1;
  return category && index >= 0
    ? { category, index, kind: category.subs[index] }
    : undefined;
}

/** A kind of shoot's page */
export async function storyView(
  categorySlug: string,
  kindSlug: string,
): Promise<StoryView | undefined> {
  const found = findKind(categorySlug, kindSlug);
  if (!found) return undefined;
  const { category, index, kind } = found;
  const words = stories[kind.slug] ?? {};
  const folder = await kindPhotos(kind.slug);

  // no cover in the folder: the category's own photo stands in
  const cover: ShownPhoto = folder.cover
    ? {
        ...folder.cover,
        alt: words.cover?.alt ?? kind.name,
        position: words.cover?.position,
      }
    : {
        src: category.cover.src,
        alt: category.cover.alt,
        position: category.cover.position,
        w: 3,
        h: 2,
      };
  // (an empty "" counts as not written yet)
  const name = words.names || NAMES[category.slug] || "Their Names";
  const photos: ShownPhoto[] = folder.photos.map((p, i) => ({
    ...p,
    alt: `${name}, ${kind.name}: photo ${i + 1}`,
  }));
  // their favourites, by number in the photos' order (1 = the first); numbers past the last
  // photo are skipped, and five at most
  const loved = (words.loved ?? [])
    .map((n) => photos[n - 1])
    .filter((p): p is ShownPhoto => !!p)
    .slice(0, LOVED);
  for (let i = photos.length; i < MIN_PHOTOS; i++) {
    const [w, h] = FRAME_SHAPES[i % FRAME_SHAPES.length];
    photos.push({ src: "", alt: "", w, h });
  }

  const near = (k: number) => {
    const s = category.subs[(k + category.subs.length) % category.subs.length];
    return { slug: s.slug, name: s.name };
  };

  return {
    category: { slug: category.slug, name: category.name },
    kind: { slug: kind.slug, name: kind.name, local: kind.local },
    story: {
      names: name,
      date: words.date || "Date of the shoot",
      place: words.place || "Venue, city",
      description: words.description ?? [],
      cover,
      photos,
      loved,
    },
    prev: near(index - 1),
    next: near(index + 1),
  };
}
