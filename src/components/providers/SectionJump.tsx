"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import { jumpTo } from "@/hooks/useAnchorScroll";

/* The admin's "View on site" buttons link to /?view=services rather than to
   /#services. A plain hash would not work: the site drops one on load on purpose,
   so every visit starts at the top and the intro plays (see the site layout).

   This waits for that intro to finish setting up — GSAP pins change the page
   height, and jumping before they exist lands nowhere near the section — then
   makes exactly the same jump the menu makes. */
export function SectionJump() {
  const lenis = useLenis();
  const wanted = useRef<string | null>(null);
  const read = useRef(false);

  useEffect(() => {
    if (!read.current) {
      read.current = true;
      const asked = new URLSearchParams(window.location.search).get("view");
      // an id, nothing else: this value goes straight into a querySelector
      wanted.current = asked && /^[a-z][a-z-]{0,30}$/.test(asked) ? asked : null;

      if (wanted.current) {
        // tidy the address at once, so a refresh starts at the top like any visit
        const url = new URL(window.location.href);
        url.searchParams.delete("view");
        history.replaceState(null, "", url.pathname + url.search);
      }
    }

    const target = wanted.current;
    if (!target) return;

    let waited = 0;
    const timer = window.setInterval(() => {
      // __dsReady is set once the hero intro is in place (Hero.tsx); the count is
      // the give-up, matching the 4s fallback the layout already uses
      if (!window.__dsReady && ++waited < 40) return;
      window.clearInterval(timer);
      wanted.current = null;
      jumpTo(`#${target}`, lenis ?? undefined);

      /* The admin shows this page in a frame while you edit. It has no way to
         know the intro has played and the jump has landed, so say so — otherwise
         it sits on a loading panel for the whole ten seconds. */
      if (window.parent !== window) {
        window.setTimeout(() => {
          window.parent.postMessage(
            { source: "ds-site", type: "ready", section: target },
            window.location.origin,
          );
        }, 1500);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [lenis]);

  return null;
}
