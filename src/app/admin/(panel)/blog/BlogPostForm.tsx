"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_TONE, type BlogPost } from "@/content/blog";
import type { BlogCoverValue, BlogPhotoValue, BlogPostValue, CategoryOption } from "@/lib/blog";
import { slugOf } from "@/lib/slug";
import { Card, TextArea, TextField } from "../../components/Field";
import { useToast } from "../../components/Feedback";
import { SaveBar } from "../../components/SaveBar";
import { UploadButton, type UploadedMedia } from "../../components/UploadButton";
import { CoverPicker, type Look } from "./CoverPicker";
import { StoryPhotos } from "./StoryPhotos";
import { NO_COVER, SHRINK_TO } from "./values";

const label = "mb-1 block font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase";
const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.9rem] text-ink placeholder:text-slate-300 focus:border-brand focus:outline-none";
const hintText = "mt-1 block text-[0.76rem] leading-relaxed text-slate-400";

type CoverKey = "cover" | "storyCover";

/** Deletes photos uploaded in the form and not kept (only ones no post uses: the server checks).
    Sent so it still goes when the page is being left. */
function discard(publicIds: string[]) {
  if (!publicIds.length) return;
  void fetch("/api/admin/blog/discard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicIds }),
    keepalive: true,
  }).catch(() => {});
}

/* One blog post's form: everything the website shows for it, in one place. Saving puts it live
   straight away (there are no drafts); the website makes its card on the blog page and its own
   page from it. Its address is made from the title as it's typed, can be changed until it's first
   saved, and is fixed after, so links to it keep working. A cover is looked at as soon as it's
   uploaded, for its focus point and its card's colour. Leaving with unsaved changes asks first,
   and photos uploaded but never saved are deleted. */
