"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import type { Photo } from "@/content/photos";
import { useEnquiry, useSite } from "@/components/providers/SiteProvider";
import { Magnetic } from "@/components/ui/Magnetic";
import { ArrowIcon, ChatIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";
import type { SectionHeading } from "@/content/db";

// Soft out-of-focus light circles behind the section: [left %, top %, size rem, gold or red, drift seconds]
const BOKEH = [
  [6, 12, 9, "gold", 19],
  [22, 64, 14, "gold", 24],
  [38, 8, 5, "red", 17],
  [47, 82, 7, "gold", 21],
  [3, 88, 6, "red", 26],
  [58, 30, 4, "gold", 15],
  [88, 6, 8, "gold", 23],
  [94, 70, 11, "red", 28],
  [70, 92, 5, "gold", 18],
] as const;

// Camera aperture: six blade edges round a hexagonal opening (decorative, behind the photo)
const R = 30;
const hexagon = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 3) * i;
  return [Math.cos(a) * R, Math.sin(a) * R] as const;
});
const blades = hexagon.map(([x, y], i) => {
  const [nx, ny] = hexagon[(i + 1) % 6];
  const len = Math.hypot(nx - x, ny - y);
  return {
    x1: x,
    y1: y,
    x2: x + ((nx - x) / len) * 104,
    y2: y + ((ny - y) / len) * 104,
  };
});

function Aperture({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="-100 -100 200 200"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.45"
    >
      <defs>
        <clipPath id="ct-aperture-clip">
          <circle r="92" />
        </clipPath>
      </defs>
      <circle r="98" />
      <circle r="92" strokeDasharray="0.6 2.4" />
      <g clipPath="url(#ct-aperture-clip)">
        {blades.map((l, i) => (
          <line key={i} {...l} />
        ))}
      </g>
      <polygon
        points={hexagon
          .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
          .join(" ")}
      />
    </svg>
  );
}

type IconProps = { className?: string };
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function PhoneIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
      <path d="M5 3.5h3.2l1.6 4.2-2.2 1.5a11 11 0 0 0 7.2 7.2l1.5-2.2 4.2 1.6V19a1.6 1.6 0 0 1-1.7 1.6A16.6 16.6 0 0 1 3.4 5.2 1.6 1.6 0 0 1 5 3.5Z" />
    </svg>
  );
}
function MailIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
function PinIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}
function ClockIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export type ContactContent = {
  phone: string;
  email: string;
  address: string[];
  hours: string[];
  bookingNote: { title: string; text: string };
};

