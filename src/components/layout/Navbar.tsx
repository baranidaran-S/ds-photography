"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { navLinks, services } from "@/content/site";
import { whatsappLink } from "@/lib/whatsapp";
import { useAnchorScroll } from "@/hooks/useAnchorScroll";
import { Logo } from "@/components/ui/Logo";
import { Mandala } from "@/components/ui/ornaments";
import { ChatIcon } from "@/components/ui/icons";

// Computers: half the links left of the centred logo, the rest on the right
const half = Math.ceil(navLinks.length / 2);
const leftLinks = navLinks.slice(0, half);
const rightLinks = navLinks.slice(half);

type NavLinkProps = {
  link: (typeof navLinks)[number];
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

/** Menu link whose label rolls up to a gold copy on hover */
function NavLink({ link, onClick }: NavLinkProps) {
  return (
    <a
      href={link.href}
      onClick={onClick}
      className="group block py-2 font-display text-[0.8rem] font-medium tracking-[0.2em] uppercase xl:text-[0.86rem] xl:tracking-[0.24em]"
    >
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-luxe group-hover:-translate-y-full">
          {link.label}
        </span>
        <span
          aria-hidden
          className="absolute inset-0 block translate-y-full text-brand-light transition-transform duration-500 ease-luxe group-hover:translate-y-0"
        >
          {link.label}
        </span>
      </span>
    </a>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuTl = useRef<gsap.core.Timeline | null>(null);

  const scrollTo = useAnchorScroll();

  const lenis = useLenis();

  // Entrance: bar drops in with the hero intro
  useGSAP(
    () => {
      // Maroon background once the page moves; hide while scrolling down, show on the way up.
      // Set as attributes straight on the header (styled in globals.css) so scrolling never re-renders React.
      const setState = (y: number, direction: number) => {
        const header = headerRef.current;
        if (!header) return;
        header.toggleAttribute("data-scrolled", y > 40);
        header.toggleAttribute("data-hidden", y > 320 && direction === 1);
      };
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => setState(self.scroll(), self.direction),
        onRefresh: (self) => setState(self.scroll(), 0),
      });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          barRef.current,
          { yPercent: -120, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 1.3,
            ease: "expo.out",
            delay: 0.5,
          },
        );
      });
    },
    { scope: barRef },
  );

  // Full-screen mobile menu: circle wipe from the toggle, then links rise in
  useGSAP(
    () => {
      const menu = menuRef.current;
      if (!menu) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const tl = gsap
        .timeline({ paused: true, defaults: { ease: "expo.inOut" } })
        .set(menu, { visibility: "visible" })
        .fromTo(
          menu,
          { clipPath: "circle(0% at calc(100% - 44px) 44px)" },
          { clipPath: "circle(150% at calc(100% - 44px) 44px)", duration: 1 },
        )
        .fromTo(
          ".menu-mandala",
          { scale: 0.6, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 1.4 },
          0.1,
        )
        .fromTo(
          ".menu-link",
          { yPercent: 115 },
          { yPercent: 0, duration: 0.9, stagger: 0.07, ease: "expo.out" },
          0.35,
        )
        .fromTo(
          ".menu-foot",
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" },
          0.6,
        );
      if (reduce) tl.timeScale(5);
      menuTl.current = tl;
    },
    { scope: menuRef },
  );

  useEffect(() => {
    const tl = menuTl.current;
    if (open) {
      tl?.play();
      lenis?.stop();
    } else {
      tl?.reverse();
      lenis?.start();
    }
  }, [open, lenis]);

  // Esc closes the menu; growing past the mobile breakpoint closes it too
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => desktop.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  const book = whatsappLink();

  return (
    <>
      <header
        ref={headerRef}
        data-open={open ? "" : undefined}
        className="site-header fixed inset-x-0 top-0 z-50"
      >
        <div
          ref={barRef}
          data-reveal
          className="mx-auto max-w-[1320px] px-5 text-cream sm:px-8 lg:px-12"
        >
          {/* Three columns: left links · centred logo · right links (the menu button on phones) */}
          <nav
            aria-label="Main"
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-6"
          >
            <ul className="hidden items-center gap-8 justify-self-start lg:flex xl:gap-12">
              {leftLinks.map((link) => (
                <li key={link.href}>
                  <NavLink link={link} onClick={(e) => scrollTo(e)} />
                </li>
              ))}
            </ul>

            <a
              href="#home"
              onClick={(e) => scrollTo(e, () => setOpen(false))}
              aria-label="DS Photography, back to top"
              className="col-start-2 justify-self-center"
            >
              <Logo />
            </a>

            <div className="col-start-3 flex items-center justify-self-end">
              <ul className="hidden items-center gap-8 lg:flex xl:gap-12">
                {rightLinks.map((link) => (
                  <li key={link.href}>
                    <NavLink link={link} onClick={(e) => scrollTo(e)} />
                  </li>
                ))}
              </ul>

              <button
                ref={toggleRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                className="relative -mr-2 grid size-11 place-items-center lg:hidden"
              >
                <span
                  className={`absolute h-px w-6 bg-current transition-transform duration-500 ease-luxe ${
                    open ? "rotate-45" : "-translate-y-[4px]"
                  }`}
                />
                <span
                  className={`absolute h-px bg-current transition-[transform,width] duration-500 ease-luxe ${
                    open
                      ? "w-6 -rotate-45"
                      : "w-4 translate-x-1 translate-y-[4px]"
                  }`}
                />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <div
        ref={menuRef}
        id="mobile-menu"
        inert={!open}
        className="invisible fixed inset-0 z-40 overflow-hidden bg-night text-cream lg:hidden"
      >
        <div
          aria-hidden
          className="menu-mandala absolute -right-40 -bottom-40 size-[520px] text-brand/15"
        >
          <Mandala className="size-full motion-safe:animate-spin-slow" />
        </div>

        <div className="relative flex h-full flex-col justify-between px-6 pt-32 pb-10 sm:px-10">
          <nav aria-label="Mobile">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.href} className="overflow-hidden">
                  <a
                    href={link.href}
                    onClick={(e) => scrollTo(e, () => setOpen(false))}
                    className="menu-link block font-display text-[clamp(2.4rem,10vw,3.8rem)] leading-[1.2] transition-colors hover:text-brand-light"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="menu-foot space-y-5 border-t border-brand/30 pt-6">
            <a
              href={book}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 font-heading text-sm font-semibold tracking-[0.14em] text-brand-light uppercase"
            >
              <ChatIcon className="size-5" />
              Book on WhatsApp
            </a>
            <p className="font-heading text-[0.68rem] leading-relaxed tracking-[0.2em] text-cream/60 uppercase">
              {services.join(" · ")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