export function BlogPostForm({ initial, categories }: { initial: BlogPostValue; categories: CategoryOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !initial.id;
  const [original, setOriginal] = useState(initial);
  const [draft, setDraft] = useState(initial);
  // a new post's address follows its title until one is typed
  const [ownAddress, setOwnAddress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [looks, setLooks] = useState<Partial<Record<CoverKey, Look>>>({});
  // the photo each cover is being looked at for (cleared when it's replaced, removed or tapped)
  const asked = useRef<Partial<Record<CoverKey, string>>>({});
  // photos uploaded here and not saved yet
  const fresh = useRef<string[]>([]);

  const address = isNew ? (ownAddress ? draft.slug : slugOf(draft.title)) : draft.slug;
  const dirty = useMemo(
    () => ownAddress || JSON.stringify(draft) !== JSON.stringify(original),
    [draft, original, ownAddress],
  );

  // the browser asks before the tab is closed or reloaded with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const stay = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", stay);
    return () => window.removeEventListener("beforeunload", stay);
  }, [dirty]);

  // photos uploaded and never saved go when the form is left (the tab closed, or another page)
  useEffect(() => {
    const leave = () => {
      discard(fresh.current);
      fresh.current = [];
    };
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, []);

  const set = (patch: Partial<BlogPostValue>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
    setError("");
  };
  const setCover = (key: CoverKey, change: (c: BlogCoverValue) => BlogCoverValue) => {
    setDraft((d) => ({ ...d, [key]: change(d[key]) }));
    setSaved(false);
    setError("");
  };

  /** A photo being replaced or removed: if it was uploaded here and never saved, its file goes */
  function letGo(photo: { publicId: string }) {
    if (!photo.publicId || !fresh.current.includes(photo.publicId)) return;
    fresh.current = fresh.current.filter((id) => id !== photo.publicId);
    discard([photo.publicId]);
  }

  /** Has the website look at a cover for its focus point (and, for the card's cover, its colour) */
  async function lookAt(key: CoverKey, src: string) {
    asked.current[key] = src;
    setLooks((l) => ({ ...l, [key]: "looking" }));
    const res = await fetch("/api/admin/blog/cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ src }),
    }).catch(() => null);
    const found = res?.ok ? await res.json().catch(() => null) : null;
    // (replaced, removed or tapped meanwhile: the answer is for a photo or a point no longer there)
    if (asked.current[key] !== src) return;
    asked.current[key] = undefined;
    if (!found?.position) {
      setLooks((l) => ({ ...l, [key]: "missed" }));
      return;
    }
    setDraft((d) =>
      d[key].src !== src
        ? d
        : {
            ...d,
            [key]: { ...d[key], position: found.position, width: d[key].width || found.width, height: d[key].height || found.height },
            ...(key === "cover" && found.tone ? { tone: found.tone } : {}),
          },
    );
    setLooks((l) => ({ ...l, [key]: "found" }));
  }

  function uploaded(key: CoverKey, m: UploadedMedia) {
    fresh.current.push(m.publicId);
    letGo(draft[key]);
    setCover(key, () => ({ src: m.url, publicId: m.publicId, width: m.width, height: m.height, position: "50% 50%" }));
    void lookAt(key, m.url);
  }

  function focus(key: CoverKey, position: string) {
    asked.current[key] = undefined;
    setLooks((l) => ({ ...l, [key]: "tapped" }));
    setCover(key, (c) => ({ ...c, position }));
  }

  /** A story photo uploaded (one call per photo, as a batch comes in): it goes at the end */
  function addPhoto(m: UploadedMedia) {
    fresh.current.push(m.publicId);
    const photo: BlogPhotoValue = { src: m.url, publicId: m.publicId, width: m.width, height: m.height };
    setDraft((d) => ({ ...d, photos: [...d.photos, photo] }));
    setSaved(false);
    setError("");
  }

  function removePhoto(photo: BlogPhotoValue) {
    letGo(photo);
    setDraft((d) => ({ ...d, photos: d.photos.filter((p) => p.src !== photo.src) }));
    setSaved(false);
    setError("");
  }

  function remove(key: CoverKey) {
    asked.current[key] = undefined;
    setLooks((l) => ({ ...l, [key]: undefined }));
    letGo(draft[key]);
    setCover(key, () => NO_COVER);
  }

  function reset() {
    discard(fresh.current);
    fresh.current = [];
    asked.current = {};
    setLooks({});
    setDraft(original);
    setOwnAddress(false);
    setError("");
    setSaved(false);
  }

  async function save() {
    const missing = !draft.title.trim()
      ? "Give the post a title."
      : !draft.category
        ? "Choose a category."
        : !draft.date
          ? "Choose the date it was published."
          : !draft.cover.src
            ? "Add a cover photo."
            : isNew && !slugOf(address)
              ? "The address needs English letters or numbers. Type one under Address."
              : Object.values(looks).includes("looking")
                ? "One moment: the cover is still being looked at. Try again in a second."
                : "";
    if (missing) {
      setError(missing);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(isNew ? "/api/admin/blog" : `/api/admin/blog?id=${draft.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, slug: address }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not save. Please try again.");
        return;
      }
      // (its photos are the post's now: kept)
      fresh.current = [];
      if (isNew) {
        // on to the post's own page in the admin, where it's edited from now on
        toast({ tone: "good", title: "Published", body: "The post is on the website." });
        setOriginal(draft);
        setOwnAddress(false);
        router.replace(`/admin/blog/${json.id}`);
        router.refresh();
        return;
      }
      setOriginal(draft);
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  // the post's card as the blog page would show it now
  const card: BlogPost = {
    slug: address,
    title: draft.title.trim() || "The post's title",
    category: categories.find((c) => c.id === draft.category)?.name ?? "",
    place: draft.place.trim(),
    date: draft.date,
    cover: { src: draft.cover.src, alt: "", position: draft.cover.position },
    storyCover: { src: draft.storyCover.src, alt: "", position: draft.storyCover.position },
    tone: draft.tone || DEFAULT_TONE,
    excerpt: "",
    description: "",
    photos: [],
    seo: { title: "", description: "" },
  };

  return (
    <>
      <div className="space-y-5">
        <Card title="Post details" description="What the card on the blog page and the top of the post's own page show.">
          <TextField
            label="Title"
            value={draft.title}
            onChange={(title) => set({ title })}
            placeholder="e.g. A traditional wedding in Tirunelveli"
          />

          {isNew ? (
            <label className="block">
              <span className={label}>Address</span>
              <span className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-brand">
                <span className="pl-3 font-mono text-[0.84rem] text-slate-400">/blog/</span>
                <input
                  value={address}
                  onChange={(e) => {
                    setOwnAddress(e.target.value !== "");
                    set({ slug: e.target.value });
                  }}
                  placeholder="made from the title"
                  className="w-full rounded-r-lg bg-transparent py-2 pr-3 pl-0.5 font-mono text-[0.84rem] text-ink placeholder:text-slate-300 focus:outline-none"
                />
              </span>
              <span className={hintText}>
                Its link: <span className="font-mono">/blog/{slugOf(address) || "…"}</span>. Made from the title; you can
                change it now, but not after publishing.
              </span>
            </label>
          ) : (
            <div>
              <span className={label}>Address</span>
              <p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[0.84rem] text-slate-600">
                <svg viewBox="0 0 24 24" aria-hidden className="size-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                </svg>
                /blog/{draft.slug}
              </p>
              <span className={hintText}>Fixed once published, so links to the post keep working.</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={label}>Category</span>
              <select value={draft.category} onChange={(e) => set({ category: e.target.value })} className={input}>
                <option value="">Choose a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.hidden ? " (hidden in the gallery)" : ""}
                  </option>
                ))}
              </select>
              <span className={hintText}>
                {categories.length ? (
                  "The gallery's categories. Its tab on the blog page."
                ) : (
                  <>
                    The gallery has no categories yet.{" "}
                    <Link href="/admin/gallery" className="text-accent-deep underline">
                      Add one in the Gallery
                    </Link>
                    .
                  </>
                )}
              </span>
            </label>
            <TextField label="Place" value={draft.place} onChange={(place) => set({ place })} placeholder="e.g. Madurai" hint="Where the shoot was." />
            <label className="block">
              <span className={label}>Published</span>
              <input type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} className={input} />
              <span className={hintText}>The blog lists the newest first.</span>
            </label>
          </div>
        </Card>

        <Card
          title="Cover photo"
          description="Any size or shape: tall, wide or square, as it comes from the camera. Nothing to crop: each place on the website shows it through a window of its own shape, keeping the gold focus point in view. The card's colour is taken from it."
        >
          <CoverPicker
            value={draft.cover}
            look={looks.cover}
            card={card}
            windows={[
              { id: "card", where: "On the blog page and under “More stories”" },
              {
                id: "phone",
                where: draft.storyCover.src ? "The newest story, at the top of the blog page" : "The newest story on the blog page, and the top of its own page",
              },
              { id: "computer", where: "The same, on a tablet or computer" },
            ]}
            onUpload={(m) => uploaded("cover", m)}
            onFocus={(p) => focus("cover", p)}
            onLookAgain={() => void lookAt("cover", draft.cover.src)}
            onRemove={() => remove("cover")}
            uploadLabel="Upload the cover"
            empty={
              <>
                <p className="font-medium text-ink">No cover yet</p>
                <p>Upload any photo, tall or wide. Wide photos lose the least in the windows.</p>
              </>
            }
          />

          <div className="border-t border-slate-100 pt-4">
            <p className={label}>Top of the post&rsquo;s own page</p>
            {draft.storyCover.src ? (
              <CoverPicker
                value={draft.storyCover}
                look={looks.storyCover}
                windows={[
                  { id: "phone", where: "The top of the post's own page, on a phone" },
                  { id: "computer", where: "The same, on a tablet or computer" },
                ]}
                onUpload={(m) => uploaded("storyCover", m)}
                onFocus={(p) => focus("storyCover", p)}
                onLookAgain={() => void lookAt("storyCover", draft.storyCover.src)}
                onRemove={() => remove("storyCover")}
                removeLabel="Use the cover here instead"
                uploadLabel="Upload a photo"
                empty={null}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
                <p className="max-w-[60ch] text-[0.84rem] leading-relaxed text-slate-500">
                  The cover is used here. To show a different photo at the top of the post (say, a wide one when the cover
                  is tall), add it. Optional.
                </p>
                <UploadButton folder="blog" library={false} shrinkTo={SHRINK_TO} label="Add a different photo" onUploaded={(m) => uploaded("storyCover", m)} />
              </div>
            )}
          </div>
        </Card>

        <Card title="Description" description="The story, shown on the post's own page exactly as written here.">
          <TextArea
            label="Description"
            value={draft.description}
            onChange={(description) => set({ description })}
            placeholder="Write the story of the shoot…"
            hint="Press Enter twice to start a new paragraph."
            rows={14}
          />
        </Card>

        <Card
          title="Photos from this shoot"
          description="Shown under the description on the post's own page, in this order, each one whole (never cropped). Tapping one there opens them full-screen."
        >
          <StoryPhotos photos={draft.photos} onOrder={(photos) => set({ photos })} onUpload={addPhoto} onRemove={removePhoto} />
        </Card>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        saved={saved}
        onSave={save}
        onReset={reset}
        saveLabel={isNew ? "Publish" : "Save changes"}
      />
    </>
  );
}
