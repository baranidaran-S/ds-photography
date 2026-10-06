"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { reviews, type ChatMessage, type Review } from "@/content/site";
import { LotusMark } from "@/components/ui/ornaments";

// Each screenshot sits at a slight angle, like prints laid on a table; hovering straightens it
const TILTS = [
  "-rotate-[1.6deg]",
  "rotate-[1.2deg]",
  "-rotate-[0.8deg]",
  "rotate-[1.5deg]",
  "-rotate-[1.2deg]",
  "rotate-[0.9deg]",
];
// How far each one drifts while scrolling (desktop), so the columns move at different speeds
const DRIFT = [36, -24, 52, -18, 44, -30];

const icon = "size-[1.15rem] shrink-0";

function StatusBar({ clock }: { clock: string }) {
  return (
    <div
      aria-hidden
      className="rv-bar flex items-center justify-between px-5 pt-2.5 pb-1 text-[0.72rem] font-semibold"
    >
      <span className="tabular-nums">{clock}</span>
      <span className="flex items-center gap-1.5">
        {/* signal */}
        <svg
          viewBox="0 0 18 12"
          className="h-[0.7rem] w-auto"
          fill="currentColor"
        >
          <rect x="0" y="8" width="3" height="4" rx="0.8" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
          <rect x="10" y="3" width="3" height="9" rx="0.8" />
          <rect x="15" y="0" width="3" height="12" rx="0.8" />
        </svg>
        {/* wifi */}
        <svg
          viewBox="0 0 16 12"
          className="h-[0.7rem] w-auto"
          fill="currentColor"
        >
          <path d="M8 2.2c2.4 0 4.6.9 6.2 2.5l1.3-1.3A10.4 10.4 0 0 0 8 .3 10.4 10.4 0 0 0 .5 3.4l1.3 1.3A8.6 8.6 0 0 1 8 2.2Z" />
          <path d="M8 5.6c1.5 0 2.8.6 3.8 1.5l1.3-1.3A7.2 7.2 0 0 0 8 3.7a7.2 7.2 0 0 0-5.1 2.1l1.3 1.3c1-.9 2.3-1.5 3.8-1.5Z" />
          <path d="M8 9c.6 0 1.1.2 1.5.6L8 11.7 6.5 9.6c.4-.4.9-.6 1.5-.6Z" />
        </svg>
        {/* battery */}
        <span className="flex items-center gap-px">
          <span className="h-[0.7rem] w-[1.4rem] rounded-[3px] border border-current/40 p-[1.5px]">
            <span className="block h-full w-[78%] rounded-[1.5px] bg-current" />
          </span>
          <span className="h-1 w-[1.5px] rounded-r-sm bg-current/40" />
        </span>
      </span>
    </div>
  );
}

function ChatHeader({ review }: { review: Review }) {
  return (
    <div className="rv-bar flex items-center gap-2.5 px-2.5 pt-1 pb-2.5">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={icon}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 5-7 7 7 7" />
      </svg>
      <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-white/15">
        <Image
          src={review.avatar.src}
          alt={review.avatar.alt}
          fill
          sizes="40px"
          // tiny files; lazy loading can miss these inside the column layout
          loading="eager"
          className="object-cover"
        />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[0.88rem] font-semibold">
          {review.name}
        </span>
        <span className="block truncate text-[0.68rem] text-white/75">
          {review.status}
        </span>
      </span>
      <span aria-hidden className="flex items-center gap-4 pr-1.5">
        <svg
          viewBox="0 0 24 24"
          className={icon}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
          <path d="m15.5 10.5 6-3.5v10l-6-3.5" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          className={icon}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 3.5h3.2l1.6 4.2-2.2 1.5a11 11 0 0 0 7.2 7.2l1.5-2.2 4.2 1.6V19a1.6 1.6 0 0 1-1.7 1.6A16.6 16.6 0 0 1 3.4 5.2 1.6 1.6 0 0 1 5 3.5Z" />
        </svg>
      </span>
    </div>
  );
}

/** Two little ticks: the message has been read */
function ReadTicks() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 18 11"
      className="rv-ticks h-[0.62rem] w-auto"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m1 6 3.2 3.2L11 2" />
      <path d="m7.5 8.6.6.6L15 2" />
    </svg>
  );
}

function Bubble({ message, first }: { message: ChatMessage; first: boolean }) {
  const mine = message.from === "studio";
  return (
    <div
      className={`flex ${mine ? "justify-end" : "justify-start"} ${first ? "mt-2" : "mt-1"} ${message.reaction ? "mb-3" : ""}`}
    >
      <div
        className={`relative max-w-[84%] rounded-[12px] px-2 pt-1.5 pb-1 shadow-[0_1px_0.5px_rgb(0_0_0/0.13)] ${
          mine ? "rv-out" : "bg-white"
        } ${first ? (mine ? "rounded-tr-[3px]" : "rounded-tl-[3px]") : ""}`}
      >
        {message.photo && (
          <span className="relative mb-1 block aspect-[4/3] w-[14rem] max-w-full overflow-hidden rounded-[9px] bg-black/5">
            <Image
              src={message.photo.src}
              alt={message.photo.alt}
              fill
              sizes="240px"
              className="object-cover"
              style={{ objectPosition: message.photo.position }}
            />
          </span>
        )}
        <span className="flex flex-wrap items-end gap-x-2 px-0.5">
          {message.text && (
            <span className="text-[0.8rem] leading-[1.42]">{message.text}</span>
          )}
          <span className="rv-meta ml-auto flex items-center gap-1 pb-px text-[0.6rem] whitespace-nowrap">
            {message.time}
            {mine && <ReadTicks />}
          </span>
        </span>
        {message.reaction && (
          <span
            aria-label={`Reacted ${message.reaction}`}
            className={`absolute -bottom-3 ${mine ? "right-2" : "left-2"} rounded-full bg-white px-1 py-px text-[0.68rem] leading-none shadow-[0_1px_2px_rgb(0_0_0/0.18)] ring-1 ring-black/[0.04]`}
          >
            {message.reaction}
          </span>
        )}
      </div>
    </div>
  );
}

