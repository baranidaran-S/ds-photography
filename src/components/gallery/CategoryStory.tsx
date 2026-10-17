"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { ALBUM_PAGE, shownOf, type ShownPhoto } from "@/lib/album";
import type { StoryView } from "@/lib/storyView";
import { useEnquiry } from "@/components/providers/SiteProvider";
import { ArrowIcon } from "@/components/ui/icons";
import { FocusMark } from "@/components/ui/ornaments";
import { PhotoViewer } from "./PhotoViewer";
import { SCREENS, warmPhotos } from "./preload";

const pad = (n: number) => String(n).padStart(2, "0");

// The last photos are placed together, trying every way, so the columns end together: this many
// for two columns, or for three (a few thousand ways each, which takes a moment)
const LAST_FEW = { 2: 12, 3: 8 } as Record<number, number>;

type Page = { photos: { id: string; src: string; width: number; height: number }[]; more: boolean };

/** Shares the photos out across the columns: the first row in order, left to right; then each to
    whichever column is shortest so far; and, once the last of them are in (`settledFrom` is where
    the last batch starts; null while more may come), the last few of that batch wherever leaves
    the columns' ends most even (each next photo alone can't see the ones still to come, so a run
    of tall photos at the end would otherwise leave one column short). Each photo's place depends
    only on the ones before it, so "Show more" only ever adds photos at the bottom of the columns,
    never moving one already showing */
