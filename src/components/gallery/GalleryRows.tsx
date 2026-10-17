"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { GalleryCategory } from "@/content/gallery";
import { useEnquiry } from "@/components/providers/SiteProvider";
import { ChatIcon } from "@/components/ui/icons";
import { FocusMark } from "@/components/ui/ornaments";
import { KindsBand } from "./KindsBand";
import { followPointer } from "./pointer";
import { PreloadPhotos, SCREENS } from "./preload";

/* The gallery as even rows: each category's photo whole, every photo in a row the same height
   and as wide as its shape needs, every row exactly the page's width (globals.css → .gr-row).
   Which categories share a row is worked out here from the photos' shapes, so whatever the
   client uploads (tall, wide, square, a panorama) the rows still end evenly.
   Phones, tablets and computers each have their own rows, aiming at this much shape per row
   (two portraits on a phone, three on a tablet, four on a computer), with at most this many
   photos in one. */
const TARGET = { phone: 1.4, tablet: 2.1, computer: 2.75 };
const MOST = { phone: 2, tablet: 3, computer: 4 };
// a category without a photo yet
const EMPTY = 0.8;
// the "Don't see your celebration?" card joins the last row when that row has at least this
// much room left; otherwise it runs across the page under the rows
const ASK_ROOM = 0.6;
// a row with less than this share of the target in it keeps the usual height (leaving a gap
// beside it) rather than growing too tall, so the cutting below avoids them
const GAP = 0.7;

const shapeOf = (c: GalleryCategory) => (c.cover.src ? (c.shape ?? EMPTY) : EMPTY);
const pad = (n: number) => String(n).padStart(2, "0");
const kindsOf = (n: number) => `${n} kind${n === 1 ? "" : "s"} of shoot`;

/** The categories, in order, cut into rows whose shapes add up as close to the target as they
    can (the best of every way of cutting them): a row too full comes out shorter, one too empty
    taller, both weighed by how far its height moves; a row that would leave a gap counts far
    worse; the last row counts as full when the invitation card fills what's left of it */
function rowsOf(categories: GalleryCategory[], target: number, most: number) {
  const n = categories.length;
  const cost = Array<number>(n + 1).fill(Infinity);
  const from = Array<number>(n + 1).fill(0);
  cost[0] = 0;
  for (let end = 1; end <= n; end++) {
    let sum = 0;
    for (let start = end - 1; start >= 0 && end - start <= most; start--) {
      sum += shapeOf(categories[start]);
      const filled = end === n && target - sum >= ASK_ROOM ? target : sum;
      const c = cost[start] + Math.log(filled / target) ** 2 + (filled < target * GAP ? 0.5 : 0);
      if (c < cost[end]) {
        cost[end] = c;
        from[end] = start;
      }
    }
  }
  const rows: { cats: GalleryCategory[]; sum: number }[] = [];
  for (let end = n; end > 0; end = from[end]) {
    const cats = categories.slice(from[end], end);
    rows.unshift({ cats, sum: cats.reduce((a, c) => a + shapeOf(c), 0) });
  }
  return rows;
}

