"use client";

import Image from "next/image";
import Link from "next/link";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import type { GalleryCategory } from "@/content/gallery";
import { ArrowIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";

const pad = (n: number) => String(n).padStart(2, "0");

// Tiles going round: each kind at least once, more often for a category with only a few, so the
// tiles leaving one side are never the ones arriving on the other
const MIN_TILES = 6;
// scroll that turns the wheel by one kind of shoot, as a share of the screen's height
const SCROLL_PER_KIND = 0.5;

type Neighbour = { slug: string; name: string };

/* A category's page: a frame in the middle shows one kind of shoot at a time, and photo tiles of
   the other kinds sit round it on the arc of a wheel turning behind it (two each side on
   computers, one on phones; the rest wait out of sight). While the page is on screen it holds
   still and scrolling turns the wheel: the next tile climbs to the top, slips behind the frame and
   its photo opens out inside it. Dragging or swiping, the arrows, the progress bar and tapping a
   tile turn it too (by scrolling to the matching point, so scroll and wheel always agree). The
   frame opens that kind's stories. Sizes and the wheel's shape are CSS (globals.css → .cw-*). */
export function CategoryWheel({
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
  const tiles = Array.from(
    { length: count * Math.ceil(MIN_TILES / count) },
    (_, j) => j,
  );

  const [front, setFront] = useState(0);
  const frontRef = useRef(0);
  // The frame photos loaded so far: the one in the frame and those either side, so the next one
  // is ready when its turn comes, without loading every big photo up front (kept once loaded)
  const [wanted, setWanted] = useState<number[]>([0, 1]);
  const need = [front - 1, front, front + 1].filter(
    (i) => i >= 0 && i < count && !wanted.includes(i),
  );
  if (need.length) setWanted([...wanted, ...need]);
  // turns the wheel to a kind of shoot; replaced once the scroll scene is built
  const goRef = useRef<(i: number) => void>(() => {});
  // where a drag started, and whether the pointer moved far enough to count as one
  const drag = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  const lenisRef = useRef<Lenis | undefined>(undefined);
  const lenis = useLenis();
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const wheel = q<HTMLElement>(".cw-wheel")[0];
      const layers = q<HTMLElement>(".cw-layer");
      const tileEls = q<HTMLElement>(".cw-tile");
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      gsap.set(q("[data-reveal]"), { autoAlpha: 1 });
      window.__dsReady = true;

      /* ── The frame: each kind's photo is a layer; a new one opens out over the last from where
         its tile slipped in behind the frame (a little right of the middle going forward, left
         going back) ── */
      let top = 1;
      const HIDDEN = "circle(0% at 50% 28%)";
      const reveal = (k: number, from: number) => {
        const layer = layers[k];
        gsap.killTweensOf(layer);
        layer.style.zIndex = String(++top);
        if (reduce) {
          gsap.set(layer, { clipPath: "circle(150% at 50% 28%)" });
          return;
        }
        const x = k > from ? 64 : 36;
        gsap.fromTo(
          layer,
          { clipPath: `circle(0% at ${x}% 28%)` },
          {
            clipPath: `circle(150% at ${x}% 28%)`,
            duration: 1.15,
            ease: "power3.inOut",
          },
        );
        // (a photo jumped to from afar is still on its way, and just opens without the zoom)
        const img = layer.querySelector("img");
        if (img)
          gsap.fromTo(
            img,
            { scale: 1.22 },
            { scale: 1, duration: 1.7, ease: "expo.out" },
          );
      };

      /* ── The wheel at a position (0 = first kind at the top, 1 = second, …). Each tile stands
         at its distance round from the top (wrapping, so the last kinds wait on the left of the
         first), times the angle between tiles; tiles further than "reach" fade out of sight.
         The angle and reach come from the CSS, as they change with the screen. ── */
      const space = q<HTMLElement>(".cw-space")[0];
      const ring = tileEls.length;
      let step = 25;
      let reach = 2;
      const measure = () => {
        const css = getComputedStyle(space);
        step = parseFloat(css.getPropertyValue("--step")) || 25;
        // (never so far that one kind could show on both sides at once)
        reach = Math.min(parseFloat(css.getPropertyValue("--reach")) || 1, (count - 1) / 2);
      };
      const state = { pos: 0 };
      const render = () => {
        tileEls.forEach((tile, j) => {
          const d = gsap.utils.wrap(-ring / 2, ring / 2, j - state.pos);
          const o = gsap.utils.clamp(0, 1, (reach + 0.5 - Math.abs(d)) / 0.5);
          tile.style.transform = `rotate(${d * step}deg) translateY(calc(var(--R) * -1))`;
          tile.style.opacity = String(o);
          tile.style.visibility = o > 0 ? "" : "hidden";
        });
      };
      measure();
      const onResize = () => {
        measure();
        render();
      };
      window.addEventListener("resize", onResize);
      const cleanup = () => window.removeEventListener("resize", onResize);
      const turnTo = (i: number, instant = false) => {
        const k = gsap.utils.clamp(0, count - 1, i);
        if (k !== frontRef.current) {
          const from = frontRef.current;
          frontRef.current = k;
          setFront(k);
          reveal(k, from);
        }
        if (instant || reduce) {
          gsap.killTweensOf(state);
          state.pos = k;
          render();
        } else {
          gsap.to(state, {
            pos: k,
            duration: 1.1,
            ease: "power3.out",
            overwrite: true,
            onUpdate: render,
          });
        }
      };
      const showFirst = (k: number) => {
        frontRef.current = k;
        setFront(k);
        gsap.set(layers, { clipPath: HIDDEN });
        gsap.set(layers[k], {
          clipPath: "circle(150% at 50% 28%)",
          zIndex: top,
        });
      };

      if (reduce || count < 2) {
        // No scroll-driven turning: the arrows, the bar and the tiles themselves turn it
        showFirst(0);
        goRef.current = (i) => turnTo(i, true);
        turnTo(0, true);
        return cleanup;
      }

      /* ── Scrolling turns the wheel: each kind of shoot holds the frame for an equal stretch ── */
      const at = (progress: number) =>
        Math.min(count - 1, Math.floor(progress * count));
      // (the scroll is the room kept below the stage, so the page never grows as this starts)
      const room = q<HTMLElement>(".cw-room")[0];
      const st = ScrollTrigger.create({
        trigger: q(".cw-stage")[0],
        start: "top top",
        end: () => `+=${room.offsetHeight}`,
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => turnTo(at(self.progress)),
      });
      goRef.current = (i) => {
        const k = gsap.utils.clamp(0, count - 1, i);
        const y = st.start + ((k + 0.5) / count) * (st.end - st.start);
        const duration = 0.8 + 0.12 * Math.abs(k - frontRef.current);
        if (lenisRef.current) lenisRef.current.scrollTo(y, { duration });
        else window.scrollTo({ top: y, behavior: "smooth" });
      };

      /* ── Arriving: the frame opens, and the tiles rise from below and fan out round the wheel ── */
      const start = at(st.progress);
      showFirst(start);
      state.pos = start - 2.5;
      render();
      const split = SplitText.create(q(".cw-name"), {
        type: "words",
        mask: "words",
      });
      gsap.set(split.masks, {
        paddingBottom: "0.14em",
        marginBottom: "-0.14em",
      });
      gsap
        .timeline({ delay: 0.1, defaults: { ease: "expo.out" } })
        .from(
          q(".cw-frame"),
          { autoAlpha: 0, scale: 0.9, y: 30, duration: 1.5 },
          0,
        )
        .from(
          q(".cw-crumbs, .cw-eyebrow"),
          { autoAlpha: 0, y: 14, duration: 0.9, stagger: 0.08 },
          0.15,
        )
        .from(wheel, { y: () => window.innerHeight * 0.7, duration: 2.2 }, 0.3)
        .to(state, { pos: start, duration: 2.6, onUpdate: render }, 0.3)
        .from(split.words, { yPercent: 115, duration: 1.2, stagger: 0.08 }, 0.5)
        .from(q(".cw-bar"), { autoAlpha: 0, y: 16, duration: 1 }, 0.9);
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return cleanup;
    },
    { scope: root, dependencies: [count] },
  );

  const kind = kinds[front];
  const storyHref = (slug: string) => `/gallery/${category.slug}/${slug}`;

  return (
    <main
      ref={root}
      aria-labelledby="cw-name"
      className="relative bg-night text-cream"
    >
      {/* (phones: just as tall as what's in it, so no empty band is left above the links below) */}
      <section className="cw-stage relative flex flex-col overflow-hidden lg:h-svh">
        {/* The light of the photo in the frame, spilling softly onto the page */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {kinds.map((s, i) =>
            s.cover?.src ? (
              <div
                key={s.slug}
                data-show={i === front ? "" : undefined}
                className="cw-amb absolute inset-0"
              >
                <Image
                  src={s.cover.src}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            ) : null,
          )}
          <div className="cw-veil absolute inset-0" />
        </div>

        {/* Where we are (phones: above the frame; computers: the top left corner) */}
        <div className="relative z-20 mx-auto w-full max-w-[1320px] px-5 pt-24 sm:px-8 sm:pt-28 lg:absolute lg:inset-x-0 lg:top-0 lg:px-12 lg:pt-[7.25rem]">
          <div>
            <nav
              aria-label="Breadcrumb"
              data-reveal
              className="cw-crumbs mb-3 flex items-center gap-2.5 font-mono text-[0.62rem] tracking-[0.18em] text-cream/60 uppercase lg:mb-4"
            >
              <Link
                href="/gallery"
                className="transition-colors hover:text-brand-light"
              >
                Gallery
              </Link>
              <span aria-hidden>/</span>
              <span aria-current="page" className="text-cream/90">
                {category.name}
              </span>
            </nav>
            <p
              data-reveal
              className="cw-eyebrow flex items-center gap-3 font-heading text-[0.66rem] font-semibold tracking-[0.3em] text-brand-light uppercase sm:text-[0.72rem]"
            >
              <LotusMark className="h-4 w-6 text-accent" />
              {pad(number)} / {pad(total)} &middot; {count} kinds of shoot
            </p>
          </div>
        </div>

        {/* The frame and the wheel */}
        <div
          className="cw-middle relative min-h-0 flex-none select-none lg:mt-[6.5rem] lg:flex-1"
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY };
            dragged.current = false;
          }}
          onPointerMove={(e) => {
            if (drag.current && Math.abs(e.clientX - drag.current.x) > 8)
              dragged.current = true;
          }}
          onPointerUp={(e) => {
            const from = drag.current;
            drag.current = null;
            if (!from) return;
            const dx = e.clientX - from.x;
            if (
              Math.abs(dx) < 40 ||
              Math.abs(dx) < Math.abs(e.clientY - from.y)
            )
              return;
            // a long drag turns past more than one tile
            const by = Math.max(1, Math.round(Math.abs(dx) / 160));
            goRef.current(frontRef.current + (dx < 0 ? by : -by));
          }}
          onPointerCancel={() => (drag.current = null)}
          onClickCapture={(e) => {
            // the end of a drag isn't a tap on what's under it
            if (!dragged.current) return;
            e.preventDefault();
            dragged.current = false;
          }}
        >
          <div className="cw-space absolute inset-0">
            {/* the wheel, turning about a point below the frame */}
            <div data-reveal className="cw-wheel">
              {tiles.map((j) => {
                const i = j % count;
                const s = kinds[i];
                const repeat = j >= count;
                return (
                  <button
                    key={j}
                    type="button"
                    aria-hidden={repeat || undefined}
                    tabIndex={repeat ? -1 : undefined}
                    aria-label={`Show ${s.name}`}
                    onClick={() => goRef.current(i)}
                    className="cw-tile group"
                    style={{ "--i": j } as React.CSSProperties}
                  >
                    <span className="cw-tile-in">
                      {s.cover?.src ? (
                        <Image
                          src={s.cover.src}
                          alt=""
                          fill
                          sizes="160px"
                          loading="eager"
                          draggable={false}
                          className="object-cover"
                          style={{ objectPosition: s.cover.position }}
                        />
                      ) : (
                        <span className="gc-blank absolute inset-0 grid place-items-center">
                          <LotusMark className="w-1/2 text-brand/30" />
                        </span>
                      )}
                      <span className="cw-tile-name">{s.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* the frame */}
            <div data-reveal className="cw-frame">
              <Link
                href={storyHref(kind.slug)}
                draggable={false}
                aria-label={`See ${kind.name} stories`}
                className="cw-photo group block"
              >
                {/* (its own stacking context: each new layer goes on top of the others in here) */}
                <span className="absolute inset-0 isolate">
                  {kinds.map((s, i) => (
                    <span key={s.slug} className="cw-layer">
                      {s.cover?.src ? (
                        wanted.includes(i) && (
                          <Image
                            src={s.cover.src}
                            alt={s.cover.alt}
                            fill
                            sizes="(max-width: 1023px) 80vw, 480px"
                            loading="eager"
                            fetchPriority={i === 0 ? "high" : undefined}
                            draggable={false}
                            className="object-cover"
                            style={{ objectPosition: s.cover.position }}
                          />
                        )
                      ) : (
                        <span className="gc-blank absolute inset-0 grid place-items-center">
                          <LotusMark className="w-1/3 text-brand/25" />
                        </span>
                      )}
                    </span>
                  ))}
                </span>
                <span className="cw-shade absolute inset-0" />
                <span
                  key={front}
                  className="cw-cap absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-5 text-center sm:pb-6"
                >
                  <span className="font-display text-[clamp(1.5rem,2.6vw,2.3rem)] leading-[1.1]">
                    {kind.name}
                  </span>
                  {kind.local && (
                    <span className="foil mt-0.5 font-display text-[clamp(0.9rem,1.3vw,1.1rem)]">
                      {kind.local}
                    </span>
                  )}
                  {!kind.cover?.src && (
                    <span className="mt-1 font-mono text-[0.55rem] tracking-[0.16em] text-cream/55 uppercase">
                      Photos coming soon
                    </span>
                  )}
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-cream/45 bg-night/35 px-4 py-2 font-heading text-[0.62rem] font-semibold tracking-[0.18em] text-cream uppercase backdrop-blur-sm transition-colors duration-500 group-hover:border-brand group-hover:bg-brand group-hover:text-night sm:mt-4">
                    See stories
                    <ArrowIcon className="size-3" />
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* The category's name, where we are in it, and the arrows */}
        <div className="relative z-20 mx-auto w-full max-w-[1320px] px-5 pt-4 pb-5 sm:px-8 sm:pb-7 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-end lg:gap-8 lg:px-12 lg:pt-2 lg:pb-8">
          <h1
            id="cw-name"
            data-reveal
            className="cw-name text-center font-display text-[clamp(2rem,10vw,3.2rem)] lg:text-[clamp(2.5rem,min(7.5vw,11svh),7rem)] leading-[1] lg:col-start-2 lg:row-start-1"
          >
            {category.name}
          </h1>
          <div
            data-reveal
            className="cw-bar mt-3 flex items-center gap-4 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:pb-3"
          >
            <p className="shrink-0 font-mono text-[0.62rem] tracking-[0.18em] text-cream/60 uppercase">
              {pad(front + 1)} / {pad(count)}
            </p>
            <div
              className="flex flex-1 gap-1.5 lg:max-w-56"
              role="group"
              aria-label="Kinds of shoot"
            >
              {kinds.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  aria-label={`Show ${s.name}`}
                  aria-current={i === front ? "true" : undefined}
                  onClick={() => goRef.current(i)}
                  className="group flex-1 py-2"
                >
                  <span
                    data-active={i === front ? "" : undefined}
                    className="block h-[2px] rounded-full bg-cream/20 transition-colors duration-500 group-hover:bg-cream/45 data-active:bg-brand"
                  />
                </button>
              ))}
            </div>
          </div>
          <div
            data-reveal
            // (kept clear of the WhatsApp button in the corner, until the page is wide enough
            // that the content ends before it)
            className="cw-bar hidden items-center justify-end gap-3 lg:col-start-3 lg:row-start-1 lg:flex lg:pr-12 lg:pb-1 min-[1416px]:pr-0"
          >
            <p
              data-hide={front > 0 ? "" : undefined}
              className="mr-2 hidden font-mono text-[0.6rem] tracking-[0.18em] whitespace-nowrap text-cream/50 uppercase transition-opacity duration-700 data-hide:opacity-0 xl:block"
            >
              Scroll or drag
            </p>
            <button
              type="button"
              aria-label="Previous kind of shoot"
              disabled={front === 0}
              onClick={() => goRef.current(frontRef.current - 1)}
              className="grid size-11 place-items-center rounded-full border border-cream/25 transition duration-500 hover:border-brand hover:bg-brand hover:text-night disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowIcon className="size-4 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next kind of shoot"
              disabled={front === count - 1}
              onClick={() => goRef.current(frontRef.current + 1)}
              className="grid size-11 place-items-center rounded-full border border-cream/25 transition duration-500 hover:border-brand hover:bg-brand hover:text-night disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowIcon className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {/* The scroll that turns the wheel, under the pinned stage. It's in the page from the start,
          rather than added once the page is running, so the links below don't jump down as it
          loads (not needed when the wheel doesn't turn on scroll: see globals.css) */}
      {count > 1 && (
        <div
          aria-hidden
          className="cw-room"
          style={{ height: `${count * SCROLL_PER_KIND * 100}svh` }}
        />
      )}

      {/* On to the next category, or back */}
      <nav
        aria-label="More categories"
        className="mx-auto grid max-w-[1320px] grid-cols-2 gap-3 border-t border-cream/15 px-5 pt-8 pb-16 sm:gap-4 sm:px-8 lg:px-12 lg:pb-24"
      >
        <Link href={`/gallery/${prev.slug}`} className="group block">
          <span className="block font-mono text-[0.62rem] tracking-[0.18em] text-cream/55 uppercase">
            &larr; Previous
          </span>
          <span className="mt-2 block font-display text-[clamp(1.2rem,2.4vw,2rem)] transition-colors duration-500 group-hover:text-brand-light">
            {prev.name}
          </span>
        </Link>
        <Link href={`/gallery/${next.slug}`} className="group block text-right">
          <span className="block font-mono text-[0.62rem] tracking-[0.18em] text-cream/55 uppercase">
            Next &rarr;
          </span>
          <span className="mt-2 block font-display text-[clamp(1.2rem,2.4vw,2rem)] transition-colors duration-500 group-hover:text-brand-light">
            {next.name}
          </span>
        </Link>
      </nav>
    </main>
  );
}
