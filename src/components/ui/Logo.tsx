"use client";

import Image from "next/image";
import { LotusMark } from "@/components/ui/ornaments";
import { useSite } from "@/components/providers/SiteProvider";

/** The word under the mark; it tucks away when the menu bar turns compact (see .site-logo-word in globals.css) */
function Word() {
  return (
    <span className="site-logo-word">
      <span className="overflow-hidden">
        <span className="block pt-1.5 font-display text-[0.56rem] leading-none tracking-[0.42em] uppercase lg:pt-2 lg:text-[0.64rem] lg:tracking-[0.48em]">
          Photography
        </span>
      </span>
    </span>
  );
}

/** Centred, stacked logo: the mark set in System Settings with PHOTOGRAPHY underneath.
    Until a logo file is set, a text logo: lotus + DS. */
export function Logo({ className = "" }: { className?: string }) {
  const { logo } = useSite();

  if (logo.src) {
    return (
      <span className={`flex flex-col items-center ${className}`}>
        <Image
          src={logo.src}
          alt={logo.alt}
          // real proportions come from the file; these only size the download
          width={logo.height * 6}
          height={logo.height}
          preload
          // --logo-k shrinks the mark once the bar turns compact (set on .site-header)
          className="h-[calc(var(--logo-h)*0.82*var(--logo-k,1))] w-auto max-w-[44vw] object-contain transition-[height] duration-700 ease-luxe lg:h-[calc(var(--logo-h)*var(--logo-k,1))]"
          style={{ "--logo-h": `${logo.height}px` } as React.CSSProperties}
        />
        {logo.showText && <Word />}
      </span>
    );
  }

  return (
    <span className={`flex flex-col items-center ${className}`}>
      <span className="flex items-center gap-2">
        <LotusMark className="h-6 w-8 text-brand lg:h-7 lg:w-9" />
        <span className="font-heading text-[1.45rem] leading-none font-semibold tracking-[0.08em] lg:text-[1.7rem]">
          DS
        </span>
      </span>
      <Word />
    </span>
  );
}
