"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import type { GalleryCategory } from "@/content/gallery";
import { useEnquiry } from "@/components/providers/SiteProvider";
import { ChatIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";
import { KindsBand } from "./KindsBand";
import { followPointer } from "./pointer";

/* The bento: tiles of different sizes fitting together. Phones: two columns, the big tiles
   spanning both. Tablets and up: four columns, every row the same height.
   By category order — the first four get the large spots, the rest are small tiles. */
const SPOTS = [
  { tile: "col-span-2 aspect-[4/3] md:aspect-auto md:row-span-2", size: "big" },
  { tile: "aspect-[3/4] md:aspect-auto md:row-span-2", size: "tall" },
  { tile: "aspect-[3/4] md:aspect-auto md:row-span-2", size: "tall" },
  { tile: "col-span-2 aspect-[2/1] md:aspect-auto", size: "wide" },
] as const;
const SMALL = { tile: "aspect-square md:aspect-auto", size: "small" } as const;

const NAME_SIZE = {
  big: "text-[clamp(1.9rem,3.6vw,3.4rem)]",
  tall: "text-[clamp(1.35rem,2.2vw,2rem)]",
  wide: "text-[clamp(1.35rem,2.2vw,2rem)]",
  small: "text-[clamp(1.1rem,1.6vw,1.45rem)]",
};
const PHOTO_SIZES = {
  big: "(min-width: 1320px) 612px, (min-width: 768px) 50vw, 100vw",
  tall: "(min-width: 1320px) 306px, (min-width: 768px) 25vw, 50vw",
  wide: "(min-width: 1320px) 612px, (min-width: 768px) 50vw, 100vw",
  small: "(min-width: 1320px) 306px, (min-width: 768px) 25vw, 50vw",
};

const tileBase =
  "gc-tile group relative overflow-hidden rounded-[18px] bg-[#141111] ring-1 ring-cream/10 md:rounded-[22px] md:hover:-translate-y-1";

export function GalleryBento({ categories }: { categories: GalleryCategory[] }) {
  const root = useRef<HTMLElement>(null);
  const enquire = useEnquiry();

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const tiles = q<HTMLElement>(".gc-tile");

      // the tiles start hidden, then everything waiting on [data-reveal] is handed to GSAP
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) gsap.set(tiles, { autoAlpha: 0, y: 50, scale: 0.94 });
      gsap.set(q("[data-reveal]:not(.gc-tile)"), { autoAlpha: 1 });
      if (reduce) gsap.set(tiles, { autoAlpha: 1 });
      window.__dsReady = true;

      /* ── Touch screens have no hover: the tile crossing the middle of the screen lights up as
         if it were hovered (the group-data-lit classes below, and globals.css) ── */
      const mm = gsap.matchMedia();
      mm.add("(hover: none), (pointer: coarse)", () => {
        tiles.forEach((t) =>
          ScrollTrigger.create({
            trigger: t,
            start: "top 50%",
            end: "bottom 50%",
            onToggle: (self) => t.toggleAttribute("data-lit", self.isActive),
          }),
        );
        return () => tiles.forEach((t) => t.removeAttribute("data-lit"));
      });
      if (reduce) return;

      /* ── Heading rises, as in every section of the site ── */
      const split = SplitText.create(q(".gc-title"), {
        type: "words",
        mask: "words",
        ignore: q(".gc-foil-mask"),
      });
      gsap.set(split.masks, { paddingBottom: "0.12em", marginBottom: "-0.12em" });
      gsap
        .timeline({ delay: 0.2, defaults: { ease: "expo.out" } })
        .from(q(".gc-eyebrow"), { autoAlpha: 0, y: 16, duration: 0.9 }, 0)
        .from(split.words, { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.1)
        .from(q(".gc-foil"), { yPercent: 115, duration: 1.1 }, 0.38)
        .from(q(".gc-intro"), { autoAlpha: 0, y: 20, duration: 1 }, 0.4);

      /* ── Tiles float up into place as they come into view, the photos settling inside them ── */
      const reveal = (batch: Element[]) =>
        gsap
          .timeline()
          .to(batch, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: "expo.out", stagger: 0.09 })
          .fromTo(
            batch.flatMap((t) => [...t.querySelectorAll(".gc-photo")]),
            { scale: 1.2 },
            { scale: 1, duration: 1.8, ease: "expo.out", stagger: 0.09 },
            0,
          );
      // tiles already on screen or scrolled past (coming back to the page part-way down, or the
      // page reloading there) appear straight away: a scroll trigger behind them would never fire
      const line = window.innerHeight * 0.92;
      const waiting = tiles.filter((t) => t.getBoundingClientRect().top >= line);
      const inView = tiles.filter((t) => !waiting.includes(t));
      if (inView.length) reveal(inView);
      if (waiting.length) ScrollTrigger.batch(waiting, { start: "top 92%", once: true, onEnter: reveal });
      // re-measure once the fonts are in, as the heading above the grid can change height
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: root },
  );

  const categoryTile = (c: GalleryCategory, i: number) => {
    const spot: { tile: string; size: keyof typeof NAME_SIZE } = SPOTS[i] ?? SMALL;
    const kinds = c.subs.map((s) => s.name);
    // phones and tablets: the first one or two, then a count, so it fits the narrower tiles
    const few = spot.size === "small" ? 1 : 2;
    const fewKinds =
      kinds.length > few ? `${kinds.slice(0, few).join(" · ")} +${kinds.length - few} more` : kinds.join(" · ");
    return (
      <Link
        key={c.slug}
        href={`/gallery/${c.slug}`}
        data-reveal
        onPointerMove={followPointer}
        className={`${tileBase} ${spot.tile}`}
      >
        <span className="absolute inset-0 overflow-hidden">
          <span className="gc-photo absolute inset-0">
            <span className="absolute inset-0 transition-[scale] duration-[1.4s] ease-luxe group-hover:scale-[1.06] group-data-lit:scale-[1.06]">
              {c.cover.src ? (
                <Image
                  src={c.cover.src}
                  alt={c.cover.alt}
                  fill
                  sizes={PHOTO_SIZES[spot.size]}
                  loading={i < 3 ? "eager" : "lazy"}
                  className="object-cover"
                  style={{ objectPosition: c.cover.position }}
                />
              ) : (
                // no photo yet: warm light in the dark and a faint lotus
                <span className="gc-blank absolute inset-0">
                  {/* (it makes way for the kinds of shoot when they slide up) */}
                  <LotusMark className="absolute top-[40%] left-1/2 h-10 w-14 -translate-x-1/2 -translate-y-1/2 text-brand/30 transition-opacity duration-500 group-hover:opacity-0 group-data-lit:opacity-0 sm:h-12 sm:w-16" />
                </span>
              )}
            </span>
          </span>
        </span>
        <span aria-hidden className="gc-shade pointer-events-none absolute inset-0" />

        <span
          aria-hidden
          className="relative z-10 float-right m-3 grid size-8 place-items-center rounded-full border border-cream/35 text-[0.85rem] text-cream backdrop-blur-[2px] transition-[background-color,border-color,color,rotate] duration-500 ease-luxe group-hover:-rotate-45 group-hover:border-brand group-hover:bg-brand group-hover:text-night group-data-lit:-rotate-45 group-data-lit:border-brand group-data-lit:bg-brand group-data-lit:text-night sm:m-4 sm:size-10 md:m-5"
        >
          &rarr;
        </span>

        <span className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 md:p-6 lg:p-7">
          <span className="block font-mono text-[0.58rem] tracking-[0.16em] text-brand-light/90 uppercase sm:text-[0.64rem]">
            {c.cover.src ? `${c.subs.length} kinds of shoot` : "Photos coming soon"}
          </span>
          <span className={`mt-1.5 block font-display leading-[1.08] ${NAME_SIZE[spot.size]}`}>{c.name}</span>
          {/* the kinds of shoot slide up on hover, or on touch screens as the tile lights up */}
          <span className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-700 ease-luxe group-hover:grid-rows-[1fr] group-data-lit:grid-rows-[1fr]">
            <span className="overflow-hidden">
              <span className="block max-w-[46ch] pt-2.5 text-[0.76rem] leading-[1.6] text-cream/75 sm:text-[0.82rem] lg:pt-3 lg:text-[0.84rem] lg:leading-[1.65]">
                <span className="lg:hidden">{fewKinds}</span>
                <span className="hidden lg:inline">{kinds.join(" · ")}</span>
              </span>
            </span>
          </span>
        </span>
      </Link>
    );
  };

  return (
    <main
      ref={root}
      aria-labelledby="gallery-title"
      className="relative overflow-hidden bg-night pt-36 pb-6 text-cream sm:pt-40 lg:pt-44 lg:pb-8"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        {/* Heading */}
        <header className="mb-12 grid items-end gap-6 lg:mb-16 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p
              data-reveal
              className="gc-eyebrow mb-5 flex items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-brand-light uppercase"
            >
              <LotusMark className="h-4 w-6 text-accent" />
              Our gallery
            </p>
            <h1
              id="gallery-title"
              data-reveal
              className="gc-title font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.06]"
            >
              Every celebration, beautifully{" "}
              <span className="gc-foil-mask -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                <span className="gc-foil foil inline-block">framed</span>
              </span>
            </h1>
          </div>
          <p
            data-reveal
            className="gc-intro max-w-[44ch] text-[1rem] leading-[1.8] text-cream/65 lg:justify-self-end"
          >
            Weddings, family ceremonies and little ones. Pick a celebration to see the kinds of shoots
            inside it, and the families who let us in.
          </p>
        </header>

        <div className="gc-grid grid grid-cols-2 gap-3 sm:gap-4 md:auto-rows-[clamp(11rem,17vw,15.5rem)] md:grid-cols-4 md:gap-5">
          {categories.map(categoryTile)}

          {/* For anything that isn't here: beside Events on phones, the rest of the last row on computers */}
          <div
            data-reveal
            onPointerMove={followPointer}
            className={`${tileBase} gc-ask flex aspect-square flex-col justify-between p-4 sm:p-5 md:col-span-3 md:aspect-auto md:flex-row md:items-end md:gap-6 md:p-7`}
          >
            <LotusMark className="relative z-10 h-5 w-7 text-accent md:absolute md:top-7 md:left-7 md:h-6 md:w-9" />
            <span className="relative z-10 block">
              <span className="block font-display text-[clamp(1.15rem,2.2vw,2rem)] leading-tight">
                Don&rsquo;t see your celebration?
              </span>
              <span className="mt-2 hidden max-w-[34ch] text-[0.9rem] leading-[1.65] text-cream/65 md:block">
                We shoot more than what&rsquo;s here. Tell us what you&rsquo;re planning.
              </span>
            </span>
            <button
              type="button"
              onClick={() => enquire({ source: "gallery" })}
              className="btn-brand btn-sm relative z-10 self-start md:self-end"
            >
              <ChatIcon className="size-4" />
              Tell us
            </button>
          </div>
        </div>
      </div>

      {/* Every kind of shoot gliding past, edge to edge */}
      <KindsBand categories={categories} />
    </main>
  );
}
