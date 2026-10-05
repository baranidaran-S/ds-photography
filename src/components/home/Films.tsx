"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { films, type Film } from "@/content/site";
import { ArrowIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";

const pad = (n: number) => String(n).padStart(2, "0");

/** The 11-character video id from any YouTube link (watch?v=, youtu.be/, shorts/, embed/, live/) */
function youtubeId(url: string) {
  const m = url.match(
    /(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed|live)\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

/** The card picture: the photo set in photos.ts → films, otherwise the film's own YouTube thumbnail
    (the large one, falling back to the smaller one that every video has) */
function Poster({ film, sizes }: { film: Film; sizes: string }) {
  const id = youtubeId(film.url);
  const [small, setSmall] = useState(false);
  const own = film.thumbnail.src;
  const src = own
    ? own
    : id
      ? `https://i.ytimg.com/vi/${id}/${small ? "hqdefault" : "maxresdefault"}.jpg`
      : null;
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      onError={() => !own && setSmall(true)}
      className="fm-poster object-cover transition-transform duration-[1.4s] ease-luxe group-hover:scale-[1.06]"
      style={{ objectPosition: own ? film.thumbnail.position : "50% 50%" }}
    />
  );
}

/** Round play button */
function PlayButton({ large }: { large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`fm-play absolute top-1/2 left-1/2 grid -translate-1/2 place-items-center rounded-full bg-cream/90 text-night shadow-[0_18px_40px_-12px_rgb(0_0_0/0.6)] transition-[background-color,color,scale] duration-500 ease-luxe group-hover:scale-110 group-hover:bg-brand group-focus-visible:bg-brand ${
        large ? "size-20 sm:size-24" : "size-14 sm:size-16"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`relative translate-x-[8%] fill-current ${large ? "size-7 sm:size-8" : "size-5 sm:size-6"}`}
      >
        <path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.2 4.1a.8.8 0 0 0-1.2.7Z" />
      </svg>
    </span>
  );
}

type CardProps = { film: Film; index: number; onPlay: (i: number) => void };

/** The first film: a wide screen with the title over the picture */
function FeatureCard({ film, index, onPlay }: CardProps) {
  return (
    <button
      type="button"
      onClick={() => onPlay(index)}
      aria-label={`Play film ${pad(index + 1)}: ${film.title}, ${film.label}`}
      className="fm-feature group relative block aspect-[4/3] w-full overflow-hidden rounded-[6px] bg-cream/5 text-left sm:aspect-video"
    >
      <Poster film={film} sizes="(min-width: 1320px) 1224px, 100vw" />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/25 to-night/10"
      />
      <PlayButton large />
      {/* the "screen opens" entrance: two dark bars slide apart from a thin line of light (hidden
          until the animation sets them up, so the picture shows if animations are off) */}
      <span aria-hidden className="fm-bar invisible absolute inset-x-0 top-0 z-10 h-1/2 bg-night" />
      <span aria-hidden className="fm-bar invisible absolute inset-x-0 bottom-0 z-10 h-1/2 bg-night" />
      <span className="fm-feature-text absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
        <span className="block font-heading text-[0.68rem] font-bold tracking-[0.3em] text-brand-light uppercase">
          Film {pad(index + 1)}
        </span>
        <span className="mt-2 block font-display text-[clamp(1.6rem,3.4vw,2.9rem)] leading-[1.1] text-cream">
          {film.title}
        </span>
        <span className="mt-2 block text-[0.95rem] text-cream/75">
          {film.label}
        </span>
      </span>
    </button>
  );
}

/** A film with a smaller picture and the title underneath (the three under the big one, and the
    slides of the phone carousel) */
function FilmCard({
  film,
  index,
  onPlay,
  className,
}: CardProps & { className: string }) {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => onPlay(index)}
        aria-label={`Play film ${pad(index + 1)}: ${film.title}, ${film.label}`}
        className="group relative block aspect-video w-full overflow-hidden rounded-[6px] bg-cream/5"
      >
        <Poster film={film} sizes="(min-width: 1024px) 400px, (min-width: 640px) 33vw, 100vw" />
        <span
          aria-hidden
          className="absolute inset-0 bg-night/20 transition-colors duration-500 group-hover:bg-night/35"
        />
        <PlayButton />
      </button>
      <p className="mt-4 font-heading text-[0.66rem] font-bold tracking-[0.3em] text-brand-light uppercase">
        Film {pad(index + 1)}
      </p>
      <p className="mt-1.5 font-display text-[1.3rem] leading-snug text-cream">
        {film.title}
      </p>
      <p className="mt-1 text-[0.9rem] text-cream/65">{film.label}</p>
    </div>
  );
}

export function Films() {
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const lenis = useLenis();
  const [feature, ...rest] = films.list;

  /* ── Phone carousel: which film is in view, and the arrows ── */
  const track = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  // distance from one slide to the next (slide width + gap)
  const slideStep = (el: HTMLElement) => {
    const first = el.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + parseFloat(getComputedStyle(el).columnGap) : 1;
  };
  const onTrackScroll = () => {
    const el = track.current;
    if (!el) return;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
    setSlide(
      atEnd
        ? films.list.length - 1
        : Math.round(el.scrollLeft / slideStep(el)),
    );
  };
  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const to = gsap.utils.clamp(0, films.list.length - 1, i);
    el.scrollTo({ left: to * slideStep(el), behavior: "smooth" });
  };

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const q = gsap.utils.selector(el);

      /* ── Entrance: heading rises, the big screen opens from the middle, the other films follow ── */
      const split = SplitText.create(q(".fm-title"), {
        type: "words",
        mask: "words",
        ignore: q(".fm-foil-mask"),
      });
      gsap.set(split.masks, { paddingBottom: "0.12em", marginBottom: "-0.12em" });
      gsap
        .timeline({
          scrollTrigger: { trigger: q(".fm-head")[0], start: "top 80%", once: true },
          defaults: { ease: "expo.out" },
        })
        .from(q(".fm-eyebrow"), { autoAlpha: 0, y: 16, duration: 0.9 }, 0)
        .from(split.words, { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.1)
        .from(q(".fm-foil"), { yPercent: 115, duration: 1.1 }, 0.3)
        .from(q(".fm-intro"), { autoAlpha: 0, y: 20, duration: 1 }, 0.4);

      const mm = gsap.matchMedia();
      mm.add("(min-width: 640px)", () => {
        gsap
          .timeline({
            scrollTrigger: { trigger: q(".fm-feature")[0], start: "top 80%", once: true },
            defaults: { ease: "expo.inOut" },
          })
          // like a cinema screen: a thin line of light that opens up to the full picture — two dark
          // bars sliding apart (light for phones to draw, unlike reshaping the picture itself)
          .fromTo(
            q(".fm-feature .fm-bar"),
            { autoAlpha: 1, yPercent: (i: number) => (i ? 4 : -4) },
            { yPercent: (i: number) => (i ? 101 : -101), duration: 1.5 },
            0,
          )
          .from(q(".fm-feature .fm-poster"), { scale: 1.25, duration: 2.2, ease: "expo.out" }, 0.2)
          .from(q(".fm-feature .fm-play"), { scale: 0, duration: 1, ease: "back.out(1.7)" }, 0.9)
          .from(
            q(".fm-feature-text > span"),
            { autoAlpha: 0, y: 24, duration: 1, stagger: 0.08, ease: "expo.out" },
            0.9,
          );

        gsap
          .timeline({
            scrollTrigger: { trigger: q(".fm-grid")[0], start: "top 85%", once: true },
            defaults: { ease: "expo.out" },
          })
          .from(q(".fm-card"), { autoAlpha: 0, y: 60, duration: 1.2, stagger: 0.12 }, 0);
      });
      // Phones: the slides glide in from the right, then the arrows and dots
      mm.add("(max-width: 639px)", () => {
        gsap
          .timeline({
            scrollTrigger: { trigger: q(".fm-track")[0], start: "top 85%", once: true },
            defaults: { ease: "expo.out" },
          })
          .from(q(".fm-slide"), { autoAlpha: 0, x: 90, duration: 1.3, stagger: 0.1 }, 0)
          .from(q(".fm-slide .fm-play"), { scale: 0, duration: 1, ease: "back.out(1.7)" }, 0.5)
          .from(q(".fm-controls"), { autoAlpha: 0, y: 16, duration: 0.9 }, 0.5);
      });

      gsap.from(q(".fm-more"), {
        autoAlpha: 0,
        y: 20,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: q(".fm-more")[0], start: "top 92%", once: true },
      });
    },
    { scope: root },
  );

  /* ── Pop-up player: opens over the page, the film starts playing; Esc, ✕ or a click outside closes it ── */
  const open = (i: number) => {
    const d = dialog.current;
    if (!d) return;
    setActive(i);
    d.showModal();
    lenis?.stop();
    // opacity only (not visibility), so the close button can take keyboard focus straight away
    gsap.fromTo(d, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
    gsap.fromTo(
      d.querySelector(".fm-dialog-panel"),
      { scale: 0.9, y: 40, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.8, ease: "expo.out", delay: 0.05 },
    );
    d.querySelector<HTMLButtonElement>(".fm-close")?.focus();
  };

  const close = () => {
    const d = dialog.current;
    if (!d?.open) return;
    gsap.to(d.querySelector(".fm-dialog-panel"), {
      scale: 0.94,
      y: 24,
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
    });
    gsap.to(d, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        d.close();
        setActive(null); // removes the player, so the film stops
        lenis?.start();
      },
    });
  };

  const playing = active === null ? null : films.list[active];
  const playingId = playing ? youtubeId(playing.url) : null;

  return (
    <section
      id="films"
      ref={root}
      aria-labelledby="films-title"
      className="relative overflow-hidden bg-night py-24 text-cream lg:py-32"
    >
      {/* soft projector glow behind the big screen, and a gold hairline parting it from the section above */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[38%] left-1/2 h-[46rem] w-[80rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-brand)_10%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 mx-auto h-px max-w-[1320px] bg-gradient-to-r from-transparent via-brand/35 to-transparent"
      />

      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        {/* Heading */}
        <div className="fm-head mb-12 grid items-end gap-6 lg:mb-14 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="fm-eyebrow mb-5 flex items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-brand-light uppercase">
              <LotusMark className="h-4 w-6 text-accent" />
              {films.eyebrow}
            </p>
            <h2
              id="films-title"
              className="fm-title font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.06]"
            >
              {films.title}{" "}
              <span className="fm-foil-mask -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                <span className="fm-foil foil inline-block">{films.titleFoil}</span>
              </span>
            </h2>
          </div>
          <p className="fm-intro max-w-[44ch] text-[1rem] leading-[1.8] text-cream/65 lg:justify-self-end">
            {films.intro}
          </p>
        </div>

        {/* Tablets and computers: one large film, three underneath */}
        <div className="hidden sm:block">
          <FeatureCard film={feature} index={0} onPlay={open} />
          <div className="fm-grid mt-8 grid grid-cols-3 gap-x-6 lg:mt-10 lg:gap-x-8">
            {rest.map((film, i) => (
              <FilmCard
                key={i}
                film={film}
                index={i + 1}
                onPlay={open}
                className="fm-card"
              />
            ))}
          </div>
        </div>

        {/* Phones: swipe through the films one at a time (the next one peeks in), arrows and dots below */}
        <div className="sm:hidden">
          <div
            ref={track}
            onScroll={onTrackScroll}
            role="group"
            aria-roledescription="carousel"
            aria-label="Our films"
            className="fm-track relative -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {films.list.map((film, i) => (
              <FilmCard
                key={i}
                film={film}
                index={i}
                onPlay={open}
                className="fm-slide w-[86%] shrink-0 snap-start"
              />
            ))}
          </div>
          <div className="fm-controls mt-8 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => goTo(slide - 1)}
              disabled={slide === 0}
              aria-label="Previous film"
              className="grid size-11 place-items-center rounded-full border border-cream/25 transition duration-500 hover:border-brand hover:bg-brand hover:text-night disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowIcon className="size-4 rotate-180" />
            </button>
            <div aria-hidden className="flex items-center gap-2">
              {films.list.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ease-luxe ${
                    i === slide ? "w-6 bg-brand" : "w-1.5 bg-cream/30"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goTo(slide + 1)}
              disabled={slide === films.list.length - 1}
              aria-label="Next film"
              className="grid size-11 place-items-center rounded-full border border-cream/25 transition duration-500 hover:border-brand hover:bg-brand hover:text-night disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowIcon className="size-4" />
            </button>
          </div>
        </div>

        <div className="fm-more mt-14 flex justify-center lg:mt-16">
          <a
            href={films.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group btn-ghost"
          >
            Watch more on YouTube
            <ArrowIcon className="size-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      {/* Pop-up player */}
      <dialog
        ref={dialog}
        aria-label={playing ? `${playing.title}, ${playing.label}` : "Film"}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="fm-dialog fixed inset-0 m-0 size-full max-h-none max-w-none place-items-center border-0 bg-night/92 p-4 text-cream backdrop:bg-transparent open:grid sm:p-8"
      >
        <div className="fm-dialog-panel relative w-[min(100%,calc((100svh-9rem)*16/9),1200px)]">
          <div className="mb-3 flex items-end justify-between gap-4">
            {playing && (
              <p className="min-w-0 truncate">
                <span className="font-heading text-[0.66rem] font-bold tracking-[0.3em] text-brand-light uppercase">
                  Film {pad((active ?? 0) + 1)}
                </span>
                <span className="ml-3 font-display text-[1.15rem] sm:text-[1.35rem]">
                  {playing.title}
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={close}
              aria-label="Close the film"
              className="fm-close grid size-11 shrink-0 place-items-center rounded-full border border-cream/30 transition-colors duration-500 hover:border-brand hover:bg-brand hover:text-night"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-[6px] bg-black shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)]">
            {playingId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playingId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={playing ? `${playing.title}, ${playing.label}` : "Film"}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            ) : (
              playing && (
                <div className="absolute inset-0 grid place-items-center">
                  <Poster film={playing} sizes="(min-width: 1200px) 1200px, 100vw" />
                  <span className="absolute inset-0 bg-night/70" />
                  <p className="relative px-6 text-center font-display text-[clamp(1.3rem,3vw,2rem)]">
                    This film is coming soon
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </dialog>
    </section>
  );
}
