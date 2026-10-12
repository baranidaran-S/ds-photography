"use client";

import { CldUploadWidget } from "next-cloudinary";
import { useState } from "react";

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
  className?: string;
};

/** Opens Cloudinary's upload widget, then records the result in our Media library. */
export function UploadButton({
  folder,
  onUploaded,
  label = "Upload photo",
  multiple = false,
  className = "",
}: Props) {
  const [saving, setSaving] = useState(false);

  return (
    <CldUploadWidget
      signatureEndpoint="/api/admin/media/sign"
      options={{
        folder: `ds-photography/${folder}`,
        multiple,
        maxFiles: multiple ? 20 : 1,
        sources: ["local", "url", "camera"],
        resourceType: "image",
        // 10 MB is generous for a web photo and keeps the free tier healthy
        maxFileSize: 10_000_000,
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

        onUploaded(media);
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
