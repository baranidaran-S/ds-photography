"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { NoResults, SearchRow, useSearchItems } from "@/components/providers/SearchProvider";
import { useEnquiry } from "@/components/providers/SiteProvider";
import { ArrowIcon, SearchIcon } from "@/components/ui/icons";
import { FocusMark } from "@/components/ui/ornaments";
import { searchItems, type SearchItem } from "@/lib/search";

/* The search results page (/search?q=…). On a warm band at the top: what was typed, editable, and
   the filters on a gold-edged card. Below: categories and kinds of shoot as compact rows (there are
   only ever a few dozen), and events as a grid of their photos, 24 at a time with "Show more", each
   photo whole on a soft mat in a square frame, so the grid stays even whatever the client uploads.
   With nothing typed and no filter chosen, nothing is shown (no photos fetched) but a few things to
   try. Typing updates the address without reloading (so it can be shared or bookmarked); the
   results follow once typing pauses (or at Enter, or the search button), so the photos for
   half-typed words ("b", "ba", "bab" on the way to "baby") are never fetched.
   Filters narrow down what the search found (with nothing typed, every event): categories, kinds of
   shoot inside the chosen categories (listed under them; until a category is chosen it says to
   choose one first), years and towns (those two are events' only, so choosing either shows events).
   Several can be ticked in each: any of them will do, while every filter set must match. Kinds
   narrow only their own category (Weddings + Couple with Reception ticked: the receptions, and all
   of Couple). None ticked is all of them.
   Each offers only what's in the results (with the other filters applied), so a choice never leads
   to nothing; no counts beside them, for a clean list. A new search clears them. Sort orders the events (so until there
   are some, it says to search or pick a filter first). */

const PAGE = 24;
// how long typing must pause before the results follow
const SETTLE = 250;
// offered to try on the empty page (any not in the gallery are left out)
const TRY = ["Reception", "Nalangu", "Newborn", "First birthday", "Engagement", "Housewarming"];

type Filters = { categories: string[]; kinds: string[]; years: string[]; places: string[] };
type FilterKey = keyof Filters;
const NO_FILTERS: Filters = { categories: [], kinds: [], years: [], places: [] };
type Sort = "best" | "newest" | "oldest";

const yearOf = (it: SearchItem) => (it.date ? String(Math.floor(it.date / 100)) : "");

/** Whether a result passes the filters (leaving one of them out, to list that one's choices);
    `kindOf` says which category each kind of shoot is in */
function passes(it: SearchItem, f: Filters, except: FilterKey | undefined, kindOf: Map<string, string>) {
  // the kinds ticked in this result's category (none: the whole category counts)
  const kindsHere = f.kinds.filter((k) => kindOf.get(k) === it.category);
  return (
    (except === "categories" || !f.categories.length || f.categories.includes(it.category)) &&
    (except === "kinds" || !kindsHere.length || (it.type !== "category" && kindsHere.includes(it.kind ?? ""))) &&
    (except === "years" || !f.years.length || (it.type === "event" && f.years.includes(yearOf(it)))) &&
    (except === "places" || !f.places.length || (it.type === "event" && f.places.includes(it.place ?? "")))
  );
}

/** Each value and how many results have it (in the order of `place` when given: the gallery's) */
function tally(list: SearchItem[], valueOf: (it: SearchItem) => string | undefined, place?: Map<string, number>) {
  const counts = new Map<string, number>();
  for (const it of list) {
    const v = valueOf(it);
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const tallied = [...counts].map(([value, count]) => ({ value, count }));
  return place ? tallied.sort((a, b) => (place.get(a.value) ?? 0) - (place.get(b.value) ?? 0)) : tallied;
}

// little line icons for the filters, in the site's style
const ICONS = {
  category: (
    <>
      <rect x="3.5" y="7" width="13.5" height="13" rx="1.5" />
      <path d="M7 4h11.5a2 2 0 0 1 2 2v11" />
    </>
  ),
  kind: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  year: <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />,
  place: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  sort: <path d="M8 4v16M4.5 16.5 8 20l3.5-3.5M16 20V4M12.5 7.5 16 4l3.5 3.5" />,
  refine: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4.5v5M8 14.5v5" />,
};
function Icon({ name, className = "size-4" }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {ICONS[name]}
    </svg>
  );
}