export function Contact({
  contact,
  photo,
  backdrop,
  meta,
}: {
  contact: ContactContent;
  photo: Photo;
  backdrop: Photo;
  meta: SectionHeading;
}) {
  const root = useRef<HTMLElement>(null);
  const enquire = useEnquiry();
  const { site } = useSite();

  const telHref = `tel:+${contact.phone.replace(/\D/g, "")}`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    contact.address.join(", "),
  )}`;

  const rows = [
    { label: "Call us", lines: [contact.phone], href: telHref, Icon: PhoneIcon },
    {
      label: "WhatsApp",
      lines: ["Message us any time"],
      onClick: () => enquire({ source: "contact-row" }),
      Icon: ChatIcon,
    },
    {
      label: "Email",
      lines: [contact.email],
      href: `mailto:${contact.email}`,
      Icon: MailIcon,
    },
    {
      label: "Studio",
      lines: contact.address,
      href: directionsHref,
      Icon: PinIcon,
      external: true,
    },
    { label: "Hours", lines: contact.hours, Icon: ClockIcon },
  ];

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const q = gsap.utils.selector(el);

      const split = SplitText.create(q(".ct-title"), {
        type: "words",
        mask: "words",
        ignore: q(".ct-foil-mask"),
      });
      gsap.set(split.masks, {
        paddingBottom: "0.12em",
        marginBottom: "-0.12em",
      });

      gsap
        .timeline({
          scrollTrigger: { trigger: el, start: "top 75%", once: true },
          defaults: { ease: "expo.out" },
        })
        .from(q(".ct-eyebrow"), { autoAlpha: 0, y: 16, duration: 0.9 }, 0)
        .from(split.words, { yPercent: 115, duration: 1.1, stagger: 0.06 }, 0.1)
        .from(q(".ct-foil"), { yPercent: 115, duration: 1.1 }, 0.45)
        .from(q(".ct-intro"), { autoAlpha: 0, y: 20, duration: 1 }, 0.4)
        .from(
          q(".ct-row"),
          { autoAlpha: 0, x: -30, duration: 0.9, stagger: 0.08 },
          0.5,
        )
        .from(
          q(".ct-cta"),
          { autoAlpha: 0, y: 20, duration: 0.9, stagger: 0.08 },
          0.9,
        )
        // the photo is unveiled from the bottom, then the booking note rises under it
        .fromTo(
          q(".ct-photo"),
          { clipPath: "inset(100% 0% 0% 0% round 6px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 6px)",
            duration: 1.6,
            ease: "expo.inOut",
          },
          0.3,
        )
        .from(q(".ct-photo-inner"), { scale: 1.15, duration: 2.2 }, 0.3)
        .from(
          q(".ct-photo-line"),
          { autoAlpha: 0, scale: 1.04, duration: 1.2, ease: "power2.out" },
          1.2,
        )
        .from(q(".ct-note"), { autoAlpha: 0, y: 30, duration: 1 }, 1.4);
    },
    { scope: root },
  );

  return (
    <section
      id="contact"
      ref={root}
      aria-labelledby="contact-title"
      className="relative overflow-hidden bg-cream py-24 text-ink lg:py-32"
    >
      {/* Background: an optional photo (photos.ts → contactBackdrop), otherwise soft bokeh lights
          and a slowly turning camera aperture; fine grain over both */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {backdrop.src ? (
          <>
            <Image
              src={backdrop.src}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: backdrop.position }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-cream/92 via-cream/75 to-cream/45" />
          </>
        ) : (
          <>
            {BOKEH.map(([left, top, size, tone, secs], i) => (
              <span
                key={i}
                className={`ct-bokeh ct-bokeh-${tone} absolute rounded-full`}
                style={
                  {
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${size}rem`,
                    height: `${size}rem`,
                    "--drift": `${secs}s`,
                  } as React.CSSProperties
                }
              />
            ))}
            <div className="absolute right-[-15rem] bottom-[-13rem] size-[34rem] text-brand/30 sm:right-[-12rem] sm:size-[42rem] lg:top-1/2 lg:right-[-10rem] lg:bottom-auto lg:-mt-[25rem] lg:size-[50rem] lg:text-brand/25">
              <Aperture className="size-full motion-safe:animate-[spin_140s_linear_infinite]" />
            </div>
          </>
        )}
        <div className="pf-grain absolute inset-0 opacity-30" />
      </div>

      <div
        data-nav-view
        className="relative mx-auto grid max-w-[1320px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-20 lg:px-12"
      >
        {/* Details */}
        <div>
          <p className="ct-eyebrow mb-5 flex items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-accent-deep uppercase">
            <LotusMark className="h-4 w-6 text-accent" />
            {meta.eyebrow}
          </p>
          <h2
            id="contact-title"
            className="ct-title font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.06]"
          >
            {meta.title}{" "}
            <span className="ct-foil-mask -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
              <span className="ct-foil foil-deep inline-block">
                {meta.titleFoil}
              </span>
            </span>
          </h2>
          <p className="ct-intro mt-6 max-w-[46ch] text-[1rem] leading-[1.8] text-ink/65">
            {meta.intro}
          </p>

          <ul className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
            {rows.map(({ label, lines, href, onClick, Icon, external }) => {
              const body = (
                <>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border border-accent-deep/25 text-accent-deep transition-colors duration-500 group-hover:border-accent-deep group-hover:bg-accent-deep group-hover:text-cream">
                    <Icon className="size-[1.15rem]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-[0.62rem] font-semibold tracking-[0.24em] text-ink/50 uppercase">
                      {label}
                    </span>
                    {lines.map((line) => (
                      <span
                        key={line}
                        className="mt-0.5 block text-[0.98rem] leading-[1.5] text-ink"
                      >
                        {line}
                      </span>
                    ))}
                  </span>
                  {(href || onClick) && (
                    <ArrowIcon className="size-4 shrink-0 -translate-x-1 text-ink/30 transition duration-500 ease-luxe group-hover:translate-x-0 group-hover:text-accent-deep" />
                  )}
                </>
              );
              return (
                <li key={label} className="ct-row">
                  {onClick ? (
                    <button
                      type="button"
                      onClick={onClick}
                      className="group flex w-full items-center gap-4 py-4 text-left"
                    >
                      {body}
                    </button>
                  ) : href ? (
                    <a
                      href={href}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="group flex items-center gap-4 py-4"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="group flex items-center gap-4 py-4">
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="ct-cta">
              <Magnetic>
                <button
                  type="button"
                  onClick={() => enquire({ source: "contact" })}
                  className="btn-brand"
                >
                  <ChatIcon className="size-[1.15rem]" />
                  {site.bookLabel}
                </button>
              </Magnetic>
            </div>
            <a
              href={telHref}
              className="ct-cta group inline-flex items-center gap-3 border border-ink/25 px-6 py-[0.95rem] font-heading text-[0.78rem] font-semibold tracking-[0.14em] uppercase transition-colors duration-500 hover:border-ink hover:bg-ink hover:text-cream"
            >
              <PhoneIcon className="size-4" />
              Call us
            </a>
          </div>
        </div>

        {/* Framed photo with the booking note underneath */}
        <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
          <div
            aria-hidden
            className="ct-photo-line absolute -inset-3 rounded-[10px] border border-brand/50 sm:-inset-4"
          />
          <div className="relative overflow-hidden rounded-[6px] shadow-[0_30px_60px_-34px_rgb(0_0_0/0.45)]">
            <div className="ct-photo relative aspect-[4/5] bg-ink/5 lg:aspect-auto lg:h-[34rem]">
              <div className="ct-photo-inner absolute inset-0">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 34rem, 92vw"
                  className="object-cover"
                  style={{ objectPosition: photo.position }}
                />
              </div>
            </div>

            <div className="ct-note flex items-center gap-4 bg-night p-4 text-cream sm:p-5">
              <span
                aria-hidden
                className="relative grid size-11 shrink-0 place-items-center"
              >
                <span className="absolute inset-0 rounded-full bg-accent/25" />
                <span className="relative size-3 rounded-full bg-accent" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-[0.8rem] font-semibold tracking-[0.12em] uppercase">
                  {contact.bookingNote.title}
                </span>
                <span className="mt-0.5 block text-[0.82rem] leading-[1.5] text-cream/65">
                  {contact.bookingNote.text}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
