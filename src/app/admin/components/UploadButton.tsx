"use client";

import { CldUploadWidget } from "next-cloudinary";
import { useEffect, useRef, useState } from "react";

export type UploadedMedia = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  originalName: string;
};

type Props = {
  /** One of UPLOAD_FOLDERS — the sign route rejects anything else. */
  folder: string;
  onUploaded: (media: UploadedMedia) => void;
  label?: string;
  multiple?: boolean;
  /** how many at once, when several can be chosen */
  maxFiles?: number;
  /* Shrinks a photo bigger than this (width or height) in the browser before it's sent, so it
     uploads faster and takes less space; a camera's 25 MB photo becomes a couple of MB. */
  shrinkTo?: number;
  /** also lists it in the admin's Media Library (the gallery's photos aren't: they'd bury it) */
  library?: boolean;
  className?: string;
};

/** Opens Cloudinary's upload widget, then records the result in our Media library. */
export function UploadButton({
  folder,
  onUploaded,
  label = "Upload photo",
  multiple = false,
  maxFiles = 20,
  shrinkTo,
  library = true,
  className = "",
}: Props) {
  const [saving, setSaving] = useState(false);
  /* The upload window is made once, when the button first shows, and keeps the onUploaded it was
     given then. Calling the newest one instead means a name typed since (before Upload was
     pressed) isn't put back the way it was. */
  const latest = useRef(onUploaded);
  useEffect(() => {
    latest.current = onUploaded;
  });

  return (
    <CldUploadWidget
      signatureEndpoint="/api/admin/media/sign"
      options={{
        folder: `ds-photography/${folder}`,
        multiple,
        maxFiles: multiple ? maxFiles : 1,
        ...(shrinkTo ? { maxImageWidth: shrinkTo, maxImageHeight: shrinkTo } : {}),
        sources: ["local", "url", "camera"],
        resourceType: "image",
        // 10 MB is generous for a web photo and keeps the free tier healthy (a photo shrunk in the
        // browser first may start bigger: the 10 MB is checked on what's sent)
        maxFileSize: shrinkTo ? 60_000_000 : 10_000_000,
        clientAllowedFormats: ["png", "jpg", "jpeg", "webp", "avif"],
        styles: {
          palette: {
            window: "#ffffff",
            sourceBg: "#f8fafc",
            windowBorder: "#cbd5e1",
            tabIcon: "#8e1120",
            inactiveTabIcon: "#64748b",
            menuIcons: "#64748b",
            link: "#8e1120",
            action: "#d6b26c",
            inProgress: "#d6b26c",
            complete: "#16a34a",
            error: "#c8102e",
            textDark: "#1e1612",
            textLight: "#ffffff",
          },
        },
      }}
      onSuccess={async (result) => {
        const info = result?.info;
        if (!info || typeof info === "string") return;

        const media: UploadedMedia = {
          publicId: info.public_id,
          url: info.secure_url,
          width: info.width ?? 0,
          height: info.height ?? 0,
          format: info.format ?? "",
          bytes: info.bytes ?? 0,
          originalName:
            (info as { original_filename?: string }).original_filename ?? "",
        };

        if (library) {
          setSaving(true);
          try {
            // record it in the library so it can be reused from the picker
            await fetch("/api/admin/media", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...media, folder }),
            });
          } finally {
            setSaving(false);
          }
        }

        latest.current(media);
      }}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          disabled={saving}
          className={
            className ||
            "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[0.84rem] font-medium text-slate-700 transition-colors hover:border-brand hover:text-accent-deep disabled:opacity-60"
          }
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V16" />
          </svg>
          {saving ? "Saving…" : label}
        </button>
      )}
    </CldUploadWidget>
  );
}
