"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChatIcon } from "@/components/ui/icons";
import { FocusMark } from "@/components/ui/ornaments";
import { loadSearchItems, type SearchItem } from "@/lib/search";

/* The pieces of the gallery search the results page (/search) is built from. The menu bar's search
   button (and Ctrl/⌘ + K) opens that page; its list (/search.json) is fetched only when the search
   is reached for (lib/search.ts). */

/** Starts fetching the search's list early: as a hand reaches for a search button */
export const prefetchSearch = () => void loadSearchItems().catch(() => {});

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

/** One result: its little picture, its name (with its Tamil name), and where it sits */
export function SearchRow({ item }: { item: SearchItem }) {
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
        <span className="block truncate font-display text-[1.05rem] leading-[1.3]">
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
