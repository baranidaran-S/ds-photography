"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { SAVED_EVENT } from "./useEditor";

/* Two things the admin kept reaching for the browser's own versions of:
   a message that something happened, and a question before something cannot be
   undone. window.confirm() blocks the whole tab, looks like a security warning
   and cannot say which slide you are about to delete, so both are built here. */

type Tone = "good" | "bad" | "warn";

export type Toast = {
  id: number;
  tone: Tone;
  title: string;
  body?: string;
  /** an optional "take me there" link */
  action?: { label: string; href: string };
  /** milliseconds; 0 stays until dismissed */
  life?: number;
};

type Ask = {
  title: string;
  body?: string;
  /** the wording on the button that goes ahead — say what it does */
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
};

const ToastContext = createContext<(t: Omit<Toast, "id">) => void>(() => {});
const ConfirmContext = createContext<(ask: Ask) => Promise<boolean>>(
  async () => false,
);

/** Drops a message in the corner. */
export function useToast() {
  return useContext(ToastContext);
}

/** Asks before something that cannot be undone. Resolves true if they agree. */
export function useConfirm() {
  return useContext(ConfirmContext);
}

/* ────────────────────────────── Icons ────────────────────────────── */

const MARKS: Record<Tone, string> = {
  good: "M5 12.5 10 17.5 19 7",
  bad: "M12 7.5v6M12 17h.01M10.3 3.9 2.6 17.2a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0",
  warn: "M12 8v5M12 16.5h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18",
};

const SKIN: Record<Tone, { ring: string; chip: string }> = {
  good: { ring: "ring-emerald-200", chip: "bg-emerald-50 text-emerald-600" },
  bad: { ring: "ring-rose-200", chip: "bg-rose-50 text-accent" },
  warn: { ring: "ring-amber-200", chip: "bg-amber-50 text-amber-600" },
};

function Mark({ tone, className = "size-[1.05rem]" }: { tone: Tone; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={MARKS[tone]} />
    </svg>
  );
}

/* ───────────────────────────── Provider ───────────────────────────── */

export function Feedback({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ask, setAsk] = useState<Ask | null>(null);
  // the promise the caller is waiting on, answered by the two buttons
  const answer = useRef<((ok: boolean) => void) | null>(null);
  const nextId = useRef(1);

  const drop = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = nextId.current++;
      // three at a time: a stack taller than that covers the page it describes
      setToasts((list) => [...list.slice(-2), { ...t, id }]);
      const life = t.life ?? 4200;
      if (life > 0) window.setTimeout(() => drop(id), life);
    },
    [drop],
  );

  const confirm = useCallback((next: Ask) => {
    setAsk(next);
    return new Promise<boolean>((resolve) => {
      answer.current = resolve;
    });
  }, []);

  const close = useCallback((ok: boolean) => {
    answer.current?.(ok);
    answer.current = null;
    setAsk(null);
  }, []);

  /* Every editor announces a save on the window. Catching it here means one
     confirmation for the whole admin instead of one per page. */
  useEffect(() => {
    const onSaved = () =>
      toast({ tone: "good", title: "Saved", body: "Your site is updated." });
    window.addEventListener(SAVED_EVENT, onSaved);
    return () => window.removeEventListener(SAVED_EVENT, onSaved);
  }, [toast]);

  useEffect(() => {
    if (!ask) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ask, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      <ToastContext.Provider value={toast}>
        {children}

        {/* Messages */}
        <div
          aria-live="polite"
          className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(23rem,calc(100vw-2rem))] flex-col gap-2.5 sm:right-5 sm:bottom-5"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex animate-[toast-in_.3s_cubic-bezier(.2,.9,.3,1)] items-start gap-3 rounded-xl bg-white p-3.5 shadow-[0_18px_45px_-20px_rgb(0_0_0/0.4)] ring-1 ${SKIN[t.tone].ring}`}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full ${SKIN[t.tone].chip}`}
              >
                <Mark tone={t.tone} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.88rem] font-semibold text-ink">{t.title}</p>
                {t.body && (
                  <p className="mt-0.5 text-[0.82rem] leading-relaxed text-slate-500">
                    {t.body}
                  </p>
                )}
                {t.action && (
                  <Link
                    href={t.action.href}
                    onClick={() => drop(t.id)}
                    className="mt-1.5 inline-block text-[0.82rem] font-medium text-accent-deep underline-offset-2 hover:underline"
                  >
                    {t.action.label}
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => drop(t.id)}
                aria-label="Dismiss"
                className="grid size-7 shrink-0 place-items-center rounded-md text-slate-300 transition-colors hover:bg-slate-100 hover:text-ink"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* The question */}
        {ask && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="fixed inset-0 z-[70] grid animate-[fade-in_.2s_ease] place-items-center p-4"
          >
            {/* Click-away for a mouse. Kept out of the accessibility tree: it
                would otherwise read as a second Cancel button, and Escape
                already covers the keyboard. */}
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => close(false)}
              className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            />
            <div className="relative w-full max-w-[25rem] animate-[dialog-in_.26s_cubic-bezier(.2,.9,.3,1)] rounded-2xl bg-white p-6 shadow-[0_30px_80px_-24px_rgb(0_0_0/0.5)]">
              <span
                className={`grid size-11 place-items-center rounded-full ${SKIN[ask.tone ?? "warn"].chip}`}
              >
                <Mark tone={ask.tone ?? "warn"} className="size-5" />
              </span>

              <h2
                id="confirm-title"
                className="mt-4 font-display text-[1.3rem] leading-tight text-ink"
              >
                {ask.title}
              </h2>
              {ask.body && (
                <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-500">
                  {ask.body}
                </p>
              )}

              <div className="mt-6 flex flex-wrap justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-[0.86rem] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-ink"
                >
                  {ask.cancelLabel ?? "Cancel"}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => close(true)}
                  className={`rounded-lg px-4 py-2 font-heading text-[0.7rem] font-bold tracking-[0.1em] text-cream uppercase transition-colors ${
                    (ask.tone ?? "warn") === "bad"
                      ? "bg-accent hover:bg-accent-deep"
                      : "bg-accent-deep hover:bg-accent"
                  }`}
                >
                  {ask.confirmLabel ?? "Yes, go ahead"}
                </button>
              </div>
            </div>
          </div>
        )}
      </ToastContext.Provider>
    </ConfirmContext.Provider>
  );
}
