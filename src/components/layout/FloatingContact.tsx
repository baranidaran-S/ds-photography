"use client";

import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { whatsappLink } from "@/lib/whatsapp";

/** Chat bubble with a phone handset: the familiar WhatsApp-style mark */
function WhatsAppIcon({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 2.6a9.4 9.4 0 0 0-8.1 14.1L2.6 21.4l4.8-1.3A9.4 9.4 0 1 0 12 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 7.3c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.1.4 0 .6.6 1 1.4 1.8 2.5 2.4.2.1.4.1.5 0l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.3.4.5 0 .6-.2 1.2-.7 1.6-.6.5-1.5.7-2.4.4-1.6-.5-3-1.4-4.1-2.6-.9-1-1.6-2.2-1.9-3.4-.2-.8 0-1.6.5-2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** WhatsApp button in the bottom-right corner. It pops in once the visitor scrolls past the hero
    (globals.css → .fab). */
export function FloatingContact() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    ScrollTrigger.create({
      start: () => window.innerHeight * 0.6,
      end: "max",
      onToggle: (self) => el.toggleAttribute("data-visible", self.isActive),
    });
  });

  return (
    <div
      ref={root}
      className="fab fixed right-4 bottom-4 z-30 sm:right-6 sm:bottom-6"
    >
      <a
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fab-btn relative grid size-[3.75rem] place-items-center rounded-full bg-[#25d366] text-white shadow-[0_14px_30px_-10px_rgb(0_0_0/0.55)]"
      >
        <WhatsAppIcon className="size-[2rem]" />
      </a>
    </div>
  );
}
