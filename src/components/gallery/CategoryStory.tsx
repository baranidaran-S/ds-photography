"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import type { ShownPhoto, StoryView } from "@/lib/storyView";
import { useEnquiry } from "@/components/providers/SiteProvider";
import { ArrowIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";
import { PhotoViewer } from "./PhotoViewer";
import { SCREENS, warmPhotos } from "./preload";

const pad = (n: number) => String(n).padStart(2, "0");

// Photos shown at first, and added each time "Show more" is pressed
const PAGE = 24;

// Their favourites go in one row while their shapes (width ÷ height) add up to no more than
// this; past it (mostly wide photos) the row would be under about 200px tall on a computer, so
// they take two rows
const ROW_LIMIT = 5.5;

/* Small line icons for the facts of the day */
const FACT_ICONS = {
  when: (
    <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
  ),
  where: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  shoot: (
    <>
      <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
};

// The last photos are placed together, trying every way, so the columns end together: this many
// for two columns, or for three (a few thousand ways each, which takes a moment)
const LAST_FEW = { 2: 12, 3: 8 } as Record<number, number>;

/** Shares the photos out across the columns: the first row in order, left to right; then each to
    whichever column is shortest so far; and the last few wherever leaves the columns' ends most
    even (each next photo alone can't see the ones still to come, so a run of tall photos at the
    end would otherwise leave one column short). The places are worked out once for all the
    photos, and a column keeps its photos in order, so "Show more" only ever adds photos at the
    bottom of the columns, never moving one already showing */
function columnsOf(photos: ShownPhoto[], cols: number) {
  // each photo's height for a column one unit wide, and the gap under it
  const tall = photos.map((p) => p.h / p.w + 0.04);
  const heights: number[] = Array(cols).fill(0);
  const place: number[] = [];
  const firstRow = Math.min(cols, photos.length);
  const last = Math.min(photos.length - firstRow, LAST_FEW[cols] ?? 8);
  const end = photos.length - last;
  for (let i = 0; i < end; i++) {
    const c = i < firstRow ? i : heights.indexOf(Math.min(...heights));
    place[i] = c;
    heights[c] += tall[i];
  }
  let best = Infinity;
  const pick: number[] = Array(last).fill(0);
  for (let n = 0; n < cols ** last; n++) {
    for (let k = 0, x = n; k < last; k++, x = Math.floor(x / cols)) pick[k] = x % cols;
    const h = [...heights];
    pick.forEach((c, k) => (h[c] += tall[end + k]));
    const spread = Math.max(...h) - Math.min(...h);
    if (spread < best - 1e-9) {
      best = spread;
      pick.forEach((c, k) => (place[end + k] = c));
    }
  }
  const columns: number[][] = Array.from({ length: cols }, () => []);
  place.forEach((c, i) => columns[c].push(i));
  return columns;
}

/* A story page:
   - a band with their photo whole in the middle, over the same photo blurred to fill the band
   - their names, and the facts of the day
   - their photos, each whole at its own shape, a page at a time ("Show more" adds the next);
     tap one to see it full-screen, and step through all of them there
   - their experience of our team in their own words (the description in stories.ts), beside
     who photographed it; that side is the same on every page
   - the photos they love most, in a row
   - an invitation to book, and the kinds either side (the breadcrumb leads back to the category)
   Photos come from the kind's folder and words from stories.ts; anything missing arrives as a
   placeholder (storyView.ts). */
export function CategoryStory({ view }: { view: StoryView }) {
  const { category, kind, story, prev, next } = view;
  const root = useRef<HTMLElement>(null);
  const enquire = useEnquiry();
  const [viewing, setViewing] = useState<number | null>(null);
  const [shown, setShown] = useState(PAGE);

  // the viewer steps through all their photos, whether or not "Show more" has reached them yet
  const real: ShownPhoto[] = story.photos.filter((p) => p.src);
  const photoCount = real.length;
  const showing = Math.min(shown, story.photos.length);

  // phones two columns, tablets and computers three; each only shows on its own screen size,
  // and only its photos that are showing load
  const layouts = useMemo(
    () => [
      { key: "phone", show: "flex md:hidden", sizes: "50vw", columns: columnsOf(story.photos, 2) },
      { key: "wide", show: "hidden md:flex", sizes: "(min-width: 1320px) 410px, 33vw", columns: columnsOf(story.photos, 3) },
    ],
    [story.photos],
  );

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      gsap.set(q("[data-reveal]"), { autoAlpha: 1 });
      window.__dsReady = true;
      if (reduce) return;

      /* ── Arriving: the photo settles into the band, their names rise, the facts lift in ── */
      const split = SplitText.create(q(".sf-names"), { type: "words", mask: "words" });
      gsap.set(split.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
      gsap
        .timeline({ delay: 0.1, defaults: { ease: "expo.out" } })
        .from(q(".sf-hero-bg"), { autoAlpha: 0, duration: 1.6 }, 0)
        .from(q(".sf-hero-photo"), { autoAlpha: 0, scale: 0.94, y: 24, duration: 1.6 }, 0.1)
        .from(q(".sf-crumbs"), { autoAlpha: 0, y: 14, duration: 0.9 }, 0.4)
        .from(split.words, { yPercent: 115, duration: 1.3, stagger: 0.1 }, 0.5)
        .from(q(".sf-facts"), { autoAlpha: 0, y: 40, duration: 1.2 }, 0.8);

      /* ── The first photos and the text float up as they come into view (photos added later
         by "Show more" float in by themselves: .sf-pop). Only the photos showing on this screen:
         the other screen size's arrangement is hidden, and would hold up their entrance ── */
      ScrollTrigger.batch(q<HTMLElement>(".sf-tile").filter((t) => t.offsetParent), {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.from(batch, { autoAlpha: 0, y: 40, duration: 1.1, ease: "expo.out", stagger: 0.08 }),
      });
      q<HTMLElement>(".sf-rise").forEach((block) =>
        gsap.from(block, {
          autoAlpha: 0,
          y: 40,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: { trigger: block, start: "top 88%", once: true },
        }),
      );

      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: root },
  );

  // more photos make the page longer: everything below them is measured again
  useEffect(() => {
    if (shown > PAGE) ScrollTrigger.refresh();
  }, [shown]);

  // as "Show more" comes near, the next photos start downloading, so they're there when it's pressed
  const more = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = more.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const sizes = layouts.find((l) => l.key === (matchMedia(SCREENS.phone).matches ? "phone" : "wide"))!.sizes;
        warmPhotos(
          story.photos
            .slice(showing, showing + PAGE)
            .filter((p) => p.src)
            .map((p) => ({ src: p.src, sizes })),
        );
      },
      { rootMargin: "1000px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [showing, layouts, story.photos]);

  const open = (src: string) => setViewing(real.findIndex((p) => p.src === src));

  // Their favourites. Computers: in one row with the widest in the middle, so a wide photo among
  // tall ones sits centre stage; but when they're mostly wide photos, one row would make them all
  // short (a strip), so they go in two rows instead, shared so the rows come out about as tall
  // as each other. Phones: the widest across the top, then the others two by two.
  const loved = useMemo(() => {
    const list = story.loved;
    if (!list.length) return { rows: [], phone: [] };
    const shape = (p: ShownPhoto) => p.w / p.h;
    const sum = (ps: ShownPhoto[]) => ps.reduce((a, p) => a + shape(p), 0);
    const widest = list.reduce((w, p, i) => (shape(p) > shape(list[w]) ? i : w), 0);
    const rest = list.filter((_, i) => i !== widest);
    const phone: ShownPhoto[][] = [[list[widest]]];
    for (let i = 0; i < rest.length; i += 2) phone.push(rest.slice(i, i + 2));

    // a row's height is its width ÷ its photos' shapes added up: past this, the photos get short
    if (sum(list) <= ROW_LIMIT) {
      const half = Math.floor(rest.length / 2);
      return { rows: [[...rest.slice(0, half), list[widest], ...rest.slice(half)]], phone };
    }
    // two rows: the fewer on top (so they're the bigger ones), choosing which go up so the two
    // rows' heights come closest; each row keeps their order
    const top = Math.floor(list.length / 2);
    let best: number[] = [];
    let gap = Infinity;
    const pick = (from: number, chosen: number[]) => {
      if (chosen.length === top) {
        const up = chosen.map((i) => list[i]);
        const down = list.filter((_, i) => !chosen.includes(i));
        const d = Math.abs(sum(up) - sum(down));
        if (d < gap - 1e-9) {
          gap = d;
          best = chosen;
        }
        return;
      }
      for (let i = from; i < list.length; i++) pick(i + 1, [...chosen, i]);
    };
    pick(0, []);
    return {
      rows: [best.map((i) => list[i]), list.filter((_, i) => !best.includes(i))],
      phone,
    };
  }, [story.loved]);

  /** One of their favourites, whole, with a thin gold edge */
  const lovedPhoto = (p: ShownPhoto, sizes: string) => (
    <button
      type="button"
      onClick={() => open(p.src)}
      aria-label="Open one of their favourite photos"
      className="lv-photo group relative block size-full cursor-pointer overflow-hidden rounded-[12px] lg:rounded-[16px]"
    >
      <Image
        src={p.src}
        alt={p.alt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-[1.04]"
      />
    </button>
  );

  /** A photo at its own shape, or an empty frame where one will go */
  const photo = (p: ShownPhoto, sizes: string, className = "") =>
    p.src ? (
      <button
        type="button"
        onClick={() => open(p.src)}
        aria-label={`Open photo: ${p.caption ?? p.alt}`}
        className={`group relative block w-full cursor-pointer overflow-hidden rounded-[10px] bg-[#e7ddcc] lg:rounded-[14px] ${className}`}
        style={{ aspectRatio: `${p.w} / ${p.h}` }}
      >
        <Image
          src={p.src}
          alt={p.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-105"
        />
        {p.caption && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pt-10 pb-3 text-left font-mono text-[0.56rem] tracking-[0.16em] text-cream/90 uppercase transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100">
            {p.caption}
          </span>
        )}
      </button>
    ) : (
      <div
        aria-hidden
        className={`grid place-items-center rounded-[10px] bg-[#ece3d4] ring-1 ring-ink/10 lg:rounded-[14px] ${className}`}
        style={{ aspectRatio: `${p.w} / ${p.h}` }}
      >
        <LotusMark className="h-5 w-8 text-accent/30" />
      </div>
    );

  return (
    <main ref={root} aria-labelledby="sf-names" className="light-page relative bg-cream text-ink">
      {/* ── The opening band: their photo whole, over soft cream silk (one picture for every story) ── */}
      <section
        className="sf-hero relative sm:h-[calc(62svh+1rem)] sm:min-h-[416px] lg:h-[calc(74svh+2.5rem)] lg:max-h-[900px]"
        style={{ "--r": story.cover.w / story.cover.h } as React.CSSProperties}
      >
        {/* (the band clips the silk, not the photo, so the photo's shadow falls softly onto the page) */}
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/gallery/event-bg.jpg"
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            className="sf-hero-bg object-cover"
          />
        </div>
        <div aria-hidden className="sf-hero-veil absolute inset-0" />
        {/* (starts a clear gap below the menu bar: 99px tall, 120px on computers) */}
        <div className="sf-hero-stage absolute inset-x-4 top-30 bottom-4 sm:inset-x-8 sm:top-32 sm:bottom-6 lg:top-38">
          <div
            data-reveal
            className="sf-hero-photo relative overflow-hidden rounded-[12px] shadow-[0_30px_70px_-30px_rgb(60_30_15/0.6)] ring-1 ring-ink/10 lg:rounded-[16px]"
          >
            <Image
              src={story.cover.src}
              alt={story.cover.alt}
              fill
              sizes="(max-width: 1023px) 92vw, 70vw"
              loading="eager"
              fetchPriority="high"
              className="object-cover"
              style={{ objectPosition: story.cover.position }}
            />
          </div>
        </div>
      </section>

      {/* ── Their names, and the facts of the day ── */}
      <section className="mx-auto max-w-[1180px] px-4 pt-8 text-center sm:px-8 lg:pt-12">
        <nav
          aria-label="Breadcrumb"
          data-reveal
          className="sf-crumbs flex flex-wrap items-center justify-center gap-2.5 font-mono text-[0.62rem] tracking-[0.18em] text-ink/55 uppercase"
        >
          <Link href="/gallery" className="transition-colors hover:text-accent-deep">
            Gallery
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/gallery/${category.slug}`} className="transition-colors hover:text-accent-deep">
            {category.name}
          </Link>
          <span aria-hidden>/</span>
          <span aria-current="page" className="text-ink/85">
            {kind.name}
          </span>
        </nav>
        <h1
          id="sf-names"
          data-reveal
          className="sf-names mt-5 font-display text-[clamp(2.6rem,8vw,6.5rem)] leading-[1]"
        >
          {story.names}
        </h1>
        {/* (like a printed invitation: a gold double edge, each fact under its own little seal) */}
        <dl
          data-reveal
          className="sf-facts relative mt-10 grid grid-cols-2 rounded-[22px] bg-[#fffdf8] shadow-[0_30px_60px_-34px_rgb(60_30_15/0.45)] ring-1 ring-brand/50 sm:grid-cols-3 lg:mt-12"
        >
          {(
            [
              ["when", "When", story.date],
              ["where", "Where", story.place],
              ["shoot", "The shoot", kind.local ? `${kind.name} (${kind.local})` : kind.name],
            ] as const
          ).map(([icon, term, value]) => (
            <div
              key={term}
              // (phones: the shoot runs the full width under the other two)
              className="relative flex min-w-0 flex-col items-center px-3 pt-6 pb-5 last:col-span-2 sm:px-6 sm:pt-9 sm:pb-8 sm:last:col-span-1"
            >
              <dt className="flex flex-col items-center gap-2.5 font-mono sm:gap-3 text-[0.6rem] tracking-[0.22em] text-[#9a7432] uppercase">
                <span
                  aria-hidden
                  className="grid size-10 place-items-center rounded-full bg-[#f6ecdf] text-accent-deep ring-1 ring-brand/45 sm:size-11 lg:size-12"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                  >
                    {FACT_ICONS[icon]}
                  </svg>
                </span>
                {term}
              </dt>
              <dd className="mt-2 font-display text-[clamp(1.05rem,1.6vw,1.4rem)] leading-[1.3]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Their photos, a page at a time ── */}
      <section aria-labelledby="sf-photos" className="mx-auto max-w-[1320px] px-3 pt-16 sm:px-6 lg:px-12 lg:pt-24">
        <div className="sf-rise mb-6 flex items-end justify-between gap-4 px-2 sm:px-0 lg:mb-10">
          <h2 id="sf-photos" className="font-display text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.1]">
            The <span className="foil-deep">photos</span>
          </h2>
          <p className="pb-1 font-mono text-[0.62rem] tracking-[0.2em] text-ink/55 uppercase">
            {pad(photoCount)} photos &middot; tap to open
          </p>
        </div>
        {layouts.map((l) => (
          <div key={l.key} className={`${l.show} items-start gap-2 sm:gap-3 lg:gap-5`}>
            {l.columns.map((column, c) => (
              <div key={c} className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3 lg:gap-5">
                {column
                  .filter((i) => i < showing)
                  .map((i) => (
                    <div
                      key={i}
                      className={i < PAGE ? "sf-tile" : "sf-pop"}
                      // (added photos float in one after another)
                      style={i < PAGE ? undefined : { animationDelay: `${((i - PAGE) % PAGE) * 40}ms` }}
                    >
                      {photo(story.photos[i], l.sizes)}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ))}
        {showing < story.photos.length && (
          <div ref={more} className="mt-10 flex flex-col items-center gap-4 lg:mt-14">
            <p className="font-mono text-[0.62rem] tracking-[0.2em] text-ink/55 uppercase">
              Showing {showing} of {photoCount}
            </p>
            <button
              type="button"
              onClick={() => setShown((s) => s + PAGE)}
              className="inline-flex items-center gap-3 rounded-full border border-accent-deep/40 px-7 py-3.5 font-heading text-[0.7rem] font-semibold tracking-[0.2em] text-accent-deep uppercase transition-colors duration-500 hover:border-accent-deep hover:bg-accent-deep hover:text-cream"
            >
              Show more photos
              <ArrowIcon className="size-3.5 rotate-90" />
            </button>
          </div>
        )}
      </section>

      {/* ── Their experience of our team, as a signed note: a cream card with a gold double edge
         and large gold quote marks (globals.css → .sf-note). The words are this kind's description
         (stories.ts); every paragraph looks the same, however many there are ── */}
      <section className="sf-band mt-20 border-y border-ink/10 lg:mt-28">
        <div className="mx-auto max-w-[1000px] px-4 py-20 sm:px-8 lg:py-28">
          <div className="sf-rise sf-note relative rounded-[24px] bg-[#fffdf8] px-6 pt-12 pb-14 text-center shadow-[0_40px_80px_-46px_rgb(60_30_15/0.5)] ring-1 ring-brand/50 sm:px-16 sm:py-16 lg:px-20">
            <span aria-hidden className="sf-note-q sf-note-q-open">
              &ldquo;
            </span>
            <span aria-hidden className="sf-note-q sf-note-q-close">
              &rdquo;
            </span>
            <h2 className="font-heading text-[0.68rem] font-semibold tracking-[0.3em] text-accent-deep uppercase">
              Their experience
            </h2>
            <div className="mx-auto mt-6 max-w-[56ch] space-y-5 font-display text-[clamp(1.1rem,1.55vw,1.3rem)] leading-[1.8] text-ink/85">
              {story.description.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div aria-hidden className="mt-8 mb-3 flex items-center justify-center gap-3.5 text-[#c9a35f]">
              <i className="h-px w-14 bg-current" />
              <span className="text-[0.6rem]">&#9670;</span>
              <i className="h-px w-14 bg-current" />
            </div>
            <p className="font-signature text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1.2]">their time with our team</p>
          </div>
        </div>
      </section>

      {/* ── The photos they love most, on a deep wine band (globals.css → .lv-*): each whole, all
         the same height, the widest in the middle (phones: across the top, then two by two). Tap
         one to see it full-screen ── */}
      {loved.rows.length > 0 && (
        // (straight on from the experience band above, no gap between them)
        <section aria-labelledby="sf-loved" className="lv-band border-b border-cream/10">
          <div className="sf-rise mx-auto max-w-[1280px] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
            <p className="flex items-center justify-center gap-3 font-heading text-[0.68rem] font-semibold tracking-[0.3em] text-brand-light uppercase">
              <span aria-hidden className="text-[0.9rem] text-accent">
                &#9829;
              </span>
              Hand-picked by them
            </p>
            <h2
              id="sf-loved"
              className="mt-3 text-center font-signature text-[clamp(2.6rem,6vw,4.6rem)] leading-[1.15] text-cream"
            >
              The moments they{" "}
              <span className="lv-love">
                love
              </span>{" "}
              most
            </h2>
            <div className="mt-10 hidden flex-col gap-4 md:flex lg:mt-14 lg:gap-5">
              {loved.rows.map((row, k) => (
                <ul key={k} className="lv-row flex gap-4 lg:gap-5">
                  {row.map((p) => (
                    <li key={p.src} style={{ "--r": p.w / p.h } as React.CSSProperties}>
                      {lovedPhoto(p, "(min-width: 1280px) 600px, 50vw")}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 md:hidden">
              {loved.phone.map((row, k) => (
                <ul key={k} className="lv-row flex gap-3">
                  {row.map((p) => (
                    <li key={p.src} style={{ "--r": p.w / p.h } as React.CSSProperties}>
                      {lovedPhoto(p, row.length > 1 ? "50vw" : "100vw")}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── An invitation ── */}
      <section className="mx-auto max-w-[1320px] px-5 pt-24 pb-14 sm:px-8 lg:px-12 lg:pt-32 lg:pb-16">
        <div className="sf-rise gc-ask relative overflow-hidden rounded-[22px] px-6 py-14 text-center ring-1 ring-ink/10 sm:px-12 lg:py-20">
          <LotusMark className="mx-auto mb-6 h-6 w-10 text-accent" />
          <h2 className="font-display text-[clamp(2.2rem,5.4vw,4.6rem)] leading-[1.05]">
            Your story could be <span className="foil-deep">next</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-[1rem] leading-[1.8] text-ink/70">
            Tell us your date and what you&rsquo;re celebrating, and we&rsquo;ll check we&rsquo;re free.
          </p>
          <button
            type="button"
            onClick={() => enquire({ source: "gallery-story" })}
            className="mt-9 inline-flex items-center gap-3 rounded-full bg-brand px-7 py-3.5 font-heading text-[0.7rem] font-semibold tracking-[0.2em] text-night uppercase transition-colors duration-500 hover:bg-accent hover:text-cream"
          >
            Check your date
            <ArrowIcon className="size-3.5" />
          </button>
        </div>
      </section>

      {/* ── The kinds either side (the breadcrumb at the top leads back to the category) ── */}
      {/* (each a round maroon arrow button, the word, then the kind's name; phones: the arrow
         above the words, so the name has the full width) */}
      <nav
        aria-label="More kinds of shoot"
        className="mx-auto grid max-w-[1320px] grid-cols-2 gap-3 px-4 pb-16 sm:gap-5 sm:px-8 lg:px-12 lg:pb-24"
      >
        {(
          [
            [prev, "Previous", "rotate-180", "items-start sm:flex-row"],
            [next, "Next", "", "items-end text-right sm:flex-row-reverse"],
          ] as const
        ).map(([to, word, turn, side]) => (
          <Link
            key={word}
            href={`/gallery/${category.slug}/${to.slug}`}
            className={`group flex flex-col gap-3 sm:items-center sm:gap-5 ${side}`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-deep text-cream transition-colors duration-500 group-hover:bg-accent sm:size-12">
              <ArrowIcon className={`size-4 sm:size-[1.1rem] ${turn}`} />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-[0.62rem] font-semibold tracking-[0.25em] text-accent-deep uppercase sm:text-[0.68rem]">
                {word}
              </span>
              <span className="mt-1 block font-display text-[clamp(1rem,2vw,1.6rem)] leading-[1.25] text-ink transition-colors duration-500 group-hover:text-accent-deep">
                {to.name}
              </span>
            </span>
          </Link>
        ))}
      </nav>

      {viewing !== null && real.length > 0 && (
        <PhotoViewer photos={real} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />
      )}
    </main>
  );
}
