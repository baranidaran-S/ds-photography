"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { heroOutro, heroSlides } from "@/content/site";
import { whatsappLink } from "@/lib/whatsapp";
import { useAnchorScroll } from "@/hooks/useAnchorScroll";
import { Magnetic } from "@/components/ui/Magnetic";
import { ArrowIcon, ChatIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";

const SLIDE_SECONDS = 6;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  // Tall wrapper the hero sticks inside while the photo shrinks into the arch
  const track = useRef<HTMLDivElement>(null);
  const goTo = useRef<(index: number) => void>(() => {});
  const scrollTo = useAnchorScroll();

  useGSAP(
    (_, contextSafe) => {
      window.__dsReady = true;
      let alive = true;
      let follow: (() => void) | null = null;

      const start = contextSafe!(() => {
        if (!alive || !root.current) return;
        const q = gsap.utils.selector(root);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        /* ── Full-screen slideshow ─────────────────────────── */
        const slides = q<HTMLElement>(".hero-slide");
        const dots = q<HTMLElement>(".hero-dot");
        const dotFills = q<HTMLElement>(".hero-dot-fill");
        const seams = q<HTMLElement>(".hero-seam");
        const imgOf = (i: number) => slides[i].querySelector("img");

        let current = 0;
        let busy = false;
        let progress: gsap.core.Tween | null = null;
        let drift: gsap.core.Tween | null = null;

        gsap.set(slides, { zIndex: 1, autoAlpha: 0 });
        gsap.set(slides[0], { zIndex: 3, autoAlpha: 1 });

        // Slow Ken Burns zoom on the active photo
        const startDrift = (i: number, from: number) => {
          drift?.kill();
          if (reduce) return;
          drift = gsap.fromTo(
            imgOf(i),
            { scale: from },
            { scale: 1, duration: SLIDE_SECONDS + 2.5, ease: "power1.out" },
          );
        };

        const runProgress = () => {
          progress?.kill();
          gsap.set(dotFills, { scaleX: 0 });
          progress = gsap.fromTo(
            dotFills[current],
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: SLIDE_SECONDS,
              ease: "none",
              onComplete: () => show((current + 1) % slides.length),
            },
          );
        };

        // New photo opens from the centre like temple doors, with a thin light at the seam
        const show = contextSafe!((next: number) => {
          if (busy || next === current) return;
          busy = true;
          const prev = current;
          current = next;
          const incoming = slides[next];

          gsap.set(slides, { zIndex: 1 });
          gsap.set(slides[prev], { zIndex: 2 });
          gsap.set(incoming, { zIndex: 3, autoAlpha: 1 });
          dots.forEach((d, k) => {
            d.toggleAttribute("data-active", k === next);
            d.setAttribute("aria-current", String(k === next));
          });

          const tl = gsap.timeline({
            onComplete: () => {
              gsap.set(slides[prev], { autoAlpha: 0 });
              busy = false;
            },
          });
          if (reduce) {
            tl.fromTo(incoming, { opacity: 0 }, { opacity: 1, duration: 0.8 });
          } else {
            tl.fromTo(
              incoming,
              { clipPath: "inset(0% 50% 0% 50%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: 1.7, ease: "expo.inOut" },
              0,
            )
              .fromTo(
                seams,
                { left: "50%", autoAlpha: 1 },
                { left: (k: number) => (k === 0 ? "0%" : "100%"), duration: 1.7, ease: "expo.inOut" },
                0,
              )
              .to(seams, { autoAlpha: 0, duration: 0.35 }, 1.4)
              .to(imgOf(prev), { scale: 1.06, duration: 1.7, ease: "expo.inOut" }, 0);
            startDrift(next, 1.25);
          }

          runProgress();
        });
        goTo.current = (i) => show(i);

        // Pause the slideshow while the hero is off screen
        ScrollTrigger.create({
          trigger: track.current,
          start: "top top",
          end: "bottom top",
          refreshPriority: -1,
          onLeave: () => {
            progress?.pause();
            drift?.pause();
          },
          onEnterBack: () => {
            progress?.resume();
            drift?.resume();
          },
        });

        if (reduce) {
          gsap.set(q("[data-reveal]"), { autoAlpha: 1 });
          runProgress();
          return;
        }

        /* ── Intro sequence ────────────────────────────────── */
        const split = SplitText.create(q(".hero-line"), {
          type: "words",
          mask: "words",
          ignore: q(".hero-foil-mask"),
        });
        gsap.set(split.masks, { paddingBottom: "0.16em", marginBottom: "-0.16em" });

        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .set(q(".hero-media"), { autoAlpha: 1 }, 0)
          .fromTo(
            slides[0],
            { clipPath: "inset(0% 50% 0% 50%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.9, ease: "expo.inOut" },
            0,
          )
          .fromTo(
            seams,
            { left: "50%", autoAlpha: 1 },
            { left: (k: number) => (k === 0 ? "0%" : "100%"), duration: 1.9, ease: "expo.inOut" },
            0,
          )
          .to(seams, { autoAlpha: 0, duration: 0.4 }, 1.55)
          .add(() => startDrift(0, 1.3), 0)
          // copy
          .fromTo(q(".hero-ornament"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 0.9)
          .fromTo(
            q(".hero-ornament-line"),
            { scaleX: 0 },
            { scaleX: 1, duration: 1.2, ease: "expo.inOut" },
            1,
          )
          .fromTo(q(".hero-kicker"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1 }, 1.05)
          .set(q(".hero-title"), { autoAlpha: 1 }, 1.1)
          .from(split.words.slice(0, 2), { yPercent: 120, duration: 1.2, stagger: 0.08 }, 1.1)
          .from(q(".hero-foil"), { yPercent: 120, duration: 1.2 }, 1.26)
          .from(split.words.slice(2), { yPercent: 120, duration: 1.2, stagger: 0.08 }, 1.34)
          .fromTo(q(".hero-sub"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1 }, 1.6)
          .fromTo(q(".hero-cta"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1 }, 1.75)
          .fromTo(q(".hero-dots"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.85)
          .add(runProgress, 2.4);

        /* ── Scroll: hero holds still, the photo shrinks into an arch, the tagline appears beside it ── */
        const el = root.current;
        const wrap = track.current!;
        const isDesktop = () => window.innerWidth >= 1024;
        const measure = () => {
          const width = el.clientWidth;
          const height = el.clientHeight;
          const view = Math.min(height, window.innerHeight);
          const w = isDesktop() ? Math.min(width * 0.32, 460) : Math.min(width * 0.68, 340);
          const h = Math.min(view * (isDesktop() ? 0.72 : 0.42), w * 1.42);
          const left = (width - w) / 2;
          const top = height - view + (view - h) / 2 + (isDesktop() ? 28 : 0);
          gsap.set(el, {
            "--arch-w": `${w}px`,
            "--arch-h": `${h}px`,
            "--arch-top": `${top}px`,
            "--arch-left": `${left}px`,
          });
          return { w, h, top, left, right: width - left - w, bottom: height - top - h };
        };
        const archClip = () => {
          const a = measure();
          return `inset(${a.top}px ${a.right}px ${a.bottom}px ${a.left}px round ${a.w / 2}px ${a.w / 2}px 12px 12px)`;
        };

        gsap.set(q(".hero-media"), { clipPath: "inset(0px 0px 0px 0px round 0px 0px 0px 0px)" });
        const shrink = gsap
          .timeline({ paused: true, defaults: { ease: "none" } })
          .to(q(".hero-copy"), { y: -80, autoAlpha: 0, duration: 0.3 }, 0)
          .fromTo(q(".hero-dots"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, immediateRender: false }, 0)
          .to(q(".hero-shade"), { autoAlpha: 0, duration: 0.45 }, 0.05)
          .to(q(".hero-media"), { clipPath: archClip, duration: 0.7, ease: "power1.inOut" }, 0)
          .to(q(".hero-slides"), { scale: 1.08, duration: 0.7, ease: "power1.inOut" }, 0)
          .to(
            [el, wrap],
            {
              backgroundColor: () =>
                getComputedStyle(el).getPropertyValue("--color-cream").trim() || "#fff8ee",
              duration: 0.4,
            },
            0.25,
          )
          .fromTo(
            q(".hero-arch-line"),
            { autoAlpha: 0, scale: 1.06 },
            { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power2.out" },
            0.5,
          )
          .set(q(".hero-outro"), { autoAlpha: 1 }, 0.5)
          .fromTo(
            q(".hero-outro-a > *"),
            { autoAlpha: 0, x: () => (isDesktop() ? -60 : 0), y: () => (isDesktop() ? 0 : -24) },
            { autoAlpha: 1, x: 0, y: 0, duration: 0.3, stagger: 0.07, ease: "power2.out" },
            0.55,
          )
          .fromTo(
            q(".hero-outro-b > *"),
            { autoAlpha: 0, x: () => (isDesktop() ? 60 : 0), y: () => (isDesktop() ? 0 : 24) },
            { autoAlpha: 1, x: 0, y: 0, duration: 0.3, stagger: 0.07, ease: "power2.out" },
            0.6,
          )
          // hold the finished arch and tagline for a moment before the next section comes up
          .to({}, { duration: 0.35 });

        // Scrolling sets where the change should be; each frame the animation moves towards it,
        // easing in near the end but never faster than the whole change in FULL_SECONDS.
        // So however fast someone scrolls, the photo still shrinks into the arch slowly.
        const FULL_SECONDS = 3.6;
        let target = 0;
        follow = () => {
          const now = shrink.progress();
          const gap = target - now;
          if (Math.abs(gap) < 0.0005) {
            if (gap !== 0) shrink.progress(target);
            return;
          }
          const dt = Math.min(gsap.ticker.deltaRatio(60), 3) / 60;
          const cap = dt / FULL_SECONDS;
          shrink.progress(now + gsap.utils.clamp(-cap, cap, gap * Math.min(1, dt * 5)));
        };
        gsap.ticker.add(follow);
        // The hero holds still with position: sticky inside its tall wrapper (not a fixed-position
        // pin, which phones' sliding address bar can shift and leave a gap above). Phones where the
        // hero is taller than the screen hold it once its bottom reaches the screen bottom.
        const holdAt = () => Math.max(0, el.offsetHeight - window.innerHeight);
        const HOLD = 2.5; // screens of scrolling while the photo shrinks
        ScrollTrigger.create({
          trigger: wrap,
          start: () => `top+=${holdAt()} top`,
          end: () => `+=${window.innerHeight * HOLD}`,
          refreshPriority: 1,
          // before measuring: where the hero sticks, and the scroll room the hold needs (a spacer
          // under the hero inside the wrapper; sticky can't use the wrapper's padding)
          onRefreshInit: () => {
            el.style.top = `${-holdAt()}px`;
            const room = wrap.querySelector<HTMLElement>(":scope > .hero-room");
            if (room) room.style.height = `${window.innerHeight * HOLD}px`;
          },
          onUpdate: (self) => (target = self.progress),
          // sizes changed: re-measure the arch from the start state, then jump to the current point.
          // Untouched until the first scroll, so it never records the page mid-intro.
          onRefresh: (self) => {
            target = self.progress;
            if (shrink.progress() > 0) shrink.progress(0);
            shrink.invalidate();
            if (self.progress > 0) shrink.progress(self.progress);
          },
        });

        // The hold adds scroll space, so re-measure sections further down that were set up before it
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      });

      document.fonts.ready.then(start);
      return () => {
        alive = false;
        if (follow) gsap.ticker.remove(follow);
      };
    },
    { scope: root },
  );

  return (
    // The wrapper gives the scroll room while the hero holds still; its colour follows the hero's
    <div ref={track} className="hero-track bg-night">
      <section
        id="home"
        ref={root}
        aria-label="Introduction"
        className="sticky top-0 isolate flex min-h-svh flex-col overflow-hidden bg-night text-cream"
      >
        {/* Photos */}
        <div data-reveal className="hero-media absolute inset-0 -z-20 overflow-hidden">
          <div className="hero-slides absolute inset-0">
            {heroSlides.map((slide, i) => (
              <div
                key={slide.src}
                className="hero-slide absolute inset-0 overflow-hidden"
                style={{ zIndex: i === 0 ? 3 : 1 }}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  preload={i === 0}
                  sizes="(max-aspect-ratio: 3/2) 160vh, 108vw"
                  className="object-cover [object-position:var(--pos-m)] lg:[object-position:var(--pos)]"
                  style={{ "--pos": slide.position, "--pos-m": slide.mobilePosition } as React.CSSProperties}
                />
              </div>
            ))}
            {[0, 1].map((k) => (
              <div
                key={k}
                aria-hidden
                className="hero-seam invisible absolute inset-y-0 z-[6] w-0.5 -translate-x-1/2 bg-brand-light shadow-[0_0_24px_6px_color-mix(in_oklab,var(--color-brand-light)_60%,transparent)]"
                style={{ left: "50%" }}
              />
            ))}
          </div>

          {/* Shading only where the text sits, so the photos keep their colours. Fades out in the arch. */}
          <div aria-hidden className="hero-shade shade-left absolute inset-0 z-[5] hidden lg:block" />
          <div aria-hidden className="hero-shade shade-bottom absolute inset-0 z-[5] hidden lg:block" />
          <div aria-hidden className="hero-shade shade-mobile absolute inset-0 z-[5] lg:hidden" />
          <div aria-hidden className="hero-shade shade-top absolute inset-x-0 top-0 z-[5] h-40" />
        </div>

        {/* Shown once the photo has shrunk into the arch */}
        <div
          aria-hidden
          className="hero-arch-line invisible absolute rounded-t-full rounded-b-[16px] border border-brand/70"
          style={{
            left: "calc(var(--arch-left, 0px) - 14px)",
            top: "calc(var(--arch-top, 0px) - 14px)",
            width: "calc(var(--arch-w, 0px) + 28px)",
            height: "calc(var(--arch-h, 0px) + 28px)",
          }}
        />
        {/* Beside the arch once the photo has shrunk: tagline, short intro and a link to the story */}
        <div className="hero-outro hero-outro-a invisible absolute inset-x-0 bottom-[calc(100%_-_var(--arch-top,0px)_+_1.5rem)] z-10 flex flex-col items-center gap-3 px-6 text-center lg:inset-x-auto lg:right-[calc(100%_-_var(--arch-left,0px)_+_3.5rem)] lg:bottom-auto lg:top-[calc(var(--arch-top,0px)_+_var(--arch-h,0px)_/_2)] lg:w-[calc(var(--arch-left,0px)_-_6rem)] lg:max-w-[26rem] lg:-translate-y-1/2 lg:items-end lg:gap-5 lg:px-0 lg:text-right">
          <p className="font-display text-[clamp(1.8rem,3.2vw,3.4rem)] leading-[1.1] text-accent-deep">
            {heroOutro.left}
          </p>
          <p className="max-w-[34ch] text-[0.9rem] text-pretty leading-[1.75] text-ink/70 lg:text-[0.98rem]">
            {heroOutro.intro}
          </p>
        </div>
        <div className="hero-outro hero-outro-b invisible absolute inset-x-0 top-[calc(var(--arch-top,0px)_+_var(--arch-h,0px)_+_1.5rem)] z-10 flex flex-col items-center gap-4 px-6 text-center lg:inset-x-auto lg:left-[calc(var(--arch-left,0px)_+_var(--arch-w,0px)_+_3.5rem)] lg:top-[calc(var(--arch-top,0px)_+_var(--arch-h,0px)_/_2)] lg:w-[calc(var(--arch-left,0px)_-_6rem)] lg:max-w-[26rem] lg:-translate-y-1/2 lg:items-start lg:gap-6 lg:px-0 lg:text-left">
          <p className="font-display text-[clamp(1.8rem,3.2vw,3.4rem)] leading-[1.1]">
            <span className="foil-deep">{heroOutro.right}</span>
          </p>
          <p className="font-heading text-[0.68rem] font-semibold tracking-[0.24em] text-ink/55 uppercase">
            Weddings · Celebrations · Little ones
          </p>
          <a
            href={heroOutro.cta.href}
            onClick={(e) => scrollTo(e)}
            className="group inline-flex items-center gap-3 border border-accent-deep/35 px-6 py-3 font-heading text-[0.72rem] font-semibold tracking-[0.16em] text-accent-deep uppercase transition-colors duration-500 hover:border-accent-deep hover:bg-accent-deep hover:text-cream"
          >
            {heroOutro.cta.label}
            <ArrowIcon className="size-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
          </a>
        </div>

        {/* Copy */}
        <div className="relative mx-auto flex w-full max-w-[1320px] flex-1 items-end px-5 pt-32 pb-20 sm:px-8 sm:pt-40 lg:items-center lg:px-12 lg:pt-36 lg:pb-16 [@media(min-width:1024px)_and_(max-height:820px)]:pt-28 [@media(min-width:1024px)_and_(max-height:820px)]:pb-10">
          <div className="hero-copy max-w-[780px]">
            <div data-reveal className="hero-ornament mb-6 hidden items-center gap-4 text-accent sm:flex">
              <LotusMark className="h-6 w-8" />
              <span
                aria-hidden
                className="hero-ornament-line h-px w-16 origin-left bg-gradient-to-r from-accent to-transparent"
              />
            </div>
            <p
              data-reveal
              className="hero-kicker mb-5 font-heading text-[0.68rem] font-semibold tracking-[0.24em] text-brand-light uppercase sm:text-[0.78rem] sm:tracking-[0.32em]"
            >
              Weddings · Celebrations · Little ones
            </p>

            <h1
              data-reveal
              className="hero-title font-display text-[clamp(2.4rem,4.6vw,4.8rem)] leading-[1.08] text-cream [text-shadow:0_2px_24px_rgb(14_12_11/0.35)]"
            >
              <span className="hero-line block">
                Capturing the{" "}
                <span className="hero-foil-mask -mb-[0.16em] inline-block overflow-hidden pb-[0.16em] align-bottom">
                  <span className="hero-foil foil inline-block [text-shadow:none]">colours</span>
                </span>
              </span>
              <span className="hero-line block">of every celebration</span>
            </h1>

            <p
              data-reveal
              className="hero-sub mt-6 max-w-[48ch] text-[0.98rem] leading-[1.85] font-light text-cream/85 sm:text-[1.05rem]"
            >
              From wedding rituals and baby showers to first birthdays, we capture your family&apos;s most
              precious moments with love and tradition.
            </p>

            <div data-reveal className="hero-cta mt-9 flex flex-wrap items-center gap-4">
              <Magnetic>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn-brand">
                  <ChatIcon className="size-[1.15rem]" />
                  Book on WhatsApp
                </a>
              </Magnetic>
              <a href="#portfolio" onClick={(e) => scrollTo(e)} className="btn-ghost group">
                View portfolio
                <ArrowIcon className="size-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
              </a>
            </div>

          </div>
        </div>

        {/* Slide dots: the active one stretches and fills while its photo plays */}
        <div
          data-reveal
          role="group"
          aria-label="Choose a photo"
          className="hero-dots absolute inset-x-0 bottom-6 z-10 mx-auto flex w-fit items-center lg:bottom-10"
        >
          {heroSlides.map((slide, i) => (
            <button
              key={slide.label}
              type="button"
              onClick={() => goTo.current(i)}
              data-active={i === 0 ? "" : undefined}
              aria-current={i === 0}
              aria-label={`Photo ${i + 1}: ${slide.label}`}
              className="hero-dot group grid h-7 place-items-center px-[5px]"
            >
              <span className="relative block h-2 w-2 overflow-hidden rounded-full bg-cream/50 transition-[width,background-color] duration-700 ease-luxe group-hover:bg-cream/85 group-data-active:w-10 group-data-active:bg-cream/30">
                <span className="hero-dot-fill absolute inset-0 origin-left scale-x-0 rounded-full bg-accent" />
              </span>
            </button>
          ))}
        </div>
      </section>
      <div aria-hidden className="hero-room" />
    </div>
  );
}
