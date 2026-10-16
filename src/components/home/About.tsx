"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { FocusMark } from "@/components/ui/ornaments";
import type { SectionHeading } from "@/content/db";
import type { Photo } from "@/content/photos";

// handwritten lines appear as if written left to right
const WRITE_FROM = "inset(-30% 100% -30% -10%)";
const WRITE_TO = "inset(-30% -15% -30% -10%)";

type AboutContent = {
  name: string;
  firstName: string;
  role: string;
  story: string[];
  stats: { value: number; suffix: string; label: string }[];
  /** the handwritten line under the heading */
  tagline: string;
  photos: { portrait: Photo; bride: Photo; temple: Photo };
};

export function About({
  about,
  meta,
}: {
  about: AboutContent;
  meta: SectionHeading;
}) {
  const root = useRef<HTMLElement>(null);
  const { portrait, bride, temple } = about.photos;

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const q = gsap.utils.selector(el);
      const once = (trigger: Element, start = "top 80%") => ({ trigger, start, once: true });
      const passing = (trigger: Element) => ({
        trigger,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      });

      /* ── His photo fades in and settles ── */
      const portraitBox = q<HTMLElement>(".ab-portrait")[0];
      gsap
        .timeline({ scrollTrigger: once(portraitBox, "top 85%") })
        .from(portraitBox, { autoAlpha: 0, duration: 1.6, ease: "power2.out" }, 0)
        .from(q(".ab-portrait img"), { scale: 1.08, duration: 2.4, ease: "expo.out" }, 0);
      // while the page scrolls past, the photo moves a little slower than the page
      gsap.fromTo(
        q(".ab-portrait-move"),
        { yPercent: -2.5 },
        { yPercent: 2.5, ease: "none", scrollTrigger: passing(portraitBox) },
      );

      /* ── Story: heading rises word by word, the handwritten line writes itself, then the
         gold line grows down beside the paragraphs ── */
      const split = SplitText.create(q(".ab-title"), {
        type: "words",
        mask: "words",
        ignore: q(".ab-foil-mask"),
      });
      gsap.set(split.masks, {
        paddingBottom: "0.08em",
        marginBottom: "-0.08em",
      });
      gsap
        .timeline({
          scrollTrigger: once(q(".ab-story")[0], "top 78%"),
          defaults: { ease: "expo.out" },
        })
        .from(q(".ab-eyebrow"), { autoAlpha: 0, y: 16, duration: 0.9 }, 0)
        .from(q(".ab-eyebrow-line"), { scaleX: 0, duration: 1.2, ease: "expo.inOut" }, 0.2)
        .from(split.words, { yPercent: 110, duration: 1.2, stagger: 0.09 }, 0.1)
        .from(q(".ab-foil"), { yPercent: 110, duration: 1.2 }, 0.3)
        .fromTo(
          q(".ab-script"),
          { clipPath: WRITE_FROM },
          { clipPath: WRITE_TO, duration: 1.6, ease: "power2.inOut" },
          0.8,
        )
        .from(q(".ab-para-line"), { scaleY: 0, duration: 1.4, ease: "expo.inOut" }, 1)
        .from(q(".ab-para"), { autoAlpha: 0, y: 20, duration: 1, stagger: 0.12 }, 1.1);

      /* ── Numbers count up ── */
      const nums = q<HTMLElement>(".ab-stat-num");
      const counters = nums.map((n) => ({
        n,
        value: Number(n.dataset.value),
        current: 0,
      }));
      counters.forEach((c) => (c.n.textContent = "0"));
      gsap
        .timeline({
          scrollTrigger: once(q(".ab-stats")[0], "top 90%"),
          defaults: { ease: "expo.out" },
        })
        .from(q(".ab-stat"), { autoAlpha: 0, y: 24, duration: 1, stagger: 0.12 }, 0)
        .from(q(".ab-stats-rule"), { scaleX: 0, duration: 1.2, ease: "expo.inOut" }, 0.3)
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
        }, 0.2);

      /* ── Right side: the temple glows in, then the bride appears out of the dark above it ── */
      const side = q<HTMLElement>(".ab-side")[0];
      gsap
        .timeline({ scrollTrigger: once(side, "top 80%") })
        .from(q(".ab-temple"), { autoAlpha: 0, duration: 1.8, ease: "power2.out" }, 0)
        .from(q(".ab-bride"), { autoAlpha: 0, y: 30, duration: 2, ease: "power2.out" }, 0.3);
      // the temple drifts a little as the page scrolls past
      gsap.fromTo(
        q(".ab-temple-move"),
        { yPercent: -5 },
        { yPercent: 3, ease: "none", scrollTrigger: passing(side) },
      );

      /* ── Signature writes itself ── */
      gsap
        .timeline({ scrollTrigger: once(q(".ab-sign")[0], "top 92%") })
        .fromTo(
          q(".ab-signature"),
          { clipPath: WRITE_FROM },
          { clipPath: WRITE_TO, duration: 1.8, ease: "power2.inOut" },
        )
        .from(q(".ab-sign-meta"), { autoAlpha: 0, x: -16, duration: 1, ease: "expo.out" }, 0.9)
        .from(q(".ab-sign-rule"), { scaleX: 0, duration: 1, ease: "expo.inOut" }, 1.1);
    },
    { scope: root },
  );

  return (
    <section
      id="about"
      ref={root}
      aria-labelledby="about-title"
      className="relative overflow-hidden bg-night text-cream"
    >
      {/* On computers everything sits in the same centred width as the other sections, and the
          sizes inside follow that width (cqw = 1% of it) rather than the whole screen */}
      <div
        data-nav-view
        className="@container relative lg:mx-auto lg:grid lg:min-h-svh lg:w-[calc(100%-6rem)] lg:max-w-[1224px] lg:grid-cols-[38%_minmax(0,1fr)_26%]"
      >
        {/* His photo: across the top on phones. On computers it's as tall as the section and
            uncropped at the sides (so his arms and hands show in full), ending a little under
            the story's faded start; on the left it reaches out past the centred box as far as
            its width needs, with only a light fade at that edge. */}
        <div className="ab-portrait relative aspect-[4/5] max-h-[85svh] w-full overflow-hidden sm:max-h-[72svh] lg:absolute lg:inset-y-0 lg:right-[54%] lg:max-h-none lg:w-auto">
          <div className="ab-portrait-move absolute inset-x-0 -inset-y-[3%]">
            <Image
              src={portrait.src}
              alt={portrait.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              style={{ objectPosition: portrait.position }}
            />
          </div>
          <span aria-hidden className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-night/70 to-transparent lg:hidden" />
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-night via-night/40 to-transparent lg:h-1/6" />
          <span aria-hidden className="absolute inset-y-0 right-0 hidden w-1/4 bg-gradient-to-l from-night to-transparent lg:block" />
          <span aria-hidden className="absolute inset-y-0 left-0 hidden w-[16%] bg-gradient-to-r from-night via-night/30 to-transparent lg:block" />
        </div>

        <div aria-hidden className="hidden lg:block" />

        {/* Story (on computers its sizes follow the screen's height as well as its width, so
            the whole section fits in one screen) */}
        <div className="ab-story relative z-10 -mt-12 px-5 sm:px-8 lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:px-[1.5cqw] lg:py-[3.6svh]">
          <p className="ab-eyebrow mb-6 flex lg:mb-[2.2svh] items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-brand-light uppercase">
            <FocusMark className="h-4 w-6 text-accent" />
            {meta.eyebrow}
            <span aria-hidden className="ab-eyebrow-line ml-3 h-px w-16 origin-left bg-brand/55" />
          </p>
          <h2
            id="about-title"
            className="ab-title font-display text-[clamp(3rem,13vw,4.6rem)] leading-[0.94] uppercase lg:text-[min(5.6cqw,8.2svh)]"
          >
            {/* each word on its own line (Behind / Every), then the gold words (Frame) */}
            {meta.title.split(/\s+/).filter(Boolean).map((word, i) => (
              <span key={`${i}-${word}`} className="block">
                {word}
              </span>
            ))}
            <span className="ab-foil-mask -mb-[0.08em] block overflow-hidden pb-[0.08em]">
              <span className="ab-foil foil inline-block">{meta.titleFoil}</span>
            </span>
          </h2>
          <p className="ab-script mt-3 lg:mt-[1svh] origin-left -rotate-3 pr-[0.1em] font-signature text-[clamp(1.7rem,7vw,2.3rem)] text-brand lg:text-[min(3.2cqw,5.4svh)]">
            {about.tagline}
          </p>

          <div className="relative mt-7 max-w-[46ch] space-y-4 pl-6 text-[0.95rem] leading-[1.7] text-cream/75 lg:mt-[3svh] lg:w-[112%] lg:max-w-none lg:space-y-[1.6svh] lg:text-[clamp(0.85rem,min(1.3cqw,2.1svh),1.1rem)] lg:leading-[1.6]">
            <span aria-hidden className="ab-para-line absolute inset-y-1 left-0 w-px origin-top bg-brand/50" />
            {about.story.map((p) => (
              <p key={p} className="ab-para text-pretty">
                {p}
              </p>
            ))}
          </div>

          {/* Numbers */}
          <div className="ab-stats mt-10 lg:mt-[3.5svh] lg:w-[135%]">
            <div className="grid grid-cols-3">
              {about.stats.map((s, i) => (
                <div
                  key={s.label}
                  className="ab-stat border-brand/45 pr-3 not-first:border-l not-first:pl-4 sm:not-first:pl-6"
                >
                  <p
                    className={`font-display text-[clamp(1.7rem,7vw,2.4rem)] leading-none whitespace-nowrap tabular-nums lg:text-[min(3cqw,4.8svh)] ${
                      i === 0 ? "text-brand" : "text-cream"
                    }`}
                  >
                    <span className="ab-stat-num" data-value={s.value}>
                      {s.value}
                    </span>
                    <span className="text-accent">{s.suffix}</span>
                  </p>
                  <p className="mt-3 font-heading text-[0.55rem] leading-[1.8] font-semibold tracking-[0.2em] text-cream/70 uppercase sm:text-[0.6rem] lg:text-[clamp(0.6rem,min(0.9cqw,1.55svh),0.74rem)]">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            <span aria-hidden className="ab-stats-rule mt-6 lg:mt-[2.4svh] block h-px w-16 origin-left bg-brand/80" />
          </div>
        </div>

        {/* Right side: a bride above our city's temple, both melting into the dark. One stage,
            so every piece keeps its place on any screen. */}
        <div className="ab-side relative">
          <div className="relative mx-auto mt-10 aspect-[10/17] w-full max-w-[24rem] lg:absolute lg:inset-0 lg:mt-0 lg:aspect-auto lg:max-w-none">
            <div className="ab-temple absolute inset-x-0 top-[42%] bottom-0 overflow-hidden">
              <div className="ab-temple-move absolute inset-x-0 -inset-y-[6%]">
                <Image
                  src={temple.src}
                  alt={temple.alt}
                  fill
                  sizes="(min-width: 1320px) 320px, (min-width: 1024px) 26vw, 24rem"
                  className="object-cover"
                  style={{ objectPosition: temple.position }}
                />
              </div>
              <span aria-hidden className="absolute inset-x-0 top-0 h-3/5 bg-gradient-to-b from-night via-night/60 to-transparent" />
              <span aria-hidden className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-night via-night/50 to-transparent" />
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-night/80 to-transparent" />
              <span aria-hidden className="absolute inset-y-0 right-0 hidden w-1/5 bg-gradient-to-l from-night to-transparent lg:block" />
            </div>

            {/* the bride: no frame, her photo's edges fade softly into the dark on every side */}
            <div className="ab-bride ab-bride-fade absolute top-[9%] left-[12%] aspect-[4/5] w-[76%] lg:w-[min(76%,46svh)]">
              <Image
                src={bride.src}
                alt={bride.alt}
                fill
                sizes="(min-width: 1320px) 245px, (min-width: 1024px) 20vw, 16rem"
                className="object-cover"
                style={{ objectPosition: bride.position }}
              />
            </div>
          </div>
        </div>

        {/* Signature: over the bottom of his photo on computers, at the end on phones */}
        <div className="ab-sign relative z-10 mt-14 px-5 pb-16 sm:px-8 lg:absolute lg:bottom-[clamp(2rem,6%,4.5rem)] lg:left-[3.5%] lg:mt-0 lg:p-0">
          <p
            className="ab-signature origin-left -rotate-[8deg] pr-[0.1em] font-signature text-[3.6rem] leading-[0.9] text-brand sm:text-[4.2rem] lg:text-[min(5cqw,8svh)]"
            aria-label={`Signed, ${about.name}`}
          >
            {about.firstName}
          </p>
          <p className="ab-sign-meta mt-2 ml-[22%] max-w-[17em] font-heading text-[0.6rem] leading-[2] font-semibold tracking-[0.25em] text-balance text-cream/85 uppercase">
            {about.role}
          </p>
          <span aria-hidden className="ab-sign-rule mt-4 ml-[22%] block h-px w-10 origin-left bg-brand/70" />
        </div>
      </div>
    </section>
  );
}
