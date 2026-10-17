import Image from "next/image";
import { dateOf, type BlogPost } from "@/content/blog";
import { ArrowIcon } from "@/components/ui/icons";

/* A story's card as the blog page shows it, kept apart from the page's animations (parts.tsx) so
   the admin's post form can show the very same card while the post is written. */

/** A card's colour (globals.css → .bj-card) */
export const toneOf = (post: BlogPost) => ({ "--tone": post.tone }) as React.CSSProperties;

/** Its category and place (those it has), as small tags a shade lighter than the card */
export function Tags({ post }: { post: BlogPost }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {[post.category, post.place].filter(Boolean).map((tag) => (
        <span key={tag} className="bj-chip rounded-md px-2.5 py-1 text-[0.68rem] text-cream/80">
          {tag}
        </span>
      ))}
    </span>
  );
}

/** The photo on its lighter panel, with the date under it */
export function Panel({ post, children }: { post: BlogPost; children: React.ReactNode }) {
  return (
    <span className="bj-card-panel block overflow-hidden rounded-[22px]">
      {children}
      <span className="block py-2 text-center text-[0.74rem] tracking-[0.04em] text-cream/85">
        Published <time dateTime={post.date}>{dateOf(post.date)}</time>
      </span>
    </span>
  );
}

/** What's inside a story's card: its photo (5:4, around its focus point) and date, the title across
    the card, its tags and a gold button */
export function CardFace({ post }: { post: BlogPost }) {
  return (
    <>
      <Panel post={post}>
        <span className="relative block aspect-[5/4] overflow-hidden rounded-[22px] bg-night/30">
          {post.cover.src && (
            <Image
              src={post.cover.src}
              alt={post.cover.alt}
              fill
              sizes="(min-width: 1024px) min(400px, 30vw), (min-width: 640px) calc(50vw - 3rem), calc(100vw - 2.5rem)"
              className="object-cover transition-[scale] duration-[1.4s] ease-luxe group-hover:scale-[1.05]"
              style={{ objectPosition: post.cover.position }}
            />
          )}
        </span>
      </Panel>
      <span className="flex flex-1 flex-col justify-between gap-5 px-3.5 pt-5 pb-3.5 sm:px-4">
        <span className="line-clamp-3 font-display text-[clamp(1.25rem,1.7vw,1.5rem)] leading-[1.22]">{post.title}</span>
        <span className="flex flex-wrap items-center justify-between gap-3">
          <Tags post={post} />
          <span className="btn-brand btn-sm">
            Read now
            <ArrowIcon className="size-3.5 -rotate-45" />
          </span>
        </span>
      </span>
    </>
  );
}
