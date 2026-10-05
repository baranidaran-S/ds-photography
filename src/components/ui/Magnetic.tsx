"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type MagneticProps = {
  children: React.ReactNode;
  className?: string;
  /** How far the element follows the pointer (0–1). */
  strength?: number;
};

/** Pulls its child toward the mouse pointer, then springs back on leave. */
export function Magnetic({ children, className = "", strength = 0.3 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });

        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * strength);
          yTo((e.clientY - (r.top + r.height / 2)) * strength);
        };
        const onLeave = () => {
          xTo(0);
          yTo(0);
        };

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={`inline-flex ${className}`}>
      {children}
    </div>
  );
}
