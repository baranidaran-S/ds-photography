import { getGallery } from "@/lib/gallery";
import type { SearchItem } from "@/lib/search";

/* Everything the gallery search can find, put together on the server from the same gallery the
   pages show (the admin's Gallery section), and nothing else: each category by its name, and each
   kind of shoot by its name and its Tamil name (with how many photos its album has, to suggest
   the fullest first). Served as one file, /search.json, that the browser fetches only when the
   search is opened; saving the gallery in the admin makes it again. */

export async function getSearchItems(): Promise<SearchItem[]> {
  const categories: SearchItem[] = [];
  const shoots: SearchItem[] = [];
  for (const c of await getGallery()) {
    const n = c.subs.length;
    categories.push({
      type: "category",
      name: c.name,
      where: n ? `${n} kind${n === 1 ? "" : "s"} of shoot` : "Coming soon",
      category: c.name,
      href: `/gallery/${c.slug}`,
      photo: c.cover.src || undefined,
      words: c.name,
    });
    for (const s of c.subs) {
      shoots.push({
        type: "shoot",
        name: s.name,
        local: s.local,
        where: `in ${c.name}`,
        category: c.name,
        kind: s.name,
        href: `/gallery/${c.slug}/${s.slug}`,
        photo: s.cover?.src || undefined,
        count: s.count ?? 0,
        words: `${s.name} ${s.local ?? ""}`,
      });
    }
  }
  return [...categories, ...shoots];
}
