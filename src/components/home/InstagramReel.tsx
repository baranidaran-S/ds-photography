"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import type { Photo } from "@/content/photos";
import { ArrowIcon } from "@/components/ui/icons";
import { FocusMark } from "@/components/ui/ornaments";
import type { SectionHeading } from "@/content/db";

/* A "bento" grid: photos of different sizes fitted together, with the Follow tile as one of them.
   On phones it's two columns; from tablets up, four columns and three rows:
     ┌───────┬───┬───┐
     │   1   │ 2 │   │
     │       ├───┤ 3 │
     │       │ 4 │   │
     ├───┬───┴───┼───┤
     │ 5 │   6   │ ♥ │  ← Follow us
     └───┴───────┴───┘
   `sizes` tells the browser how wide each photo is drawn, so it downloads a big enough copy. A
   wide (landscape) photo in a tall or square spot is cropped at the sides, so it's drawn wider
   than the spot itself: these allow for photos up to 16:9, so any photo stays sharp.          */
const SMALL = "(min-width: 1320px) 430px, (min-width: 1024px) 33vw, (min-width: 768px) 29vw, 70vw";
const SPOTS = [
  { className: "col-span-2 aspect-[4/3] md:aspect-auto md:row-span-2", sizes: "(min-width: 1320px) 860px, (min-width: 1024px) 66vw, (min-width: 768px) 58vw, 100vw" },
  { className: "aspect-square md:aspect-auto", sizes: SMALL },
  { className: "aspect-square md:aspect-auto md:row-span-2", sizes: "(min-width: 1320px) 860px, (min-width: 1024px) 66vw, (min-width: 768px) 58vw, 70vw" },
  { className: "aspect-square md:aspect-auto", sizes: SMALL },
  { className: "aspect-square md:aspect-auto", sizes: SMALL },
  { className: "col-span-2 aspect-[2/1] md:aspect-auto", sizes: "(min-width: 1320px) 612px, (min-width: 1024px) 47vw, (min-width: 768px) 50vw, 100vw" },
];

export type InstagramTile = Photo & { likes?: string };
type InstagramMeta = { handle: string; url: string };

