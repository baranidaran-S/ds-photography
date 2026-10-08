"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import type { HeroSlide } from "@/content/site";
import { useEnquiry, useSite } from "@/components/providers/SiteProvider";
import { useAnchorScroll } from "@/hooks/useAnchorScroll";
import { Magnetic } from "@/components/ui/Magnetic";
import { ArrowIcon, ChatIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";
import type { HeroCopy } from "@/content/db";

const SLIDE_SECONDS = 6;
const DOOR_SECONDS = 1.7; // how long a new photo takes to open
// Phones move quicker: each photo stays a shorter time and opens faster
const PHONE_SLIDE_SECONDS = 3.5;
const PHONE_DOOR_SECONDS = 1.1;

type HeroOutro = {
  left: string;
  right: string;
  intro: string;
  cta: { label: string; href: string };
};

export function Hero({
  slides: heroSlides,
  outro: heroOutro,
  copy,
}: {
  slides: HeroSlide[];
  outro: HeroOutro;
  copy: HeroCopy;
}) {
  const root = useRef<HTMLElement>(null);
  const enquire = useEnquiry();
  const { site } = useSite();
  // Tall wrapper the hero sticks inside while the photo shrinks into the arch
  const track = useRef<HTMLDivElement>(null);
  const goTo = useRef<(index: number) => void>(() => {});
  const scrollTo = useAnchorScroll();
  const lenisRef = useRef<Lenis | undefined>(undefined);
  const lenis = useLenis();
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useGSAP(
    (_, contextSafe) => {
      window.__dsReady = true;
      let alive = true;
      let stopEarly: (() => void) | null = null;

      const start = contextSafe!(() => {
        if (!alive || !root.current) return;
        const q = gsap.utils.selector(root);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        /* ── Full-screen slideshow ─────────────────────────── */
        const slides = q<HTMLElement>(".hero-slide");
        const dots = q<HTMLElement>(".hero-dot");
        const dotFills = q<HTMLElement>(".hero-dot-fill");
        const seams = q<HTMLElement>(".hero-seam");
        const doors = q<HTMLElement>(".hero-door");
        // the two lights travel from the centre to the edges (moved, not re-laid-out, so phones keep up)
        const seamTo = (k: number, seam: HTMLElement) =>
          (k === 0 ? -0.5 : 0.5) * (seam.parentElement?.clientWidth ?? 0);
        const imgOf = (i: number) => slides[i].querySelector("img");

        let current = 0;
        let busy = false;
        let progress: gsap.core.Tween | null = null;
        let drift: gsap.core.Tween | null = null;

        const phone = window.matchMedia("(max-width: 767px)");
        const slideSeconds = () => (phone.matches ? PHONE_SLIDE_SECONDS : SLIDE_SECONDS);
        const doorSeconds = () => (phone.matches ? PHONE_DOOR_SECONDS : DOOR_SECONDS);

        gsap.set(slides, { zIndex: 1, autoAlpha: 0 });
        gsap.set(slides[0], { zIndex: 3, autoAlpha: 1 });

        // Slow Ken Burns zoom on the active photo
        const startDrift = (i: number, from: number) => {
          drift?.kill();
          if (reduce) return;
          drift = gsap.fromTo(
            imgOf(i),
            { scale: from },
            { scale: 1, duration: slideSeconds() + 2.5, ease: "power1.out" },
          );
        };

        // Photos after the first wait (display: none, so they don't download with the page);
        // each one is woken while the photo before it plays, and unpacked (decoded) in advance so
        // the phone doesn't stop to do it the moment the photo starts to open
        const wake = (i: number) => {
          if (!slides[i]?.hasAttribute("data-wait")) return;
          slides[i].removeAttribute("data-wait");
          imgOf(i)?.decode().catch(() => {});
        };

        const runProgress = () => {
          progress?.kill();
          wake((current + 1) % slides.length);
          gsap.set(dotFills, { scaleX: 0 });
          progress = gsap.fromTo(
            dotFills[current],
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: slideSeconds(),
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
          wake(next); // a dot can jump ahead to a photo that hasn't been woken yet

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
            const door = doorSeconds();
            tl.fromTo(
              incoming,
              { clipPath: "inset(0% 50% 0% 50%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: door, ease: "expo.inOut" },
              0,
            )
              .fromTo(seams, { x: 0, autoAlpha: 1 }, { x: seamTo, duration: door, ease: "expo.inOut" }, 0)
              .to(seams, { autoAlpha: 0, duration: 0.35 }, door - 0.3)
              .to(imgOf(prev), { scale: 1.06, duration: door, ease: "expo.inOut" }, 0);
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
          gsap.set(doors, { display: "none" });
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
          // the first photo opens from the centre: two dark doors slide apart (moving whole panels
          // is light for phones, unlike reshaping the full-screen photo every frame)
          .set(doors, { autoAlpha: 1 }, 0)
          .fromTo(
            doors,
            { xPercent: 0 },
            { xPercent: (k: number) => (k === 0 ? -100 : 100), duration: 1.9, ease: "expo.inOut" },
            0,
          )
          .set(doors, { display: "none" }, 1.9)
          .fromTo(seams, { x: 0, autoAlpha: 1 }, { x: seamTo, duration: 1.9, ease: "expo.inOut" }, 0)
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

        /* ── Scroll: hero holds still, the photo shrinks into an arch, the tagline appears beside it ──
           Set up once the intro has played, or as soon as the visitor starts scrolling: setting it up
           re-measures the whole page, a long job that would make the intro stutter on phones. */
        let scrollReady = false;
        const setupScroll = contextSafe!(() => {
          if (scrollReady || !alive || !root.current) return;
          scrollReady = true;
          stopEarly?.();
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
            );

          // One scroll plays the whole change: the photo shrinks into the arch by itself (it never
          // stops halfway) while the page glides to the end of the hold; scrolling back up into the
          // hold plays it in reverse. Scrolling is paused during the glide so one flick can't skip it.
          const GLIDE_SECONDS = 3;
          const glideEase = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2); // power1.inOut
          let inArch = false;
          let gliding = false;
          const glide = (toArch: boolean, self: ScrollTrigger) => {
            inArch = toArch;
            gsap.to(shrink, {
              progress: toArch ? 1 : 0,
              duration: GLIDE_SECONDS,
              ease: "power1.inOut",
              overwrite: true,
            });
            const lenis = lenisRef.current;
            // a menu link is already taking the page somewhere, or the page jumped right past the
            // hold (scrollbar drag, restored position): let it be, the change just plays along
            const jumpedPast = toArch ? self.progress >= 1 : self.progress <= 0;
            if (!lenis || lenis.userData.anchor || jumpedPast) return;
            // On computers only the mouse wheel glides the page; dragging the scrollbar or using the
            // keys moves it directly, so the page goes where it's taken and the change plays along
            const coarse = window.matchMedia("(pointer: coarse)").matches;
            if (!coarse && lenis.isScrolling !== "smooth") return;
            gliding = true;
            const to = toArch ? self.end : self.start;
            // Finger scrolling: hold the page still (which also stops the finger's leftover slide,
            // that would fight a moving page), let the change play, then jump to its end. The hero
            // is pinned all through the hold, so the jump can't be seen. Mouse wheels glide along.
            if (coarse) {
              lenis.stop();
              gsap.delayedCall(GLIDE_SECONDS, () => {
                lenis.start();
                lenis.scrollTo(to, { immediate: true, force: true });
                gliding = false;
              });
              return;
            }
            gsap.delayedCall(GLIDE_SECONDS, () => (gliding = false));
            lenis.scrollTo(to, { duration: GLIDE_SECONDS, easing: glideEase, lock: true, force: true });
          };
          // The hero holds still with position: sticky inside its tall wrapper (not a fixed-position
          // pin, which phones' sliding address bar can shift and leave a gap above). Phones where the
          // hero is taller than the screen hold it once its bottom reaches the screen bottom.
          const holdAt = () => Math.max(0, el.offsetHeight - window.innerHeight);
          const HOLD = 2.5; // screens of scroll room the hero holds for (the page glides through it)
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
            onUpdate: (self) => {
              if (gliding) return;
              if (!inArch && self.direction === 1 && self.progress > 0) glide(true, self);
              else if (inArch && self.direction === -1 && self.progress < 1) glide(false, self);
            },
            // sizes changed: re-measure the arch from the start state, then show the photo or the
            // finished arch. Untouched until the first scroll, so it never records the page mid-intro.
            onRefresh: (self) => {
              gsap.killTweensOf(shrink);
              if (shrink.progress() > 0) shrink.progress(0);
              shrink.invalidate();
              if (!gliding) inArch = self.progress > 0;
              if (inArch) shrink.progress(1);
            },
          });

          // The hold adds scroll space, so re-measure sections further down that were set up before it
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
        });
        const early = () => setupScroll();
        const inputs = ["wheel", "touchstart", "keydown", "scroll"] as const;
        inputs.forEach((type) => window.addEventListener(type, early, { passive: true }));
        stopEarly = () => inputs.forEach((type) => window.removeEventListener(type, early));
        gsap.delayedCall(3, setupScroll);
      });

      // Start once the fonts are in and the first photo is unpacked (decoded), so the doors open onto
      // a ready picture instead of the phone freezing to unpack it mid-intro; never wait over 1.5s
      const firstPhoto = root.current?.querySelector<HTMLImageElement>(".hero-slide img");
      const decoded = firstPhoto ? firstPhoto.decode().catch(() => {}) : Promise.resolve();
      document.fonts.ready
        .then(() => Promise.race([decoded, new Promise((done) => setTimeout(done, 1500))]))
        .then(start);
      return () => {
        alive = false;
        stopEarly?.();
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
                data-wait={i > 0 ? "" : undefined}
                className="hero-slide absolute inset-0 overflow-hidden data-wait:hidden"
                style={{ zIndex: i === 0 ? 3 : 1 }}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  preload={i === 0}
                  // phones held upright get a lighter file: plenty sharp behind the shading and text
                  sizes="(orientation: portrait) 75vh, (max-aspect-ratio: 3/2) 160vh, 108vw"
                  className="object-cover [object-position:var(--pos-m)] lg:[object-position:var(--pos)]"
                  style={{ "--pos": slide.position, "--pos-m": slide.mobilePosition } as React.CSSProperties}
                />
              </div>
            ))}
            {/* intro: two dark doors over the first photo that slide apart (hidden unless the intro runs) */}
            {[0, 1].map((k) => (
              <div
                key={`door-${k}`}
                aria-hidden
                className={`hero-door invisible absolute inset-y-0 z-[4] w-[calc(50%+1px)] bg-night ${k === 0 ? "left-0" : "right-0"}`}
              />
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
            {copy.eyebrow}
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
              {copy.eyebrow}
            </p>

            <h1
              data-reveal
              className="hero-title font-display text-[clamp(2.4rem,4.6vw,4.8rem)] leading-[1.08] text-cream [text-shadow:0_2px_24px_rgb(14_12_11/0.35)]"
            >
              {/* one block per line, with the chosen one in gold foil */}
              {copy.lines.map((line, i) => (
                <span key={`${i}-${line}`} className="hero-line block">
                  {i === copy.foilLine ? (
                    <span className="hero-foil-mask -mb-[0.16em] inline-block overflow-hidden pb-[0.16em] align-bottom">
                      <span className="hero-foil foil inline-block [text-shadow:none]">
                        {line}
                      </span>
                    </span>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </h1>

            <p
              data-reveal
              className="hero-sub mt-6 max-w-[48ch] text-[0.98rem] leading-[1.85] font-light text-cream/85 sm:text-[1.05rem]"
            >
              {copy.sub}
            </p>

            <div data-reveal className="hero-cta mt-9 flex flex-wrap items-center gap-4">
              <Magnetic>
                <button
                  type="button"
                  onClick={() => enquire({ source: "hero" })}
                  className="btn-brand"
                >
                  <ChatIcon className="size-[1.15rem]" />
                  {site.bookLabel}
                </button>
              </Magnetic>
              <a href="#portfolio" onClick={(e) => scrollTo(e)} className="btn-ghost group">
                {copy.portfolioLabel}
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
      {/* scroll room for the hold; sized from the start (the script fine-tunes it) so the sections
          below don't count as "near the screen" and download their photos early */}
      <div aria-hidden className="hero-room h-[250svh] motion-reduce:h-0" />
    </div>
  );
}
