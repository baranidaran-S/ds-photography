"use client";

import { useRef, useState } from "react";
import type { BlogPost } from "@/content/blog";
import type { BlogCoverValue } from "@/lib/blog";
import { thumbOf } from "@/lib/photoUrl";
import { CardFace, toneOf } from "@/components/blog/card";
import { UploadButton, type UploadedMedia } from "../../components/UploadButton";
import { SHRINK_TO } from "./values";

/** How a cover's focus point came to be where it is: being found, found by the website, not found
    (the middle is used), or set by the admin */
export type Look = "looking" | "found" | "missed" | "tapped";

type WindowId = "card" | "phone" | "computer";

// the windows the website shows a cover through (the blog's cards and a story's top)
const WINDOWS: Record<WindowId, { name: string; w: number; h: number }> = {
  card: { name: "Story card", w: 5, h: 4 },
  phone: { name: "Big card, phone", w: 4, h: 3 },
  computer: { name: "Big card, computer", w: 3, h: 2 },
};

const label = "block font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase";
const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));

/** "x% y%" → [x, y] */
const pointOf = (position: string) => {
  const [x, y] = position.split(" ").map((v) => parseFloat(v));
  return [Number.isFinite(x) ? x : 50, Number.isFinite(y) ? y : 50];
};

/** How much of a photo of shape `a` a window of shape `f` shows */
function keeps(a: number, f: number) {
  if (Math.abs(a - f) < 0.02) return "Shows all of it.";
  return a < f ? `Shows ${Math.round((a / f) * 100)}% of its height.` : `Shows ${Math.round((f / a) * 100)}% of its width.`;
}

/** Where a window of shape `f` sits on the whole photo (as shares of it), the way CSS's
    object-position puts it: the focus point lands as far along the window as it is along the photo,
    so it's always inside */
function windowOn(a: number, f: number, [x, y]: number[]) {
  if (a < f) {
    const h = a / f;
    return { left: 0, top: (1 - h) * (y / 100), width: 1, height: h };
  }
  const w = f / a;
  return { left: (1 - w) * (x / 100), top: 0, width: w, height: 1 };
}

/* A blog cover in the post's form: the whole photo with its gold focus point (tap or drag the photo,
   or use the arrow keys, to move it) and, beside it, the windows the website shows it through, live:
   the story card itself when `card` is given, and the big cards. The window picked is also drawn on
   the photo, with what it leaves out shaded. No cropping: the photo is kept whole. */
