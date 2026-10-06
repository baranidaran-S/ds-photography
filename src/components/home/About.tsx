"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { about } from "@/content/site";
import { LotusMark } from "@/components/ui/ornaments";

// The portrait is shown through a staggered grid of tiles: [x, y, width, height] in % of the frame.
// One continuous photo runs behind all of them, so the gaps slice it like a broken grid.
const TILES = [
  [12, 12, 19, 18],
  [0, 32, 31, 27],
  [12, 61, 19, 19],
  [12, 82, 19, 13],
  [33, 3, 32, 55], // the big centre tile: the face sits here
  [33, 60, 32, 19],
  [33, 81, 32, 19],
  [67, 7, 20, 23],
  [67, 32, 33, 26],
  [67, 60, 20, 24],
] as const;
const FACE_TILE = 4;
// How far each tile sits from the centre, so it can fly in from (and drift towards) its own side
const tileDir = TILES.map(([x, y, w, h]) => ({
  x: (x + w / 2 - 50) / 50,
  y: (y + h / 2 - 50) / 50,
}));

export function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const q = gsap.utils.selector(el);

      /* ── Photo mosaic: the tiles fly in from the edges and lock together into the portrait ── */
      const tiles = q<HTMLElement>(".ab-tile");
      const mosaic = q<HTMLElement>(".ab-mosaic")[0];
      gsap
        .timeline({
          scrollTrigger: { trigger: mosaic, start: "top 80%", once: true },
          defaults: { ease: "expo.out" },
        })
        .from(tiles, {
          x: (i: number) => tileDir[i].x * 140,
          y: (i: number) => tileDir[i].y * 140 + 40,
          rotation: (i: number) => (i % 2 ? 7 : -7),
          scale: 0.82,
          autoAlpha: 0,
          duration: 1.5,
          stagger: { amount: 0.55, from: "random" },
        })
        .from(q(".ab-tile-photo"), { scale: 1.18, duration: 2.2 }, 0.15);

      // Desktop: hovering the portrait pulls the tiles slightly apart
      const pointerFine = window.matchMedia("(pointer: fine)").matches;
      const spread = (on: boolean) =>
        gsap.to(tiles, {
          x: (i: number) => (on ? tileDir[i].x * 9 : 0),
          y: (i: number) => (on ? tileDir[i].y * 9 : 0),
          duration: 0.8,
          ease: "power3.out",
          overwrite: "auto",
        });
      const onEnter = () => spread(true);
      const onLeave = () => spread(false);
      if (pointerFine) {
        mosaic.addEventListener("pointerenter", onEnter);
        mosaic.addEventListener("pointerleave", onLeave);
      }

      // Gentle depth while scrolling
      gsap.fromTo(
        q(".ab-media"),
        { y: 40 },
        {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: q(".ab-media")[0],
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );

      /* ── Story: heading rises word by word, then the paragraphs ── */
      const split = SplitText.create(q(".ab-title"), {
        type: "words",
        mask: "words",
        ignore: q(".ab-foil-mask"),
      });
      gsap.set(split.masks, {
        paddingBottom: "0.12em",
        marginBottom: "-0.12em",
      });
      gsap
        .timeline({
          scrollTrigger: {
            trigger: q(".ab-story")[0],
            start: "top 78%",
            once: true,
          },
          defaults: { ease: "expo.out" },
        })
        .from(q(".ab-eyebrow"), { autoAlpha: 0, y: 16, duration: 0.9 }, 0)
        .from(split.words, { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.1)
        .from(q(".ab-foil"), { yPercent: 115, duration: 1.1 }, 0.4)
        .from(
          q(".ab-para"),
          { autoAlpha: 0, y: 24, duration: 1, stagger: 0.12 },
          0.45,
        );

      /* ── Numbers count up, then the signature writes itself ── */
      const nums = q<HTMLElement>(".ab-stat-num");
      const counters = nums.map((n) => ({
        n,
        value: Number(n.dataset.value),
        current: 0,
      }));
      counters.forEach((c) => (c.n.textContent = "0"));
      gsap
        .timeline({
          scrollTrigger: {
            trigger: q(".ab-stats")[0],
            start: "top 85%",
            once: true,
          },
          defaults: { ease: "expo.out" },
        })
        .from(
          q(".ab-stats-rule"),
          { scaleX: 0, duration: 1.4, ease: "expo.inOut", stagger: 0.1 },
          0,
        )
        .from(
          q(".ab-stat"),
          { autoAlpha: 0, y: 24, duration: 1, stagger: 0.1 },
          0.1,
        )
        .add(() => {
          counters.forEach((c, i) =>
            gsap.to(c, {
              current: c.value,
              duration: 2,
              delay: i * 0.1,
              ease: "power3.out",
              onUpdate: () => (c.n.textContent = String(Math.round(c.current))),
            }),
          );
        }, 0.2)
        .fromTo(
          q(".ab-signature"),
          { clipPath: "inset(-30% 100% -30% -10%)" },
          {
            clipPath: "inset(-30% -15% -30% -10%)",
            duration: 1.8,
            ease: "power2.inOut",
          },
          0.6,
        )
        .from(q(".ab-sign-meta"), { autoAlpha: 0, x: -16, duration: 1 }, 1.4);

      return () => {
        mosaic.removeEventListener("pointerenter", onEnter);
        mosaic.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: root },
  );

  return (
    <section
      id="about"
      ref={root}
      aria-labelledby="about-title"
      className="relative overflow-hidden bg-night py-24 text-cream lg:py-36"
    >
      {/* soft warm glow behind the portrait */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-[-10%] h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-brand)_12%,transparent),transparent)]"
      />

      <div
        data-nav-view
        className="relative mx-auto grid max-w-[1320px] items-center gap-20 px-5 sm:px-8 lg:grid-cols-[1fr_1.12fr] lg:gap-24 lg:px-12"
      >
        {/* Photo mosaic */}
        <div className="ab-media relative mx-auto w-full max-w-[24rem] sm:max-w-[30rem] lg:mx-0 lg:max-w-[34rem]">
          <div className="ab-mosaic relative aspect-[100/108] w-full">
            {TILES.map(([x, y, w, h], i) => (
              <div
                key={i}
                className="ab-tile absolute overflow-hidden rounded-[3px] bg-cream/10"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${w}%`,
                  height: `${h}%`,
                }}
              >
                {/* the whole frame, shifted so this tile shows its own piece of the photo */}
                <div
                  className="absolute"
                  style={{
                    left: `${(-x / w) * 100}%`,
                    top: `${(-y / h) * 100}%`,
                    width: `${(100 / w) * 100}%`,
                    height: `${(100 / h) * 100}%`,
                  }}
                >
                  <div className="ab-tile-photo absolute inset-0">
                    <Image
                      src={about.photo.src}
                      alt={i === FACE_TILE ? about.photo.alt : ""}
                      fill
                      sizes="(min-width: 1024px) 41rem, (min-width: 640px) 36rem, 29rem"
                      className="object-cover"
                      style={{ objectPosition: about.photo.position }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Story */}
        <div className="ab-story lg:pl-4">
          <p className="ab-eyebrow mb-5 flex items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-brand-light uppercase">
            <LotusMark className="h-4 w-6 text-accent" />
            Our story
          </p>
          <h2
            id="about-title"
            className="ab-title font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.06]"
          >
            The eyes behind{" "}
            <span className="ab-foil-mask -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
              <span className="ab-foil foil inline-block">every frame</span>
            </span>
          </h2>

          <div className="mt-8 max-w-[52ch] space-y-5 text-[1rem] leading-[1.85] text-cream/70 sm:text-[1.05rem]">
            {about.story.map((p) => (
              <p key={p} className="ab-para text-pretty">
                {p}
              </p>
            ))}
          </div>

          {/* Numbers */}
          <div className="ab-stats relative mt-12 grid grid-cols-3 gap-4 py-8 sm:gap-8">
            <span
              aria-hidden
              className="ab-stats-rule absolute inset-x-0 top-0 h-px origin-left bg-cream/12"
            />
            <span
              aria-hidden
              className="ab-stats-rule absolute inset-x-0 bottom-0 h-px origin-left bg-cream/12"
            />
            {about.stats.map((s) => (
              <div key={s.label} className="ab-stat">
                <p className="font-display text-[clamp(2rem,4.2vw,3.4rem)] leading-none text-brand-light tabular-nums">
                  <span className="ab-stat-num" data-value={s.value}>
                    {s.value}
                  </span>
                  <span className="text-accent">{s.suffix}</span>
                </p>
                <p className="mt-3 font-heading text-[0.6rem] font-semibold tracking-[0.2em] text-cream/55 uppercase sm:text-[0.66rem]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Signature */}
          <div className="mt-10 flex items-end gap-6">
            <p
              className="ab-signature pr-[0.1em] font-signature text-[3.6rem] leading-[0.8] text-brand sm:text-[4.2rem]"
              aria-label={`Signed, ${about.name}`}
            >
              {about.firstName}
            </p>
            <div className="ab-sign-meta pb-1">
              <p className="font-heading text-[0.78rem] font-semibold tracking-[0.18em] text-cream uppercase">
                {about.name}
              </p>
              <p className="mt-1 text-[0.82rem] text-cream/55">{about.role}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