export function GalleryRows({ categories }: { categories: GalleryCategory[] }) {
  const root = useRef<HTMLElement>(null);
  const enquire = useEnquiry();

  const layouts = useMemo(
    () =>
      (
        [
          { key: "phone", show: "flex md:hidden", target: TARGET.phone, most: MOST.phone, page: "calc(100vw - 2rem)" },
          { key: "tablet", show: "hidden md:flex lg:hidden", target: TARGET.tablet, most: MOST.tablet, page: "calc(100vw - 4rem)" },
          { key: "computer", show: "hidden lg:flex", target: TARGET.computer, most: MOST.computer, page: "min(1224px, 100vw - 6rem)" },
        ] as const
      ).map((l) => {
        const rows = rowsOf(categories, l.target, l.most);
        const room = l.target - (rows.at(-1)?.sum ?? 0);
        return { ...l, rows, askShape: room >= ASK_ROOM ? room : 0 };
      }),
    [categories],
  );

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      // (only the rows showing on this screen; the other screen sizes' rows are simply there, in
      // case the screen turns). The first row rises in by itself from the CSS (.rise-in), so the
      // top photos show without waiting for this; the rest float up as they come into view
      const showing = q<HTMLElement>(".gr-item").filter((t) => t.offsetParent);
      const items = showing.filter((t) => !t.classList.contains("rise-in"));
      const elsewhere = q<HTMLElement>(".gr-item").filter((t) => !t.offsetParent);
      if (elsewhere.length) gsap.set(elsewhere, { autoAlpha: 1 });

      // those cards start hidden ([data-reveal]), then GSAP takes them over
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (items.length) gsap.set(items, reduce ? { autoAlpha: 1 } : { autoAlpha: 0, y: 40 });
      window.__dsReady = true;

      /* ── Touch screens have no hover: the card crossing the middle of the screen lights up as
         if it were hovered (the group-data-lit classes below, and globals.css) ── */
      const mm = gsap.matchMedia();
      mm.add("(hover: none), (pointer: coarse)", () => {
        showing.forEach((t) =>
          ScrollTrigger.create({
            trigger: t,
            start: "top 55%",
            end: "bottom 45%",
            onToggle: (self) => t.toggleAttribute("data-lit", self.isActive),
          }),
        );
        return () => showing.forEach((t) => t.removeAttribute("data-lit"));
      });
      if (reduce) return;

      /* ── Cards float up into place as they come into view, the photos settling inside them ── */
      const reveal = (batch: Element[]) => {
        const tl = gsap.timeline().to(batch, { autoAlpha: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.09 });
        // (the "Don't see your celebration?" card has no photo to settle)
        const inside = batch.flatMap((t) => [...t.querySelectorAll(".gr-photo")]);
        if (inside.length) tl.fromTo(inside, { scale: 1.15 }, { scale: 1, duration: 1.8, ease: "expo.out", stagger: 0.09 }, 0);
      };
      // cards already on screen or scrolled past (coming back to the page part-way down) appear
      // straight away: a scroll trigger behind them would never fire
      const line = window.innerHeight * 0.92;
      const waiting = items.filter((t) => t.getBoundingClientRect().top >= line);
      const inView = items.filter((t) => !waiting.includes(t));
      if (inView.length) reveal(inView);
      if (waiting.length) ScrollTrigger.batch(waiting, { start: "top 92%", once: true, onEnter: reveal });
      // re-measure once the fonts are in, as the heading above the rows can change height
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: root },
  );

  // (the first row rises in from the CSS as the page arrives, each card `delay` seconds after it)
  const card = (c: GalleryCategory, i: number, sizes: string, delay?: number) => (
    <li key={c.slug} style={{ "--r": shapeOf(c) } as React.CSSProperties}>
      <Link
        href={`/gallery/${c.slug}`}
        data-reveal={delay === undefined ? true : undefined}
        onPointerMove={followPointer}
        className={`gr-item group block ${delay === undefined ? "" : "rise-in"}`}
        style={delay === undefined ? undefined : ({ "--d": `${delay}s` } as React.CSSProperties)}
      >
        <span
          className="gc-tile relative block overflow-hidden rounded-[14px] bg-[#e7ddcc] shadow-[0_22px_44px_-26px_rgb(60_30_15/0.55)] ring-1 ring-ink/10 md:rounded-[18px] md:group-hover:-translate-y-1"
          style={{ aspectRatio: shapeOf(c) }}
        >
          <span className={`gr-photo absolute inset-0 ${delay === undefined ? "" : "rise-photo"}`}>
            <span className="absolute inset-0 transition-[scale] duration-[1.4s] ease-luxe group-hover:scale-[1.05] group-data-lit:scale-[1.05]">
              {c.cover.src ? (
                <Image
                  src={c.cover.src}
                  alt={c.cover.alt}
                  fill
                  sizes={sizes}
                  // (only the rows showing load their photos; the first ones first)
                  loading="lazy"
                  fetchPriority={i < 3 ? "high" : undefined}
                  className="object-cover"
                />
              ) : (
                // no photo yet: a faint focus frame
                <span className="absolute inset-0 grid place-items-center bg-[#ece3d4]">
                  <FocusMark className="h-10 w-14 text-accent/30" />
                </span>
              )}
            </span>
          </span>
          {c.cover.src && <span aria-hidden className="sw-shade pointer-events-none absolute inset-0" />}
          <span
            aria-hidden
            className="absolute top-2.5 right-2.5 z-10 grid size-8 place-items-center rounded-full border border-cream/40 text-[0.85rem] text-cream backdrop-blur-[2px] transition-[background-color,border-color,color,rotate] duration-500 ease-luxe group-hover:-rotate-45 group-hover:border-brand group-hover:bg-brand group-hover:text-night group-data-lit:-rotate-45 group-data-lit:border-brand group-data-lit:bg-brand group-data-lit:text-night sm:top-3.5 sm:right-3.5 sm:size-10"
          >
            &rarr;
          </span>
        </span>

        {/* its name underneath, large; below it how many kinds of shoot it holds, in maroon after a
            short gold line, and its number in gold at the end */}
        <span className="mt-3.5 block px-0.5 font-display text-[clamp(1.3rem,2.4vw,2.15rem)] leading-[1.1] text-ink transition-colors duration-500 group-hover:text-accent-deep group-data-lit:text-accent-deep sm:mt-5">
          {c.name}
        </span>
        <span className="mt-2 flex items-center gap-2.5 px-0.5 font-heading text-[0.6rem] font-semibold tracking-[0.2em] text-accent-deep uppercase sm:mt-2.5 sm:text-[0.7rem]">
          <i aria-hidden className="h-px w-5 shrink-0 bg-[#c9a35f] sm:w-7" />
          {c.subs.length ? kindsOf(c.subs.length) : "Coming soon"}
          <span className="ml-auto hidden font-mono font-normal tracking-[0.14em] text-[#9a7432] sm:inline">
            {pad(i + 1)}
          </span>
        </span>
      </Link>
    </li>
  );

  type Layout = (typeof layouts)[number];
  // a row's shapes added up (the last one with the invitation card filling it)
  const rowSum = (l: Layout, k: number) => l.rows[k].sum + (k === l.rows.length - 1 ? l.askShape : 0);
  // how wide a photo shows: its share of the row
  const sizesIn = (l: Layout, k: number, c: GalleryCategory) =>
    `calc(${l.page} * ${(shapeOf(c) / rowSum(l, k)).toFixed(3)})`;

  // "Don't see your celebration?": a card filling the end of the last row, or a strip under them
  const ask = (inRow: boolean) => (
    <div
      data-reveal
      className={`gr-item gc-ask relative flex overflow-hidden rounded-[14px] ring-1 ring-ink/10 md:rounded-[18px] ${
        inRow
          ? "h-full flex-col items-start justify-between gap-4 p-4 sm:p-6"
          : "w-full flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"
      }`}
    >
      <span className={`flex gap-4 ${inRow ? "flex-col" : "items-center"}`}>
        <FocusMark className="h-5 w-8 shrink-0 text-accent sm:h-6 sm:w-10" />
        <span className="block">
          <span className="block font-display text-[clamp(1.1rem,2vw,1.8rem)] leading-tight">
            Don&rsquo;t see your celebration?
          </span>
          <span className="mt-1.5 hidden max-w-[36ch] text-[0.88rem] leading-[1.6] text-ink/65 sm:block">
            We shoot more than what&rsquo;s here. Tell us what you&rsquo;re planning.
          </span>
        </span>
      </span>
      <button type="button" onClick={() => enquire({ source: "gallery" })} className="btn-brand btn-sm shrink-0">
        <ChatIcon className="size-4" />
        Tell us
      </button>
    </div>
  );

  return (
    <main
      ref={root}
      aria-labelledby="gallery-title"
      className="light-page relative overflow-hidden bg-cream pt-36 pb-6 text-ink sm:pt-40 lg:pt-44 lg:pb-8"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
        {/* Heading */}
        <header className="mb-12 grid items-end gap-6 px-1 sm:px-0 lg:mb-16 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p
              className="gc-eyebrow rise-in mb-5 flex items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-accent-deep uppercase"
            >
              <FocusMark className="h-4 w-6 text-accent" />
              Our gallery
            </p>
            <h1
              id="gallery-title"
              className="gc-title rise-in font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.06]"
              style={{ "--d": "0.08s" } as React.CSSProperties}
            >
              Every celebration, beautifully <span className="foil-deep">framed</span>
            </h1>
          </div>
          <p
            className="gc-intro rise-in max-w-[44ch] text-[1rem] leading-[1.8] text-ink/65 lg:justify-self-end"
            style={{ "--d": "0.2s" } as React.CSSProperties}
          >
            Weddings, family ceremonies and little ones. Pick a celebration to see the kinds of shoots
            inside it, and the families who let us in.
          </p>
        </header>

        {categories.length === 0 ? (
          /* Nothing in the gallery yet: it says so, and offers the enquiry form */
          <div
            className="rise-in flex flex-col items-center rounded-[22px] border border-dashed border-ink/15 px-6 py-16 text-center sm:py-20"
            style={{ "--d": "0.3s" } as React.CSSProperties}
          >
            <FocusMark className="h-8 w-12 text-accent" />
            <p className="mt-5 font-display text-[clamp(1.7rem,3.2vw,2.5rem)] leading-[1.15]">
              Our gallery is being <span className="foil-deep">curated</span>
            </p>
            <p className="mt-3 max-w-[44ch] text-[0.98rem] leading-[1.7] text-ink/60">
              Photos coming soon. Meanwhile, tell us what you&rsquo;re celebrating and we&rsquo;ll share our
              recent work with you.
            </p>
            <button type="button" onClick={() => enquire({ source: "gallery" })} className="btn-brand btn-sm mt-7">
              <ChatIcon className="size-4" />
              Tell us
            </button>
          </div>
        ) : (
          <>
            {/* The rows: one arrangement for each size of screen, only the one that fits showing (its
                first row of photos asked for as soon as the page arrives) */}
            {layouts.map((l) => (
              <PreloadPhotos
                key={l.key}
                media={SCREENS[l.key]}
                photos={(l.rows[0]?.cats ?? [])
                  .filter((c) => c.cover.src)
                  .map((c) => ({ src: c.cover.src, sizes: sizesIn(l, 0, c) }))}
              />
            ))}
            {layouts.map((l) => (
              <div key={l.key} className={`${l.show} flex-col gap-9 sm:gap-12 lg:gap-14`}>
                {l.rows.map((row, k) => {
                  const last = k === l.rows.length - 1;
                  const sum = rowSum(l, k);
                  return (
                    <ul
                      key={k}
                      className="gr-row mx-auto flex w-full gap-3 sm:gap-4 lg:gap-5"
                      // (a row with too little in it keeps the usual height rather than growing)
                      style={sum < l.target * GAP ? { maxWidth: `${(sum / l.target) * 100}%` } : undefined}
                    >
                      {row.cats.map((c, j) =>
                        card(c, categories.indexOf(c), sizesIn(l, k, c), k === 0 ? 0.3 + j * 0.09 : undefined),
                      )}
                      {last && l.askShape > 0 && (
                        <li style={{ "--r": l.askShape } as React.CSSProperties}>
                          {/* (its shape makes it exactly as tall as the photos beside it) */}
                          <div style={{ aspectRatio: l.askShape }}>{ask(true)}</div>
                        </li>
                      )}
                    </ul>
                  );
                })}
                {l.askShape === 0 && ask(false)}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Every kind of shoot gliding past, edge to edge */}
      <KindsBand categories={categories} />
    </main>
  );
}
