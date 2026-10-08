"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { labelFor } from "./nav";

export function Topbar({
  name,
  onMenu,
  menuOpen,
}: {
  name: string;
  onMenu: () => void;
  menuOpen: boolean;
}) {
  const pathname = usePathname();
  const current = labelFor(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-[4.5rem] items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/85 px-4 backdrop-blur sm:gap-4 sm:px-6 lg:px-9">
      <button
        type="button"
        onClick={onMenu}
        aria-expanded={menuOpen}
        aria-label="Open menu"
        className="-ml-1 grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-brand hover:text-accent-deep lg:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="size-[1.1rem]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-2 text-[0.9rem]">
          <li className="hidden sm:block">
            <Link
              href="/admin/dashboard"
              className="text-slate-400 transition-colors hover:text-ink"
            >
              Admin
            </Link>
          </li>
          <li aria-hidden className="hidden text-slate-300 sm:block">
            ›
          </li>
          <li className="truncate font-semibold text-ink" aria-current="page">
            {current}
          </li>
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.8rem] font-medium text-slate-600 transition-colors hover:border-brand hover:text-accent-deep sm:flex"
        >
          View site
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </Link>

        <span className="hidden text-[0.86rem] text-slate-500 sm:inline">{name}</span>
        <span className="grid size-9 place-items-center rounded-full bg-brand/20 font-heading text-[0.8rem] font-bold text-accent-deep">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    </header>
  );
}
