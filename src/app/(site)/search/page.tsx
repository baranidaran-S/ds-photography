import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/search/SearchResults";

export const metadata: Metadata = {
  title: "Search | DS Photography",
  // (a page of search results isn't one for search engines to list)
  robots: { index: false },
};

/* Search: every result for what was typed (/search?q=baby), opened from the search panel's
   "See all results". The results themselves are found in the browser (SearchResults). */
export default function SearchPage() {
  return (
    <main aria-labelledby="search-title" className="light-page relative min-h-svh bg-cream pb-20 text-ink lg:pb-28">
      {/* (what was searched for is only known in the browser) */}
      <Suspense fallback={<div className="sf-band h-[26rem] border-b border-ink/10" />}>
        <SearchResults />
      </Suspense>
    </main>
  );
}
