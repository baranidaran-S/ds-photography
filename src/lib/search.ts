/* The gallery search: what it can find, and how a query is matched against it. The list itself is
   put together on the server (searchIndex.ts) from the same content the gallery pages show and
   served as one file, /search.json; the browser fetches it once, when the search is first reached
   for, and searches it here as the visitor types (instant, with no server to ask each time). */

export type SearchItem = {
  type: "category" | "shoot";
  name: string;
  /** The Tamil or traditional name, shown beside the name */
  local?: string;
  /** Where it sits, shown under the name */
  where: string;
  /** For the results page's filters: the category it's in (a category: itself), and a kind of
      shoot's own name */
  category: string;
  kind?: string;
  href: string;
  /** A little picture of it */
  photo?: string;
  /** A kind of shoot: how many photos its album has */
  count?: number;
  /** Everything it can be found by */
  words: string;
};

/** Lower case, no accents, "&" read as "and", anything else that isn't a letter or a number a space */
export const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// the words of a query that count ("and" doesn't: "Janani and Vignesh" is "Janani & Vignesh")
const tokensOf = (s: string) =>
  normalise(s)
    .split(" ")
    .filter((t) => t && t !== "and");

/** The items matching a query, best first. Every word typed must appear in an item's words, as
    part of a word ("mater" finds Maternity) or run together ("jananivignesh" finds Janani &
    Vignesh); a single letter must start a word. Best: the name exactly, then a name starting
    with it, then a name with a word starting with it, then anything else; among equals, the
    list's order. */
export function searchItems(items: SearchItem[], query: string) {
  const tokens = tokensOf(query);
  if (!tokens.length) return [];
  const asked = tokens.join(" ");
  return items
    .map((item, i) => {
      const text = tokensOf(item.words).join(" ");
      const words = text.split(" ");
      const runTogether = words.join("");
      const found = tokens.every((t) =>
        t.length === 1 ? words.some((w) => w.startsWith(t)) : text.includes(t) || runTogether.includes(t),
      );
      if (!found) return null;
      const name = tokensOf(item.name).join(" ");
      const score =
        name === asked ? 3 : name.startsWith(asked) ? 2 : name.split(" ").some((w) => w.startsWith(tokens[0])) ? 1 : 0;
      return { item, score, i };
    })
    .filter((r) => r !== null)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((r) => r.item);
}

/** A few kinds of shoot to suggest before anything is typed, picked from the list itself (so they
    follow whatever the gallery holds, with nothing written in the code): the kinds with the most
    photos first, then the gallery's order; one from each category before a second from any, so
    they're varied. A kind with no photos yet isn't suggested; none in the gallery: none. */
export function suggestionsOf(items: SearchItem[], count: number) {
  const ranked = items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.type === "shoot" && (it.count ?? 0) > 0)
    .sort((a, b) => (b.it.count ?? 0) - (a.it.count ?? 0) || a.i - b.i);
  // each category's kinds, best first (the categories in the order of their best kind)
  const byCategory = new Map<string, SearchItem[]>();
  for (const { it } of ranked) byCategory.set(it.category, [...(byCategory.get(it.category) ?? []), it]);
  const picked: SearchItem[] = [];
  for (let round = 0; picked.length < count; round++) {
    const next = [...byCategory.values()].map((kinds) => kinds[round]).filter((it) => it !== undefined);
    if (!next.length) break;
    picked.push(...next);
  }
  return picked.slice(0, count);
}

// the list, fetched once and kept for the rest of the visit
let loading: Promise<SearchItem[]> | null = null;

/** The search list, fetching it the first time (call it early, e.g. as a hand reaches for the
    search button, and it's usually there by the time the search opens) */
export function loadSearchItems() {
  loading ??= fetch("/search.json")
    .then((res) => {
      if (!res.ok) throw new Error(`search list: ${res.status}`);
      return res.json() as Promise<SearchItem[]>;
    })
    .catch((err) => {
      // (a failed fetch is tried again next time)
      loading = null;
      throw err;
    });
  return loading;
}