function InstagramGlyph({ className = "size-5", strokeWidth = 1.7 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    >
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Tile({
  photo,
  spot,
  instagram,
}: {
  photo: InstagramTile;
  spot: (typeof SPOTS)[number];
  instagram: InstagramMeta;
}) {
  return (
    <a
      href={instagram.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${photo.alt}, on Instagram`}
      className={`ig-tile group relative block overflow-hidden rounded-[14px] border border-cream/8 bg-cream/5 ${spot.className}`}
    >
      {/* the entrance zoom moves this wrapper; the hover zoom moves the photo inside it */}
      <div className="ig-zoom absolute inset-0">
        <Image
          src={photo.src}
          alt=""
          fill
          sizes={spot.sizes}
          className="object-cover transition-transform duration-[1.2s] ease-luxe group-hover:scale-[1.06]"
          style={{ objectPosition: photo.position }}
        />
      </div>
      {/* on hover: the photo dims and the Instagram mark and likes appear */}
      <span
        aria-hidden
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-night/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <span className="grid size-14 scale-90 place-items-center rounded-full border border-brand-light/50 bg-night/60 text-brand-light transition-transform duration-500 group-hover:scale-100">
          <InstagramGlyph className="size-6" />
        </span>
        {photo.likes && (
          <span className="flex items-center gap-1.5 font-heading text-[0.78rem] font-semibold tracking-[0.06em] text-cream">
            <svg viewBox="0 0 24 24" className="size-4 fill-current">
              <path d="M12 20.6s-7.6-4.6-9.4-9.4C1.4 7.9 3.6 4.6 7 4.6c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.3 4.4 6.6-1.8 4.8-9.4 9.4-9.4 9.4Z" />
            </svg>
            {photo.likes}
          </span>
        )}
      </span>
    </a>
  );
}

export function InstagramReel({
  photos,
  instagram,
  meta,
  backdrop,
}: {
  photos: InstagramTile[];
  instagram: InstagramMeta;
  meta: SectionHeading;
  backdrop: Photo;
}) {
  const root = useRef<HTMLElement>(null);
  // the grid has six photo spots; any more photos in the admin are left out
  const shown = photos.slice(0, SPOTS.length);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const q = gsap.utils.selector(el);

      /* ── Heading rises word by word ── */
      const split = SplitText.create(q(".ig-title"), {
        type: "words",
        mask: "words",
        ignore: q(".ig-foil-mask"),
      });
      gsap.set(split.masks, {
        paddingBottom: "0.12em",
        marginBottom: "-0.12em",
      });
      gsap
        .timeline({
          scrollTrigger: { trigger: el, start: "top 78%", once: true },
          defaults: { ease: "expo.out" },
        })
        .from(q(".ig-eyebrow"), { autoAlpha: 0, y: 16, duration: 0.9 }, 0)
        .from(split.words, { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.1)
        .from(q(".ig-foil"), { yPercent: 115, duration: 1.1 }, 0.35);

      /* ── The tiles appear one by one, each photo settling from a soft zoom (once only, so
         nothing moves while the page is still) ── */
      gsap
        .timeline({
          scrollTrigger: { trigger: q(".ig-grid")[0], start: "top 82%", once: true },
          defaults: { ease: "expo.out" },
        })
        .from(q(".ig-tile"), { autoAlpha: 0, y: 40, duration: 1.3, stagger: 0.09 }, 0)
        .from(q(".ig-zoom"), { scale: 1.15, duration: 1.8, stagger: 0.09 }, 0);
    },
    { scope: root },
  );

  return (
    <section
      id="instagram"
      ref={root}
      aria-labelledby="instagram-title"
      // on computers the section is exactly one screen tall: the heading takes what it needs and
      // the grid fills the rest, keeping its shape (on short screens it gets narrower, not squashed)
      className="relative overflow-hidden bg-night py-24 text-cream lg:flex lg:h-svh lg:min-h-[36rem] lg:flex-col lg:py-[5svh]"
    >
      {/* Background image (photos.ts → instagramBackdrop, unless the admin has set one); plain
          dark without one */}
      {backdrop.src && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src={backdrop.src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: backdrop.position }}
          />
        </div>
      )}

      <div className="relative mx-auto max-w-[1320px] px-5 text-center sm:px-8 lg:shrink-0">
        <p className="ig-eyebrow mb-5 flex items-center justify-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-brand-light uppercase lg:mb-[1.8svh]">
          <FocusMark className="h-4 w-6 text-accent" />
          {meta.eyebrow}
        </p>
        <h2
          id="instagram-title"
          className="ig-title font-display text-[clamp(2.2rem,4.4vw,4rem)] leading-[1.06] lg:text-[clamp(2rem,min(4.4vw,7svh),4rem)]"
        >
          {meta.title}{" "}
          <span className="ig-foil-mask -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
            <span className="ig-foil foil inline-block">{meta.titleFoil}</span>
          </span>
        </h2>
      </div>

      {/* on computers this box fills the rest of the screen, and the grid inside takes its height
          and works out its width from its shape */}
      <div className="relative mx-auto mt-12 w-full max-w-[1320px] px-5 sm:px-8 lg:mt-[4svh] lg:flex lg:min-h-0 lg:flex-1 lg:justify-center lg:px-12">
        <div className="ig-grid grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 md:grid-rows-[repeat(3,clamp(10rem,16vw,14.5rem))] md:gap-3.5 lg:aspect-[1224/718] lg:h-full lg:max-w-full lg:grid-rows-3">
          {shown.map((photo, i) => (
            <Tile key={`${i}-${photo.src}`} photo={photo} spot={SPOTS[i]} instagram={instagram} />
          ))}

          {/* Follow tile: a wide bar on phones (icon, name, arrow in a row); from tablets up the last
              square of the grid (icon and arrow along the top, the name along the bottom, sized to
              the tile so it always fits) */}
          <a
            href={instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ig-tile group @container relative col-span-2 flex items-center gap-4 overflow-hidden rounded-[14px] border border-brand/45 bg-[#141110] p-4 md:col-span-1 md:grid md:grid-cols-[auto_1fr_auto] md:grid-rows-[auto_1fr] md:gap-0 md:p-[clamp(0.85rem,2.2svh,1.5rem)]"
          >
            <span aria-hidden className="ig-follow-glow absolute inset-0" />
            {/* the real Instagram app icon: a rounded square in its own colours, white camera */}
            <span className="ig-brand relative grid size-11 shrink-0 place-items-center rounded-[28%] text-white shadow-[0_6px_18px_-6px_rgba(214,36,159,0.55)] md:col-start-1 md:row-start-1 md:size-[clamp(2.4rem,18cqw,3rem)]">
              <InstagramGlyph className="size-[80%]" strokeWidth={2} />
            </span>
            <span className="relative min-w-0 flex-1 leading-tight md:col-span-3 md:row-start-2 md:self-end">
              <span className="block font-heading text-[0.62rem] font-semibold tracking-[0.24em] text-brand-light uppercase">
                Follow us
              </span>
              <span className="mt-1.5 block truncate font-display text-[1.15rem] md:text-[clamp(0.85rem,9cqw,1.4rem)]">
                @{instagram.handle}
              </span>
            </span>
            <span className="relative grid size-10 shrink-0 place-items-center rounded-full border border-cream/30 transition duration-500 group-hover:border-cream group-hover:bg-cream group-hover:text-night md:col-start-3 md:row-start-1 md:size-[clamp(2.2rem,15cqw,2.6rem)]">
              <ArrowIcon className="size-4" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
