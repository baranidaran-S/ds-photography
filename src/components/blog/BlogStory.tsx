"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { isTall, photoRows, type BlogPhoto, type BlogPost } from "@/content/blog";
import { PhotoViewer } from "@/components/gallery/PhotoViewer";
import { ArrowIcon } from "@/components/ui/icons";
import { delay, InviteCard, Panel, StoryCard, Tags, toneOf, useReveal } from "./parts";

/** A line of the description, with [some words](/an/address) made into links (to another site:
    in a new tab) */
function rich(text: string) {
  const parts: React.ReactNode[] = [];
  const link = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let at = 0;
  for (const m of text.matchAll(link)) {
    if (m.index > at) parts.push(text.slice(at, m.index));
    const [, words, href] = m;
    const look = "text-accent-deep underline decoration-brand/60 underline-offset-4 transition-colors hover:text-accent";
    parts.push(
      href.startsWith("/") ? (
        <Link key={m.index} href={href} className={look}>
          {words}
        </Link>
      ) : (
        <a key={m.index} href={href} target="_blank" rel="noopener noreferrer" className={look}>
          {words}
        </a>
      ),
    );
    at = m.index + m[0].length;
  }
  if (at < text.length) parts.push(text.slice(at));
  return parts;
}

/* A story's page, on the light cream page:
   - a way back to all the stories, then the story's own card at the top, in its colour: the cover
     photo with the date under it, and beside it (under it on phones) its tags, title and a button
     down to the photos
   - the description, whole, as the admin typed it, at an easy reading width (an empty line starts
     a new paragraph, a single one a new line)
   - the shoot's photos together, whole (never cropped): a wide photo across, two tall ones side by
     side. Tap one to see them all full-screen.
   - three more stories (from the same kind of shoot first), and the invitation to enquire
   The top rises in by itself (.rise-in); the photos and what follows rise in as they come into view. */
