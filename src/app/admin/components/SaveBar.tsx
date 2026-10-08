"use client";

type Props = {
  dirty: boolean;
  saving: boolean;
  error?: string;
  saved?: boolean;
  onSave: () => void;
  onReset: () => void;
};

/** Sticky footer every section editor shares: save state, errors, and a way back. */
export function SaveBar({ dirty, saving, error, saved, onSave, onReset }: Props) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-slate-200 bg-white/90 px-4 py-3.5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-9 lg:px-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          role={error ? "alert" : "status"}
          className={`text-[0.86rem] ${
            error
              ? "text-accent"
              : saved
                ? "text-emerald-600"
                : dirty
                  ? "text-amber-600"
                  : "text-slate-400"
          }`}
        >
          {error
            ? error
            : saved
              ? "Saved. Your site is updated."
              : dirty
                ? "You have unsaved changes."
                : "Everything is saved."}
        </p>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onReset}
            disabled={!dirty || saving}
            className="rounded-lg px-3.5 py-2 text-[0.84rem] font-medium text-slate-500 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || saving}
            className="rounded-lg bg-accent-deep px-5 py-2.5 font-heading text-[0.74rem] font-bold tracking-[0.12em] text-cream uppercase transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
