"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Drives Lenis from GSAP's ticker so smooth scroll and ScrollTrigger stay in sync. */
function GsapBridge() {
  const lenis = useLenis(ScrollTrigger.update);

  useEffect(() => {
    if (!lenis) return;
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(update);
  }, [lenis]);

  return null;
}

/* Every page opens at the top, where its intro plays (as a fresh visit does, see the site layout).
   The browser's Back and Forward would otherwise bring a page back wherever it was left, or at
   the last page's scroll position: so on Back/Forward, on a page restored from the browser's
   cache, and whenever the page changes, both the window and Lenis go straight to the top. */
function TopOnEveryPage() {
  const lenis = useLenis();
  const pathname = usePathname();
  const shown = useRef(pathname);

  useEffect(() => {
    const toTop = () => {
      lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
    };
    const restored = (e: PageTransitionEvent) => e.persisted && toTop();
    window.addEventListener("popstate", toTop);
    window.addEventListener("pageshow", restored);
    return () => {
      window.removeEventListener("popstate", toTop);
      window.removeEventListener("pageshow", restored);
    };
  }, [lenis]);

  useEffect(() => {
    // (only when the page has changed: a fresh visit already starts at the top)
    if (shown.current === pathname) return;
    shown.current = pathname;
    lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    // the new page's scroll animations measured themselves before this jump
    ScrollTrigger.refresh();
  }, [pathname, lenis]);

  return null;
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ReactLenis root options={{ autoRaf: false, lerp: 0.09 }} />
      <GsapBridge />
      <TopOnEveryPage />
      {children}
    </>
  );
}
