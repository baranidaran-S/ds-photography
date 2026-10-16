/* The gallery search: what it can find, and how a query is matched against it. The list itself is
   put together on the server (searchIndex.ts) from the same content the gallery pages show and
   served as one file, /search.json; the browser fetches it once, when the search is first reached
   for, and searches it here as the visitor types (instant, with no server to ask each time). */

export type SearchItem = {
  type: "category" | "shoot" | "event";
  name: string;
  /** The Tamil or traditional name, shown beside the name */
  local?: string;
  /** Where it sits, shown under the name */
  where: string;
  /** For the results page's filters: the category it's in (a category: itself), the kind of shoot
      (a kind: itself; an event: its kind), and an event's town ("Thiruparankundram, Madurai" →
      "Madurai"); an event's year comes from `date` */
  category: string;
  kind?: string;
  place?: string;
  href: string;
  /** A little picture of it */
  photo?: string;
  /** An event's photo's width ÷ height, so the results page can show it whole */
  shape?: number;
  /** An event's date as written ("March 2025"), and as a number for newest first (202503) */
  when?: string;
  date?: number;
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
    newest event first, then the list's order. */
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
    .sort((a, b) => b.score - a.score || (b.item.date ?? 0) - (a.item.date ?? 0) || a.i - b.i)
    .map((r) => r.item);
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
