"use client";

import type { GalleryCoverValue } from "@/lib/gallery";
import { thumbOf } from "@/lib/photoUrl";
import { NO_COVER } from "./values";
import { UploadButton } from "../../components/UploadButton";

// gallery photos are shrunk to this (width or height) before they're uploaded
export const SHRINK_TO = 2400;

/* A gallery photo field: the photo whole, in its own shape, with Upload / Replace and Remove.
   No crop or focus tools: the gallery pages show every photo whole, whatever its size, so there's
   nothing to adjust. Its width and height are kept with it, as the pages lay photos out by shape.
   `compact`: a small square preview beside the buttons, for a sub-category's line. */
export function CoverField({
  label,
  value,
  onChange,
  hint,
  compact = false,
}: {
  label: string;
  value: GalleryCoverValue;
  onChange: (next: GalleryCoverValue) => void;
  hint?: string;
  compact?: boolean;
}) {
  const upload = (
    <UploadButton
      folder="gallery"
      library={false}
      shrinkTo={SHRINK_TO}
      label={value.src ? "Replace" : "Upload"}
      onUploaded={(m) => onChange({ src: m.url, publicId: m.publicId, width: m.width, height: m.height })}
      className={
        compact
          ? "rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[0.76rem] font-medium text-slate-600 transition-colors hover:border-brand hover:text-accent-deep"
          : undefined
      }
    />
  );
  const remove = value.src && (
    <button
      type="button"
      onClick={() => onChange(NO_COVER)}
      className={`text-slate-400 transition-colors hover:text-accent ${compact ? "px-1 text-[0.74rem]" : "rounded-lg px-2.5 py-2 text-[0.8rem]"}`}
    >
      Remove
    </button>
  );

  if (compact) {
    return (
      <div className="flex shrink-0 items-center gap-3">
        <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-center font-heading text-[0.5rem] leading-tight font-bold tracking-[0.08em] text-slate-400 uppercase">
          {value.src ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={thumbOf(value.src, 128)} alt="" className="size-full object-cover" />
          ) : (
            <>
              No
              <br />
              cover
            </>
          )}
        </span>
        <span className="flex flex-col items-start gap-1">
          <span className="font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">{label}</span>
          <span className="flex items-center gap-1">
            {upload}
            {remove}
          </span>
        </span>
      </div>
    );
  }

  const shape = value.width && value.height ? `${value.width} / ${value.height}` : "3 / 2";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-heading text-[0.62rem] font-bold tracking-[0.18em] text-slate-500 uppercase">{label}</p>
        <div className="flex items-center gap-2">
          {remove}
          {upload}
        </div>
      </div>
      {value.src ? (
        <div className="mx-auto max-h-[18rem] max-w-full overflow-hidden rounded-lg bg-slate-100" style={{ aspectRatio: shape }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbOf(value.src, 900, true)} alt="" className="size-full object-contain" />
        </div>
      ) : (
        <div className="grid aspect-[3/2] place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-[0.84rem] text-slate-400">
          No photo yet
        </div>
      )}
      {hint && <p className="mt-2 text-[0.76rem] leading-relaxed text-slate-400">{hint}</p>}
    </div>
  );
}
