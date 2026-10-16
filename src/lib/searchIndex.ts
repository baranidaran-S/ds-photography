import { galleryCategories } from "@/content/gallery";
import { stories } from "@/content/stories";
import { kindSearchPhotos } from "@/lib/kindPhotos";
import type { SearchItem } from "@/lib/search";

/* Everything the gallery search can find, put together on the server from the same content the
   gallery pages show, and nothing else: each category by its name, each kind of shoot by its name
   and its Tamil name, and each event by the names on it, with its date (for newest first) and its
   top photo's shape (so the results page shows it whole). Served as one file, /search.json, that
   the browser fetches only when the search is opened. */

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** The town in a place ("Thiruparankundram, Madurai" → "Madurai"), for the place filter */
const townOf = (place?: string) => place?.split(",").at(-1)?.trim() || undefined;

/** "March 2025" as 202503, so later dates count higher (a span like "2024 – 2025" counts as its
    last year); nothing if there's no year in it */
function sortableDate(date?: string) {
  const years = date?.match(/\d{4}/g);
  if (!years) return undefined;
  const month = MONTHS.findIndex((m) => date!.toLowerCase().includes(m));
  return Number(years.at(-1)) * 100 + (month + 1);
}

export async function getSearchItems(): Promise<SearchItem[]> {
  const categories: SearchItem[] = [];
  const shoots: SearchItem[] = [];
  const events: SearchItem[] = [];
  for (const c of galleryCategories) {
    categories.push({
      type: "category",
      name: c.name,
      where: `${c.subs.length} kinds of shoot`,
      category: c.name,
      href: `/gallery/${c.slug}`,
      photo: c.cover.src || undefined,
      words: c.name,
    });
    for (const s of c.subs) {
      const href = `/gallery/${c.slug}/${s.slug}`;
      const photos = await kindSearchPhotos(s.slug);
      shoots.push({
        type: "shoot",
        name: s.name,
        local: s.local,
        where: `in ${c.name}`,
        category: c.name,
        kind: s.name,
        href,
        photo: photos.cover,
        words: `${s.name} ${s.local ?? ""}`,
      });
      const story = stories[s.slug];
      if (story?.names) {
        events.push({
          type: "event",
          name: story.names,
          where: `${s.name} · ${c.name}`,
          category: c.name,
          kind: s.name,
          place: townOf(story.place),
          href,
          photo: photos.hero?.src,
          shape: photos.hero ? +(photos.hero.w / photos.hero.h).toFixed(3) : undefined,
          when: story.date,
          date: sortableDate(story.date),
          words: story.names,
        });
      }
    }
  }
  return [...categories, ...shoots, ...events];
}
