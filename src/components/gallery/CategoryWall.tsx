"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { GalleryCategory, GallerySub } from "@/content/gallery";
import { FocusMark } from "@/components/ui/ornaments";
import { followPointer } from "./pointer";
import { PreloadPhotos, SCREENS } from "./preload";

const pad = (n: number) => String(n).padStart(2, "0");

type Neighbour = { slug: string; name: string };

/** A card's shape: its photo's own (width ÷ height), kept between 2:3 and 3:2 so a panorama or a
    phone screenshot can't make a sliver; a photo outside that loses a little off its long sides */
const shapeOf = (s: GallerySub) => Math.min(1.5, Math.max(2 / 3, s.shape ?? 0.8));

// how much lower every other column starts, as a share of a column's width
const LOWER = 0.22;

// ways of sharing the kinds out worth trying one by one (beyond this, a quicker rule of thumb)
const MOST_TRIES = 200_000;

/** Shares the kinds out across the columns so they all end as close together as they can: the
    first row in order, left to right, then the rest wherever leaves the columns' ends most even
    (every way is tried, as a category has only a handful; for a long list, each next kind goes
    to the shortest column). Within a column the kinds keep their order. `caption` is a name's
    height below its photo, as a share of a column's width */
function arrange(kinds: GallerySub[], cols: number, caption: number) {
  const tall = kinds.map((s) => 1 / shapeOf(s) + caption);
  const rest = tall.length - cols;
  const firstRow = () => Array.from({ length: cols }, (_, c): number => (c % 2 ? LOWER : 0) + (tall[c] ?? 0));
  const spread = (h: number[]) => Math.max(...h) - Math.min(...h);

  // which column each kind after the first row goes in
  let place: number[] = [];
  if (rest > 0 && cols ** rest <= MOST_TRIES) {
    let best = Infinity;
    const pick: number[] = Array(rest).fill(0);
    for (let n = 0; n < cols ** rest; n++) {
      for (let k = 0, x = n; k < rest; k++, x = Math.floor(x / cols)) pick[k] = x % cols;
      const h = firstRow();
      pick.forEach((c, k) => (h[c] += tall[cols + k]));
      if (spread(h) < best - 1e-9) {
        best = spread(h);
        place = [...pick];
      }
    }
  } else if (rest > 0) {
    const h = firstRow();
    place = tall.slice(cols).map((t) => {
      const c = h.indexOf(Math.min(...h));
      h[c] += t;
      return c;
    });
  }

  // (with fewer kinds than columns the rest stay empty, so a card keeps its usual size)
  const columns: number[][] = Array.from({ length: cols }, (_, c) => (c < kinds.length ? [c] : []));
  place.forEach((c, k) => columns[c].push(cols + k));
  const h = columns.map(
    (list, c) => (c % 2 ? LOWER : 0) + list.reduce((a, i) => a + tall[i], 0),
  );
  return { cols: columns.length, columns, spread: spread(h) };
}

/** Of these column counts, the one whose columns end most evenly, measured on the page (a
    column's width shrinks as there are more of them); on a tie, the fewer, bigger columns. With
    only a kind or two, the fewest columns (each card at its usual size, not stretched across) */
function bestOf(kinds: GallerySub[], counts: number[], caption: number) {
  if (kinds.length < Math.min(...counts)) return arrange(kinds, Math.min(...counts), caption);
  const tries = [...new Set(counts)].map((c) => arrange(kinds, c, caption));
  return tries.reduce((a, b) => (b.spread / b.cols < a.spread / a.cols - 1e-9 ? b : a));
}

/* A category's page: all its kinds of shoot at once, as a gallery wall. Each card takes its photo's
   own shape (whatever the client uploads shows whole, nothing to crop or adjust), with its name
   underneath. Every other column starts lower, and as the page scrolls those columns climb faster
   than the others, so the wall seems to drift. Each card opens that kind's album; it lights up
   with a gold edge that follows the mouse (globals.css → .gc-tile).
   Phones, tablets and computers each have their own arrangement (two, three, and three or four
   columns), worked out here from the photos' shapes, so it's right before the page even runs. */