export function CoverPicker({
  value,
  look,
  windows,
  card,
  onUpload,
  onFocus,
  onLookAgain,
  onRemove,
  removeLabel = "Remove",
  uploadLabel,
  empty,
}: {
  value: BlogCoverValue;
  look?: Look;
  /** the windows it's shown through, and where each is on the website */
  windows: { id: WindowId; where: string }[];
  /** the post as its card would show now (the story card window is then that card) */
  card?: BlogPost;
  onUpload: (media: UploadedMedia) => void;
  onFocus: (position: string) => void;
  onLookAgain: () => void;
  onRemove: () => void;
  removeLabel?: string;
  uploadLabel: string;
  /** what an empty one says */
  empty: React.ReactNode;
}) {
  const photo = useRef<HTMLImageElement>(null);
  const dragging = useRef(false);
  // the photo's own shape, if the upload didn't say
  const [natural, setNatural] = useState(0);
  const [picked, setPicked] = useState<WindowId | null>(null);

  if (!value.src) {
    return (
      <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-[0.86rem] leading-relaxed text-slate-500">
        <div>{empty}</div>
        <UploadButton folder="blog" library={false} shrinkTo={SHRINK_TO} label={uploadLabel} onUploaded={onUpload} />
      </div>
    );
  }

  const a = value.width && value.height ? value.width / value.height : natural || 1.5;
  const point = pointOf(value.position);
  // the window shown on the photo: the one picked, or the one that leaves out the most
  const loss = (id: WindowId) => {
    const f = WINDOWS[id].w / WINDOWS[id].h;
    return Math.min(a / f, f / a);
  };
  const shown = picked && windows.some((w) => w.id === picked) ? picked : [...windows].sort((p, q) => loss(p.id) - loss(q.id))[0].id;
  const box = windowOn(a, WINDOWS[shown].w / WINDOWS[shown].h, point);
  const preview = thumbOf(value.src, 1200, true);

  function focusAt(e: React.PointerEvent) {
    const r = photo.current?.getBoundingClientRect();
    if (!r?.width) return;
    onFocus(`${clamp(((e.clientX - r.left) / r.width) * 100)}% ${clamp(((e.clientY - r.top) / r.height) * 100)}%`);
  }

  function nudge(e: React.KeyboardEvent) {
    const step = ({ ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] } as Record<string, number[]>)[e.key];
    if (!step) return;
    e.preventDefault();
    onFocus(`${clamp(point[0] + step[0])}% ${clamp(point[1] + step[1])}%`);
  }

  const status =
    look === "looking"
      ? "Finding the people in the photo…"
      : look === "found"
        ? "Focus point found automatically. If a face is cut off in a window, tap the face."
        : look === "missed"
          ? "The photo couldn't be looked at, so the middle is used. Tap the faces to set the focus point."
          : look === "tapped"
            ? "Focus point set by you."
            : "The gold dot is the focus point: tap the photo to move it.";

  const pick = (id: WindowId) => ({
    type: "button" as const,
    onClick: () => setPicked(id),
    "aria-pressed": shown === id,
  });
  const caption = (id: WindowId, where: string) => (
    <span className="mt-2 block px-1">
      <span className="block text-[0.8rem] font-medium text-ink">
        {WINDOWS[id].name} · {WINDOWS[id].w}:{WINDOWS[id].h}
      </span>
      <span className="block text-[0.74rem] leading-snug text-slate-400">
        {where}. {keeps(a, WINDOWS[id].w / WINDOWS[id].h)}
      </span>
    </span>
  );
  const ring = (id: WindowId) =>
    // (a column from the top: a button centres what's in it, which pushed a shorter preview down)
    `flex w-full flex-col rounded-xl border p-1.5 text-left transition-colors ${shown === id ? "border-brand ring-1 ring-brand" : "border-slate-200 hover:border-slate-300"}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* The whole photo, its focus point, and the window picked */}
      <div>
        <div className="grid place-items-center rounded-xl bg-night p-3">
          <div
            tabIndex={0}
            aria-label="The whole photo. Tap it, drag, or use the arrow keys to move the focus point."
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              focusAt(e);
            }}
            onPointerMove={(e) => dragging.current && focusAt(e)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
            onKeyDown={nudge}
            className="relative max-w-full cursor-crosshair touch-none overflow-hidden rounded-md select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {/* a plain img, not next/image: the window and the dot move over it live */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={photo}
              src={preview}
              alt=""
              draggable={false}
              onLoad={(e) => setNatural(e.currentTarget.naturalWidth / (e.currentTarget.naturalHeight || 1))}
              className="block max-h-[26rem] max-w-full"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute rounded-[3px] outline-2 outline-brand"
              style={{
                left: `${box.left * 100}%`,
                top: `${box.top * 100}%`,
                width: `${box.width * 100}%`,
                height: `${box.height * 100}%`,
                boxShadow: "0 0 0 100vmax rgb(11 10 10 / 0.62)",
              }}
            >
              <span className="absolute top-1.5 left-1.5 rounded bg-brand px-1.5 py-0.5 font-heading text-[0.55rem] font-bold tracking-[0.1em] text-night uppercase">
                {WINDOWS[shown].name}
              </span>
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute -mt-3 -ml-3 grid size-6 place-items-center rounded-full border-2 border-cream shadow-[0_0_0_2px_var(--color-brand),0_2px_8px_rgb(0_0_0/0.5)]"
              style={{ left: `clamp(12px, ${point[0]}%, calc(100% - 12px))`, top: `clamp(12px, ${point[1]}%, calc(100% - 12px))` }}
            >
              <span className="size-2 rounded-full bg-brand" />
            </span>
          </div>
        </div>

        <p className={`mt-2.5 flex items-center gap-2 text-[0.8rem] leading-snug ${look === "missed" ? "text-accent" : "text-slate-500"}`} aria-live="polite">
          {look === "looking" && <span aria-hidden className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-accent-deep" />}
          {status}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <UploadButton folder="blog" library={false} shrinkTo={SHRINK_TO} label="Replace" onUploaded={onUpload} />
          <button
            type="button"
            onClick={onLookAgain}
            disabled={look === "looking"}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[0.84rem] font-medium text-slate-700 transition-colors hover:border-brand hover:text-accent-deep disabled:opacity-50"
          >
            Find the focus again
          </button>
          <button type="button" onClick={onRemove} className="rounded-lg px-2.5 py-2 text-[0.8rem] text-slate-400 transition-colors hover:text-accent">
            {removeLabel}
          </button>
        </div>
      </div>

      {/* The windows, as the website shows them */}
      <div>
        <p className={`${label} mb-2`}>How the website shows it</p>
        <div className="space-y-3">
          {windows.some((w) => w.id === "card") && card && (
            <button {...pick("card")} className={`${ring("card")} max-w-[19rem]`}>
              <span className="bj-card flex flex-col rounded-[30px] p-2.5 text-cream" style={toneOf(card)}>
                <CardFace post={card} />
              </span>
              {caption("card", windows.find((w) => w.id === "card")!.where)}
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            {windows
              .filter((w) => w.id !== "card" || !card)
              .map((w) => (
                <button key={w.id} {...pick(w.id)} className={ring(w.id)}>
                  <span className="relative block overflow-hidden rounded-lg bg-slate-100" style={{ aspectRatio: `${WINDOWS[w.id].w} / ${WINDOWS[w.id].h}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: value.position }} />
                  </span>
                  {caption(w.id, w.where)}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
