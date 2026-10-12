"use client";

import { useEffect, useRef, useState } from "react";
import { SAVED_EVENT } from "./useEditor";

/* The real site in a frame, shrunk to fit. Not a drawing of it: the same page a
   visitor gets, with its own fonts, crops and animations, so what you see here
   is what they will see.

   It is rendered at a full window size and scaled down rather than squeezed into
   a narrow frame — a 400px-wide render would show the phone layout and tell you
   nothing about the computer one. */
const DEVICES = {
  desktop: { w: 1440, h: 900, label: "Computer" },
  phone: { w: 390, h: 844, label: "Phone" },
} as const;

type Device = keyof typeof DEVICES;

/* How tall the panel is allowed to get. On a narrow admin window it shrinks
   with the frame rather than eating the screen before you reach the editor. */
const TALL = 480;
const SHORT = 260;

/* The site plays its intro before scrolling to the section, which takes a few
   seconds. It posts a message when it gets there; this is the give-up, for a
   section that never arrives. */
const GIVE_UP = 14_000;

export function SitePreview({ section }: { section: string }) {
  const [device, setDevice] = useState<Device>("desktop");
  const [open, setOpen] = useState(true);
  /* Changing the key rebuilds the frame, which is the only reliable way to
     reload a same-origin iframe without reaching into its history. */
  const [reload, setReload] = useState(0);
  const [ready, setReady] = useState(false);
  /* The frame is scaled to fit, so the panel has to know how much room it has.
     Measured rather than guessed: it changes with the window, with the menu
     collapsing, and with the admin's own breakpoints. */
  const [room, setRoom] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const watch = new ResizeObserver(([entry]) =>
      setRoom(entry.contentRect.width),
    );
    watch.observe(el);
    return () => watch.disconnect();
  }, [open]);

  /* The frame shows what is saved, so it is reloaded the moment a save lands.
     Otherwise the preview quietly shows the version before your last change —
     worse than no preview at all. */
  useEffect(() => {
    const onSaved = () => {
      setReady(false);
      setReload((n) => n + 1);
    };
    window.addEventListener(SAVED_EVENT, onSaved);
    return () => window.removeEventListener(SAVED_EVENT, onSaved);
  }, []);

  // the frame says when it has finished its intro and reached the section
  useEffect(() => {
    if (!open) return;

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { source?: string; type?: string } | null;
      if (data?.source === "ds-site" && data.type === "ready") setReady(true);
    }

    window.addEventListener("message", onMessage);
    const bail = window.setTimeout(() => setReady(true), GIVE_UP);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(bail);
    };
  }, [open, device, reload]);

  /* Every way of starting the frame over goes through here: the spinner has to
     come back with it, and setting that from inside the effect would be a
     render reacting to a render. */
  function restart(change: () => void) {
    setReady(false);
    change();
  }

  const { w, h, label } = DEVICES[device];
  /* Whichever runs out first decides the size: the height we allow, or the width
     we actually have. Scaling by height alone pushed a 1440-wide frame off both
     sides of a narrow panel, so you saw a slice down the middle. */
  const limit = room && room < 480 ? SHORT : TALL;
  const scale = room ? Math.min(limit / h, room / w) : 0;
  const panel = Math.round(h * scale) || limit;

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 px-4 py-2.5">
        <p className="font-heading text-[0.6rem] font-bold tracking-[0.18em] text-slate-500 uppercase">
          Live preview
        </p>

        {open && (
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            {(Object.keys(DEVICES) as Device[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => restart(() => setDevice(key))}
                aria-pressed={device === key}
                className={`rounded-md px-2.5 py-1 text-[0.74rem] font-medium transition-colors ${
                  device === key
                    ? "bg-white text-ink shadow-sm"
                    : "text-slate-500 hover:text-ink"
                }`}
              >
                {DEVICES[key].label}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {open && (
            <button
              type="button"
              onClick={() => restart(() => setReload((n) => n + 1))}
              className="text-[0.78rem] text-slate-400 underline-offset-2 hover:text-accent-deep hover:underline"
            >
              Refresh
            </button>
          )}
          <a
            href={`/?view=${section}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.78rem] text-slate-400 underline-offset-2 hover:text-accent-deep hover:underline"
          >
            Open full size
          </a>
          <button
            type="button"
            onClick={() => restart(() => setOpen((v) => !v))}
            aria-expanded={open}
            className="text-[0.78rem] font-medium text-slate-500 underline-offset-2 hover:text-ink hover:underline"
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={box}
          style={{ height: panel }}
          className="relative overflow-hidden bg-slate-100 transition-[height] duration-200"
        >
          {/* Absolutely placed rather than centred by the grid: a 900px-tall
                box inside a 480px one overflows, and centring overflow is where
                browsers stop agreeing. Pinning the middle to the middle always
                lands the same way. */}
          <div
            style={{
              width: w,
              height: h,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
            className="absolute top-1/2 left-1/2 overflow-hidden bg-white shadow-[0_8px_30px_-12px_rgb(0_0_0/0.3)]"
          >
            {/* Not interactive on purpose. A wheel over a live frame scrolls
                  the site inside it, and the section you came to look at slides
                  away; with the pointer passing straight through, the wheel
                  scrolls this page instead and the frame holds its place. Use
                  "Open full size" to actually move around the site.

                  The frame is also drawn a little wider than its box so the
                  site's own scrollbar falls outside the clipped edge. */}
            <iframe
              key={`${device}-${reload}`}
              src={`/?view=${section}`}
              title={`Your site on a ${label.toLowerCase()}`}
              tabIndex={-1}
              style={{ width: w + 24, height: h }}
              className="pointer-events-none border-0"
            />
          </div>

          {(!ready || !scale) && (
            <div className="absolute inset-0 grid place-items-center bg-slate-100/85 backdrop-blur-[1px]">
              <p className="flex items-center gap-2.5 text-[0.84rem] text-slate-500">
                <span className="size-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-accent-deep" />
                Loading your site, then scrolling to this section…
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
