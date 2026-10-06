"use client";

import { useCallback } from "react";
import { useLenis } from "lenis/react";

const NAV_HEIGHT = 72;

/** Where a "#section" link scrolls to: the section's main view (marked data-nav-view, e.g. the
    Services viewfinder) rather than its heading. The view starts just below the menu bar's space
    (`bar`), with a little air above it when it fits; a pinned view starts where its pin does. */
function scrollTopFor(section: HTMLElement, bar: number) {
  const view = section.querySelector<HTMLElement>("[data-nav-view]") ?? section;
  const spacer = view.parentElement?.classList.contains("pin-spacer") ? view.parentElement : null;
  // page position from the layout itself, so entrance animations (moves, scales) don't skew it
  let top = 0;
  for (let n: HTMLElement | null = spacer ?? view; n; n = n.offsetParent as HTMLElement | null) {
    top += n.offsetTop;
  }
  if (spacer) return top;
  const spare = window.innerHeight - bar - view.offsetHeight;
  return top - bar - (spare > 0 ? Math.min(spare / 2, 32) : 8);
}

/** Smooth-scrolls in-page "#section" links through Lenis; leaves other links alone. */
export function useAnchorScroll() {
  const lenis = useLenis();

  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, onDone?: () => void) => {
      const href = event.currentTarget.getAttribute("href");
      if (!href?.startsWith("#")) return;

      const section = href === "#home" ? null : document.querySelector<HTMLElement>(href);
      event.preventDefault();
      onDone?.();
      if (href !== "#home" && !section) return;
      // the menu bar hides while the page scrolls down and comes back while it scrolls up
      let top = section ? scrollTopFor(section, 0) : 0;
      if (section && top < window.scrollY) {
        const bar = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? NAV_HEIGHT;
        top = scrollTopFor(section, bar);
      }
      top = Math.max(0, top);

      if (lenis) {
        lenis.start();
        // tagged so the hero lets this scroll pass instead of stopping on its arch
        lenis.scrollTo(top, { duration: 1.4, userData: { anchor: true } });
      } else {
        window.scrollTo({ top, behavior: "smooth" });
      }
      // show the section in the address; a refresh still starts back at the top (layout.tsx)
      history.replaceState(null, "", href);
    },
    [lenis],
  );
}
