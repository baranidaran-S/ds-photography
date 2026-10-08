"use client";

/* Paging for the list editors. Unlike the Media and Enquiry pages, this one is
   purely about what is on screen: the whole list stays in the draft, so Save
   still writes every row and a row can still be moved past the end of a page.
   Splitting these lists server-side would break both. */

type Props = {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
  /** plural noun for the count line, e.g. "slides" */
  noun: string;
  /* The singular, when chopping the "s" off would not give it: one
     enquiry, not one enquirie. */
  one?: string;
};

function windowed(page: number, pages: number) {
  const keep = new Set([1, pages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => keep.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => keep.add(n));

  const shown = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);

  const out: (number | "gap")[] = [];
  shown.forEach((n, i) => {
    if (i && n - shown[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

export function ListPager({
  page,
  pages,
  total,
  onPage,
  noun,
  one,
}: Props) {
  const step =
    "grid h-9 min-w-9 place-items-center rounded-lg px-2.5 text-[0.84rem] font-medium transition-colors disabled:text-slate-300";

  if (pages <= 1) {
    return total > 0 ? (
      <p className="mt-4 text-center text-[0.8rem] text-slate-400">
        {total} {total === 1 ? (one ?? noun.replace(/s$/, "")) : noun}
      </p>
    ) : null;
  }

  return (
    <nav
      aria-label="Pages"
      className="mt-5 flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className={`${step} enabled:bg-white enabled:text-slate-600 enabled:ring-1 enabled:ring-slate-200 enabled:hover:text-ink`}
      >
        ‹ Prev
      </button>

      {windowed(page, pages).map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} className={`${step} text-slate-300`}>
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onPage(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${step} ${
              n === page
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-ink"
            }`}
          >
            {n}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page === pages}
        className={`${step} enabled:bg-white enabled:text-slate-600 enabled:ring-1 enabled:ring-slate-200 enabled:hover:text-ink`}
      >
        Next ›
      </button>

      <p className="w-full text-center text-[0.8rem] text-slate-400">
        {total} {noun} · page {page} of {pages} · Save writes all of them
      </p>
    </nav>
  );
}
