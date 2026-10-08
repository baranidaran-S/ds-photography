"use client";

import { useState } from "react";
import { SectionEditor, type PagePhotosValue, type PortfolioValue } from "./SectionEditor";
import { StoriesEditor, type StoryValue } from "./StoriesEditor";

const TABS = [
  { key: "spreads", label: "Album spreads" },
  { key: "section", label: "Heading & cover" },
] as const;

/* Both editors stay mounted and the inactive one is hidden, so switching tabs
   never throws away something typed but not yet saved. */
export function PortfolioTabs({
  stories,
  copy,
  photos,
}: {
  stories: StoryValue[];
  copy: PortfolioValue;
  photos: PagePhotosValue;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("spreads");

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`rounded-lg px-3.5 py-1.5 text-[0.84rem] font-medium transition-colors ${
              tab === t.key
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={tab === "spreads" ? "" : "hidden"}>
        <StoriesEditor initial={stories} />
      </div>
      <div className={tab === "section" ? "" : "hidden"}>
        <SectionEditor copy={copy} photos={photos} />
      </div>
    </>
  );
}
