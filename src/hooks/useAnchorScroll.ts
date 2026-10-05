"use client";

import { useCallback } from "react";
import { useLenis } from "lenis/react";

const NAV_OFFSET = -72;

/** Smooth-scrolls in-page "#section" links through Lenis; leaves other links alone. */
export function useAnchorScroll() {
  const lenis = useLenis();

  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, onDone?: () => void) => {
      const href = event.currentTarget.getAttribute("href");
      if (!href?.startsWith("#")) return;

      const target = href === "#home" ? 0 : document.querySelector<HTMLElement>(href);
      event.preventDefault();
      onDone?.();
      if (target === null) return;

      if (lenis) {
        lenis.start();
        lenis.scrollTo(target, { offset: NAV_OFFSET, duration: 1.4 });
      } else if (target === 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
      history.replaceState(null, "", href);
    },
    [lenis],
  );
}
