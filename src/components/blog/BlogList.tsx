"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import type { BlogPost } from "@/content/blog";
import { ArrowIcon } from "@/components/ui/icons";
import { FocusMark } from "@/components/ui/ornaments";
import { delay, InviteCard, Panel, StoryCard, Tags, toneOf, useReveal } from "./parts";

// cards showing at first, and how many more each "Show more" adds
const PAGE = 9;

/** A category's name, or null for "All" */
type Filter = string | null;

/* The blog page, on the light cream page:
   - the heading, then the newest story as one big card
   - every other story as a card in its own colour (parts.tsx → StoryCard): three across on
     computers, two on tablets, one on phones; the category tabs above narrow them down, a sindoor
     line sliding to the chosen one; nine at first and nine more with each "Show more"
   - a dark closing card with soft drifting lights, inviting an enquiry
   The first screen rises in by itself (.rise-in); the cards rise in as they come into view. */
export function BlogList({ posts, categories }: { posts: BlogPost[]; categories: string[] }) {
  const root = useRef<HTMLElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const tabLine = useRef<HTMLSpanElement>(null);
  const [filter, setFilter] = useState<Filter>(null);
  const [shown, setShown] = useState(PAGE);

  const [latest, ...rest] = posts;
  const countOf = (f: Filter) => (f === null ? posts.length : posts.filter((p) => p.category === f).length);
  // a tab for each live category that has stories, in the admin's order
  const filters: Filter[] = [null, ...categories.filter((c) => countOf(c) > 0)];
  // "All": every story but the newest (it's the big card above); a category: every story in it
  const list = filter === null ? rest : posts.filter((p) => p.category === filter);
  const visible = list.slice(0, shown);

  const choose = (f: Filter) => {
    setFilter(f);
    setShown(PAGE);
  };

  useReveal(root, [filter, shown]);

  /* ── The line under the chosen tab slides to it (and follows it as the fonts load) ── */
  useLayoutEffect(() => {
    const group = tabs.current;
    const line = tabLine.current;
    if (!group || !line) return;
    const place = () => {
      const on = group.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!on) return;
      line.style.width = `${on.offsetWidth}px`;
      line.style.translate = `${on.offsetLeft}px 0`;
    };
    place();
    const watch = new ResizeObserver(place);
    watch.observe(group);
    return () => watch.disconnect();
  }, [filter]);

  return (
    <main
      ref={root}
      aria-labelledby="blog-title"
      className="light-page relative overflow-hidden bg-cream pt-36 text-ink sm:pt-40 lg:pt-44"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
        {/* ── Heading ── */}
        <header className="mb-10 grid items-end gap-6 px-1 sm:px-0 lg:mb-14 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="rise-in mb-5 flex items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-accent-deep uppercase">
              <FocusMark className="h-4 w-6 text-accent" />
              Our journal
            </p>
            <h1
              id="blog-title"
              className="rise-in font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.06]"
              style={{ "--d": "0.08s" } as React.CSSProperties}
            >
              Stories behind every <span className="foil-deep">frame</span>
            </h1>
          </div>
          <p
            className="rise-in max-w-[44ch] text-[1rem] leading-[1.8] text-ink/65 lg:justify-self-end"
            style={{ "--d": "0.2s" } as React.CSSProperties}
          >
            Real shoots from Madurai and around: weddings, newborns, birthdays and the families who let us
            in.
          </p>
        </header>

        {!latest ? (
          /* No stories yet */
          <div className="mb-20 flex flex-col items-center rounded-[22px] border border-dashed border-ink/15 px-6 py-16 text-center lg:mb-28">
            <FocusMark className="h-8 w-12 text-accent" />
            <p className="mt-5 font-display text-[clamp(1.7rem,3.2vw,2.5rem)] leading-[1.15]">
              Our first stories are on their <span className="foil-deep">way</span>
            </p>
          </div>
        ) : (
          <>
            {/* ── The newest story, as one big card: photo on the left, its words on the right
                (on phones, the photo above) ── */}
            <div className="rise-in" style={{ "--d": "0.3s" } as React.CSSProperties}>
              <Link
                href={`/blog/${latest.slug}`}
                className="bj-card group grid rounded-[34px] p-2.5 text-cream sm:p-3 lg:grid-cols-[1.3fr_1fr] lg:gap-3"
                style={toneOf(latest)}
              >
                <Panel post={latest}>
                  <span className="relative block aspect-[4/3] overflow-hidden rounded-[22px] bg-night/30 sm:aspect-[3/2]">
                    {latest.cover.src && (
                      <span className="rise-photo absolute inset-0">
                        <Image
                          src={latest.cover.src}
                          alt={latest.cover.alt}
                          fill
                          sizes="(min-width: 1024px) min(700px, 54vw), (min-width: 640px) calc(100vw - 4rem), calc(100vw - 2.5rem)"
                          loading="eager"
                          fetchPriority="high"
                          className="object-cover transition-[scale] duration-[1.4s] ease-luxe group-hover:scale-[1.04]"
                          style={{ objectPosition: latest.cover.position }}
                        />
                      </span>
                    )}
                  </span>
                </Panel>
                <span className="flex flex-col justify-center px-3.5 pt-6 pb-4 sm:px-5 lg:px-8 lg:py-8">
                  <span className="flex items-center gap-2.5 font-heading text-[0.66rem] font-semibold tracking-[0.24em] text-brand-light uppercase">
                    <span aria-hidden className="relative flex size-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-brand/70 motion-reduce:animate-none" />
                      <span className="relative size-2 rounded-full bg-brand" />
                    </span>
                    Newest story
                  </span>
                  <span className="mt-4 font-display text-[clamp(1.9rem,3.4vw,3.2rem)] leading-[1.08]">{latest.title}</span>
                  <span className="mt-4 line-clamp-3 text-[0.98rem] leading-[1.75] text-cream/75 lg:line-clamp-none">
                    {latest.excerpt}
                  </span>
                  <span className="mt-6 flex flex-wrap items-center justify-between gap-4 lg:mt-8">
                    <Tags post={latest} />
                    <span className="btn-brand btn-sm">
                      Read the story
                      <ArrowIcon className="size-3.5 -rotate-45" />
                    </span>
                  </span>
                </span>
              </Link>
            </div>

            {/* ── Every other story ── */}
            <section aria-labelledby="blog-all" className="pt-20 pb-20 lg:pt-28 lg:pb-28">
              <div className="bj-reveal flex flex-col gap-6 border-b border-ink/12 lg:flex-row lg:items-end lg:justify-between">
                <div className="px-1 sm:px-0 lg:pb-6">
                  <p className="bj-up mb-4 flex items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-accent-deep uppercase">
                    <FocusMark className="h-4 w-6 text-accent" />
                    From the journal
                  </p>
                  <h2 id="blog-all" className="bj-up font-display text-[clamp(2.2rem,4.4vw,3.8rem)] leading-[1.05]" style={delay(0.1)}>
                    More <span className="foil-deep">stories</span>
                  </h2>
                </div>
                {filters.length > 2 && (
                  <div className="bj-up -mx-4 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0" style={delay(0.2)}>
                    <div ref={tabs} role="group" aria-label="Show stories about" className="relative flex w-max gap-6 sm:gap-8">
                      {filters.map((f) => {
                        const on = f === filter;
                        return (
                          <button
                            key={f ?? ""}
                            type="button"
                            aria-pressed={on}
                            onClick={() => choose(f)}
                            className={`py-4 font-heading text-[0.72rem] font-semibold tracking-[0.18em] whitespace-nowrap uppercase transition-colors duration-300 ${
                              on ? "text-ink" : "text-ink/45 hover:text-ink/80"
                            }`}
                          >
                            {f ?? "All"}
                            <sup className="ml-1 font-mono text-[0.58rem] font-normal tracking-normal text-accent-deep/70">
                              {countOf(f)}
                            </sup>
                          </button>
                        );
                      })}
                      <span
                        ref={tabLine}
                        aria-hidden
                        className="absolute -bottom-px left-0 h-[2px] bg-accent transition-[translate,width] duration-500 ease-luxe"
                      />
                    </div>
                  </div>
                )}
              </div>

              {visible.length > 0 && (
                // (a new list for each tab, so its cards all rise in fresh)
                <ul
                  key={filter ?? ""}
                  className="mt-12 grid gap-x-5 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:mt-16 lg:grid-cols-3 lg:gap-x-7 lg:gap-y-12"
                >
                  {visible.map((p, i) => (
                    <StoryCard key={p.slug} post={p} i={i} />
                  ))}
                </ul>
              )}

              {list.length > shown && (
                <div className="mt-16 flex flex-col items-center gap-4 lg:mt-20">
                  <p className="font-mono text-[0.62rem] tracking-[0.2em] text-ink/55 uppercase">
                    Showing {visible.length} of {list.length}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShown(shown + PAGE)}
                    className="inline-flex items-center gap-3 rounded-full border border-accent-deep/40 px-7 py-3.5 font-heading text-[0.7rem] font-semibold tracking-[0.2em] text-accent-deep uppercase transition-colors duration-500 hover:border-accent-deep hover:bg-accent-deep hover:text-cream"
                  >
                    Show more stories
                    <ArrowIcon className="size-3.5 rotate-90" />
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        <section className="pb-20 lg:pb-28">
          <InviteCard source="blog" />
        </section>
      </div>
    </main>
  );
}
