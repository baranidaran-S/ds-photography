import Link from "next/link";

/* Pages are in the address, not in component state: the back button then works,
   a refresh after saving stays where you were, and the server only ever reads
   the rows it is about to show. */

type Props = {
  page: number;
  pages: number;
  total: number;
  /** the page's own path, e.g. /admin/media */
  base: string;
  /** filters to carry across, e.g. { folder: "hero" } */
  params?: Record<string, string>;
  /** plural noun for the count line, e.g. "photos" */
  noun: string;
  /* The singular, when chopping the "s" off would not give it: one
     enquiry, not one enquirie. */
  one?: string;
};

function href(base: string, params: Record<string, string>, page: number) {
  const q = new URLSearchParams(params);
  // page 1 is the bare URL, so the common case has no query string at all
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

/** The page numbers worth showing: the ends, and a window around where you are. */
function windowed(page: number, pages: number) {
  const keep = new Set([1, pages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => keep.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => keep.add(n));

  const shown = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);

  // a gap of more than one becomes an ellipsis
  const out: (number | "gap")[] = [];
  shown.forEach((n, i) => {
    if (i && n - shown[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

export function Pager({
  page,
  pages,
  total,
  base,
  params = {},
  noun,
  one,
}: Props) {
  if (pages <= 1) {
    return total > 0 ? (
      <p className="mt-6 text-center text-[0.8rem] text-slate-400">
        {total} {total === 1 ? (one ?? noun.replace(/s$/, "")) : noun}
      </p>
    ) : null;
  }

  const step =
    "grid h-9 min-w-9 place-items-center rounded-lg px-2.5 text-[0.84rem] font-medium transition-colors";

  return (
    <nav
      aria-label="Pages"
      className="mt-7 flex flex-wrap items-center justify-center gap-1.5"
    >
      {page > 1 ? (
        <Link
          href={href(base, params, page - 1)}
          rel="prev"
          className={`${step} bg-white text-slate-600 ring-1 ring-slate-200 hover:text-ink`}
        >
          ‹ Prev
        </Link>
      ) : (
        <span className={`${step} text-slate-300`}>‹ Prev</span>
      )}

      {windowed(page, pages).map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} className={`${step} text-slate-300`}>
            …
          </span>
        ) : (
          <Link
            key={n}
            href={href(base, params, n)}
            aria-current={n === page ? "page" : undefined}
            className={`${step} ${
              n === page
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-ink"
            }`}
          >
            {n}
          </Link>
        ),
      )}

      {page < pages ? (
        <Link
          href={href(base, params, page + 1)}
          rel="next"
          className={`${step} bg-white text-slate-600 ring-1 ring-slate-200 hover:text-ink`}
        >
          Next ›
        </Link>
      ) : (
        <span className={`${step} text-slate-300`}>Next ›</span>
      )}

      <p className="w-full text-center text-[0.8rem] text-slate-400">
        {total} {noun} · page {page} of {pages}
      </p>
    </nav>
  );
}
