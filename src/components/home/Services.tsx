"use client";

import Image from "next/image";
import { useId, useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { serviceDetails } from "@/content/site";
import { whatsappLink } from "@/lib/whatsapp";
import { ChatIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";

const SHOT_SECONDS = 3.5;
const pad = (n: number) => String(n).padStart(2, "0");
const total = serviceDetails.length;

const enquiry = (name: string) =>
  whatsappLink(`Hi DS Photography! I'd like to know more about ${name.toLowerCase()} photography.`);

// Aperture opening: an octagon cut out of a black plate. Scaling it to 0 closes the iris.
const R = 150;
const octagon = Array.from({ length: 8 }, (_, i) => {
  const a = (Math.PI / 4) * i + Math.PI / 8;
  return [Math.cos(a) * R, Math.sin(a) * R] as const;
});
const octagonPoints = octagon.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
// Blade edges: each side of the octagon carried on past its corner
const bladeLines = octagon.map(([x, y], i) => {
  const [px, py] = octagon[(i + 7) % 8];
  const len = Math.hypot(x - px, y - py);
  return { x1: x, y1: y, x2: x + ((x - px) / len) * 420, y2: y + ((y - py) / len) * 420 };
});

const cornerClasses = [
  "top-4 left-4 border-t border-l sm:top-6 sm:left-6",
  "top-4 right-4 border-t border-r sm:top-6 sm:right-6",
  "bottom-4 left-4 border-b border-l sm:bottom-6 sm:left-6",
  "bottom-4 right-4 border-b border-r sm:bottom-6 sm:right-6",
];

export function Services() {
  const root = useRef<HTMLElement>(null);
  const goTo = useRef<(index: number) => void>(() => {});
  const maskId = `vf-iris-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useGSAP(
    (_, contextSafe) => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Touch screens skip the blur as a new photo pulls into focus: blur is heavy for phones to draw
      const blurIn = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

      const viewfinder = q<HTMLElement>(".vf")[0];
      const slides = q<HTMLElement>(".vf-slide");
      const names = q<HTMLElement>(".vf-name");
      const ctas = q<HTMLElement>(".vf-cta");
      const thumbs = q<HTMLElement>(".vf-thumb");
      const fills = q<HTMLElement>(".vf-thumb-fill");
      const iris = q<SVGGElement>(".vf-iris-move");
      const flash = q<HTMLElement>(".vf-flash")[0];
      const focus = q<HTMLElement>(".vf-focus")[0];
      const readout = {
        mode: q<HTMLElement>(".vf-mode")[0],
        count: q<HTMLElement>(".vf-count")[0],
        lens: q<HTMLElement>(".vf-lens")[0],
        aperture: q<HTMLElement>(".vf-aperture")[0],
        shutter: q<HTMLElement>(".vf-shutter")[0],
        iso: q<HTMLElement>(".vf-iso")[0],
      };

      const accent = getComputedStyle(el).getPropertyValue("--color-accent").trim() || "#c8102e";
      let current = 0;
      let busy = false;
      let queued: number | null = null;
      let inView = false;
      let progress: gsap.core.Tween | null = null;

      gsap.set([...slides, ...names, ...ctas], { autoAlpha: 0 });
      gsap.set([slides[0], names[0], ctas[0]], { autoAlpha: 1 });
      gsap.set(iris, { svgOrigin: "0 0" });

      // Camera readouts flicker to their new values
      const setReadout = (i: number) => {
        const s = serviceDetails[i];
        const values: [HTMLElement, string][] = [
          [readout.mode, s.name.toUpperCase()],
          [readout.lens, s.exif.lens],
          [readout.aperture, s.exif.aperture],
          [readout.shutter, s.exif.shutter],
          [readout.iso, s.exif.iso],
          [readout.count, `${pad(i + 1)}/${pad(total)}`],
        ];
        values.forEach(([node, text]) => {
          if (reduce) node.textContent = text;
          else
            gsap.to(node, {
              duration: 0.7,
              scrambleText: { text, chars: "0123456789/ABCDEFGHIJKLMNOPQRSTUVWXYZ", speed: 0.6 },
            });
        });
      };

      // Photos after the first wait (display: none, so they don't download with the page);
      // the next one is woken while the current one is on screen
      const wake = (i: number) => slides[i]?.removeAttribute("data-wait");

      const startProgress = () => {
        progress?.kill();
        gsap.set(fills, { scaleX: 0 });
        if (!inView) return;
        wake((current + 1) % total);
        progress = gsap.fromTo(
          fills[current],
          { scaleX: 0 },
          { scaleX: 1, duration: SHOT_SECONDS, ease: "none", onComplete: () => go((current + 1) % total) },
        );
      };

      // Shutter: iris snaps shut, flash, the next photo appears and pulls into focus
      const go = contextSafe!((next: number) => {
        if (busy) {
          queued = next; // play it as soon as the current shutter finishes
          return;
        }
        // Clicking the photo already showing takes the shot again
        busy = true;
        progress?.kill();
        wake(next); // a thumbnail can jump to a photo that hasn't been woken yet
        const prev = current;
        current = next;
        thumbs.forEach((t, k) => {
          t.toggleAttribute("data-active", k === next);
          t.setAttribute("aria-pressed", String(k === next));
        });
        setReadout(next);

        const swap = () => {
          gsap.set([slides[prev], names[prev], ctas[prev]], { autoAlpha: 0 });
          gsap.set([slides[next], names[next], ctas[next]], { autoAlpha: 1 });
        };
        const done = () => {
          busy = false;
          if (queued !== null && queued !== current) {
            const q2 = queued;
            queued = null;
            go(q2);
            return;
          }
          queued = null;
          startProgress();
        };

        if (reduce) {
          swap();
          gsap.fromTo(slides[next], { opacity: 0 }, { opacity: 1, duration: 0.6, onComplete: done });
          return;
        }

        gsap
          .timeline({ onComplete: done })
          .to(iris, { scale: 0, rotation: 70, svgOrigin: "0 0", duration: 0.32, ease: "power2.in" })
          .add(swap)
          .set(flash, { opacity: 0.45 })
          .to(iris, { scale: 1, rotation: 140, svgOrigin: "0 0", duration: 0.6, ease: "power3.out" })
          .set(iris, { rotation: 0 })
          .to(flash, { opacity: 0, duration: 0.7, ease: "power2.out" }, "<-0.6")
          .fromTo(
            slides[next].querySelectorAll("img"),
            blurIn ? { scale: 1.12, filter: "blur(10px)" } : { scale: 1.12 },
            blurIn
              ? { scale: 1, filter: "blur(0px)", duration: 1.2, ease: "power3.out" }
              : { scale: 1, duration: 1.2, ease: "power3.out" },
            "<",
          )
          .fromTo(
            focus,
            { scale: 1.6, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(2)" },
            "<0.15",
          )
          .to(focus, { color: accent, duration: 0.12, repeat: 3, yoyo: true }, ">-0.05")
          .fromTo(
            names[next].firstElementChild,
            { yPercent: 110 },
            { yPercent: 0, duration: 0.9, ease: "expo.out" },
            "<-0.5",
          )
          .fromTo(ctas[next], { y: 14 }, { y: 0, duration: 0.8, ease: "expo.out" }, "<0.12");
      });
      goTo.current = (i) => go(i);

      // Auto-advance only while the section is on screen
      ScrollTrigger.create({
        trigger: viewfinder,
        start: "top 75%",
        end: "bottom 25%",
        onToggle: (self) => {
          inView = self.isActive;
          if (inView && !busy) startProgress();
          else progress?.pause();
        },
      });

      // Swipe on touch screens
      let startX = 0;
      const onDown = (e: PointerEvent) => (startX = e.clientX);
      const onUp = (e: PointerEvent) => {
        if (e.pointerType === "mouse") return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 45) go((current + (dx < 0 ? 1 : total - 1)) % total);
      };
      viewfinder.addEventListener("pointerdown", onDown);
      viewfinder.addEventListener("pointerup", onUp);

      /* ── Entrance: heading rises, the camera powers on ── */
      if (!reduce) {
        const split = SplitText.create(q(".svc-title"), {
          type: "words",
          mask: "words",
          ignore: q(".svc-foil-mask"),
        });
        gsap.set(split.masks, { paddingBottom: "0.12em", marginBottom: "-0.12em" });
        gsap
          .timeline({
            scrollTrigger: { trigger: q(".svc-head")[0], start: "top 80%", once: true },
            defaults: { ease: "expo.out" },
          })
          .from(q(".svc-eyebrow"), { autoAlpha: 0, y: 16, duration: 0.9 }, 0)
          .from(split.words, { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.1)
          .from(q(".svc-foil"), { yPercent: 115, duration: 1.1 }, 0.38)
          .from(q(".svc-intro"), { autoAlpha: 0, y: 20, duration: 1 }, 0.4);

        gsap
          .timeline({
            scrollTrigger: { trigger: viewfinder, start: "top 72%", once: true },
            defaults: { ease: "expo.out" },
          })
          .from(viewfinder, { scale: 0.94, autoAlpha: 0, duration: 1.1 }, 0)
          .fromTo(
            iris,
            { scale: 0, rotation: -80, svgOrigin: "0 0" },
            { scale: 1, rotation: 0, svgOrigin: "0 0", duration: 1.3, ease: "power3.inOut" },
            0.35,
          )
          .from(
            q(".vf-corner"),
            {
              x: (i: number) => (i % 2 ? -50 : 50),
              y: (i: number) => (i < 2 ? 50 : -50),
              autoAlpha: 0,
              duration: 1,
            },
            0.45,
          )
          .from(q(".vf-grid"), { autoAlpha: 0, duration: 1.2 }, 0.8)
          .from(
            q(".vf-hud"),
            { autoAlpha: 0, y: (i: number) => (i === 0 ? -10 : 10), duration: 0.8, stagger: 0.1 },
            0.9,
          )
          .add(() => setReadout(0), 0.9)
          .fromTo(
            focus,
            { scale: 1.8, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(2)" },
            1.2,
          )
          .from(names[0].firstElementChild, { yPercent: 110, duration: 1 }, 1.2)
          .from(ctas[0], { autoAlpha: 0, y: 16, duration: 0.9 }, 1.35)
          .from(thumbs, { autoAlpha: 0, y: 30, duration: 0.8, stagger: 0.06 }, 0.6);
      }

      return () => {
        viewfinder.removeEventListener("pointerdown", onDown);
        viewfinder.removeEventListener("pointerup", onUp);
      };
    },
    { scope: root },
  );

  const first = serviceDetails[0];

  return (
    <section
      id="services"
      ref={root}
      aria-labelledby="services-title"
      className="relative overflow-hidden bg-night py-24 text-cream lg:py-32"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        {/* Heading */}
        <div className="svc-head mb-12 grid items-end gap-6 lg:mb-14 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="svc-eyebrow mb-5 flex items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-brand-light uppercase">
              <LotusMark className="h-4 w-6 text-accent" />
              What we capture
            </p>
            <h2
              id="services-title"
              className="svc-title font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.06]"
            >
              Every ritual, every{" "}
              <span className="svc-foil-mask -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                <span className="svc-foil foil inline-block">milestone</span>
              </span>
            </h2>
          </div>
          <p className="svc-intro max-w-[44ch] text-[1rem] leading-[1.8] text-cream/65 lg:justify-self-end">
            Seven kinds of shoots, one way of seeing. Tap a frame below, or let the camera take you through
            each one.
          </p>
        </div>

        {/* Viewfinder */}
        <div
          className="vf relative mx-auto aspect-[4/5] w-full touch-pan-y overflow-hidden rounded-[4px] bg-black select-none sm:aspect-[3/2] sm:w-[min(100%,calc(76svh*1.5))]"
          aria-roledescription="carousel"
          aria-label="Our services"
        >
          {/* Photos */}
          {serviceDetails.map((s, i) => (
            <div
              key={s.name}
              data-wait={i ? "" : undefined}
              className={`vf-slide absolute inset-0 data-wait:hidden ${i ? "invisible" : ""}`}
            >
              <Image
                src={s.tall.src}
                alt={s.tall.alt}
                fill
                sizes="100vw"
                className="object-cover sm:hidden"
                style={{ objectPosition: s.tall.position }}
              />
              <Image
                src={s.wide.src}
                alt={s.wide.alt}
                fill
                sizes="(min-width: 1320px) 1224px, 100vw"
                className="hidden object-cover sm:block"
                style={{ objectPosition: s.wide.position }}
              />
            </div>
          ))}

          {/* Shading: soft vignette + dark base for the text */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.45)_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-3/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/55 to-transparent"
          />

          {/* Rule-of-thirds grid */}
          <div aria-hidden className="vf-grid pointer-events-none absolute inset-0 z-10 hidden sm:block">
            <span className="absolute inset-y-0 left-1/3 w-px bg-cream/12" />
            <span className="absolute inset-y-0 left-2/3 w-px bg-cream/12" />
            <span className="absolute inset-x-0 top-1/3 h-px bg-cream/12" />
            <span className="absolute inset-x-0 top-2/3 h-px bg-cream/12" />
          </div>

          {/* Frame corners */}
          {cornerClasses.map((c, i) => (
            <span
              key={i}
              aria-hidden
              className={`vf-corner pointer-events-none absolute z-20 size-7 border-cream/85 sm:size-10 ${c}`}
            />
          ))}

          {/* Focus box */}
          <div
            aria-hidden
            className="vf-focus pointer-events-none absolute top-[42%] left-1/2 z-20 -mt-6 -ml-9 h-12 w-[4.5rem] text-cream sm:top-1/2 sm:-mt-8 sm:-ml-12 sm:h-16 sm:w-24"
          >
            <span className="absolute top-0 left-0 size-3 border-t border-l border-current" />
            <span className="absolute top-0 right-0 size-3 border-t border-r border-current" />
            <span className="absolute bottom-0 left-0 size-3 border-b border-l border-current" />
            <span className="absolute right-0 bottom-0 size-3 border-r border-b border-current" />
            <span className="absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
          </div>

          {/* Top readout */}
          <div
            aria-hidden
            className="vf-hud pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-12 pt-5 font-mono text-[0.62rem] tracking-[0.14em] text-cream/85 uppercase sm:px-20 sm:pt-8 sm:text-[0.7rem]"
          >
            <span className="flex items-center gap-2.5">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              <span className="hidden text-cream/55 sm:inline">Mode</span>
              <span className="vf-mode text-brand-light">{first.name.toUpperCase()}</span>
            </span>
            <span className="flex items-center gap-3 sm:gap-4">
              <span className="hidden sm:inline">RAW</span>
              <span className="hidden items-center gap-0.5 sm:flex">
                <span className="h-2.5 w-5 rounded-[2px] border border-cream/70 p-px">
                  <span className="block h-full w-3/4 bg-cream/80" />
                </span>
                <span className="h-1 w-0.5 bg-cream/70" />
              </span>
              <span className="vf-count tabular-nums">{`01/${pad(total)}`}</span>
            </span>
          </div>

          {/* Service name and enquiry */}
          <div className="absolute inset-x-0 bottom-0 z-20 p-6 pb-7 sm:max-w-[60%] sm:p-10 lg:p-12">
            <div className="grid">
              {serviceDetails.map((s, i) => (
                <h3
                  key={s.name}
                  className={`vf-name overflow-hidden pb-[0.08em] [grid-area:1/1] ${i ? "invisible" : ""}`}
                >
                  <span className="block font-display text-[clamp(2.2rem,5vw,4.4rem)] leading-[1.05]">
                    {s.name}
                  </span>
                </h3>
              ))}
            </div>
            <div className="mt-5 grid justify-items-start">
              {serviceDetails.map((s, i) => (
                <a
                  key={s.name}
                  href={enquiry(s.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`vf-cta btn-brand btn-sm [grid-area:1/1] ${i ? "invisible" : ""}`}
                  aria-label={`Enquire about ${s.name} on WhatsApp`}
                >
                  <ChatIcon className="size-4" />
                  Enquire
                </a>
              ))}
            </div>
          </div>

          {/* Bottom-right exposure readout (desktop) */}
          <div
            aria-hidden
            className="vf-hud pointer-events-none absolute right-0 bottom-0 z-20 hidden flex-col items-end gap-3 p-10 font-mono text-[0.7rem] tracking-[0.12em] text-cream/85 uppercase lg:flex lg:p-12"
          >
            <span className="flex gap-5 tabular-nums">
              <span className="vf-lens">{first.exif.lens}</span>
              <span className="vf-shutter">{first.exif.shutter}</span>
              <span className="vf-aperture text-brand-light">{first.exif.aperture}</span>
              <span className="vf-iso">{first.exif.iso}</span>
            </span>
            <span className="flex items-end gap-[5px] text-[0.55rem] text-cream/55">
              <span className="mr-1">-2</span>
              {Array.from({ length: 13 }, (_, i) => (
                <span
                  key={i}
                  className={`w-px ${i === 6 ? "h-3 bg-accent" : i % 3 === 0 ? "h-2 bg-cream/70" : "h-1 bg-cream/40"}`}
                />
              ))}
              <span className="ml-1">+2</span>
            </span>
          </div>

          {/* Shutter iris and flash */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-30 size-full"
            viewBox="-100 -100 200 200"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <mask id={maskId}>
                <rect x="-1000" y="-1000" width="2000" height="2000" fill="white" />
                <g className="vf-iris-move">
                  <polygon points={octagonPoints} fill="black" />
                </g>
              </mask>
            </defs>
            <rect x="-1000" y="-1000" width="2000" height="2000" fill="#050505" mask={`url(#${maskId})`} />
            <g className="vf-iris-move">
              {bladeLines.map((l, i) => (
                <line key={i} {...l} stroke="#2a2626" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          </svg>
          <div
            aria-hidden
            className="vf-flash pointer-events-none absolute inset-0 z-40 bg-white opacity-0"
          />
        </div>

        {/* Contact-sheet thumbnails */}
        <div className="-mx-5 mt-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-auto lg:grid lg:w-[min(100%,calc(76svh*1.5))] lg:grid-cols-7 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
          {serviceDetails.map((s, i) => (
            <button
              key={s.name}
              type="button"
              onClick={() => goTo.current(i)}
              data-active={i === 0 ? "" : undefined}
              aria-pressed={i === 0}
              aria-label={`Show ${s.name}`}
              className="vf-thumb group w-28 shrink-0 snap-start text-left sm:w-32 lg:w-auto"
            >
              <span className="relative block aspect-[3/2] overflow-hidden rounded-[3px] ring-1 ring-cream/15 transition duration-500 group-hover:ring-cream/40 group-data-active:ring-brand">
                <Image
                  src={s.wide.src}
                  alt=""
                  fill
                  sizes="180px"
                  className="object-cover opacity-50 grayscale transition duration-500 group-hover:opacity-90 group-hover:grayscale-0 group-data-active:opacity-100 group-data-active:grayscale-0"
                  style={{ objectPosition: s.wide.position }}
                />
              </span>
              <span className="mt-2 flex items-center justify-between gap-2 font-mono text-[0.6rem] tracking-[0.12em] text-cream/50 uppercase transition-colors group-hover:text-cream/80 group-data-active:text-brand-light">
                <span className="truncate">{s.name}</span>
                <span className="tabular-nums">{pad(i + 1)}</span>
              </span>
              <span className="relative mt-1.5 block h-px overflow-hidden bg-cream/15">
                <span className="vf-thumb-fill absolute inset-0 origin-left scale-x-0 bg-accent" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
