"use client";

import { useEffect, useRef, useState } from "react";
import { isTall, photoRows } from "@/content/blog";
import type { BlogPhotoValue } from "@/lib/blog";
import { thumbOf } from "@/lib/photoUrl";
import { UploadButton, type UploadedMedia } from "../../components/UploadButton";
import { SHRINK_TO } from "./values";

// a photo smaller than this on its long side may look soft on a big screen
const SMALL = 1200;
// photos one upload can take
const PER_UPLOAD = 100;

const label = "block font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase";
const keyOf = (p: BlogPhotoValue) => p.publicId || p.src;
const isSmall = (p: BlogPhotoValue) => Math.max(p.width, p.height) < SMALL;
const shapeOf = (p: BlogPhotoValue) => ({ p, w: p.width || 4, h: p.height || 5 });

/** The list with the item at `from` moved to `to` */
function moved<T>(list: T[], from: number, to: number) {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

/** [3] → "3", [3, 7] → "3 and 7", [3, 7, 9] → "3, 7 and 9" */
const listOf = (ns: number[]) => (ns.length < 2 ? String(ns[0]) : `${ns.slice(0, -1).join(", ")} and ${ns[ns.length - 1]}`);

type Drag = { key: string; x: number; y: number; offX: number; offY: number; size: number };

/* A story's photos in the post's form: upload many at once; drag one to change the order (by its
   handle on touch screens, or the arrow keys on it); remove one. Beside them, the story page's
   arrangement as it will be: a wide photo across, two tall ones in a row side by side, a lone
   tall one centred and narrower. Every photo stays whole. */
export function StoryPhotos({
  photos,
  onOrder,
  onUpload,
  onRemove,
}: {
  photos: BlogPhotoValue[];
  onOrder: (photos: BlogPhotoValue[]) => void;
  onUpload: (media: UploadedMedia) => void;
  onRemove: (photo: BlogPhotoValue) => void;
}) {
  const tiles = useRef(new Map<string, HTMLLIElement>());
  const [drag, setDrag] = useState<Drag | null>(null);
  // the newest list and onOrder, for the drag's listeners on the window
  const latest = useRef({ photos, onOrder });
  useEffect(() => {
    latest.current = { photos, onOrder };
  });

  /** Picks a photo up (after the pointer has moved a little, so a tap isn't a drag): it follows the
      pointer, and takes the place of the photo it's over */
  function pickUp(e: React.PointerEvent<HTMLLIElement>, key: string) {
    const target = e.target as HTMLElement;
    if (e.button !== 0 || target.closest("[data-remove]")) return;
    // on touch screens only the handle drags, so the page still scrolls under a finger
    if (e.pointerType !== "mouse" && !target.closest("[data-handle]")) return;
    if (e.pointerType === "mouse") e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    const [sx, sy] = [e.clientX, e.clientY];
    let lifted = false;

    const move = (ev: PointerEvent) => {
      if (!lifted && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
      lifted = true;
      ev.preventDefault();
      document.body.style.cursor = "grabbing";
      setDrag({ key, x: ev.clientX, y: ev.clientY, offX: sx - box.left, offY: sy - box.top, size: box.width });
      const { photos: list, onOrder: order } = latest.current;
      const from = list.findIndex((p) => keyOf(p) === key);
      for (let to = 0; to < list.length; to++) {
        if (to === from) continue;
        const r = tiles.current.get(keyOf(list[to]))?.getBoundingClientRect();
        if (r && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
          const next = moved(list, from, to);
          latest.current = { photos: next, onOrder: order };
          order(next);
          break;
        }
      }
      // near the top or bottom of the window, the page scrolls along
      if (ev.clientY < 80) window.scrollBy(0, -14);
      else if (ev.clientY > window.innerHeight - 80) window.scrollBy(0, 14);
    };
    const drop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", drop);
      window.removeEventListener("pointercancel", drop);
      document.body.style.cursor = "";
      setDrag(null);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", drop);
    window.addEventListener("pointercancel", drop);
  }

  /** The arrow keys on a photo's handle move it one place; the handle keeps the focus */
  function nudge(e: React.KeyboardEvent, i: number, key: string) {
    const step = ({ ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 } as Record<string, number>)[e.key];
    if (!step) return;
    e.preventDefault();
    if (i + step < 0 || i + step >= photos.length) return;
    onOrder(moved(photos, i, i + step));
    requestAnimationFrame(() => tiles.current.get(key)?.querySelector<HTMLElement>("[data-handle]")?.focus());
  }

  const rows = photoRows(photos.map(shapeOf));
  const lone = rows.filter((r) => r.length === 1 && isTall(r[0].photo)).map((r) => r[0].n + 1);
  const small = photos.filter(isSmall).length;
  const held = drag && photos.find((p) => keyOf(p) === drag.key);

  const thumb = ({ p, w, h }: ReturnType<typeof shapeOf>, n: number) => (
    <div className="relative overflow-hidden rounded-[5px] bg-slate-200" style={{ aspectRatio: `${w} / ${h}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbOf(p.src, 320, true)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      <span className="absolute top-1 left-1 rounded bg-night/60 px-1 font-mono text-[0.55rem] text-cream">{n + 1}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* (one upload button, always in the same place: it keeps uploading the rest of a batch
          while the list changes under it) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.86rem] text-slate-500">
          {photos.length ? (
            <>
              <span className="font-medium text-ink">
                {photos.length} {photos.length === 1 ? "photo" : "photos"}
              </span>{" "}
              · drag one to change the order
            </>
          ) : (
            "No photos yet."
          )}
        </p>
        <UploadButton
          folder="blog"
          library={false}
          multiple
          maxFiles={PER_UPLOAD}
          shrinkTo={SHRINK_TO}
          label={photos.length ? "Add more photos" : "Upload photos"}
          onUploaded={onUpload}
        />
      </div>

      {photos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-[0.86rem] leading-relaxed text-slate-500">
          Upload the shoot&rsquo;s photos: as many as you like at once, any size or shape.
          <br />
          They show under the description, whole, in the order you set here.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          {/* The photos, to put in order */}
          <div>
            <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-5">
              {photos.map((p, i) => {
                const key = keyOf(p);
                return (
                  <li
                    key={key}
                    ref={(el) => {
                      if (el) tiles.current.set(key, el);
                      else tiles.current.delete(key);
                    }}
                    onPointerDown={(e) => pickUp(e, key)}
                    className={`relative aspect-square rounded-lg bg-slate-100 select-none ${drag ? "" : "md:cursor-grab"} ${
                      drag?.key === key ? "opacity-30 outline-2 outline-offset-1 outline-brand outline-dashed" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbOf(p.src, 320, true)}
                      alt=""
                      draggable={false}
                      loading="lazy"
                      className="absolute inset-0 size-full object-contain p-1"
                    />
                    <span className="absolute top-1.5 left-1.5 rounded bg-night/70 px-1.5 py-0.5 font-mono text-[0.62rem] text-cream">{i + 1}</span>
                    <button
                      type="button"
                      data-remove
                      onClick={() => onRemove(p)}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm transition-colors hover:bg-accent hover:text-white"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      data-handle
                      onKeyDown={(e) => nudge(e, i, key)}
                      aria-label={`Move photo ${i + 1}: drag it, or use the arrow keys`}
                      className="absolute bottom-1 left-1 grid size-7 cursor-grab touch-none place-items-center rounded-md bg-white/90 text-slate-500 shadow-sm focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="currentColor">
                        {[7, 12, 17].flatMap((y) => [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
                      </svg>
                    </button>
                    {isSmall(p) && (
                      <span
                        title={`Only ${p.width} × ${p.height} pixels: it may look soft on big screens.`}
                        className="absolute right-1 bottom-1 rounded bg-amber-100 px-1.5 py-0.5 text-[0.6rem] font-bold text-amber-800"
                      >
                        Small
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {small > 0 && (
              <p className="mt-3 text-[0.8rem] leading-relaxed text-amber-700">
                {small === 1 ? "1 photo is" : `${small} photos are`} small (under {SMALL} pixels) and may look soft on big
                screens. A bigger copy of {small === 1 ? "it" : "them"} would look sharper.
              </p>
            )}
          </div>

          {/* The story page's arrangement, as it will be */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className={`${label} mb-2`}>How the post&rsquo;s page shows them</p>
            <div className="max-h-[60vh] overflow-y-auto rounded-xl bg-cream p-2.5 lg:max-h-[75vh]">
              <div className="flex flex-col gap-1.5">
                {rows.map((row) =>
                  row.length === 2 ? (
                    <div key={row[0].n} className="flex gap-1.5">
                      {row.map(({ photo, n }) => (
                        <div key={n} className="min-w-0" style={{ flex: `${photo.w / photo.h} 1 0%` }}>
                          {thumb(photo, n)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div key={row[0].n} className={isTall(row[0].photo) ? "mx-auto w-[51%]" : ""}>
                      {thumb(row[0].photo, row[0].n)}
                    </div>
                  ),
                )}
              </div>
            </div>
            {lone.length > 0 && (
              <p className="mt-2.5 text-[0.78rem] leading-relaxed text-slate-500">
                <span className="font-medium text-ink">Tip:</span> photo{lone.length > 1 ? "s" : ""} {listOf(lone)}{" "}
                {lone.length > 1 ? "are" : "is"} tall and on {lone.length > 1 ? "their" : "its"} own, so{" "}
                {lone.length > 1 ? "they show" : "it shows"} narrower. Put two tall photos next to each other and they sit
                side by side.
              </p>
            )}
          </div>
        </div>
      )}

      {/* the photo being dragged, under the pointer */}
      {drag && held && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 aspect-square rotate-2 rounded-lg bg-white p-1 shadow-2xl ring-2 ring-brand"
          style={{ left: drag.x - drag.offX, top: drag.y - drag.offY, width: drag.size }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbOf(held.src, 320, true)} alt="" className="size-full object-contain" />
        </div>
      )}
    </div>
  );
}
