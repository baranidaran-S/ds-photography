"use client";

import { useRef, useState } from "react";
import { UploadButton, type UploadedMedia } from "./UploadButton";

export type PhotoValue = {
  src: string;
  alt: string;
  position?: string;
  mobilePosition?: string;
  publicId?: string;
};

type Props = {
  label: string;
  value: PhotoValue;
  onChange: (next: PhotoValue) => void;
  folder: string;
  /** Shows the second focus point used on phones, where the crop is taller. */
  withMobile?: boolean;
  /** Preview box ratio — match the shape the photo appears in on the site. */
  aspect?: string;
  /* Offers "Remove photo". Only for the places the site copes with an empty one,
     either by falling back to something else or by leaving the photo out. */
  optional?: boolean;
  hint?: string;
};

function parse(position?: string) {
  const [x, y] = (position ?? "50% 50%").split(" ");
  // `|| 50` would be wrong here: 0 is falsy, and "0% 30%" is a real focus point
  const num = (v: string) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 50);
  return { x: num(x), y: num(y) };
}

export function PhotoField({
  label,
  value,
  onChange,
  folder,
  withMobile = false,
  aspect = "3 / 2",
  optional = false,
  hint,
}: Props) {
  const [editing, setEditing] = useState<"desktop" | "mobile">("desktop");
  const [focusMode, setFocusMode] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const replaceRef = useRef<HTMLDivElement>(null);

  const key = editing === "mobile" ? "mobilePosition" : "position";
  const current =
    editing === "mobile"
      ? value.mobilePosition || value.position || "50% 50%"
      : value.position || "50% 50%";
  const point = parse(current);

  /* Clicking the photo swaps the photo — that is what everyone reaches for first.
     It presses the Replace button rather than carrying a second copy of the upload
     widget, so there is still only one of them per field. */
  function openPicker() {
    replaceRef.current?.querySelector("button")?.click();
  }

  /* Choosing the focus point — the part of the photo that stays in view when it is
     cropped — is a deliberate mode. It used to run on any click of the preview,
     which quietly moved the crop when someone only meant to change the picture. */
  function setFocus(event: React.MouseEvent<HTMLDivElement>) {
    const box = boxRef.current;
    if (!box || !value.src) return;
    const rect = box.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    onChange({
      ...value,
      [key]: `${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`,
    });
  }

  function onUploaded(media: UploadedMedia) {
    onChange({ ...value, src: media.url, publicId: media.publicId });
  }

  /* Clears the alt text along with the photo: it described the picture that has
     just gone, and left behind it would quietly mislabel the next one. The file
     stays in the Media Library, so nothing is lost by changing your mind. */
  function removePhoto() {
    setFocusMode(false);
    onChange({
      ...value,
      src: "",
      publicId: "",
      alt: "",
      position: "50% 50%",
      mobilePosition: "50% 50%",
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-heading text-[0.62rem] font-bold tracking-[0.18em] text-slate-500 uppercase">
          {label}
        </p>
        <div ref={replaceRef}>
          <UploadButton
            folder={folder}
            onUploaded={onUploaded}
            label={value.src ? "Replace" : "Upload"}
          />
        </div>
      </div>

      {/* Preview + focus picker */}
      <div
        ref={boxRef}
        onClick={(e) => (focusMode ? setFocus(e) : openPicker())}
        onKeyDown={(e) => {
          // a div with role="button" does not fire click from the keyboard
          if (!focusMode && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openPicker();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={
          focusMode
            ? "Click the part of the photo that should stay in view"
            : value.src
              ? "Change this photo"
              : "Add a photo"
        }
        style={{ aspectRatio: aspect }}
        /* Capped: a full-width 16:9 preview ran to four hundred pixels tall, and
           a page of them was nothing but scrolling. Still large enough to pick a
           focus point on. */
        className={`relative w-full max-w-[26rem] overflow-hidden rounded-lg bg-slate-100 ${
          focusMode ? "cursor-crosshair" : "cursor-pointer"
        }`}
      >
        {value.src ? (
          <>
            {/* a plain img, not next/image: the preview changes object-position live */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.src}
              alt=""
              className="size-full object-cover"
              style={{ objectPosition: current }}
            />
            {focusMode && (
              <span
                aria-hidden
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgb(0_0_0/0.35)]"
              />
            )}
          </>
        ) : (
          <span className="grid size-full place-items-center text-[0.84rem] text-slate-400">
            No photo yet — click to add one
          </span>
        )}
      </div>

      {value.src && (
        <>
          <div className="mt-2 flex max-w-[26rem] flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFocusMode((v) => !v)}
              aria-pressed={focusMode}
              className={`rounded-lg px-2.5 py-1 text-[0.76rem] font-medium transition-colors ${
                focusMode
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-accent-deep"
              }`}
            >
              {focusMode ? "Done adjusting" : "Adjust the crop"}
            </button>

            {optional && !focusMode && (
              <button
                type="button"
                onClick={removePhoto}
                className="ml-auto text-[0.76rem] text-slate-400 underline-offset-2 hover:text-accent hover:underline"
              >
                Remove photo
              </button>
            )}

            {focusMode && (
              <>
                {withMobile && (
                  <div className="flex rounded-lg bg-slate-100 p-0.5">
                    {(["desktop", "mobile"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setEditing(mode)}
                        aria-pressed={editing === mode}
                        className={`rounded-md px-2.5 py-1 text-[0.74rem] font-medium capitalize transition-colors ${
                          editing === mode
                            ? "bg-white text-ink shadow-sm"
                            : "text-slate-500 hover:text-ink"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                )}
                <p className="font-mono text-[0.72rem] text-slate-400">
                  focus {current}
                </p>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, [key]: "50% 50%" })}
                  className="ml-auto text-[0.76rem] text-slate-400 underline-offset-2 hover:text-accent-deep hover:underline"
                >
                  Centre
                </button>
              </>
            )}
          </div>

          <p className="mt-1.5 text-[0.76rem] leading-relaxed text-slate-400">
            {focusMode
              ? "Click the part of the photo that must stay in view when it is cropped."
              : "Click the photo to change it."}
          </p>
        </>
      )}

      <label className="mt-3 block">
        <span className="mb-1 block font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
          Alt text
        </span>
        <input
          value={value.alt}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
          placeholder="Short description of what is in the photo"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.88rem] text-ink placeholder:text-slate-300 focus:border-brand focus:outline-none"
        />
      </label>

      <p className="mt-1.5 text-[0.76rem] leading-relaxed text-slate-400">
        {hint ?? "Read aloud by screen readers and used by Google. Describe the photo, don't repeat the page title."}
      </p>
    </div>
  );
}
