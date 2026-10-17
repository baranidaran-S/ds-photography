"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AlbumPhoto } from "@/lib/gallery";
import { thumbOf } from "@/lib/photoUrl";
import { SHRINK_TO } from "../CoverField";
import { useConfirm, useToast } from "../../../components/Feedback";
import { SaveBar } from "../../../components/SaveBar";
import { UploadButton, type UploadedMedia } from "../../../components/UploadButton";

type Upload = { src: string; publicId: string; width: number; height: number };

const photosCount = (n: number) => (n === 1 ? "1 photo" : `${n} photos`);

/* A sub-category's photos: upload many at once, see them all (newest first, a page at a time),
   and delete any. Like the rest of the admin nothing changes on the website until Save: new
   uploads wait here marked "New", deleted ones stay dimmed with Undo. Discard throws the new
   uploads away (deleting their files from the photo store, so they don't sit there unused), and
   leaving the page with changes not saved asks first. Once saved, it goes back to the Gallery
   page, to this sub-category. */
export function PhotosEditor({
  sub,
  initial,
}: {
  sub: { id: string; name: string; count: number };
  initial: { photos: AlbumPhoto[]; more: boolean };
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const router = useRouter();
  const [photos, setPhotos] = useState(initial.photos);
  const [more, setMore] = useState(initial.more);
  const [added, setAdded] = useState<Upload[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<"" | "saving" | "more" | "discarding">("");
  const [error, setError] = useState("");
  const dirty = added.length > 0 || removed.size > 0;

  // leaving (or reloading) with changes not saved asks first
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const page = async (before?: string) => {
    const res = await fetch(`/api/admin/gallery/photos?sub=${sub.id}${before ? `&before=${before}` : ""}`);
    if (!res.ok) throw new Error("Could not load the photos.");
    return (await res.json()) as { photos: AlbumPhoto[]; more: boolean };
  };

  async function showMore() {
    setBusy("more");
    try {
      const next = await page(photos.at(-1)?.id);
      setPhotos((p) => [...p, ...next.photos]);
      setMore(next.more);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the photos.");
    } finally {
      setBusy("");
    }
  }

  function onUploaded(m: UploadedMedia) {
    setAdded((a) => [...a, { src: m.url, publicId: m.publicId, width: m.width, height: m.height }]);
    setError("");
  }

  // a new photo not saved yet goes straight away, file and all (nothing else uses it)
  function dropNew(publicId: string) {
    setAdded((a) => a.filter((p) => p.publicId !== publicId));
    void discard([publicId]);
  }
  function toggleRemoved(id: string) {
    setRemoved((r) => {
      const next = new Set(r);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const discard = (publicIds: string[]) =>
    fetch("/api/admin/gallery/discard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicIds }),
    }).catch(() => {});

  async function save() {
    if (removed.size) {
      const sure = await confirm({
        title: `Delete ${photosCount(removed.size)} for good?`,
        body: "They'll be removed from the website and from the photo store. This can't be undone.",
        confirmLabel: "Save and delete",
        tone: "bad",
      });
      if (!sure) return;
    }
    setBusy("saving");
    setError("");
    try {
      const res = await fetch("/api/admin/gallery/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sub: sub.id, add: added, remove: [...removed] }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not save. Please try again.");
        setBusy("");
        return;
      }
      setAdded([]);
      setRemoved(new Set());
      toast({
        tone: "good",
        title: "Saved. Your site is updated.",
        body: `${sub.name} has ${photosCount(json.count ?? 0)} on the website.`,
      });
      // (still "saving" until the Gallery page opens, so Save can't be pressed twice)
      router.push(`/admin/gallery?open=${sub.id}`);
    } catch {
      setError("Network problem. Check your connection and try again.");
      setBusy("");
    }
  }

  async function reset() {
    setBusy("discarding");
    await discard(added.map((p) => p.publicId));
    setAdded([]);
    setRemoved(new Set());
    setError("");
    setBusy("");
  }

  // the newest upload first, as the website will show them
  const fresh = [...added].reverse();

  return (
    <>
      {/* Uploading */}
      <section className="rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-8 text-center">
        <p className="font-display text-[1.25rem] text-ink">Add photos to {sub.name}</p>
        <p className="mx-auto mt-1.5 max-w-[56ch] text-[0.86rem] leading-relaxed text-slate-500">
          Choose up to 200 at a time, or drag them into the window that opens. Any size or shape works: each
          shows whole on the website, and big ones are made smaller before they upload. They appear on the
          website when you press <b className="font-semibold text-slate-600">Save changes</b>.
        </p>
        <div className="mt-5 flex justify-center">
          <UploadButton
            folder="gallery"
            multiple
            maxFiles={200}
            shrinkTo={SHRINK_TO}
            library={false}
            label="Upload photos"
            onUploaded={onUploaded}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-deep px-5 py-2.5 font-heading text-[0.74rem] font-bold tracking-[0.12em] text-cream uppercase transition-colors hover:bg-accent disabled:opacity-60"
          />
        </div>
      </section>

      {/* What's there */}
      <p className="mt-7 mb-3 text-[0.9rem] text-slate-600">
        <b className="font-semibold text-ink">{photosCount(sub.count)}</b> on the website
        {added.length > 0 && <span className="text-amber-600"> · {photosCount(added.length)} new, not saved yet</span>}
        {removed.size > 0 && <span className="text-accent"> · {photosCount(removed.size)} to delete</span>}
      </p>

      {fresh.length + photos.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-[0.9rem] text-slate-400">
          No photos yet. Upload the first ones above.
        </div>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
          {fresh.map((p) => (
            <li key={p.publicId} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 ring-2 ring-amber-400">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbOf(p.src)} alt="" loading="lazy" className="size-full object-cover" />
              <span className="absolute top-1.5 left-1.5 rounded bg-amber-400 px-1.5 py-0.5 font-heading text-[0.55rem] font-bold tracking-[0.1em] text-ink uppercase">
                New
              </span>
              <button
                type="button"
                onClick={() => dropNew(p.publicId)}
                aria-label="Remove this new photo"
                className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow transition-colors hover:text-accent"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
          {photos.map((p) => {
            const going = removed.has(p.id);
            return (
              <li key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbOf(p.src)}
                  alt=""
                  loading="lazy"
                  className={`size-full object-cover transition-opacity ${going ? "opacity-25 grayscale" : ""}`}
                />
                {going ? (
                  <button
                    type="button"
                    onClick={() => toggleRemoved(p.id)}
                    className="absolute inset-0 grid place-items-center text-center"
                  >
                    <span className="rounded-lg bg-white/95 px-2.5 py-1.5 text-[0.72rem] leading-tight text-accent shadow">
                      Will be deleted
                      <span className="block font-semibold text-slate-600 underline">Undo</span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleRemoved(p.id)}
                    aria-label="Delete this photo"
                    className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow transition-colors hover:text-accent"
                  >
                    <TrashIcon />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {more && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={showMore}
            disabled={busy === "more"}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[0.86rem] font-medium text-slate-700 transition-colors hover:border-brand hover:text-accent-deep disabled:opacity-60"
          >
            {busy === "more" ? "Loading…" : "Show more photos"}
          </button>
        </div>
      )}

      <SaveBar
        dirty={dirty}
        saving={busy === "saving" || busy === "discarding"}
        error={error}
        onSave={save}
        onReset={reset}
      />
    </>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M6 7l.8 12.1A1.9 1.9 0 0 0 8.7 21h6.6a1.9 1.9 0 0 0 1.9-1.9L18 7" />
    </svg>
  );
}
