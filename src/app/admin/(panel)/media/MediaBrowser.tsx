"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadButton } from "../../components/UploadButton";
import { useConfirm, useToast } from "../../components/Feedback";

export type MediaItem = {
  id: string;
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  folder: string;
  originalName: string;
};

const FOLDERS = [
  "hero",
  "services",
  "portfolio",
  "about",
  "reviews",
  "instagram",
  "films",
  "logo",
  "contact",
  "misc",
];

function size(bytes: number) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/* One page of the library. The folder filter is a link rather than local state,
   so it composes with the page number in the address and survives a refresh
   after an upload or a delete. */
export function MediaBrowser({
  items,
  folder,
  counts,
  everything,
}: {
  items: MediaItem[];
  folder: string;
  counts: Record<string, number>;
  everything: number;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState("");

  async function remove(item: MediaItem) {
    const sure = await confirm({
      title: "Delete this file for good?",
      body: `${item.originalName || item.publicId} goes from Cloudinary as well as the library. Any section already using it keeps its copy of the link, so it will show a broken image until you put a new photo there.`,
      confirmLabel: "Delete for good",
      tone: "bad",
    });
    if (!sure) return;

    setBusy(item.publicId);
    const res = await fetch(
      `/api/admin/media?publicId=${encodeURIComponent(item.publicId)}`,
      { method: "DELETE" },
    );
    setBusy("");
    if (res.ok) {
      toast({ tone: "good", title: "File deleted" });
      router.refresh();
    } else {
      toast({
        tone: "bad",
        title: "Could not delete it",
        body: "Check your connection and try again.",
      });
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/media"
          className={`rounded-lg px-3 py-1.5 text-[0.82rem] font-medium transition-colors ${
            folder === ""
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-ink"
          }`}
        >
          All ({everything})
        </Link>
        {FOLDERS.map((f) => {
          const n = counts[f] ?? 0;
          if (n === 0) return null;
          return (
            <Link
              key={f}
              href={`/admin/media?folder=${f}`}
              className={`rounded-lg px-3 py-1.5 text-[0.82rem] font-medium capitalize transition-colors ${
                folder === f
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-ink"
              }`}
            >
              {f} ({n})
            </Link>
          );
        })}

        <div className="ml-auto">
          <UploadButton
            folder={folder || "misc"}
            multiple
            label={`Upload to ${folder || "misc"}`}
            onUploaded={() => {
              toast({ tone: "good", title: "Photo added to the library" });
              router.refresh();
            }}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-[0.95rem] text-slate-500">
            Nothing uploaded yet.
          </p>
          <p className="mx-auto mt-1 max-w-[46ch] text-[0.86rem] leading-relaxed text-slate-400">
            Your current photos still live in the project folder. They keep
            working — anything you upload here is stored on Cloudinary instead.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <figure
              key={item.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                {/* plain img: these are arbitrary library files shown at thumbnail size */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
              <figcaption className="p-3">
                <p className="truncate text-[0.84rem] font-medium text-ink">
                  {item.originalName || item.publicId.split("/").pop()}
                </p>
                <p className="mt-0.5 font-mono text-[0.72rem] text-slate-400">
                  {item.width}×{item.height} · {item.format} · {size(item.bytes)}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(item.url);
                      setCopied(item.id);
                      setTimeout(() => setCopied(""), 1600);
                      toast({
                        tone: "good",
                        title: "Link copied",
                        body: "Paste it anywhere you need this photo.",
                      });
                    }}
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-[0.76rem] font-medium text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    {copied === item.id ? "Copied" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    disabled={busy === item.publicId}
                    className="ml-auto rounded-md px-2.5 py-1 text-[0.76rem] font-medium text-slate-400 transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-50"
                  >
                    {busy === item.publicId ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  );
}
