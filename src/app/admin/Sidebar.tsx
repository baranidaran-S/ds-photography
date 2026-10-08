"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { navGroups } from "./nav";
import { NavIcon } from "./icons";
import { useNewEnquiries } from "./components/EnquiryAlerts";
import { useConfirm } from "./components/Feedback";

export function Sidebar({
  name,
  open,
  onClose,
}: {
  name: string;
  /** drawer state, only meaningful below the large breakpoint */
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const waiting = useNewEnquiries();
  const [signingOut, setSigningOut] = useState(false);
  const confirm = useConfirm();

  async function signOut() {
    const sure = await confirm({
      title: "Sign out of the admin?",
      body: "Anything you have typed but not saved will be lost. You will need your password to get back in.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
    });
    if (!sure) return;

    setSigningOut(true);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  /* Collapsing is a desktop idea: the drawer on a phone is either open at full
     width or not there at all. Derived rather than reset, so resizing a window
     cannot leave a narrow drawer with no labels in it. */
  const narrow = collapsed && !open;

  return (
    <aside
      data-collapsed={narrow ? "" : undefined}
      className={`group/side relative z-40 flex h-svh w-[17rem] shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-luxe max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:shadow-[0_0_60px_-10px_rgb(0_0_0/0.3)] lg:sticky lg:top-0 lg:w-[16rem] lg:translate-x-0 lg:transition-[width] lg:data-collapsed:w-[4.75rem] ${
        open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      }`}
    >
      {/* Studio photo behind the menu */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/images/sidebarbg.webp')] bg-cover bg-bottom"
      />
      {/* Menu text has to stay readable over a photograph, so the picture sits
          under a veil. It is near-solid across the top, which both keeps the
          logo crisp and hides the wordmark printed on the photo itself — the
          two were showing through one another. It thins over the menu, then
          thickens again at the foot, where the camera is darkest. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/95 from-7% via-white/30 via-22% to-white/55"
      />

      {/* Logo */}
      <div className="relative flex h-[4.5rem] items-center gap-3 px-6 group-data-collapsed/side:justify-center group-data-collapsed/side:px-0">
        <span className="font-display text-[1.35rem] leading-none text-ink">DS</span>
        <span className="font-heading text-[0.54rem] font-semibold tracking-[0.3em] text-slate-400 uppercase group-data-collapsed/side:hidden">
          Photography
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink lg:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {/* Groups */}
      <nav aria-label="Admin" className="relative flex-1 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="mb-1.5 px-3 font-heading text-[0.58rem] font-bold tracking-[0.18em] text-slate-400 uppercase group-data-collapsed/side:text-center group-data-collapsed/side:px-0">
              <span className="group-data-collapsed/side:hidden">{group.title}</span>
              <span aria-hidden className="hidden group-data-collapsed/side:inline">
                ·
              </span>
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                const base =
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.88rem] transition-colors duration-200 group-data-collapsed/side:justify-center group-data-collapsed/side:px-0";

                if (item.soon) {
                  return (
                    <li key={item.href}>
                      <span
                        title="Coming in the next phase"
                        className={`${base} cursor-not-allowed text-slate-300`}
                      >
                        <NavIcon name={item.icon} />
                        <span className="flex-1 group-data-collapsed/side:hidden">
                          {item.label}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-heading text-[0.52rem] font-bold tracking-[0.1em] text-slate-400 uppercase group-data-collapsed/side:hidden">
                          Soon
                        </span>
                      </span>
                    </li>
                  );
                }

                const badge = item.href === "/admin/enquiries" ? waiting : 0;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={`${base} ${
                        active
                          ? "bg-brand/25 font-semibold text-accent-deep"
                          : "text-slate-600 hover:bg-white/70 hover:text-ink"
                      }`}
                    >
                      <span className="relative shrink-0">
                        <NavIcon name={item.icon} />
                        {/* collapsed sidebar has no room for the number, so it
                            shrinks to a dot on the icon */}
                        {badge > 0 && (
                          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-accent ring-2 ring-white group-data-collapsed/side:block hidden" />
                        )}
                      </span>
                      <span className="flex-1 group-data-collapsed/side:hidden">
                        {item.label}
                      </span>
                      {badge > 0 && (
                        <span
                          aria-label={`${badge} waiting`}
                          className="min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center font-heading text-[0.62rem] font-bold text-cream tabular-nums group-data-collapsed/side:hidden"
                        >
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="relative border-t border-white/50 bg-white/75 px-3 py-3 backdrop-blur-[3px]">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-pressed={collapsed}
          className="hidden w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[0.86rem] text-slate-500 transition-colors hover:bg-white/80 hover:text-ink group-data-collapsed/side:justify-center group-data-collapsed/side:px-0 lg:flex"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="size-[1.15rem] transition-transform duration-300 group-data-collapsed/side:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 5-7 7 7 7" />
          </svg>
          <span className="group-data-collapsed/side:hidden">Collapse Menu</span>
        </button>

        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[0.86rem] font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50 group-data-collapsed/side:justify-center group-data-collapsed/side:px-0"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="size-[1.15rem]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 20.5H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4M16 16l4-4-4-4M20 12H10" />
          </svg>
          <span className="group-data-collapsed/side:hidden">
            {signingOut ? "Signing out…" : "Sign Out"}
          </span>
        </button>

        <p className="mt-2 truncate px-3 text-[0.72rem] text-slate-400 group-data-collapsed/side:hidden">
          {name}
        </p>
      </div>
    </aside>
  );
}
