"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { useEnquiry } from "@/components/providers/SiteProvider";
import { ArrowIcon, ChatIcon, SearchIcon } from "@/components/ui/icons";
import { FocusMark } from "@/components/ui/ornaments";
import { loadSearchItems, searchItems, type SearchItem } from "@/lib/search";

/* The gallery search, the same on every page: the menu bar's search button (and the Gallery
   page's search box) open it over the page. It finds categories, kinds of shoot (also by their
   Tamil names) and events (by the names on them) as the visitor types, in three groups of the
   best three, each with "+ more" adding ten once (so the panel stays short), and "See all results"
   opening the results page (/search) for the rest. Before anything is typed it suggests a few; when nothing matches it offers the
   enquiry form. Arrow keys and Enter work on computers, and Ctrl/⌘ + K opens it.
   Its list (/search.json) is fetched only when the search is reached for (lib/search.ts). */

const SearchContext = createContext<() => void>(() => {});

/** Opens the search */
export function useOpenSearch() {
  return useContext(SearchContext);
}

/** Starts fetching the search's list early: as a hand reaches for a search button */
export const prefetchSearch = () => void loadSearchItems().catch(() => {});

const GROUPS = [
  { type: "category", label: "Categories" },
  { type: "shoot", label: "Kinds of shoot" },
  { type: "event", label: "Events" },
] as const;
// shown in each group at first, and added when its "+ more" is pressed (once: past that, "See all
// results" opens the results page)
const SHOWN = 3;
const MORE = 10;
// suggested before anything is typed (any that aren't in the gallery are left out)
const POPULAR = [
  "/gallery/weddings",
  "/gallery/weddings/reception",
  "/gallery/maternity-baby/newborn",
  "/gallery/kids-birthdays/first-birthday",
];

/** The search's list, fetched when it's first needed: null while it's on its way, "failed" if it
    couldn't be fetched (`retry` tries again) */
export function useSearchItems(wanted: boolean) {
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!wanted || items) return;
    let live = true;
    loadSearchItems().then(
      (list) => live && setItems(list),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [wanted, items, attempt]);
  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((a) => a + 1);
  }, []);
  return { items, failed, retry };
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  // Ctrl/⌘ + K opens it from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // going to another page (Back, Forward) closes it
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }

  return (
    <SearchContext.Provider value={openSearch}>
      {children}
      <SearchDialog open={open} onClose={close} />
    </SearchContext.Provider>
  );
}