export function BlogStory({ post, more }: { post: BlogPost; more: BlogPost[] }) {
  const root = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const [viewing, setViewing] = useState<number | null>(null);
  useReveal(root, []);

  const paragraphs = post.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  // (n: a photo's place in the list, for the full-screen viewer)
  const rows = photoRows(post.photos);
  const count = post.photos.length;

  const toPhotos = () => {
    const target = document.getElementById("photos");
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -40, duration: 1.4 });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  const photoButton = (photo: BlogPhoto, n: number, sizes: string) => (
    <button
      type="button"
      onClick={() => setViewing(n)}
      aria-label={`See "${photo.alt}" full-screen`}
      className="group block w-full cursor-zoom-in overflow-hidden rounded-[16px] bg-[#e7ddcc] sm:rounded-[20px]"
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.w}
        height={photo.h}
        sizes={sizes}
        className="h-auto w-full transition-[scale] duration-[1.4s] ease-luxe group-hover:scale-[1.03]"
      />
    </button>
  );

  return (
    <main ref={root} aria-labelledby="story-title" className="light-page relative overflow-hidden bg-cream pt-32 text-ink sm:pt-36 lg:pt-40">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
        {/* ── Back to all the stories ── */}
        <nav
          aria-label="Breadcrumb"
          className="rise-in mb-6 flex items-center gap-3 px-1 font-heading text-[0.68rem] font-semibold tracking-[0.2em] text-ink/50 uppercase sm:px-0 lg:mb-8"
        >
          <Link href="/blog" className="group inline-flex items-center gap-2 text-accent-deep transition-colors hover:text-accent">
            <ArrowIcon className="size-3.5 rotate-180 transition-transform duration-500 ease-luxe group-hover:-translate-x-1" />
            All stories
          </Link>
          <span aria-hidden>/</span>
          <span>{post.category}</span>
        </nav>

        {/* ── The story's card ── */}
        <header
          className="rise-in bj-card grid rounded-[34px] p-2.5 text-cream sm:p-3 lg:grid-cols-[1.3fr_1fr] lg:gap-3"
          style={{ ...toneOf(post), "--d": "0.1s" } as React.CSSProperties}
        >
          <Panel post={post}>
            <span className="relative block aspect-[4/3] overflow-hidden rounded-[22px] bg-night/30 sm:aspect-[3/2]">
              {/* (the story's own top photo, or its cover when it has none) */}
              {post.storyCover.src && (
                <span className="rise-photo absolute inset-0">
                  <Image
                    src={post.storyCover.src}
                    alt={post.storyCover.alt}
                    fill
                    sizes="(min-width: 1024px) min(700px, 54vw), (min-width: 640px) calc(100vw - 4rem), calc(100vw - 2.5rem)"
                    loading="eager"
                    fetchPriority="high"
                    className="object-cover"
                    style={{ objectPosition: post.storyCover.position }}
                  />
                </span>
              )}
            </span>
          </Panel>
          <div className="flex flex-col justify-center px-3.5 pt-6 pb-5 sm:px-5 lg:px-8 lg:py-10">
            <Tags post={post} />
            <h1 id="story-title" className="mt-5 font-display text-[clamp(2rem,3.6vw,3.4rem)] leading-[1.08]">
              {post.title}
            </h1>
            {count > 0 && (
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 lg:mt-9">
                <button type="button" onClick={toPhotos} className="btn-brand btn-sm">
                  See the photos
                  <ArrowIcon className="size-3.5 rotate-90" />
                </button>
                <span className="font-mono text-[0.64rem] tracking-[0.18em] text-cream/60 uppercase">
                  {count} {count === 1 ? "photo" : "photos"}
                </span>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* ── The description ── */}
      {paragraphs.length > 0 && (
        <div className="mx-auto max-w-[740px] px-5 pt-14 sm:px-8 lg:pt-20">
          {paragraphs.map((p, k) => (
            <p
              key={k}
              className={`text-[1.05rem] leading-[1.9] text-ink/80 ${
                // the story opens with a large maroon first letter
                k === 0
                  ? "first-letter:float-left first-letter:mt-1.5 first-letter:mr-3 first-letter:font-display first-letter:text-[4.1rem] first-letter:leading-[0.8] first-letter:text-accent-deep"
                  : "mt-6"
              }`}
            >
              {p.split("\n").map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  {rich(line)}
                </Fragment>
              ))}
            </p>
          ))}
        </div>
      )}

      {/* ── The photos ── */}
      {count > 0 && (
        <section id="photos" aria-labelledby="story-photos" className="mx-auto max-w-[1080px] px-4 pt-16 sm:px-8 lg:pt-24">
          <div className="bj-reveal mb-8 flex items-end justify-between gap-6 border-b border-ink/12 px-1 pb-5 sm:px-0 lg:mb-10">
            <h2 id="story-photos" className="bj-up font-display text-[clamp(1.7rem,3vw,2.6rem)] leading-[1.1]">
              Photos from this <span className="foil-deep">shoot</span>
            </h2>
            <span className="bj-up shrink-0 pb-1.5 font-mono text-[0.64rem] tracking-[0.18em] text-ink/50 uppercase" style={delay(0.1)}>
              {count} {count === 1 ? "photo" : "photos"}
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:gap-5">
            {rows.map((row) => (
              <div key={row[0].n} className="bj-reveal">
                {row.length === 2 ? (
                  // two tall photos side by side, each as wide as its shape needs, so they end the same height
                  <div className="bj-up flex gap-3 sm:gap-5">
                    {row.map(({ photo, n }) => (
                      <div key={n} className="min-w-0" style={{ flex: `${photo.w / photo.h} 1 0%` }}>
                        {photoButton(photo, n, "(min-width: 1080px) 500px, 50vw")}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`bj-up mx-auto ${isTall(row[0].photo) ? "max-w-[520px]" : ""}`}>
                    {photoButton(
                      row[0].photo,
                      row[0].n,
                      isTall(row[0].photo) ? "(min-width: 600px) 520px, 100vw" : "(min-width: 1080px) 1016px, 100vw",
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── More stories ── */}
      {more.length > 0 && (
        <section aria-labelledby="story-more" className="mx-auto max-w-[1320px] px-4 pt-20 sm:px-8 lg:px-12 lg:pt-28">
          <div className="bj-reveal flex items-end justify-between gap-6 border-b border-ink/12 pb-6">
            <h2 id="story-more" className="bj-up px-1 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.05] sm:px-0">
              More <span className="foil-deep">stories</span>
            </h2>
            <Link
              href="/blog"
              className="bj-up group inline-flex shrink-0 items-center gap-2 pb-2 font-heading text-[0.68rem] font-semibold tracking-[0.2em] text-accent-deep uppercase transition-colors hover:text-accent"
              style={delay(0.1)}
            >
              All stories
              <ArrowIcon className="size-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
            </Link>
          </div>
          <ul className="mt-12 grid gap-x-5 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:mt-14 lg:grid-cols-3 lg:gap-x-7">
            {more.map((p, i) => (
              <StoryCard key={p.slug} post={p} i={i} />
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
        <InviteCard source="blog-story" />
      </section>

      {viewing !== null && (
        <PhotoViewer photos={post.photos} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />
      )}
    </main>
  );
}