function columnsOf(photos: ShownPhoto[], cols: number, settledFrom: number | null) {
  // each photo's height for a column one unit wide, and the gap under it
  const tall = photos.map((p) => p.h / p.w + 0.04);
  const heights: number[] = Array(cols).fill(0);
  const place: number[] = [];
  const firstRow = Math.min(cols, photos.length);
  const last =
    settledFrom === null ? 0 : Math.max(0, Math.min(photos.length - Math.max(firstRow, settledFrom), LAST_FEW[cols] ?? 8));
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

/* A kind of shoot's page: one album of all its photos, not one couple's or family's story.
   - a band with its cover photo whole in the middle, over soft cream silk (none yet: a faint frame)
   - its name (and its Tamil or traditional name), and how many photos
   - its photos, newest first, each whole at its own shape: the first ones come with the page and
     "Show more" fetches the next (they start coming as the button comes near, so they're there
     when it's pressed); tap one to see it full-screen, and step through them there
   - an invitation to book, and the kinds either side (the breadcrumb leads back to the category)
   With no photos yet it says they're coming; with no other kind in its category, there's no
   Previous / Next. */
export function CategoryStory({ view }: { view: StoryView }) {
  const { category, kind, cover, total, prev, next } = view;
  const root = useRef<HTMLElement>(null);
  const enquire = useEnquiry();
  const [viewing, setViewing] = useState<number | null>(null);
  const [photos, setPhotos] = useState(view.photos);
  const [more, setMore] = useState(view.more);
  const [settledFrom, setSettledFrom] = useState<number | null>(view.more ? null : 0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const real: ShownPhoto[] = photos.filter((p) => p.src);
  const photoCount = total;
  const showing = photos.length;

  // phones two columns, tablets and computers three; each only shows on its own screen size,
  // and only its photos that are showing load
  const layouts = useMemo(
    () => [
      { key: "phone", show: "flex md:hidden", sizes: "50vw", columns: columnsOf(photos, 2, settledFrom) },
      {
        key: "wide",
        show: "hidden md:flex",
        sizes: "(min-width: 1320px) 410px, 33vw",
        columns: columnsOf(photos, 3, settledFrom),
      },
    ],
    [photos, settledFrom],
  );

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // (arriving, the photo, the name and the count rise in by themselves from the CSS,
      // .rise-in, so they show without waiting for this)
      window.__dsReady = true;
      if (reduce) return;

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
    if (showing > ALBUM_PAGE) ScrollTrigger.refresh();
  }, [showing]);

  // the next photos, fetched once (as "Show more" comes near, or when it's pressed)
  const lastId = photos.at(-1)?.id ?? "";
  const nextPage = useRef<{ after: string; page: Promise<Page> } | null>(null);
  const fetchNext = () => {
    if (nextPage.current?.after !== lastId) {
      const page = fetch(`/api/gallery/photos?sub=${kind.id}&before=${lastId}`).then((r) =>
        r.ok ? (r.json() as Promise<Page>) : Promise.reject(new Error("not loaded")),
      );
      // (a failed fetch is tried again next time)
      page.catch(() => (nextPage.current = null));
      nextPage.current = { after: lastId, page };
    }
    return nextPage.current.page;
  };

  // as "Show more" comes near, the next photos start downloading, so they're there when it's pressed
  const moreBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = moreBox.current;
    if (!el || !more) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const sizes = layouts.find((l) => l.key === (matchMedia(SCREENS.phone).matches ? "phone" : "wide"))!.sizes;
        fetchNext()
          .then((page) => warmPhotos(page.photos.map((p) => ({ src: p.src, sizes }))))
          .catch(() => {});
      },
      { rootMargin: "1000px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  });

  async function showMore() {
    setLoading(true);
    setFailed(false);
    try {
      const page = await fetchNext();
      const start = photos.length;
      setPhotos([...photos, ...page.photos.map((p, i) => shownOf(p, kind.name, start + i + 1))]);
      setMore(page.more);
      if (!page.more) setSettledFrom(start);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const open = (src: string) => setViewing(real.findIndex((p) => p.src === src));

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
        <FocusMark className="h-5 w-8 text-accent/30" />
      </div>
    );

  return (
    <main ref={root} aria-labelledby="sf-title" className="light-page relative bg-cream text-ink">
      {/* ── The opening band: its photo whole, over soft cream silk (one picture for every kind) ── */}
      <section
        className="sf-hero relative sm:h-[calc(62svh+1rem)] sm:min-h-[416px] lg:h-[calc(74svh+2.5rem)] lg:max-h-[900px]"
        style={{ "--r": cover ? cover.w / cover.h : 1.5 } as React.CSSProperties}
      >
        {/* (the band clips the silk, not the photo, so the photo's shadow falls softly onto the page) */}
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          {/* (the largest thing on the first screen, so it's asked for first and shows as it lands) */}
          <Image
            src="/images/gallery/event-bg.jpg"
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="sf-hero-bg object-cover"
          />
        </div>
        <div aria-hidden className="sf-hero-veil absolute inset-0" />
        {/* (starts a clear gap below the menu bar: 99px tall, 120px on computers) */}
        <div className="sf-hero-stage absolute inset-x-4 top-30 bottom-4 sm:inset-x-8 sm:top-32 sm:bottom-6 lg:top-38">
          <div
            className="sf-hero-photo rise-in relative overflow-hidden rounded-[12px] shadow-[0_30px_70px_-30px_rgb(60_30_15/0.6)] ring-1 ring-ink/10 lg:rounded-[16px]"
          >
            {cover ? (
              <Image
                src={cover.src}
                alt={cover.alt}
                fill
                sizes="(max-width: 1023px) 92vw, 70vw"
                loading="eager"
                fetchPriority="high"
                className="object-cover"
                style={{ objectPosition: cover.position }}
              />
            ) : (
              // no photo yet: a faint focus frame
              <span className="absolute inset-0 grid place-items-center bg-[#ece3d4]">
                <FocusMark className="h-12 w-16 text-accent/30" />
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Its name, and how many photos ── */}
      <section className="mx-auto max-w-[1180px] px-4 pt-8 text-center sm:px-8 lg:pt-12">
        <nav
          aria-label="Breadcrumb"
          className="rise-in flex flex-wrap items-center justify-center gap-2.5 font-mono text-[0.62rem] tracking-[0.18em] text-ink/55 uppercase"
          style={{ "--d": "0.3s" } as React.CSSProperties}
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
          id="sf-title"
          className="rise-in mt-5 font-display text-[clamp(2.5rem,7vw,5.75rem)] leading-[1.02]"
          style={{ "--d": "0.4s" } as React.CSSProperties}
        >
          {kind.name}
        </h1>
        {kind.local && (
          <p
            className="rise-in mt-3 font-display text-[clamp(1.15rem,2.2vw,1.7rem)] text-ink/50"
            style={{ "--d": "0.48s" } as React.CSSProperties}
          >
            {kind.local}
          </p>
        )}
        <div
          aria-hidden
          className="rise-in mt-7 flex items-center justify-center gap-3.5 text-[#c9a35f]"
          style={{ "--d": "0.55s" } as React.CSSProperties}
        >
          <i className="h-px w-14 bg-gradient-to-l from-current to-transparent" />
          <span className="text-[0.6rem]">&#9670;</span>
          <i className="h-px w-14 bg-gradient-to-r from-current to-transparent" />
        </div>
        <p
          className="rise-in mt-4 font-mono text-[0.62rem] tracking-[0.2em] text-ink/55 uppercase"
          style={{ "--d": "0.6s" } as React.CSSProperties}
        >
          {photoCount ? <>{pad(photoCount)} photos &middot; tap one to open</> : "Photos coming soon"}
        </p>
      </section>

      {/* ── Every photo, a page at a time (none yet: the line above says they're coming) ── */}
      {photos.length > 0 && (
        <section aria-label={`${kind.name} photos`} className="mx-auto max-w-[1320px] px-3 pt-10 sm:px-6 lg:px-12 lg:pt-14">
          {layouts.map((l) => (
            <div key={l.key} className={`${l.show} items-start gap-2 sm:gap-3 lg:gap-5`}>
              {l.columns.map((column, c) => (
                <div key={c} className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3 lg:gap-5">
                  {column.map((i) => (
                    <div
                      key={photos[i].id ?? i}
                      className={i < ALBUM_PAGE ? "sf-tile" : "sf-pop"}
                      // (added photos float in one after another)
                      style={i < ALBUM_PAGE ? undefined : { animationDelay: `${((i - ALBUM_PAGE) % ALBUM_PAGE) * 40}ms` }}
                    >
                      {photo(photos[i], l.sizes)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          {more && (
            <div ref={moreBox} className="mt-10 flex flex-col items-center gap-4 lg:mt-14">
              <p className="font-mono text-[0.62rem] tracking-[0.2em] text-ink/55 uppercase">
                {failed ? "Couldn't load more just now" : `Showing ${showing} of ${photoCount}`}
              </p>
              <button
                type="button"
                onClick={showMore}
                disabled={loading}
                className="inline-flex items-center gap-3 rounded-full border border-accent-deep/40 px-7 py-3.5 font-heading text-[0.7rem] font-semibold tracking-[0.2em] text-accent-deep uppercase transition-colors duration-500 hover:border-accent-deep hover:bg-accent-deep hover:text-cream"
              >
                {loading ? "Loading…" : failed ? "Try again" : "Show more photos"}
                <ArrowIcon className="size-3.5 rotate-90" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── An invitation ── */}
      <section className="mx-auto max-w-[1320px] px-5 pt-24 pb-14 sm:px-8 lg:px-12 lg:pt-32 lg:pb-16">
        <div className="sf-rise gc-ask relative overflow-hidden rounded-[22px] px-6 py-14 text-center ring-1 ring-ink/10 sm:px-12 lg:py-20">
          <FocusMark className="mx-auto mb-6 h-6 w-10 text-accent" />
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
      {prev.slug !== kind.slug && (
        <nav
          aria-label="More kinds of shoot"
          className="mx-auto grid max-w-[1320px] grid-cols-2 gap-3 px-4 pb-16 sm:gap-5 sm:px-8 lg:px-12 lg:pb-24"
        >
          {(
            [
              [prev, "Previous", "rotate-180", "items-start sm:flex-row"],
              [next, "Next", "", "col-start-2 items-end text-right sm:flex-row-reverse"],
            ] as const
          )
            // (with only two kinds, the one either side is the same: just Next)
            .filter(([to, word]) => word === "Next" || to.slug !== next.slug)
            .map(([to, word, turn, side]) => (
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
      )}

      {viewing !== null && real.length > 0 && (
        <PhotoViewer photos={real} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />
      )}
    </main>
  );
}