/** One result: its little picture, its name (with its Tamil name), and where it sits */
export function SearchRow({ item, active = false }: { item: SearchItem; active?: boolean }) {
  return (
    <>
      <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-[#e7ddcc] ring-1 ring-ink/10">
        {item.photo ? (
          <Image src={item.photo} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <FocusMark className="h-4 w-6 text-accent/40" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-display text-[1.05rem] leading-[1.3] ${active ? "text-accent-deep" : ""}`}>
          {item.name}
          {item.local && <span className="text-ink/45"> · {item.local}</span>}
        </span>
        <span className="block truncate text-[0.8rem] text-ink/55">{item.where}</span>
      </span>
    </>
  );
}

/** Nothing found: they can still tell us what they're celebrating */
export function NoResults({ query, onTell }: { query: string; onTell: () => void }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <FocusMark className="h-6 w-9 text-accent" />
      <p className="mt-4 font-display text-[1.2rem]">No results for &ldquo;{query}&rdquo;</p>
      <p className="mt-1.5 max-w-[34ch] text-[0.92rem] leading-[1.6] text-ink/60">
        Tell us what you&rsquo;re celebrating and we&rsquo;ll show you how we&rsquo;d capture it.
      </p>
      <button type="button" onClick={onTell} className="btn-brand btn-sm mt-6">
        <ChatIcon className="size-4" />
        Tell us
      </button>
    </div>
  );
}

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const router = useRouter();
  const enquire = useEnquiry();
  const { items, failed, retry } = useSearchItems(open);
  const [query, setQuery] = useState("");
  // the groups whose "+ more" has been pressed
  const [more, setMore] = useState<Partial<Record<SearchItem["type"], boolean>>>({});
  const [active, setActive] = useState(0);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setQuery("");
      setMore({});
      setActive(0);
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  const typed = query.trim().length > 0;
  const groups = useMemo(() => {
    if (!items) return [];
    if (!typed) {
      const popular = POPULAR.map((href) => items.find((it) => it.href === href && it.type !== "event")).filter(
        (it): it is SearchItem => !!it,
      );
      return [{ type: "popular" as const, label: "Popular", all: popular, shown: popular }];
    }
    const found = searchItems(items, query);
    return GROUPS.map((g) => {
      const all = found.filter((it) => it.type === g.type);
      return { ...g, all, opened: !!more[g.type], shown: all.slice(0, SHOWN + (more[g.type] ? MORE : 0)) };
    }).filter((g) => g.all.length > 0);
  }, [items, query, typed, more]);
  // every row showing, in order, for the arrow keys, and where each group's rows start in it
  const rows = groups.flatMap((g) => g.shown);
  const starts = groups.map((_, gi) => groups.slice(0, gi).reduce((sum, g) => sum + g.shown.length, 0));
  const total = typed ? groups.reduce((sum, g) => sum + g.all.length, 0) : 0;
  const allHref = `/search?q=${encodeURIComponent(query.trim())}`;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!rows.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (active + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length;
      setActive(next);
      document.getElementById(`${id}-row-${next}`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(rows[Math.min(active, rows.length - 1)].href);
    }
  };

  return (
    <dialog
      ref={dialog}
      // (scrolling in here never scrolls the page behind: Lenis leaves it alone)
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-label="Search the gallery"
      className="fixed inset-0 m-0 size-full max-h-none max-w-none flex-col items-center border-0 bg-night/75 p-3 backdrop-blur-[3px] backdrop:bg-transparent open:flex sm:p-8 sm:pt-[11vh]"
    >
      {open && (
        <div className="sr-panel flex max-h-full w-[min(100%,40rem)] flex-col overflow-hidden rounded-[18px] bg-cream text-ink shadow-[0_40px_90px_-30px_rgb(0_0_0/0.75)] ring-1 ring-brand/45">
          {/* What to search for */}
          <div className="flex items-center gap-3 border-b border-ink/10 px-4 sm:px-5">
            <SearchIcon className="size-5 shrink-0 text-accent-deep" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
                setMore({});
              }}
              onKeyDown={onKeyDown}
              placeholder="Find your celebration…"
              role="combobox"
              aria-expanded={rows.length > 0}
              aria-controls={`${id}-list`}
              aria-activedescendant={rows.length ? `${id}-row-${active}` : undefined}
              aria-autocomplete="list"
              aria-label="Search categories, kinds of shoot and names"
              className="min-w-0 flex-1 bg-transparent py-4 font-display text-[1.15rem] text-ink placeholder:text-ink/35 focus:outline-none sm:py-5 sm:text-[1.3rem] [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="grid size-9 shrink-0 place-items-center rounded-full text-[1.3rem] leading-none text-ink/45 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              &times;
            </button>
          </div>

          {/* What it found */}
          <div id={`${id}-list`} role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3">
            {/* (the list on its way: the first time only, usually a moment) */}
            {!items && !failed && (
              <div aria-label="Loading" className="space-y-1 px-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3.5 px-2 py-2.5">
                    <span className="size-12 shrink-0 animate-pulse rounded-[9px] bg-ink/8" />
                    <span className="h-3.5 w-1/2 animate-pulse rounded-full bg-ink/8" />
                  </div>
                ))}
              </div>
            )}
            {failed && (
              <div className="px-4 py-8 text-center text-[0.92rem] text-ink/65">
                The search couldn&rsquo;t load just now.{" "}
                <button type="button" onClick={retry} className="font-semibold text-accent-deep underline">
                  Try again
                </button>
              </div>
            )}

            {groups.map((g, gi) => (
              <div key={g.type} role="group" aria-label={g.label} className="mb-2 last:mb-0">
                <p className="px-3 pt-1 pb-1.5 font-mono text-[0.6rem] tracking-[0.2em] text-ink/45 uppercase">
                  {g.label}
                </p>
                {g.shown.map((item, j) => {
                  const n = starts[gi] + j;
                  return (
                    <Link
                      key={`${item.type} ${item.href}`}
                      id={`${id}-row-${n}`}
                      href={item.href}
                      role="option"
                      aria-selected={n === active}
                      onClick={onClose}
                      onMouseMove={() => n !== active && setActive(n)}
                      className={`flex items-center gap-3.5 rounded-[12px] px-3 py-2.5 transition-colors ${n === active ? "bg-[#f3e6d4]" : ""}`}
                    >
                      <SearchRow item={item} active={n === active} />
                    </Link>
                  );
                })}
                {g.type !== "popular" && !g.opened && g.all.length > g.shown.length && (
                  <button
                    type="button"
                    onClick={() => setMore((m) => ({ ...m, [g.type]: true }))}
                    className="ml-3 rounded-full px-3 py-1.5 font-heading text-[0.64rem] font-semibold tracking-[0.18em] text-accent-deep uppercase transition-colors hover:bg-[#f3e6d4]"
                  >
                    + {Math.min(MORE, g.all.length - g.shown.length)} more {g.label.toLowerCase()}
                  </button>
                )}
              </div>
            ))}

            {items && typed && rows.length === 0 && (
              <NoResults
                query={query.trim()}
                onTell={() => {
                  onClose();
                  enquire({ source: "search" });
                }}
              />
            )}
          </div>

          {/* Every result on a page of its own, when there are more than the panel shows */}
          {typed && total > rows.length && (
            <Link
              href={allHref}
              onClick={onClose}
              className="group flex items-center justify-between gap-3 border-t border-ink/10 bg-[#f8efe2] px-5 py-3.5 font-heading text-[0.7rem] font-semibold tracking-[0.18em] text-accent-deep uppercase transition-colors hover:bg-[#f3e6d4]"
            >
              See all {total} results
              <ArrowIcon className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          )}

          {/* (computers: how to move through it) */}
          <p className="hidden border-t border-ink/10 px-5 py-2.5 font-mono text-[0.58rem] tracking-[0.16em] text-ink/40 uppercase sm:block">
            &uarr; &darr; to move &middot; Enter to open &middot; Esc to close
          </p>
        </div>
      )}
    </dialog>
  );
}
