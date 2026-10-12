"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/* On a phone there is no room for a menu beside the page, so it becomes a drawer
   that slides in over it. The state lives here because two parts need it: the
   button in the top bar opens it, the menu itself closes it. */
export function AdminShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    /* The page behind must not scroll under the drawer — on a phone that reads
       as the menu sliding away on its own. */
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <div className="flex min-h-svh bg-slate-50 text-ink">
      {/* Dimmed page behind the drawer, and a tap target to shut it */}
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <Sidebar name={name} open={open} onClose={() => setOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar name={name} onMenu={() => setOpen(true)} menuOpen={open} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
