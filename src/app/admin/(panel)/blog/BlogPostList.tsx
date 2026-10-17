"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dateOf } from "@/content/blog";
import type { BlogPostRow } from "@/lib/blog";
import { thumbOf } from "@/lib/photoUrl";
import { useConfirm, useToast } from "../../components/Feedback";

const postsCount = (n: number) => (n === 1 ? "1 post" : `${n} posts`);
const photosCount = (n: number) => (n === 1 ? "1 photo" : `${n} photos`);

/* The blog's posts, newest first, one line each: its cover, title, and under it its category,
   place, date and how many photos (the line opens its form); then Edit, a link to see it on the
   website, and a delete button. A search box narrows the list by title, category or place. */
export function BlogPostList({ posts }: { posts: BlogPostRow[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = words.length
    ? posts.filter((p) => {
        const text = `${p.title} ${p.category} ${p.place}`.toLowerCase();
        return words.every((w) => text.includes(w));
      })
    : posts;

  async function remove(post: BlogPostRow) {
    const sure = await confirm({
      title: "Delete this post for good?",
      body: `“${post.title}” goes from the website straight away, with its page. This can't be undone.`,
      confirmLabel: "Delete it",
      tone: "bad",
    });
    if (!sure) return;

    setBusy(post.id);
    const res = await fetch(`/api/admin/blog?id=${post.id}`, { method: "DELETE" }).catch(() => null);
    setBusy("");
    if (res?.ok) {
      toast({ tone: "good", title: "Post deleted", body: "The website is updated." });
      router.refresh();
    } else {
      const json = await res?.json().catch(() => ({}));
      toast({ tone: "bad", title: "Could not delete it", body: json?.error ?? "Check your connection and try again." });
    }
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="font-display text-[1.3rem] text-ink">No posts yet</p>
        <p className="mx-auto mt-1.5 max-w-[46ch] text-[0.88rem] leading-relaxed text-slate-500">
          The website&rsquo;s blog says &ldquo;Our first stories are on their way&rdquo; until you add one. Press
          New post to add your first.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, category or place"
          aria-label="Search the posts"
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.9rem] text-ink placeholder:text-slate-300 focus:border-brand focus:outline-none"
        />
        <p className="text-[0.84rem] text-slate-400">
          {words.length ? `${shown.length} of ${postsCount(posts.length)}` : postsCount(posts.length)}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-[0.9rem] text-slate-500">
          No posts match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {shown.map((p) => (
            <li
              key={p.id}
              className={`flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-opacity ${
                busy === p.id ? "opacity-50" : ""
              }`}
            >
              <Link href={`/admin/blog/${p.id}`} className="group flex min-w-0 flex-1 basis-full items-center gap-3 sm:basis-0">
                {p.cover ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={thumbOf(p.cover, 128)} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-slate-100 font-heading text-[0.5rem] font-bold tracking-[0.08em] text-slate-400 uppercase">
                    No cover
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.95rem] font-medium text-ink transition-colors group-hover:text-accent-deep">
                    {p.title || <span className="text-slate-300">Untitled</span>}
                  </span>
                  <span className="block truncate text-[0.8rem] text-slate-400">
                    {[p.category || "No category", p.place, dateOf(p.date), photosCount(p.photos)].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>

              <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                <Link
                  href={`/admin/blog/${p.id}`}
                  className="rounded-lg bg-accent-deep px-3 py-1.5 text-[0.8rem] font-medium text-cream transition-colors hover:bg-accent"
                >
                  Edit
                </Link>
                <a
                  href={`/blog/${p.slug}`}
                  target="_blank"
                  rel="noopener"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-[0.8rem] font-medium text-slate-600 transition-colors hover:border-brand hover:text-accent-deep"
                >
                  View &#8599;
                </a>
                <button
                  type="button"
                  onClick={() => remove(p)}
                  disabled={busy === p.id}
                  aria-label={`Delete “${p.title}”`}
                  className="grid size-8 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-accent/10 hover:text-accent disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6 7l.8 12.1A1.9 1.9 0 0 0 8.7 21h6.6a1.9 1.9 0 0 0 1.9-1.9L18 7" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
