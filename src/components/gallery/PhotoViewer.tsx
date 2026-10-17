"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import type { ShownPhoto } from "@/lib/storyView";
import { ArrowIcon } from "@/components/ui/icons";

const pad = (n: number) => String(n).padStart(2, "0");

/* An album's photos full-screen, one at a time: arrows, the keyboard (← → and Esc) or a swipe
   move through them. The page behind holds still while it's open, and the keyboard comes back
   to the photo that opened it when it closes. */
export function PhotoViewer({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: ShownPhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const lenis = useLenis();
  const box = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const count = photos.length;
  const photo = photos[index];
  const go = (step: number) => onIndex((index + step + count) % count);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    lenis?.stop();
    closeButton.current?.focus();
    return () => {
      lenis?.start();
      opener?.focus();
    };
  }, [lenis]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && box.current) {
        // keep the keyboard inside the viewer
        const stops = box.current.querySelectorAll<HTMLElement>("button");
        const first = stops[0];
        const last = stops[stops.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const arrow =
    "grid size-12 place-items-center rounded-full border border-cream/25 bg-night/40 text-cream transition duration-500 hover:border-brand hover:bg-brand hover:text-night";

  return (
    <div
      ref={box}
      role="dialog"
      aria-modal="true"
      aria-label="Photos"
      className="sf-viewer fixed inset-0 z-[100] flex flex-col bg-night/96 text-cream"
      onPointerDown={(e) => {
        swipe.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const from = swipe.current;
        swipe.current = null;
        if (!from) return;
        const dx = e.clientX - from.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - from.y)) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
        <p className="font-mono text-[0.68rem] tracking-[0.18em] text-cream/70">
          {pad(index + 1)} / {pad(count)}
        </p>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-11 place-items-center rounded-full border border-cream/25 text-[1.4rem] leading-none transition duration-500 hover:border-brand hover:bg-brand hover:text-night"
        >
          &times;
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div key={index} className="sf-view-photo absolute inset-x-3 inset-y-4 sm:inset-x-24">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            loading="eager"
            draggable={false}
            className="object-contain"
          />
        </div>
        {/* the photos either side, loading quietly so the next one is ready */}
        {count > 1 &&
          [index - 1, index + 1].map((k) => {
            const p = photos[(k + count) % count];
            return (
              <Image
                key={k}
                src={p.src}
                alt=""
                fill
                sizes="100vw"
                loading="eager"
                className="pointer-events-none invisible object-contain"
              />
            );
          })}
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(-1)}
              className={`${arrow} absolute top-1/2 left-5 hidden -translate-y-1/2 sm:grid`}
            >
              <ArrowIcon className="size-4 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(1)}
              className={`${arrow} absolute top-1/2 right-5 hidden -translate-y-1/2 sm:grid`}
            >
              <ArrowIcon className="size-4" />
            </button>
          </>
        )}
      </div>

      <p className="min-h-[3.5rem] px-6 pt-3 pb-6 text-center font-display text-[1.05rem] text-cream/85">
        {photo.caption}
      </p>
    </div>
  );
}
