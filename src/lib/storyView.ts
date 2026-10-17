import { ALBUM_PAGE, shownOf, type ShownPhoto } from "./album";
import { albumPage, findCategory } from "./gallery";

export type { ShownPhoto };

/* Everything a kind of shoot's page shows, put together on the server (CategoryStory renders
   it): one album of every photo of that kind, with no couple's or family's names, place or date,
   read from the admin's Gallery section (lib/gallery.ts). The first photos come with the page;
   "Show more" fetches the next ones (api/gallery/photos), so a kind with thousands of photos
   still opens quickly. */

export type StoryView = {
  category: { slug: string; name: string };
  kind: { id: string; slug: string; name: string; local?: string };
  /** the photo that opens the page: its own cover, or else its category's; none yet, none */
  cover?: ShownPhoto;
  /** the first photos, newest first */
  photos: ShownPhoto[];
  /** how many it has in all, and whether there are more than came with the page */
  total: number;
  more: boolean;
  /** the kinds either side of this one in its category (itself, when it's the only one) */
  prev: { slug: string; name: string };
  next: { slug: string; name: string };
};

/** A kind of shoot's page (undefined if there's no such live one) */
export async function storyView(categorySlug: string, kindSlug: string): Promise<StoryView | undefined> {
  const found = await findCategory(categorySlug);
  if (!found) return undefined;
  const { category } = found;
  const index = category.subs.findIndex((s) => s.slug === kindSlug);
  if (index < 0) return undefined;
  const kind = category.subs[index];

  const own = kind.cover?.src ? { photo: kind.cover, shape: kind.shape } : undefined;
  const fallback = category.cover.src ? { photo: category.cover, shape: category.shape } : undefined;
  const opening = own ?? fallback;
  const shape = opening?.shape ?? 1.5;
  const cover: ShownPhoto | undefined = opening && {
    src: opening.photo.src,
    alt: own ? `${kind.name} by DS Photography` : opening.photo.alt,
    w: Math.round(shape * 1000),
    h: 1000,
  };

  const first = await albumPage(kind.id ?? "", ALBUM_PAGE);

  const near = (k: number) => {
    const s = category.subs[(k + category.subs.length) % category.subs.length];
    return { slug: s.slug, name: s.name };
  };

  return {
    category: { slug: category.slug, name: category.name },
    kind: { id: kind.id ?? "", slug: kind.slug, name: kind.name, local: kind.local },
    cover,
    photos: first.photos.map((p, i) => shownOf(p, kind.name, i + 1)),
    total: kind.count ?? first.photos.length,
    more: first.more,
    prev: near(index - 1),
    next: near(index + 1),
  };
}