/** One review, drawn as a phone screenshot of the chat */
function ChatShot({ review }: { review: Review }) {
  // a message needs text or a photo; skip any left empty in site.ts
  const messages = review.messages.filter((m) => m.text || m.photo);
  return (
    <figure className="rv-shot overflow-hidden rounded-[26px] bg-white ring-1 ring-black/[0.06]">
      <figcaption className="sr-only">
        Message from {review.name}, {review.shoot} shoot
      </figcaption>
      <StatusBar clock={review.clock} />
      <ChatHeader review={review} />
      <div className="rv-wall px-2.5 pt-3 pb-3.5">
        <p className="rv-meta mx-auto w-fit rounded-md bg-white px-2 py-0.5 text-[0.62rem] font-medium shadow-[0_1px_0.5px_rgb(0_0_0/0.08)]">
          {review.date}
        </p>
        {messages.map((m, i) => (
          <Bubble
            key={i}
            message={m}
            first={i === 0 || messages[i - 1].from !== m.from}
          />
        ))}
      </div>
      {/* message box */}
      <div
        aria-hidden
        className="rv-wall flex items-center gap-2 px-2.5 pt-0.5 pb-3"
      >
        <span className="flex-1 rounded-full bg-white px-3.5 py-2 text-[0.74rem] text-black/35 shadow-[0_1px_0.5px_rgb(0_0_0/0.08)]">
          Message
        </span>
        <span className="rv-mic grid size-8 place-items-center rounded-full">
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
          </svg>
        </span>
      </div>
    </figure>
  );
}

export function Reviews() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const q = gsap.utils.selector(el);

      /* ── Heading rises word by word ── */
      const split = SplitText.create(q(".rv-title"), {
        type: "words",
        mask: "words",
        ignore: q(".rv-foil-mask"),
      });
      gsap.set(split.masks, {
        paddingBottom: "0.12em",
        marginBottom: "-0.12em",
      });
      gsap
        .timeline({
          scrollTrigger: {
            trigger: q(".rv-head")[0],
            start: "top 80%",
            once: true,
          },
          defaults: { ease: "expo.out" },
        })
        .from(q(".rv-eyebrow"), { autoAlpha: 0, y: 16, duration: 0.9 }, 0)
        .from(split.words, { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.1)
        .from(q(".rv-foil"), { yPercent: 115, duration: 1.1 }, 0.38)
        .from(q(".rv-intro"), { autoAlpha: 0, y: 20, duration: 1 }, 0.4);

      /* ── Screenshots land on the page as they scroll into view ── */
      const cards = q<HTMLElement>(".rv-card");
      gsap.set(cards, {
        autoAlpha: 0,
        y: 80,
        rotation: (i: number) => (i % 2 ? 5 : -5),
      });
      ScrollTrigger.batch(cards, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            rotation: 0,
            duration: 1.2,
            ease: "expo.out",
            stagger: 0.12,
          }),
      });

      /* ── Desktop: each screenshot drifts at its own speed while scrolling ── */
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        q<HTMLElement>(".rv-float").forEach((f, i) => {
          const d = DRIFT[i % DRIFT.length];
          gsap.fromTo(
            f,
            { y: d },
            {
              y: -d,
              ease: "none",
              scrollTrigger: {
                trigger: f,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      id="reviews"
      ref={root}
      aria-labelledby="reviews-title"
      className="relative overflow-hidden bg-cream py-24 text-ink lg:py-32"
    >
      {/* Heading */}
      <div className="rv-head mx-auto grid max-w-[1320px] items-end gap-6 px-5 sm:px-8 lg:grid-cols-[1.25fr_1fr] lg:px-12">
        <div>
          <p className="rv-eyebrow mb-5 flex items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-accent-deep uppercase">
            <LotusMark className="h-4 w-6 text-accent" />
            Kind words
          </p>
          <h2
            id="reviews-title"
            className="rv-title font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.06]"
          >
            Messages we{" "}
            <span className="rv-foil-mask -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
              <span className="rv-foil foil-deep inline-block">treasure</span>
            </span>
          </h2>
        </div>
        <p className="rv-intro max-w-[44ch] text-[1rem] leading-[1.8] text-ink/65 lg:justify-self-end">
          A few of the notes families sent us after their photos arrived. We
          read every one, usually more than once.
        </p>
      </div>

      {/* Screenshots: a swipe row on phones, staggered columns from tablets up */}
      <div data-nav-view className="mx-auto mt-12 max-w-[1180px] lg:mt-16">
        <div className="-mb-6 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pt-4 pb-10 [scrollbar-width:none] md:mb-0 md:block md:columns-2 md:gap-10 md:overflow-visible md:px-8 md:pt-6 md:pb-0 lg:columns-3 lg:px-12 [&::-webkit-scrollbar]:hidden">
          {reviews.map((review, i) => (
            <div
              key={review.name}
              className="rv-card w-[78vw] max-w-[330px] shrink-0 snap-center md:mx-auto md:mb-14 md:w-full md:max-w-[340px] md:break-inside-avoid"
            >
              <div className="rv-float">
                <div
                  className={`transition duration-700 ease-luxe hover:-translate-y-1.5 hover:rotate-0 ${TILTS[i % TILTS.length]}`}
                >
                  <ChatShot review={review} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
