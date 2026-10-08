"use client";

/* A list of full editors makes for a very long page — six hero slides ran to
   several screens of scrolling. Each row collapses to a single line with its
   photo, its name and its controls, and opens only when you want to edit it. */

type Props = {
  /** zero-based; shown as 01, 02, … */
  index: number;
  title: string;
  /** the small grey line under the title */
  subtitle?: string;
  /** thumbnail in the collapsed row, so rows are told apart by eye */
  thumb?: string;
  open: boolean;
  onToggle: () => void;
  /** <RowControls> — kept outside the toggle so its buttons are not nested */
  controls: React.ReactNode;
  dimmed?: boolean;
  children: React.ReactNode;
};

export function EditorRow({
  index,
  title,
  subtitle,
  thumb,
  open,
  onToggle,
  controls,
  dimmed = false,
  children,
}: Props) {
  return (
    <div
      className={`rounded-xl border bg-white transition-opacity ${
        dimmed ? "border-slate-200 opacity-60" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {/* On a phone the controls drop to their own line: sharing one row with
            them squeezed the name down to a letter and an ellipsis. */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 basis-full items-center gap-3 text-left sm:basis-0"
        >
          <span className="font-display text-[1rem] text-slate-300 tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>

          {thumb ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumb}
              alt=""
              className="size-10 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 font-heading text-[0.5rem] font-bold tracking-[0.08em] text-slate-400 uppercase">
              No
              <br />
              photo
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.95rem] font-medium text-ink">
              {title || <span className="text-slate-300">Untitled</span>}
            </span>
            {subtitle && (
              <span className="block truncate text-[0.8rem] text-slate-400">
                {subtitle}
              </span>
            )}
          </span>

          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div className="flex w-full justify-end sm:w-auto">{controls}</div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-5 py-5">{children}</div>
      )}
    </div>
  );
}