export function SearchResults() {
  const q = useSearchParams().get("q") ?? "";
  const enquire = useEnquiry();
  const { items, failed, retry } = useSearchItems(true);
  // what's in the box as it's typed, and what the results show: the box once typing pauses
  const [text, setText] = useState(q);
  const [typed, setTyped] = useState(q.trim());
  const [shown, setShown] = useState(PAGE);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<Sort>("best");

  // a new search starts clean: no filters, best match, the first 24
  const startOver = (v: string) => {
    setTyped(v);
    setShown(PAGE);
    setFilters(NO_FILTERS);
    setSort("best");
  };

  // arriving from the search panel again with something else ("See all results")
  const [arrivedWith, setArrivedWith] = useState(q);
  if (q !== arrivedWith) {
    setArrivedWith(q);
    setText(q);
    startOver(q.trim());
  }

  // the results (and the address, without a reload or a request) follow what was typed
  const settle = (value: string) => {
    const v = value.trim();
    startOver(v);
    // (noted first, so the address changing doesn't count as arriving with something new)
    setArrivedWith(v);
    window.history.replaceState(null, "", v ? `/search?q=${encodeURIComponent(v)}` : "/search");
  };
  useEffect(() => {
    if (text.trim() === typed) return;
    const wait = setTimeout(() => settle(text), SETTLE);
    return () => clearTimeout(wait);
  });

  // which category each kind of shoot is in
  const kindCategory = useMemo(
    () => new Map((items ?? []).filter((it) => it.type === "shoot").map((it) => [it.name, it.category])),
    [items],
  );
  // a choice ticked or unticked; a category unticked takes its kinds of shoot with it, and a kind
  // ticked ticks its category too
  const toggle = (key: FilterKey, value: string) => {
    setFilters((f) => {
      const next = { ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] };
      const category = key === "kinds" ? kindCategory.get(value) : undefined;
      if (category && !next.categories.includes(category)) next.categories = [...next.categories, category];
      if (key === "categories") next.kinds = next.kinds.filter((k) => next.categories.includes(kindCategory.get(k) ?? ""));
      return next;
    });
    setShown(PAGE);
  };
  // a filter emptied (a category's empties the kinds too)
  const clear = (key: FilterKey) => {
    setFilters((f) => ({ ...f, [key]: [], ...(key === "categories" ? { kinds: [] } : {}) }));
    setShown(PAGE);
  };
  const clearFilters = () => {
    setFilters(NO_FILTERS);
    setShown(PAGE);
  };

  const filtered = Object.values(filters).some((v) => v.length > 0);
  // nothing typed and nothing chosen: nothing to show yet
  const asked = !!typed || filtered;
  // with nothing typed there's no "best match": newest first, unless oldest is chosen
  const order: Sort = !typed && sort === "best" ? "newest" : sort;

  const view = useMemo(() => {
    // what the search found, or with nothing typed every event (the filters' choices come from it)
    const base = !items ? [] : typed ? searchItems(items, typed) : items.filter((it) => it.type === "event");
    const ok = (it: SearchItem, except?: FilterKey) => passes(it, filters, except, kindCategory);
    const found = asked ? base.filter((it) => ok(it)) : [];
    const events = found.filter((it) => it.type === "event");
    if (order !== "best") {
      const when = (it: SearchItem) => it.date ?? (order === "newest" ? -Infinity : Infinity);
      events.sort((a, b) => (order === "newest" ? when(b) - when(a) : when(a) - when(b)));
    }
    // where each category and kind of shoot sits in the gallery, to list them in that order
    const gallery = (type: SearchItem["type"]) =>
      new Map((items ?? []).filter((it) => it.type === type).map((it, i) => [it.name, i]));
    return {
      // (categories first, then kinds of shoot, each best first)
      places: [...found.filter((it) => it.type === "category"), ...found.filter((it) => it.type === "shoot")],
      events,
      total: base.length,
      categories: tally(
        base.filter((it) => ok(it, "categories")),
        (it) => it.category,
        gallery("category"),
      ),
      // the kinds of shoot, under their categories
      kinds: (() => {
        const kinds = tally(
          base.filter((it) => it.type !== "category" && filters.categories.includes(it.category) && ok(it, "kinds")),
          (it) => it.kind,
          gallery("shoot"),
        );
        const groups: { label: string; options: typeof kinds }[] = [];
        for (const k of kinds) {
          const label = kindCategory.get(k.value) ?? "";
          const group = groups.find((g) => g.label === label);
          if (group) group.options.push(k);
          else groups.push({ label, options: [k] });
        }
        return groups;
      })(),
      years: tally(
        base.filter((it) => it.type === "event" && ok(it, "years")),
        yearOf,
      ).sort((a, b) => Number(b.value) - Number(a.value)),
      towns: tally(
        base.filter((it) => it.type === "event" && ok(it, "places")),
        (it) => it.place,
      ).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
      suggestions: (items ?? []).filter((it) => it.type === "shoot" && TRY.includes(it.name)),
    };
  }, [items, typed, filters, order, asked, kindCategory]);
  const { places, events } = view;
  const showing = places.length + events.length;

  // the filters chosen, each removable on its own
  const chosen = (["categories", "kinds", "years", "places"] as const).flatMap((key) =>
    filters[key].map((value) => ({ key: `${key} ${value}`, value, remove: () => toggle(key, value) })),
  );

  return (
    <>
      {/* ── The warm band: what to search for, and the filters ── */}
      <section className="sf-band border-b border-ink/10">
        <div className="mx-auto max-w-[1320px] px-4 pt-32 pb-10 sm:px-8 sm:pt-36 sm:pb-12 lg:px-12 lg:pt-40 lg:pb-14">
          <p className="flex items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-accent-deep uppercase">
            <FocusMark className="h-4 w-6 text-accent" />
            Search the gallery
          </p>
          <h1 id="search-title" className="mt-5 font-display text-[clamp(2.2rem,5vw,4.2rem)] leading-[1.08]">
            {typed ? (
              <>
                Results for <span className="foil-deep">&ldquo;{typed}&rdquo;</span>
              </>
            ) : (
              <>
                Find your <span className="foil-deep">celebration</span>
              </>
            )}
          </h1>
          <p className="mt-3 text-[0.95rem] leading-[1.7] text-ink/60">
            {!items
              ? " "
              : asked
                ? `${showing} ${showing === 1 ? "result" : "results"}${events.length ? ` · ${events.length} ${events.length === 1 ? "event" : "events"}` : ""}${filtered ? ` · filtered from ${view.total}` : ""}`
                : "Every celebration, kind of shoot and family we’ve photographed."}
          </p>

          {/* What to search for */}
          <div className="mt-7 flex w-full max-w-[44rem] items-center gap-3 rounded-full bg-[#fffdf8] py-1.5 pr-1.5 pl-5 shadow-[0_24px_50px_-30px_rgb(60_30_15/0.6)] ring-1 ring-brand/55 transition-[box-shadow] focus-within:ring-2 focus-within:ring-accent-deep/45 sm:pl-6">
            <SearchIcon className="size-5 shrink-0 text-accent-deep" />
            <input
              type="search"
              value={text}
              autoFocus={!q}
              onChange={(e) => setText(e.target.value)}
              // (Enter shows the results straight away)
              onKeyDown={(e) => e.key === "Enter" && settle(text)}
              placeholder="A celebration, a kind of shoot or a name…"
              aria-label="Search categories, kinds of shoot and names"
              className="min-w-0 flex-1 bg-transparent py-3 text-[1.02rem] text-ink placeholder:text-ink/40 focus:outline-none sm:text-[1.08rem] [&::-webkit-search-cancel-button]:hidden"
            />
            {text && (
              <button
                type="button"
                onClick={() => {
                  setText("");
                  settle("");
                }}
                aria-label="Clear the search"
                className="grid size-9 shrink-0 place-items-center rounded-full text-[1.3rem] leading-none text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                &times;
              </button>
            )}
            <button
              type="button"
              onClick={() => settle(text)}
              aria-label="Search"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-deep text-cream shadow-[0_10px_20px_-10px_rgb(142_17_32/0.8)] transition-colors duration-300 hover:bg-accent sm:size-12"
            >
              <ArrowIcon className="size-4" />
            </button>
          </div>

          {/* The filters, on a gold-edged card */}
          {items && view.total > 0 && (
            <div
              role="group"
              aria-label="Filter and sort the results"
              className="sr-filters relative mt-8 rounded-[22px] bg-[#fffdf8] p-5 shadow-[0_30px_60px_-40px_rgb(60_30_15/0.5)] ring-1 ring-brand/45 sm:p-7"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="flex items-center gap-2.5 font-display text-[1.15rem] sm:text-[1.25rem]">
                  <Icon name="refine" className="size-5 text-accent-deep" />
                  Refine your search
                </p>
                {filtered && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="font-heading text-[0.64rem] font-semibold tracking-[0.18em] text-accent-deep uppercase underline-offset-4 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                {/* (phones: across the top, the others two by two below) */}
                <div className="col-span-2 lg:col-span-1">
                  <MultiChoice
                    label="Category"
                    icon="category"
                    chosen={filters.categories}
                    options={view.categories}
                    onToggle={(v) => toggle("categories", v)}
                    onClear={() => clear("categories")}
                  />
                </div>
                <MultiChoice
                  label="Sub-category"
                  icon="kind"
                  chosen={filters.kinds}
                  groups={view.kinds}
                  onToggle={(v) => toggle("kinds", v)}
                  onClear={() => clear("kinds")}
                  hint={filters.categories.length ? undefined : "Choose a category first"}
                  offLabel="Category first"
                />
                <MultiChoice
                  label="Year"
                  icon="year"
                  chosen={filters.years}
                  options={view.years}
                  onToggle={(v) => toggle("years", v)}
                  onClear={() => clear("years")}
                />
                <MultiChoice
                  label="Place"
                  icon="place"
                  chosen={filters.places}
                  options={view.towns}
                  onToggle={(v) => toggle("places", v)}
                  onClear={() => clear("places")}
                />
                <Choice
                  label="Sort"
                  icon="sort"
                  value={order}
                  onChange={(v) => setSort(v as Sort)}
                  options={[
                    ...(typed ? [{ value: "best", label: "Best match" }] : []),
                    { value: "newest", label: "Newest first" },
                    { value: "oldest", label: "Oldest first" },
                  ]}
                  noAll
                  quiet
                  hint={events.length ? undefined : asked ? "No events to sort" : "Search or pick a filter first"}
                />
              </div>

              {/* The filters chosen, each removable */}
              {chosen.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-5">
                  <span className="mr-1 font-mono text-[0.6rem] tracking-[0.2em] text-ink/50 uppercase">Showing</span>
                  {chosen.map(({ key, value, remove }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={remove}
                      aria-label={`Remove ${value}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#f3e6d4] py-1.5 pr-2.5 pl-3.5 text-[0.84rem] text-accent-deep transition-colors hover:bg-[#ecdbc4]"
                    >
                      {value}
                      <span aria-hidden className="text-[1rem] leading-none text-accent-deep/60">
                        &times;
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── What it found ── */}
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
        {!items && !failed && <div aria-label="Loading" className="mt-12 h-48 animate-pulse rounded-[18px] bg-ink/5" />}
        {failed && (
          <p className="mt-12 text-[0.95rem] text-ink/65">
            The search couldn&rsquo;t load just now.{" "}
            <button type="button" onClick={retry} className="font-semibold text-accent-deep underline">
              Try again
            </button>
          </p>
        )}

        {/* Nothing asked yet: a few things to try */}
        {items && !asked && (
          <div className="mx-auto flex max-w-[40rem] flex-col items-center py-16 text-center lg:py-20">
            <FocusMark className="h-7 w-10 text-accent" />
            <p className="mt-5 font-display text-[clamp(1.4rem,2.6vw,1.9rem)] leading-[1.25]">
              Start with a name or a celebration
            </p>
            <p className="mt-2 text-[0.95rem] leading-[1.7] text-ink/60">
              Type above, or choose a category, year or place to see the events.
            </p>
            {view.suggestions.length > 0 && (
              <div className="mt-7 flex flex-wrap justify-center gap-2.5">
                <span className="w-full font-mono text-[0.6rem] tracking-[0.2em] text-ink/45 uppercase">Try</span>
                {view.suggestions.map((s) => (
                  <button
                    key={s.href}
                    type="button"
                    onClick={() => {
                      setText(s.name);
                      settle(s.name);
                    }}
                    className="rounded-full bg-[#fffdf8] px-4 py-2 text-[0.88rem] text-ink/80 ring-1 ring-brand/40 transition-colors duration-300 hover:bg-accent-deep hover:text-cream hover:ring-accent-deep"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories and kinds of shoot */}
        {places.length > 0 && (
          <section aria-labelledby="search-places" className="mt-12 lg:mt-14">
            <Heading id="search-places" count={places.length}>
              Categories &amp; kinds of shoot
            </Heading>
            <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((item) => (
                <li key={`${item.type} ${item.href}`}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3.5 rounded-[14px] bg-[#fffdf8] px-3 py-2.5 ring-1 ring-brand/30 transition-[box-shadow,translate] duration-500 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-24px_rgb(60_30_15/0.5)] hover:ring-accent-deep/40"
                  >
                    <SearchRow item={item} />
                    <ArrowIcon className="size-4 shrink-0 text-accent-deep/50 transition-[color,translate] duration-500 group-hover:translate-x-0.5 group-hover:text-accent-deep" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Events */}
        {events.length > 0 && (
          <section aria-labelledby="search-events" className="mt-14 lg:mt-16">
            <Heading id="search-events" count={events.length}>
              Events
            </Heading>
            <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-9">
              {events.slice(0, shown).map((item, i) => (
                <li key={item.href}>
                  <EventCard item={item} eager={i < 4} />
                </li>
              ))}
            </ul>
            {shown < events.length && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <p className="font-mono text-[0.62rem] tracking-[0.18em] text-ink/55 uppercase">
                  Showing {shown} of {events.length}
                </p>
                <button
                  type="button"
                  onClick={() => setShown((s) => s + PAGE)}
                  className="inline-flex items-center gap-3 rounded-full border border-accent-deep/40 px-7 py-3.5 font-heading text-[0.7rem] font-semibold tracking-[0.2em] text-accent-deep uppercase transition-colors duration-500 hover:border-accent-deep hover:bg-accent-deep hover:text-cream"
                >
                  Show more events
                </button>
              </div>
            )}
          </section>
        )}

        {items && typed && view.total === 0 && (
          <div className="mx-auto mt-10 max-w-[40rem]">
            <NoResults query={typed} onTell={() => enquire({ source: "search" })} />
          </div>
        )}
      </div>
    </>
  );
}

/** A results section's heading: its name, how many, and a gold line running on */
function Heading({ id, count, children }: { id: string; count: number; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-3 font-display text-[clamp(1.3rem,2.2vw,1.7rem)] leading-none">
      {children}
      <span className="rounded-full bg-[#f3e6d4] px-2.5 py-1 font-mono text-[0.66rem] tracking-[0.08em] text-accent-deep">
        {count}
      </span>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-brand/60 to-transparent" />
    </h2>
  );
}

type Option = { value: string; label?: string; count?: number };

/** A dropdown in the site's look: a cream pill (its icon, what's chosen, an arrow) that opens the
    site's own list below it (the browser's own list can't be styled, and looks different on every
    device). It closes on a click outside or Esc; the arrow keys move through the list. While it's
    off, a little bubble says why (on hover, or for a moment when it's tapped). */
function Dropdown({
  label,
  icon,
  summary,
  active,
  hint,
  children,
  footer,
}: {
  label: string;
  icon: keyof typeof ICONS;
  /** what the pill says */
  summary: string;
  /** whether something is chosen (a maroon edge) */
  active: boolean;
  /** given while it's off: why */
  hint?: string;
  children: (close: () => void) => React.ReactNode;
  footer?: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [nudged, setNudged] = useState(false);
  // (a list that would run off the right of the screen opens leftwards instead)
  const [toLeft, setToLeft] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();
  const off = !!hint;
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", esc);
    // (the chosen one, or else the first, takes the keyboard)
    const list = box.current?.querySelector<HTMLElement>("[data-list]");
    (list?.querySelector<HTMLElement>("[data-chosen='true']") ?? list?.querySelector<HTMLElement>("[data-item]"))?.focus({
      preventScroll: true,
    });
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  useEffect(() => {
    if (!nudged) return;
    const wait = setTimeout(() => setNudged(false), 1800);
    return () => clearTimeout(wait);
  }, [nudged]);

  const toggle = () => {
    if (off) return setNudged(true);
    const r = box.current?.getBoundingClientRect();
    setToLeft(!!r && r.left + Math.max(r.width, 256) > window.innerWidth - 12);
    setOpen((o) => !o);
  };
  const onListKeys = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(box.current?.querySelectorAll<HTMLElement>("[data-item]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  };

  return (
    <div ref={box} className="group/select relative flex min-w-0 flex-col gap-1.5">
      <span className="font-mono text-[0.6rem] tracking-[0.2em] text-ink/50 uppercase">{label}</span>
      {off && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute bottom-[calc(100%-1.25rem)] left-1/2 z-10 mb-2.5 -translate-x-1/2 rounded-[8px] bg-ink px-3 py-1.5 text-[0.76rem] whitespace-nowrap text-cream shadow-[0_10px_24px_-10px_rgb(0_0_0/0.5)] transition-opacity duration-300 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-ink after:content-[''] group-hover/select:opacity-100 ${nudged ? "opacity-100" : "opacity-0"}`}
        >
          {hint}
        </span>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={listId}
        aria-disabled={off || undefined}
        aria-label={`${label}: ${summary}`}
        className={`relative h-12 w-full min-w-0 rounded-full bg-cream pr-8 pl-4 text-left text-[0.86rem] ring-1 transition-[box-shadow] focus:ring-2 focus:ring-accent-deep/45 focus:outline-none sm:pr-9 sm:pl-11 sm:text-[0.9rem] ${
          off ? "cursor-default text-ink/40" : "text-ink"
        } ${active || open ? "ring-accent-deep/45" : "ring-brand/35"}`}
      >
        {/* (the icon from tablets up: phones need the room for the words) */}
        <Icon
          name={icon}
          className={`pointer-events-none absolute top-1/2 left-4 hidden size-4 -translate-y-1/2 sm:block ${off ? "text-ink/30" : "text-accent-deep"}`}
        />
        <span className="block truncate">{summary}</span>
        <svg
          aria-hidden
          viewBox="0 0 12 8"
          className={`pointer-events-none absolute top-1/2 right-4 h-2 w-3 -translate-y-1/2 transition-transform duration-300 ${off ? "text-ink/30" : "text-accent-deep"} ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M1 1.5 6 6.5l5-5" />
        </svg>
      </button>

      {open && (
        <div
          id={listId}
          role="group"
          aria-label={label}
          // (scrolling the list never scrolls the page behind)
          data-lenis-prevent
          onKeyDown={onListKeys}
          className={`sr-list absolute top-full z-30 mt-2 w-full min-w-[16rem] overflow-hidden rounded-[16px] bg-[#fffdf8] shadow-[0_30px_60px_-24px_rgb(60_30_15/0.5)] ring-1 ring-brand/50 ${toLeft ? "right-0" : "left-0"}`}
        >
          <div data-list className="max-h-[18rem] overflow-y-auto overscroll-contain p-1.5">
            {children(close)}
          </div>
          {footer && (
            <div className="flex items-center justify-between border-t border-ink/10 px-4 py-2.5">{footer(close)}</div>
          )}
        </div>
      )}
    </div>
  );
}

/** One row of a list: what it is, and whether it's chosen */
function Row({
  chosen,
  onClick,
  tick,
  label,
}: {
  chosen: boolean;
  onClick: () => void;
  /** a tick-box (several can be chosen) rather than a mark on the one chosen */
  tick?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      data-item
      data-chosen={chosen}
      role={tick ? "menuitemcheckbox" : "option"}
      aria-checked={tick ? chosen : undefined}
      aria-selected={tick ? undefined : chosen}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[0.9rem] transition-colors hover:bg-[#f6ecdf] focus:bg-[#f6ecdf] focus:outline-none ${chosen ? "text-accent-deep" : "text-ink/85"}`}
    >
      {tick && (
        <span
          aria-hidden
          className={`grid size-[1.1rem] shrink-0 place-items-center rounded-[5px] ring-1 transition-colors ${
            chosen ? "bg-accent-deep ring-accent-deep" : "bg-cream ring-ink/25"
          }`}
        >
          {chosen && (
            <svg viewBox="0 0 12 10" className="h-2.5 w-3 text-cream" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1.5 5.2 4.5 8l6-6.5" />
            </svg>
          )}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {!tick && (
        <svg
          aria-hidden
          viewBox="0 0 12 10"
          className={`h-2.5 w-3 shrink-0 text-accent-deep ${chosen ? "" : "invisible"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M1.5 5.2 4.5 8l6-6.5" />
        </svg>
      )}
    </button>
  );
}

/** A heading over a group in a list (a kind of shoot's category): bold maroon, a gold line running on */
function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 flex items-center gap-2.5 px-3 pt-3 pb-1.5 font-heading text-[0.66rem] font-bold tracking-[0.2em] text-accent-deep uppercase">
      {children}
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-brand/60 to-transparent" />
    </p>
  );
}

/** A filter where several can be chosen: a tick-box for each (or for each under its heading, in
    groups); "All" while none is chosen, else the first chosen and how many more */
function MultiChoice({
  label,
  icon,
  chosen,
  options = [],
  groups,
  onToggle,
  onClear,
  hint,
  offLabel = "—",
}: {
  label: string;
  icon: keyof typeof ICONS;
  chosen: string[];
  options?: Option[];
  groups?: { label: string; options: Option[] }[];
  onToggle: (value: string) => void;
  onClear: () => void;
  /** given while it's off: why */
  hint?: string;
  /** what it says while it's off */
  offLabel?: string;
}) {
  const inGroups = (groups ?? []).flatMap((g) => g.options);
  // (one ticked that the other filters have since emptied still shows, to untick)
  const missing = chosen.filter((c) => !options.some((o) => o.value === c) && !inGroups.some((o) => o.value === c));
  const listed = [...options, ...(groups ? [] : missing.map((value) => ({ value })))];
  const any = listed.length + inGroups.length > 0;
  const summary = hint
    ? offLabel
    : !chosen.length
      ? any
        ? "All"
        : "—"
      : chosen.length === 1
        ? chosen[0]
        : `${chosen[0]} +${chosen.length - 1}`;
  const row = (o: Option) => (
    <Row key={o.value} tick chosen={chosen.includes(o.value)} onClick={() => onToggle(o.value)} label={o.label ?? o.value} />
  );
  return (
    <Dropdown
      label={label}
      icon={icon}
      summary={summary}
      active={chosen.length > 0}
      hint={hint ?? (any || chosen.length ? undefined : "Nothing to choose here")}
      footer={(close) => (
        <>
          <button
            type="button"
            onClick={onClear}
            disabled={!chosen.length}
            className="font-heading text-[0.62rem] font-semibold tracking-[0.18em] text-accent-deep uppercase disabled:text-ink/30"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-full bg-accent-deep px-4 py-1.5 font-heading text-[0.62rem] font-semibold tracking-[0.18em] text-cream uppercase transition-colors hover:bg-accent"
          >
            Done
          </button>
        </>
      )}
    >
      {() => (
        <>
          {listed.map(row)}
          {groups?.map((g) => (
            <div key={g.label} role="group" aria-label={g.label}>
              <GroupHeading>{g.label}</GroupHeading>
              {g.options.map(row)}
            </div>
          ))}
        </>
      )}
    </Dropdown>
  );
}

/** A filter where one is chosen: "All" (unless `noAll`), then each choice (or the choices in
    groups, each under its heading); choosing one closes the list */
function Choice({
  label,
  icon,
  value,
  onChange,
  options,
  groups,
  hint,
  noAll,
  quiet,
}: {
  label: string;
  icon: keyof typeof ICONS;
  value: string;
  onChange: (value: string) => void;
  options?: Option[];
  groups?: { label: string; options: Option[] }[];
  hint?: string;
  /** no "All" (sort: always one of its orders) */
  noAll?: boolean;
  /** never shown as a filter set (sort) */
  quiet?: boolean;
}) {
  const all = [...(options ?? []), ...(groups ?? []).flatMap((g) => g.options)];
  const any = all.length > 0;
  const current = all.find((o) => o.value === value);
  const row = (o: Option, close: () => void) => (
    <Row
      key={o.value}
      chosen={o.value === value}
      onClick={() => {
        onChange(o.value);
        close();
      }}
      label={o.label ?? o.value}
    />
  );
  return (
    <Dropdown
      label={label}
      icon={icon}
      summary={current ? (current.label ?? current.value) : hint ? (label === "Sub-category" ? "Category first" : "—") : any ? "All" : "—"}
      active={!quiet && !!value}
      hint={hint ?? (any ? undefined : "Nothing to choose here")}
    >
      {(close) => (
        <>
          {!noAll && (
            <Row
              chosen={!value}
              onClick={() => {
                onChange("");
                close();
              }}
              label="All"
            />
          )}
          {options?.map((o) => row(o, close))}
          {groups?.map((g) => (
            <div key={g.label} role="group" aria-label={g.label}>
              <GroupHeading>{g.label}</GroupHeading>
              {g.options.map((o) => row(o, close))}
            </div>
          ))}
        </>
      )}
    </Dropdown>
  );
}

/** An event: its top photo whole on a soft mat, its names, and what kind of shoot and when */
function EventCard({ item, eager }: { item: SearchItem; eager: boolean }) {
  return (
    <Link href={item.href} className="group block">
      <span className="relative block aspect-square overflow-hidden rounded-[14px] bg-[#efe4d4] shadow-[0_22px_44px_-30px_rgb(60_30_15/0.55)] ring-1 ring-ink/10 transition-[translate,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_30px_54px_-30px_rgb(60_30_15/0.6)]">
        {item.photo && (
          <Image
            src={item.photo}
            alt=""
            fill
            sizes="(min-width: 1320px) 300px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            loading={eager ? "eager" : "lazy"}
            className="object-contain p-2.5 drop-shadow-[0_8px_14px_rgb(60_30_15/0.28)] transition-transform duration-1000 ease-luxe group-hover:scale-[1.03] sm:p-3"
          />
        )}
      </span>
      <span className="mt-3 block px-0.5 font-display text-[clamp(1.05rem,1.6vw,1.35rem)] leading-[1.2] transition-colors duration-500 group-hover:text-accent-deep">
        {item.name}
      </span>
      <span className="mt-1 block px-0.5 text-[0.8rem] leading-[1.45] text-ink/55">
        {item.where}
        {item.when && <> &middot; {item.when}</>}
        {item.place && <> &middot; {item.place}</>}
      </span>
    </Link>
  );
}
