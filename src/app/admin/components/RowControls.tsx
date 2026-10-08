"use client";

import { useConfirm } from "./Feedback";

type Props = {
  index: number;
  count: number;
  active: boolean;
  onMove: (from: number, to: number) => void;
  onToggle: (index: number) => void;
  onRemove: (index: number) => void;
  /** Hidden when the list has a fixed shape (e.g. the 7 services). */
  removable?: boolean;
  /* What is about to go, for the question. "Hero slide", "Review" — the dialog
     says it back so a mis-aimed click is caught before it costs anything. */
  noun?: string;
  /** the row's own name, when it has one */
  label?: string;
};

/* Reordering uses buttons rather than drag-and-drop: it works with a keyboard and
   on a phone, which is where the site owner is most likely to be editing. */
export function RowControls({
  index,
  count,
  active,
  onMove,
  onToggle,
  onRemove,
  removable = true,
  noun = "item",
  label,
}: Props) {
  const confirm = useConfirm();

  async function remove() {
    const sure = await confirm({
      title: `Delete this ${noun.toLowerCase()}?`,
      body: label
        ? `“${label}” will be removed from the list. It only becomes final when you press Save.`
        : "It will be removed from the list. It only becomes final when you press Save.",
      confirmLabel: "Delete it",
      tone: "bad",
    });
    if (sure) onRemove(index);
  }

  const arrow =
    "grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand hover:text-accent-deep disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onMove(index, index - 1)}
        disabled={index === 0}
        aria-label="Move up"
        className={arrow}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 15 7-7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onMove(index, index + 1)}
        disabled={index === count - 1}
        aria-label="Move down"
        className={arrow}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 9 7 7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => onToggle(index)}
        aria-pressed={active}
        className={`rounded-lg px-2.5 py-1.5 font-heading text-[0.6rem] font-bold tracking-[0.12em] uppercase transition-colors ${
          active
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
        }`}
      >
        {active ? "Live" : "Hidden"}
      </button>

      {removable && (
        <button
          type="button"
          onClick={remove}
          aria-label="Remove"
          className="grid size-8 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-accent/10 hover:text-accent"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6 7l.8 12.1A1.9 1.9 0 0 0 8.7 21h6.6a1.9 1.9 0 0 0 1.9-1.9L18 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
