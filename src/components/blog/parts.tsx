"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import type { BlogPost } from "@/content/blog";
import { useEnquiry } from "@/components/providers/SiteProvider";
import { ChatIcon } from "@/components/ui/icons";
import { FocusMark } from "@/components/ui/ornaments";
import { CardFace, toneOf } from "./card";

/* The pieces the blog page and a story's page share: the story card (its inside is card.tsx), the
   closing invitation, and the rise-in as things come into view. */

export { Panel, Tags, toneOf } from "./card";

/** How long a piece waits before rising in (globals.css → .bj-up) */
export const delay = (t: number) => ({ "--t": `${t}s` }) as React.CSSProperties;

/** A story's card: its photo and date, the title across the card, its tags and a gold button.
    Cards in a row rise in one after another (`i` is its place in the list). */
export function StoryCard({ post, i }: { post: BlogPost; i: number }) {
  return (
    <li className="bj-reveal">
      <div className="bj-up h-full" style={delay((i % 3) * 0.08)}>
        <Link
          href={`/blog/${post.slug}`}
          className="bj-card group flex h-full flex-col rounded-[30px] p-2.5 text-cream"
          style={toneOf(post)}
        >
          <CardFace post={post} />
        </Link>
      </div>
    </li>
  );
}

// Soft lights drifting in the closing card: left %, top %, size (rem), colour, seconds per drift
const LIGHTS = [
  [8, 18, 10, "gold", 19],
  [26, 80, 7, "red", 23],
  [55, 8, 5, "gold", 17],
  [72, 88, 9, "gold", 21],
  [92, 30, 12, "red", 26],
] as const;

/** The closing card: soft gold and red lights drifting behind an invitation to enquire */
export function InviteCard({ source }: { source: string }) {
  const enquire = useEnquiry();
  return (
    <div className="bj-reveal relative overflow-hidden rounded-[28px] bg-night px-6 py-16 text-center text-cream sm:px-12 lg:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {LIGHTS.map(([left, top, size, tone, secs], i) => (
          <span
            key={i}
            className={`ct-bokeh ct-bokeh-${tone} absolute rounded-full`}
            style={
              { left: `${left}%`, top: `${top}%`, width: `${size}rem`, height: `${size}rem`, "--drift": `${secs}s` } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="relative">
        <FocusMark className="bj-up mx-auto mb-6 h-6 w-10 text-brand" />
        <h2 className="bj-up font-display text-[clamp(2.2rem,5.4vw,4.6rem)] leading-[1.05]" style={delay(0.1)}>
          Let&rsquo;s tell <span className="foil">your</span> story
        </h2>
        <p className="bj-up mx-auto mt-5 max-w-[46ch] text-[1rem] leading-[1.8] text-cream/70" style={delay(0.2)}>
          Tell us your date and what you&rsquo;re celebrating, and we&rsquo;ll check we&rsquo;re free.
        </p>
        <div className="bj-up mt-9" style={delay(0.3)}>
          <button type="button" onClick={() => enquire({ source })} className="btn-brand">
            <ChatIcon className="size-4" />
            Tell us
          </button>
        </div>
      </div>
    </div>
  );
}

/** Pieces inside `root` marked .bj-reveal rise in as they come into view (globals.css). Runs again
    whenever `deps` change, for the new ones; then the page is re-measured for the footer's
    animation below (not on arriving: nothing has moved yet). */
export function useReveal(root: React.RefObject<HTMLElement | null>, deps: unknown[]) {
  const changed = useRef(false);
  useEffect(() => {
    window.__dsReady = true;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.setAttribute("data-in", "");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    el.querySelectorAll(".bj-reveal:not([data-in])").forEach((t) => io.observe(t));
    if (changed.current) ScrollTrigger.refresh();
    changed.current = true;
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
