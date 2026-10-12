"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { useToast } from "./Feedback";

type Latest = { id: string; name: string; eventType: string } | null;

const CountContext = createContext<number>(0);

/** The unread count, for the sidebar badge. */
export function useNewEnquiries() {
  return useContext(CountContext);
}

const POLL_MS = 30_000;
const DESKTOP_KEY = "ds-admin-desktop-alerts";

/* Polling rather than a live socket: the admin is open for minutes at a time, a
   count query is cheap, and this keeps working on hosts that cut long-lived
   connections. Thirty seconds is well inside "I noticed straight away". */
export function EnquiryAlerts({
  initialCount,
  children,
}: {
  initialCount: number;
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(initialCount);
  const seenId = useRef<string>("");
  const pathname = usePathname();
  // the admin's one message corner, rather than a second one of its own
  const toast = useToast();

  // what the title said before a count was added to it
  const baseTitle = useRef<string>("");

  const notify = useCallback(
    (latest: Latest) => {
      if (!latest) return;
      toast({
        tone: "warn",
        title: "New enquiry",
        body: latest.eventType
          ? `${latest.name} · ${latest.eventType}`
          : latest.name,
        action: { label: "Open it", href: "/admin/enquiries" },
        // stays until dismissed: a lead is worth more than four seconds
        life: 0,
      });

      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted" &&
        localStorage.getItem(DESKTOP_KEY) === "on"
      ) {
        try {
          new Notification("New enquiry · DS Photography", {
            body: latest.eventType
              ? `${latest.name} — ${latest.eventType}`
              : latest.name,
            tag: latest.id, // replaces rather than stacks if it fires twice
          });
        } catch {
          // some browsers refuse outside a service worker; the toast still shows
        }
      }
    },
    [toast],
  );

  useEffect(() => {
    let alive = true;

    async function check() {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/admin/enquiries/count", {
          cache: "no-store",
        });
        if (!res.ok || !alive) return;
        const json = await res.json();
        const next = Number(json.new) || 0;

        setCount((prev) => {
          /* Only announce an enquiry we have not seen before. seenId starts
             empty, so the first poll after loading never fires a false alert
             for leads that were already sitting there. */
          const latest: Latest = json.latest ?? null;
          if (
            latest &&
            seenId.current &&
            latest.id !== seenId.current &&
            next > prev
          ) {
            notify(latest);
          }
          if (latest) seenId.current = latest.id;
          else seenId.current = "";
          return next;
        });
      } catch {
        // offline or the session expired — the next tick tries again
      }
    }

    // records the ids already on screen, so the first poll is a no-op
    check();
    const timer = setInterval(check, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [notify]);

  /* Put the count in the tab title too, so a background tab shows it. */
  useEffect(() => {
    if (!baseTitle.current) {
      baseTitle.current = document.title.replace(/^\(\d+\)\s*/, "");
    }
    document.title =
      count > 0 ? `(${count}) ${baseTitle.current}` : baseTitle.current;
  }, [count, pathname]);

  return (
    <CountContext.Provider value={count}>{children}</CountContext.Provider>
  );
}

/* Opt-in desktop notifications — no service to sign up for, just the browser.
   Permission and the stored preference are browser-only, so they are read through
   useSyncExternalStore rather than assigned from an effect. */
type AlertState = "off" | "on" | "blocked" | "unsupported";

const alertListeners = new Set<() => void>();

function subscribeAlerts(onChange: () => void) {
  alertListeners.add(onChange);
  return () => {
    alertListeners.delete(onChange);
  };
}

function readAlertState(): AlertState {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  try {
    return localStorage.getItem(DESKTOP_KEY) === "on" ? "on" : "off";
  } catch {
    // private windows can throw on access
    return "off";
  }
}

export function DesktopAlertToggle() {
  const state = useSyncExternalStore(
    subscribeAlerts,
    readAlertState,
    () => "off" as AlertState,
  );

  async function toggle() {
    if (state === "on") {
      try {
        localStorage.setItem(DESKTOP_KEY, "off");
      } catch {
        /* nothing to do — the toggle simply will not stick */
      }
      alertListeners.forEach((l) => l());
      return;
    }

    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

    if (permission === "granted") {
      try {
        localStorage.setItem(DESKTOP_KEY, "on");
      } catch {
        /* same as above */
      }
    }
    alertListeners.forEach((l) => l());
  }

  if (state === "unsupported") return null;

  if (state === "blocked") {
    return (
      <p className="text-[0.8rem] leading-relaxed text-slate-400">
        Desktop alerts are blocked for this site in your browser settings. Allow
        notifications there to turn them on.
      </p>
    );
  }

  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={state === "on"}
        onChange={toggle}
        className="mt-0.5 size-4 accent-accent-deep"
      />
      <span>
        <span className="block text-[0.9rem] text-ink">
          Show a desktop notification for new enquiries
        </span>
        <span className="block text-[0.78rem] leading-relaxed text-slate-400">
          Only while this admin tab is open. Stored in this browser, so turn it
          on again on each device you use.
        </span>
      </span>
    </label>
  );
}