export function CategoryWall({
  category,
  number,
  total,
  prev,
  next,
}: {
  category: GalleryCategory;
  number: number;
  total: number;
  prev: Neighbour;
  next: Neighbour;
}) {
  const root = useRef<HTMLElement>(null);
  const kinds = category.subs;
  const count = kinds.length;
  // phones two columns, tablets two or three, computers three or four: whichever ends most evenly
  const layouts = useMemo(
    () =>
      [
        { key: "phone" as const, show: "flex md:hidden", ...bestOf(kinds, [2], 0.36) },
        { key: "tablet" as const, show: "hidden md:flex lg:hidden", ...bestOf(kinds, [3, 2], 0.26) },
        { key: "computer" as const, show: "hidden lg:flex", ...bestOf(kinds, [3, 4], 0.2) },
      ].map((l) => ({
        ...l,
        sizes:
          l.key === "computer"
            ? `(min-width: 1320px) ${Math.round(1224 / l.cols)}px, ${Math.round(100 / l.cols)}vw`
            : `${Math.round(100 / l.cols)}vw`,
      })),
    [kinds],
  );

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      // (the top card of each column rises in by itself from the CSS, .rise-in, so the first photos
      // show without waiting for this; the rest float up as they come into view)
      const all = q<HTMLElement>(".sw-item");
      const items = all.filter((c) => !c.classList.contains("rise-in"));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // those cards start hidden ([data-reveal]), then GSAP takes them over
      if (items.length) gsap.set(items, reduce ? { autoAlpha: 1 } : { autoAlpha: 0, y: 60, scale: 0.94 });
      window.__dsReady = true;

      /* ── Touch screens have no hover: the card crossing the middle of the screen lights up as
         if it were hovered ── */
      const mm = gsap.matchMedia();
      mm.add("(hover: none), (pointer: coarse)", () => {
        all.forEach((c) =>
          ScrollTrigger.create({
            trigger: c,
            start: "top 50%",
            end: "bottom 50%",
            onToggle: (self) => c.toggleAttribute("data-lit", self.isActive),
          }),
        );
        return () => all.forEach((c) => c.removeAttribute("data-lit"));
      });
      if (reduce) return;

      /* ── Cards float up into place as they come into view, the photos settling inside ── */
      const reveal = (batch: Element[]) =>
        gsap
          .timeline()
          .to(batch, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: "expo.out", stagger: 0.09 })
          .fromTo(
            batch.flatMap((c) => [...c.querySelectorAll(".sw-photo")]),
            { scale: 1.2 },
            { scale: 1, duration: 1.8, ease: "expo.out", stagger: 0.09 },
            0,
          );
      // the other screen sizes' arrangements aren't showing: theirs are simply there (in case the
      // screen turns), so they don't hold up the showing cards' one-after-another entrance
      const showing = items.filter((c) => c.offsetParent);
      const elsewhere = items.filter((c) => !c.offsetParent);
      if (elsewhere.length) gsap.set(elsewhere, { autoAlpha: 1, y: 0, scale: 1 });
      // cards already on screen (or scrolled past, coming back part-way down) appear straight away
      const line = window.innerHeight * 0.92;
      const waiting = showing.filter((c) => c.getBoundingClientRect().top >= line);
      const now = showing.filter((c) => !waiting.includes(c));
      if (now.length) reveal(now);
      if (waiting.length) ScrollTrigger.batch(waiting, { start: "top 92%", once: true, onEnter: reveal });

      /* ── The wall drifts: the lower columns climb faster than the others as the page scrolls ── */
      const wall = q<HTMLElement>(".sw-wall")[0];
      mm.add({ phone: "(max-width: 767px)", bigger: "(min-width: 768px)" }, (ctx) => {
        const reach = ctx.conditions?.phone ? 36 : 90;
        q<HTMLElement>(".sw-col").forEach((col) => {
          const by = reach * (col.dataset.lower ? 1 : 0.35);
          gsap.fromTo(
            col,
            { y: by },
            {
              y: -by,
              ease: "none",
              scrollTrigger: { trigger: wall, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
      });

      // re-measure once the fonts are in, as the heading above the wall can change height
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: root },
  );

  // (the top row rises in from the CSS as the page arrives, each card `delay` seconds after it)
  const card = (s: GallerySub, i: number, sizes: string, delay?: number) => (
    <li key={s.slug}>
      <Link
        href={`/gallery/${category.slug}/${s.slug}`}
        data-reveal={delay === undefined ? true : undefined}
        onPointerMove={followPointer}
        className={`sw-item group block ${delay === undefined ? "" : "rise-in"}`}
        style={delay === undefined ? undefined : ({ "--d": `${delay}s` } as React.CSSProperties)}
      >
        <span
          className="gc-tile relative block overflow-hidden rounded-[16px] bg-[#e7ddcc] shadow-[0_22px_44px_-26px_rgb(60_30_15/0.55)] ring-1 ring-ink/10 md:rounded-[20px] md:group-hover:-translate-y-1"
          style={{ aspectRatio: shapeOf(s) }}
        >
          <span className={`sw-photo absolute inset-0 ${delay === undefined ? "" : "rise-photo"}`}>
            <span className="absolute inset-0 transition-[scale] duration-[1.4s] ease-luxe group-hover:scale-[1.05] group-data-lit:scale-[1.05]">
              {s.cover?.src ? (
                <Image
                  src={s.cover.src}
                  alt={s.cover.alt}
                  fill
                  sizes={sizes}
                  // (only the arrangement showing loads its photos; the first ones first)
                  loading="lazy"
                  fetchPriority={i < 2 ? "high" : undefined}
                  className="object-cover"
                  style={{ objectPosition: s.cover.position }}
                />
              ) : (
                // no photo yet: a faint focus frame
                <span className="absolute inset-0 grid place-items-center bg-[#ece3d4]">
                  <FocusMark className="h-10 w-14 text-accent/30" />
                </span>
              )}
            </span>
          </span>
          {s.cover?.src && <span aria-hidden className="sw-shade pointer-events-none absolute inset-0" />}
          <span
            aria-hidden
            className="absolute top-2.5 right-2.5 z-10 grid size-8 place-items-center rounded-full border border-cream/40 text-[0.85rem] text-cream backdrop-blur-[2px] transition-[background-color,border-color,color,rotate] duration-500 ease-luxe group-hover:-rotate-45 group-hover:border-brand group-hover:bg-brand group-hover:text-night group-data-lit:-rotate-45 group-data-lit:border-brand group-data-lit:bg-brand group-data-lit:text-night sm:top-3.5 sm:right-3.5 sm:size-10"
          >
            &rarr;
          </span>
        </span>

        {/* its name underneath, with the traditional one above it */}
        <span className="mt-3 block px-0.5 sm:mt-4">
          {s.local && (
            <span className="mb-1 block font-mono text-[0.55rem] tracking-[0.16em] text-accent-deep/80 uppercase sm:text-[0.62rem]">
              {s.local}
            </span>
          )}
          <span className="block font-display text-[clamp(1.05rem,1.8vw,1.6rem)] leading-[1.15] transition-colors duration-500 group-hover:text-accent-deep group-data-lit:text-accent-deep">
            {s.name}
          </span>
        </span>
      </Link>
    </li>
  );

  return (
    <main ref={root} aria-labelledby="sw-name" className="light-page relative overflow-hidden bg-cream text-ink">
      <div className="mx-auto max-w-[1320px] px-5 pt-32 sm:px-8 sm:pt-36 lg:px-12 lg:pt-40">
        {/* Where we are */}
        <header>
          <nav
            aria-label="Breadcrumb"
            className="sw-crumbs rise-in mb-3 flex items-center gap-2.5 font-mono text-[0.62rem] tracking-[0.18em] text-ink/55 uppercase lg:mb-4"
          >
            <Link href="/gallery" className="transition-colors hover:text-accent-deep">
              Gallery
            </Link>
            <span aria-hidden>/</span>
            <span aria-current="page" className="text-ink/85">
              {category.name}
            </span>
          </nav>
          <p
            className="sw-eyebrow rise-in flex items-center gap-3 font-heading text-[0.66rem] font-semibold tracking-[0.3em] text-accent-deep uppercase sm:text-[0.72rem]"
            style={{ "--d": "0.06s" } as React.CSSProperties}
          >
            <FocusMark className="h-4 w-6 text-accent" />
            {pad(number)} / {pad(total)} &middot; {count ? `${count} kind${count === 1 ? "" : "s"} of shoot` : "Coming soon"}
          </p>
          <h1
            id="sw-name"
            style={{ "--d": "0.12s" } as React.CSSProperties}
            className="sw-name rise-in mt-4 font-display text-[clamp(2.8rem,9vw,7rem)] leading-[1.02] lg:mt-5"
          >
            {category.name}
          </h1>
        </header>

        {/* No kinds of shoot in it yet */}
        {count === 0 && (
          <div
            className="rise-in mt-12 flex flex-col items-center rounded-[22px] border border-dashed border-ink/15 px-6 py-16 text-center lg:mt-16"
            style={{ "--d": "0.3s" } as React.CSSProperties}
          >
            <FocusMark className="h-7 w-10 text-accent" />
            <p className="mt-5 font-display text-[clamp(1.5rem,2.8vw,2.1rem)] leading-[1.2]">Photos coming soon</p>
            <p className="mt-2 max-w-[40ch] text-[0.95rem] leading-[1.7] text-ink/60">
              We&rsquo;re putting this part of the gallery together. Please check back soon.
            </p>
          </div>
        )}

        {/* The wall: one arrangement for each screen size, only the one that fits showing (its
            top row of photos asked for as soon as the page arrives) */}
        {layouts.map((l) => (
          <PreloadPhotos
            key={l.key}
            media={SCREENS[l.key]}
            photos={l.columns
              .map((column) => kinds[column[0]]?.cover?.src)
              .filter((src): src is string => !!src)
              .map((src) => ({ src, sizes: l.sizes }))}
          />
        ))}
        <div className="sw-wall mt-10 sm:mt-12 lg:mt-16">
          {layouts.map((l) => (
            <div key={l.key} className={`${l.show} items-start gap-3 sm:gap-4 md:gap-5 lg:gap-6`}>
              {l.columns.map((column, c) => (
                <ul
                  key={c}
                  data-lower={c % 2 ? "" : undefined}
                  className="sw-col flex min-w-0 flex-1 flex-col gap-6 md:gap-8"
                  // every other column starts lower (a share of the row, so of a column's width)
                  style={c % 2 ? { paddingTop: `${(LOWER * 100) / l.cols}%` } : undefined}
                >
                  {column.map((i, r) => card(kinds[i], i, l.sizes, r === 0 ? 0.3 + c * 0.09 : undefined))}
                </ul>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* On to the next category, or back (none when it's the only one) */}
      {total > 1 && (
        <nav
          aria-label="More categories"
          className="mx-auto mt-16 grid max-w-[1320px] grid-cols-2 gap-3 border-t border-ink/15 px-5 pt-8 pb-16 sm:gap-4 sm:px-8 lg:mt-24 lg:px-12 lg:pb-24"
        >
          {/* (with only two categories, the one either side is the same: just Next) */}
          {prev.slug !== next.slug && (
            <Link href={`/gallery/${prev.slug}`} className="group block">
              <span className="block font-mono text-[0.62rem] tracking-[0.18em] text-ink/55 uppercase">
                &larr; Previous
              </span>
              <span className="mt-2 block font-display text-[clamp(1.2rem,2.4vw,2rem)] transition-colors duration-500 group-hover:text-accent-deep">
                {prev.name}
              </span>
            </Link>
          )}
          <Link href={`/gallery/${next.slug}`} className="group col-start-2 block text-right">
            <span className="block font-mono text-[0.62rem] tracking-[0.18em] text-ink/55 uppercase">
              Next &rarr;
            </span>
            <span className="mt-2 block font-display text-[clamp(1.2rem,2.4vw,2rem)] transition-colors duration-500 group-hover:text-accent-deep">
              {next.name}
            </span>
          </Link>
        </nav>
      )}
      {/* (the only category: room below the wall instead) */}
      {total <= 1 && <div aria-hidden className="pb-20 lg:pb-28" />}
    </main>
  );
}
