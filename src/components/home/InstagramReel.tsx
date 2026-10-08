"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import type { Photo } from "@/content/photos";
import { Magnetic } from "@/components/ui/Magnetic";
import { ArrowIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";
import type { SectionHeading } from "@/content/db";

// Each row repeats its photos this many times so the loop never shows a gap, even on wide screens
const COPIES = 4;
// Seconds for one set of photos to pass by
const LOOP_SECONDS = 42;

export type InstagramTile = Photo & { likes?: string };
type InstagramMeta = { handle: string; url: string };

function InstagramGlyph({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Tile({
  photo,
  copy,
  instagram,
}: {
  photo: InstagramTile;
  copy: number;
  instagram: InstagramMeta;
}) {
  // only the first copy of each photo is reachable by keyboard / screen readers
  const hidden = copy > 0;
  return (
    <a
      href={instagram.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={hidden ? undefined : `${photo.alt}, on Instagram`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className="group relative block size-[clamp(9rem,16vw,15rem)] shrink-0 overflow-hidden rounded-[4px] bg-cream/5"
    >
      <Image
        src={photo.src}
        alt=""
        fill
        sizes="(min-width: 1024px) 16vw, 9rem"
        className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-110"
        style={{ objectPosition: photo.position }}
      />
      <span className="absolute inset-0 flex items-center justify-center gap-2 bg-night/45 font-heading text-[0.8rem] font-semibold tracking-[0.08em] text-cream opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
        <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-current">
          <path d="M12 20.6s-7.6-4.6-9.4-9.4C1.4 7.9 3.6 4.6 7 4.6c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.3 4.4 6.6-1.8 4.8-9.4 9.4-9.4 9.4Z" />
        </svg>
        {photo.likes}
      </span>
    </a>
  );
}

export function InstagramReel({
  photos,
  instagram,
  meta,
}: {
  photos: InstagramTile[];
  instagram: InstagramMeta;
  meta: SectionHeading;
}) {
  const root = useRef<HTMLElement>(null);
  const half = Math.ceil(photos.length / 2);
  const rows = [photos.slice(0, half), photos.slice(half)];

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const q = gsap.utils.selector(el);

      /* ── Endless rows: the top row glides left, the bottom row right ── */
      const loops = q<HTMLElement>(".ig-track").map((track, r) =>
        gsap.fromTo(
          track,
          { xPercent: r ? -100 / COPIES : 0 },
          {
            xPercent: r ? 0 : -100 / COPIES,
            duration: LOOP_SECONDS,
            ease: "none",
            repeat: -1,
            paused: true,
          },
        ),
      );

      // Only run while on screen; scrolling past gives the reel a little push that eases off
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) =>
          loops.forEach((l) => (self.isActive ? l.play() : l.pause())),
        onUpdate: (self) => {
          const boost = gsap.utils.clamp(
            1,
            6,
            1 + Math.abs(self.getVelocity()) / 260,
          );
          loops.forEach((l) => {
            l.timeScale(Math.max(boost, l.timeScale()));
            gsap.to(l, {
              timeScale: 1,
              duration: 1.4,
              ease: "power2.out",
              overwrite: true,
            });
          });
        },
      });

      /* ── Entrance: heading rises, rows slide in from opposite sides, the button pops ── */
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
        .from(q(".ig-foil"), { yPercent: 115, duration: 1.1 }, 0.35)
        .from(
          q(".ig-row"),
          {
            autoAlpha: 0,
            x: (i: number) => (i ? -160 : 160),
            duration: 1.6,
            stagger: 0.1,
          },
          0.25,
        )
        .from(
          q(".ig-pill"),
          { autoAlpha: 0, scale: 0.6, duration: 1, ease: "back.out(1.8)" },
          0.9,
        );
    },
    { scope: root },
  );

  return (
    <section
      id="instagram"
      ref={root}
      aria-labelledby="instagram-title"
      className="relative overflow-hidden bg-night py-24 text-cream lg:py-28"
    >
      <div className="mx-auto max-w-[1320px] px-5 text-center sm:px-8">
        <p className="ig-eyebrow mb-5 flex items-center justify-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-brand-light uppercase">
          <LotusMark className="h-4 w-6 text-accent" />
          {meta.eyebrow}
        </p>
        <h2
          id="instagram-title"
          className="ig-title font-display text-[clamp(2.2rem,4.4vw,4rem)] leading-[1.06]"
        >
          {meta.title}{" "}
          <span className="ig-foil-mask -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
            <span className="ig-foil foil inline-block">{meta.titleFoil}</span>
          </span>
        </h2>
      </div>

      {/* Reel: soft fade at both screen edges */}
      <div className="relative mt-12 [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)] lg:mt-16">
        <div className="flex flex-col gap-3 sm:gap-4">
          {rows.map((row, r) => (
            <div key={r} className="ig-row overflow-hidden">
              <div className="ig-track flex w-max gap-3 sm:gap-4">
                {Array.from({ length: COPIES }, (_, copy) =>
                  row.map((photo) => (
                    <Tile
                      key={`${copy}-${photo.src}`}
                      photo={photo}
                      copy={copy}
                      instagram={instagram}
                    />
                  )),
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Follow button over the seam between the rows */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="ig-pill pointer-events-auto">
            <Magnetic>
              <a
                href={instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-full bg-cream py-2.5 pr-3 pl-3 text-ink shadow-[0_18px_40px_-14px_rgb(0_0_0/0.75)] ring-1 ring-black/5 transition-colors duration-500 hover:bg-brand-light sm:gap-4 sm:py-3 sm:pr-3.5 sm:pl-3.5"
              >
                <span className="grid size-10 place-items-center rounded-full bg-accent-deep text-cream sm:size-11">
                  <InstagramGlyph className="size-5 sm:size-[1.35rem]" />
                </span>
                <span className="text-left leading-tight">
                  <span className="block font-heading text-[0.62rem] font-semibold tracking-[0.24em] text-ink/55 uppercase">
                    Follow us
                  </span>
                  <span className="block font-body text-[0.95rem] font-medium tracking-[0.01em] sm:text-[1.05rem]">
                    @{instagram.handle}
                  </span>
                </span>
                <span className="grid size-9 place-items-center rounded-full border border-ink/15 transition duration-500 group-hover:border-ink/40 group-hover:bg-ink group-hover:text-cream sm:size-10">
                  <ArrowIcon className="size-4" />
                </span>
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
