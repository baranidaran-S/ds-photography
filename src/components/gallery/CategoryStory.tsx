"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import type { ShownPhoto, StoryView } from "@/lib/storyView";
import { photos as sitePhotos } from "@/content/photos";
import { useEnquiry } from "@/components/providers/SiteProvider";
import { ArrowIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";
import { PhotoViewer } from "./PhotoViewer";

const pad = (n: number) => String(n).padStart(2, "0");

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

/* A story page:
   - the cover photo fills the screen with their names
   - the facts of the day on a card resting on the cover's edge
   - their photos, each whole at its own shape (three columns on computers, two on phones);
     tap one to see it full-screen
   - their experience of our team in their own words (the description in stories.ts), beside
     who photographed it; that side is the same on every page
   - an invitation to book, and the kinds either side (the breadcrumb at the top leads back to
     the category)
   Photos come from the kind's folder and words from stories.ts; anything missing arrives as a
   placeholder (storyView.ts). */
export function CategoryStory({ view }: { view: StoryView }) {
  const { category, kind, story, prev, next } = view;
  const root = useRef<HTMLElement>(null);
  const enquire = useEnquiry();
  const [viewing, setViewing] = useState<number | null>(null);

  // the viewer steps through the photos in the grid (the cover is just the page's opening)
  const real: ShownPhoto[] = story.photos.filter((p) => p.src);
  const photoCount = real.length;

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      gsap.set(q("[data-reveal]"), { autoAlpha: 1 });
      window.__dsReady = true;
      if (reduce) return;

      /* ── Arriving: the cover settles, their names rise, the facts card lifts into place ── */
      const split = SplitText.create(q(".sf-names"), {
        type: "words",
        mask: "words",
      });
      gsap.set(split.masks, {
        paddingBottom: "0.14em",
        marginBottom: "-0.14em",
      });
      gsap
        .timeline({ delay: 0.1, defaults: { ease: "expo.out" } })
        .from(q(".sf-cover-img"), { scale: 1.15, duration: 2.4 }, 0)
        .from(
          q(".sf-crumbs, .sf-eyebrow"),
          { autoAlpha: 0, y: 14, duration: 0.9, stagger: 0.08 },
          0.3,
        )
        .from(split.words, { yPercent: 115, duration: 1.3, stagger: 0.1 }, 0.4)
        .from(q(".sf-when"), { autoAlpha: 0, y: 16, duration: 1 }, 0.8)
        .from(q(".sf-facts"), { autoAlpha: 0, y: 50, duration: 1.3 }, 0.9);

      /* ── Photos and text float up as they come into view ── */
      ScrollTrigger.batch(q(".sf-tile"), {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.from(batch, {
            autoAlpha: 0,
            y: 40,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.08,
          }),
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

  const open = (src: string) =>
    setViewing(real.findIndex((p) => p.src === src));

  /** A photo at its own shape, or an empty frame where one will go */
  const photo = (p: ShownPhoto, sizes: string, className = "") =>
    p.src ? (
      <button
        type="button"
        onClick={() => open(p.src)}
        aria-label={`Open photo: ${p.caption ?? p.alt}`}
        className={`group relative block w-full cursor-zoom-in overflow-hidden rounded-[10px] bg-[#141111] lg:rounded-[14px] ${className}`}
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
        className={`gc-blank grid place-items-center rounded-[10px] ring-1 ring-cream/10 lg:rounded-[14px] ${className}`}
        style={{ aspectRatio: `${p.w} / ${p.h}` }}
      >
        <LotusMark className="h-5 w-8 text-brand/35" />
      </div>
    );

  return (
    <main
      ref={root}
      aria-labelledby="sf-names"
      className="relative bg-night text-cream"
    >
      {/* ── The cover ── */}
      <section className="relative h-svh overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={story.cover.src}
            alt={story.cover.alt}
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="sf-cover-img object-cover"
            style={{ objectPosition: story.cover.position }}
          />
        </div>
        <div className="sf-shade pointer-events-none absolute inset-0" />

        <div className="pointer-events-none absolute inset-0 flex flex-col">
          <nav
            aria-label="Breadcrumb"
            data-reveal
            className="sf-crumbs pointer-events-auto mx-auto flex w-full max-w-[1320px] flex-wrap items-center gap-2.5 px-5 pt-24 font-mono text-[0.62rem] tracking-[0.18em] text-cream/80 uppercase sm:px-8 sm:pt-28 lg:px-12 lg:pt-32"
          >
            <Link
              href="/gallery"
              className="transition-colors hover:text-brand-light"
            >
              Gallery
            </Link>
            <span aria-hidden>/</span>
            <Link
              href={`/gallery/${category.slug}`}
              className="transition-colors hover:text-brand-light"
            >
              {category.name}
            </Link>
            <span aria-hidden>/</span>
            <span aria-current="page" className="text-cream">
              {kind.name}
            </span>
          </nav>
          <div className="mt-auto px-5 pb-32 text-center sm:px-8 lg:pb-36">
            <p
              data-reveal
              className="sf-eyebrow mb-4 font-heading text-[0.68rem] font-semibold tracking-[0.3em] text-brand-light uppercase sm:text-[0.74rem]"
            >
              {kind.name}
              {kind.local ? ` · ${kind.local}` : ""}
            </p>
            <h1
              id="sf-names"
              data-reveal
              className="sf-names font-display text-[clamp(2.8rem,10vw,9rem)] leading-[0.98]"
            >
              {story.names}
            </h1>
            <p
              data-reveal
              className="sf-when mt-5 font-mono text-[0.68rem] tracking-[0.2em] text-cream/85 uppercase"
            >
              {story.date} &middot; {story.place}
            </p>
          </div>
        </div>
      </section>

      {/* ── The facts of the day, resting on the cover's edge ── */}
      <section className="relative z-10 mx-auto -mt-20 max-w-[1180px] px-4 sm:px-8">
        <dl
          data-reveal
          className="sf-facts grid grid-cols-2 gap-px overflow-hidden rounded-[20px] bg-brand/15 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] ring-1 ring-brand/25 sm:grid-cols-3"
        >
          {(
            [
              ["when", "When", story.date],
              ["where", "Where", story.place],
              [
                "shoot",
                "The shoot",
                kind.local ? `${kind.name} (${kind.local})` : kind.name,
              ],
            ] as const
          ).map(([icon, term, value]) => (
            <div
              key={term}
              // (phones: the shoot runs the full width under the other two)
              className="flex gap-3.5 bg-[#141010] px-4 py-5 last:col-span-2 sm:px-6 sm:py-6 sm:last:col-span-1"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 size-5 shrink-0 text-brand"
              >
                {FACT_ICONS[icon]}
              </svg>
              <div className="min-w-0">
                <dt className="font-mono text-[0.58rem] tracking-[0.2em] text-cream/50 uppercase">
                  {term}
                </dt>
                <dd className="mt-1.5 font-display text-[clamp(1rem,1.5vw,1.25rem)] leading-[1.35]">
                  {value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Their photos ── */}
      <section
        aria-labelledby="sf-photos"
        className="mx-auto max-w-[1320px] px-3 pt-16 sm:px-6 lg:px-12 lg:pt-24"
      >
        <div className="sf-rise mb-6 flex items-end justify-between gap-4 px-2 sm:px-0 lg:mb-10">
          <h2
            id="sf-photos"
            className="font-display text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.1]"
          >
            The <span className="foil">photos</span>
          </h2>
          <p className="pb-1 font-mono text-[0.62rem] tracking-[0.2em] text-cream/55 uppercase">
            {pad(photoCount)} photos &middot; tap to open
          </p>
        </div>
        <div className="columns-2 gap-2 sm:gap-3 lg:columns-3 lg:gap-5">
          {story.photos.map((p, i) => (
            <div
              key={i}
              className="sf-tile mb-2 break-inside-avoid sm:mb-3 lg:mb-5"
            >
              {photo(p, "(max-width: 1023px) 50vw, 420px")}
            </div>
          ))}
        </div>
      </section>

      {/* ── Their experience of our team: the left side is the same on every page, the words
         beside it are this kind's description (stories.ts) ── */}
      <section className="sf-band mt-20 border-y border-cream/10 lg:mt-28">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-28">
          <div className="sf-rise lg:col-span-5">
            <p className="flex items-center gap-3 font-heading text-[0.68rem] font-semibold tracking-[0.3em] text-brand-light uppercase">
              <LotusMark className="h-4 w-6 text-accent" />
              Their experience
            </p>
            <h2 className="mt-4 font-display text-[clamp(2.1rem,3.8vw,3.4rem)] leading-[1.08]">
              What it was like with <span className="foil">our team</span>
            </h2>
            {/* who photographed it */}
            <div className="mt-8 flex items-center gap-4">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-full ring-1 ring-brand/50">
                <Image
                  src={sitePhotos.about.portrait.src}
                  alt={sitePhotos.about.portrait.alt}
                  fill
                  sizes="56px"
                  className="object-cover"
                  style={{
                    objectPosition: sitePhotos.about.portrait.position,
                  }}
                />
              </span>
              <span>
                <span className="block font-mono text-[0.58rem] tracking-[0.2em] text-cream/50 uppercase">
                  Photographed by
                </span>
                <span className="mt-1 block font-display text-[1.2rem]">
                  Sivakumar &amp; team
                </span>
                <span
                  className="mt-1 block text-[0.85rem] tracking-[0.25em] text-brand"
                  aria-label="Rated 5 out of 5"
                >
                  ★★★★★
                </span>
              </span>
            </div>
          </div>
          <div className="sf-rise space-y-6 text-[1.02rem] leading-[1.9] text-cream/80 lg:col-span-7 lg:text-[1.08rem]">
            {story.description.map((para, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "font-display text-[clamp(1.25rem,1.9vw,1.6rem)] leading-[1.6] text-cream"
                    : undefined
                }
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── An invitation ── */}
      <section className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="sf-rise gc-ask relative overflow-hidden rounded-[22px] px-6 py-14 text-center ring-1 ring-cream/10 sm:px-12 lg:py-20">
          <LotusMark className="mx-auto mb-6 h-6 w-10 text-accent" />
          <h2 className="font-display text-[clamp(2.2rem,5.4vw,4.6rem)] leading-[1.05]">
            Your story could be <span className="foil">next</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-[1rem] leading-[1.8] text-cream/75">
            Tell us your date and what you&rsquo;re celebrating, and we&rsquo;ll
            check we&rsquo;re free.
          </p>
          <button
            type="button"
            onClick={() => enquire({ source: "gallery-story" })}
            className="mt-9 inline-flex items-center gap-3 rounded-full bg-brand px-7 py-3.5 font-heading text-[0.7rem] font-semibold tracking-[0.2em] text-night uppercase transition-colors duration-500 hover:bg-brand-light"
          >
            Check your date
            <ArrowIcon className="size-3.5" />
          </button>
        </div>
      </section>

      {/* ── The kinds either side (the breadcrumb at the top leads back to the category) ── */}
      <nav
        aria-label="More kinds of shoot"
        className="mx-auto grid max-w-[1320px] grid-cols-2 gap-3 border-t border-cream/15 px-5 pt-8 pb-16 sm:gap-4 sm:px-8 lg:px-12 lg:pb-24"
      >
        <Link
          href={`/gallery/${category.slug}/${prev.slug}`}
          className="group block"
        >
          <span className="block font-mono text-[0.62rem] tracking-[0.18em] text-cream/55 uppercase">
            &larr; Previous
          </span>
          <span className="mt-2 block font-display text-[clamp(1.15rem,2.2vw,1.8rem)] transition-colors duration-500 group-hover:text-brand-light">
            {prev.name}
          </span>
        </Link>
        <Link
          href={`/gallery/${category.slug}/${next.slug}`}
          className="group block text-right"
        >
          <span className="block font-mono text-[0.62rem] tracking-[0.18em] text-cream/55 uppercase">
            Next &rarr;
          </span>
          <span className="mt-2 block font-display text-[clamp(1.15rem,2.2vw,1.8rem)] transition-colors duration-500 group-hover:text-brand-light">
            {next.name}
          </span>
        </Link>
      </nav>

      {viewing !== null && real.length > 0 && (
        <PhotoViewer
          photos={real}
          index={viewing}
          onIndex={setViewing}
          onClose={() => setViewing(null)}
        />
      )}
    </main>
  );
}
