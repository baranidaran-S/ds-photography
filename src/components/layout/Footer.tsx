"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import {
  contact,
  films,
  footer,
  instagram,
  navLinks,
  site,
} from "@/content/site";
import { photos } from "@/content/photos";
import { whatsappLink } from "@/lib/whatsapp";
import { useAnchorScroll } from "@/hooks/useAnchorScroll";
import { ArrowIcon, ChatIcon } from "@/components/ui/icons";

const telHref = `tel:+${contact.phone.replace(/\D/g, "")}`;

type IconProps = { className?: string };
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function InstagramIcon({ className = "size-[1.1rem]" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function YouTubeIcon({ className = "size-[1.1rem]" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
      <rect x="2.5" y="5" width="19" height="14" rx="4.5" />
      <path d="m10 9.3 5 2.7-5 2.7Z" fill="currentColor" />
    </svg>
  );
}
function PhoneIcon({ className = "size-[1.1rem]" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
      <path d="M5 3.5h3.2l1.6 4.2-2.2 1.5a11 11 0 0 0 7.2 7.2l1.5-2.2 4.2 1.6V19a1.6 1.6 0 0 1-1.7 1.6A16.6 16.6 0 0 1 3.4 5.2 1.6 1.6 0 0 1 5 3.5Z" />
    </svg>
  );
}
function MailIcon({ className = "size-[1.1rem]" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
function PinIcon({ className = "size-[1.1rem]" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

const socials = [
  { label: "Instagram", href: instagram.url, Icon: InstagramIcon },
  { label: "YouTube", href: films.channelUrl, Icon: YouTubeIcon },
  { label: "WhatsApp", href: whatsappLink(), Icon: ChatIcon },
];

const heading =
  "mb-6 font-heading text-[0.68rem] font-semibold tracking-[0.28em] text-brand-light/80 uppercase";
const link =
  "text-[0.95rem] text-cream/70 transition-colors duration-300 hover:text-brand-light";

export function Footer() {
  const root = useRef<HTMLElement>(null);
  const scrollTo = useAnchorScroll();

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const q = gsap.utils.selector(el);

      // The footer slides up from underneath the page as it comes into view
      gsap.fromTo(
        q(".ft-inner"),
        { yPercent: -18 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
        },
      );

      // Logo and links rise in, the big line writes itself word by word between two rules that
      // draw outwards from it, then the columns and the bottom bar
      const split = SplitText.create(q(".ft-headline"), {
        type: "words",
        mask: "words",
        ignore: q(".ft-foil-mask"),
      });
      gsap.set(split.masks, { paddingBottom: "0.12em", marginBottom: "-0.12em" });
      gsap
        .timeline({
          scrollTrigger: { trigger: el, start: "top 70%", once: true },
          defaults: { ease: "expo.out" },
        })
        .from(q(".ft-top > *"), { autoAlpha: 0, y: 26, duration: 1, stagger: 0.08 }, 0)
        .from(
          q(".ft-social"),
          { autoAlpha: 0, scale: 0.5, duration: 0.9, stagger: 0.07, ease: "back.out(2)" },
          0.35,
        )
        .from(split.words, { yPercent: 115, duration: 1.1, stagger: 0.06 }, 0.4)
        .from(q(".ft-foil"), { yPercent: 115, duration: 1.1 }, 0.7)
        .from(q(".ft-line"), { scaleX: 0, duration: 1.4, ease: "expo.inOut" }, 0.6)
        .from(q(".ft-col"), { autoAlpha: 0, y: 30, duration: 1, stagger: 0.1 }, 0.7)
        .from(q(".ft-rule"), { scaleX: 0, duration: 1.4, ease: "expo.inOut" }, 0.9)
        .from(q(".ft-bottom"), { autoAlpha: 0, duration: 1 }, 1.1);
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="relative overflow-hidden bg-night text-cream">
      <div className="ft-inner mx-auto max-w-[1320px] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-24">
        {/* Logo and social links */}
        <div className="ft-top flex flex-col items-center text-center">
          <a
            href="#home"
            onClick={(e) => scrollTo(e)}
            aria-label={`${site.name}, back to top`}
            className="flex flex-col items-center"
          >
            <Image
              src={photos.logo.full}
              alt={photos.logo.alt}
              width={828}
              height={706}
              sizes="120px"
              className="h-auto w-[5.5rem] sm:w-[6.25rem]"
            />
            <span className="mt-3 font-display text-[0.62rem] tracking-[0.48em] text-brand-light/80 uppercase">
              Photography
            </span>
          </a>
          <ul className="mt-8 flex gap-3">
            {socials.map(({ label, href, Icon }) => (
              <li key={label} className="ft-social">
                <a
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-11 place-items-center rounded-full border border-cream/20 text-cream/80 transition-colors duration-500 hover:border-brand hover:bg-brand hover:text-night"
                >
                  <Icon className="size-[1.1rem]" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Links · the big line between two rules · contact. Both sides take equal width, so the big
            line sits in the exact centre; each rule fills the space between its column and the line. */}
        {/* Tablets and small laptops: the big line on top, Explore and Contact side by side, centred under it */}
        <div className="mt-16 grid gap-12 pb-16 sm:grid-cols-[auto_auto] sm:justify-center sm:gap-x-20 lg:mt-20 lg:gap-x-32 lg:pb-20 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:justify-normal xl:gap-x-8">
          <div className="flex items-center gap-8">
            <nav aria-label="Footer" className="ft-col shrink-0 self-start xl:w-[17rem]">
              <p className={heading}>Explore</p>
              <ul className="grid grid-cols-[repeat(2,max-content)] gap-x-10 gap-y-3">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} onClick={(e) => scrollTo(e)} className={link}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <span aria-hidden className="ft-line hidden h-px min-w-10 flex-1 origin-right bg-cream/12 xl:block" />
          </div>

          <p className="ft-headline order-first mx-auto max-w-[15ch] self-center text-center font-display text-[clamp(2.1rem,3vw,3.2rem)] leading-[1.12] sm:col-span-2 xl:order-none xl:col-span-1">
            {footer.headline}{" "}
            <span className="ft-foil-mask -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
              <span className="ft-foil foil inline-block">{footer.headlineFoil}</span>
            </span>
          </p>

          <div className="flex items-center gap-8">
            <span aria-hidden className="ft-line hidden h-px min-w-10 flex-1 origin-left bg-cream/12 xl:block" />
            <div className="ft-col shrink-0 self-start xl:w-[17rem]">
              <p className={heading}>Contact</p>
              <address className="max-w-[19rem] space-y-3.5 text-[0.95rem] leading-[1.6] text-cream/70 not-italic">
                <a href={telHref} className="flex items-start gap-3 transition-colors duration-300 hover:text-brand-light">
                  <PhoneIcon className="mt-[0.2rem] size-4 shrink-0" />
                  {contact.phone}
                </a>
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-start gap-3 transition-colors duration-300 hover:text-brand-light"
                >
                  <MailIcon className="mt-[0.2rem] size-4 shrink-0" />
                  {contact.email}
                </a>
                <p className="flex items-start gap-3">
                  <PinIcon className="mt-[0.2rem] size-4 shrink-0" />
                  <span>{contact.address.join(", ")}</span>
                </p>
              </address>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <span aria-hidden className="ft-rule block h-px origin-left bg-cream/12" />
        <div className="ft-bottom flex flex-col-reverse items-start justify-between gap-5 py-8 text-[0.8rem] text-cream/45 sm:flex-row sm:items-center">
          <p>
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
            {site.name}. All rights reserved.
            <span aria-hidden className="mx-2.5 text-cream/25">
              ·
            </span>
            Designed & developed by{" "}
            <a
              href={footer.credit.url || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream/70 transition-colors duration-300 hover:text-brand-light"
            >
              {footer.credit.label}
            </a>
          </p>
          <a
            href="#home"
            onClick={(e) => scrollTo(e)}
            className="group inline-flex items-center gap-3 font-heading text-[0.68rem] font-semibold tracking-[0.22em] text-cream/70 uppercase transition-colors duration-300 hover:text-brand-light"
          >
            Back to top
            <span className="grid size-9 place-items-center rounded-full border border-cream/20 transition-colors duration-500 group-hover:border-brand group-hover:bg-brand group-hover:text-night">
              <ArrowIcon className="size-4 -rotate-90 transition-transform duration-500 ease-luxe group-hover:-translate-y-0.5" />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
