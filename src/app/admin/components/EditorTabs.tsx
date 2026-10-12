"use client";

import { useState } from "react";

/* A page that edits both a list and the words around it. Both panels stay
   mounted and the inactive one is hidden, so switching tabs never throws away
   something typed but not yet saved. */
export function EditorTabs({
  tabs,
}: {
  tabs: { label: string; panel: React.ReactNode }[];
}) {
  const [open, setOpen] = useState(0);

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setOpen(i)}
            aria-pressed={open === i}
            className={`rounded-lg px-3.5 py-1.5 text-[0.84rem] font-medium transition-colors ${
              open === i
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab, i) => (
        <div key={tab.label} className={open === i ? "" : "hidden"}>
          {tab.panel}
        </div>
      ))}
    </>
  );
}
