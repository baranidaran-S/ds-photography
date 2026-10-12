"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { prettyDate } from "@/lib/eventDate";
import { sourceLabel } from "../../source";
import { useConfirm, useToast } from "../../components/Feedback";

export type EnquiryRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  message: string;
  status: "new" | "contacted" | "confirmed" | "closed" | "cancelled";
  notes: string;
  source: string;
  openedWhatsapp: boolean;
  createdAt: string;
};

const STATUSES = [
  "new",
  "contacted",
  "confirmed",
  "closed",
  "cancelled",
] as const;

/** End states: the lead is done with, so its status stops changing. */
const FINAL: readonly string[] = ["closed", "cancelled"];

const STATUS_STYLE: Record<string, string> = {
  new: "bg-amber-50 text-amber-700 ring-amber-200",
  contacted: "bg-sky-50 text-sky-700 ring-sky-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  closed: "bg-slate-100 text-slate-500 ring-slate-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

function when(iso: string) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 8) return `${days} day${days === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* One page of enquiries. The status filter lives in the address so it composes
   with the page number, and the counts come from the server rather than from
   whichever twenty rows happen to be on screen. */
export function EnquiryList({
  items,
  status: filter,
  counts,
  everything,
}: {
  items: EnquiryRow[];
  status: string;
  counts: Record<string, number>;
  everything: number;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [openId, setOpenId] = useState<string>("");
  const [busy, setBusy] = useState("");
  const [failed, setFailed] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  // true until the refreshed list has actually arrived, so the row stays disabled
  const [refreshing, startRefresh] = useTransition();

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    setFailed("");
    try {
      const res = await fetch("/api/admin/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      if (!res.ok) {
        /* Silently swallowing this was the worst of it: an expired session
           returns 401 and the row simply never changed, with nothing said. */
        const json = await res.json().catch(() => ({}));
        setFailed(
          res.status === 401
            ? "Your session has expired. Sign in again, then try once more."
            : (json.error ??
              "That did not save. Check your connection and try again."),
        );
        return;
      }
      if (typeof body.status === "string") {
        toast({ tone: "good", title: `Moved to ${body.status}` });
      } else if (typeof body.notes === "string") {
        toast({ tone: "good", title: "Note saved", body: "Only you can see it." });
      }

      /* Under a status filter the row has just stopped matching, so refreshing
         in place would make the card vanish mid-edit — which reads as "the
         button did nothing". Showing the whole list keeps it in sight. */
      if (filter && typeof body.status === "string" && body.status !== filter) {
        startRefresh(() => router.push("/admin/enquiries"));
      } else {
        startRefresh(() => router.refresh());
      }
    } catch {
      setFailed("That did not save. Check your connection and try again.");
    } finally {
      setBusy("");
    }
  }

  async function remove(row: EnquiryRow) {
    const sure = await confirm({
      title: `Delete ${row.name}'s enquiry?`,
      body: "Their name, number and message go for good. If you only want it out of the way, close or cancel it instead.",
      confirmLabel: "Delete for good",
      tone: "bad",
    });
    if (!sure) return;

    setBusy(row.id);
    const res = await fetch(`/api/admin/enquiries?id=${row.id}`, {
      method: "DELETE",
    });
    setBusy("");
    if (res.ok) {
      toast({ tone: "good", title: "Enquiry deleted" });
      startRefresh(() => router.refresh());
    } else {
      toast({
        tone: "bad",
        title: "Could not delete it",
        body: "Check your connection and try again.",
      });
    }
  }

  if (everything === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
        <p className="text-[0.95rem] text-slate-500">No enquiries yet.</p>
        <p className="mx-auto mt-1 max-w-[52ch] text-[0.86rem] leading-relaxed text-slate-400">
          When someone fills in the form on your site, their details land here —
          even if they never go on to send the WhatsApp message.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/enquiries"
          className={`rounded-lg px-3 py-1.5 text-[0.82rem] font-medium transition-colors ${
            filter === ""
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-ink"
          }`}
        >
          All ({everything})
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/enquiries?status=${s}`}
            className={`rounded-lg px-3 py-1.5 text-[0.82rem] font-medium capitalize transition-colors ${
              filter === s
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-ink"
            }`}
          >
            {s} ({counts[s] ?? 0})
          </Link>
        ))}
      </div>

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
          <p className="text-[0.9rem] text-slate-500">
            No {filter || "matching"} enquiries right now.
          </p>
          <Link
            href="/admin/enquiries"
            className="mt-2 inline-block text-[0.84rem] font-medium text-accent-deep underline-offset-2 hover:underline"
          >
            Show all {everything}
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {items.map((row) => {
          const open = openId === row.id;
          return (
            <div
              key={row.id}
              className={`rounded-xl border bg-white transition-colors ${
                row.status === "new" ? "border-amber-200" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? "" : row.id)}
                aria-expanded={open}
                className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/20 font-heading text-[0.82rem] font-bold text-accent-deep">
                  {row.name.charAt(0).toUpperCase()}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.95rem] font-semibold text-ink">
                    {row.name}
                  </span>
                  <span className="block truncate text-[0.84rem] text-slate-500">
                    {[row.eventType, prettyDate(row.eventDate)]
                      .filter(Boolean)
                      .join(" · ") ||
                      sourceLabel(row.source) ||
                      "No shoot type given"}
                  </span>
                </span>

                {!row.openedWhatsapp && !FINAL.includes(row.status) && (
                  <span
                    title="They did not carry on to WhatsApp, so this one is waiting on you."
                    className="rounded-md bg-rose-50 px-2 py-1 font-heading text-[0.56rem] font-bold tracking-[0.1em] text-rose-600 uppercase ring-1 ring-rose-200"
                  >
                    Needs chasing
                  </span>
                )}

                <span
                  className={`rounded-md px-2.5 py-1 font-heading text-[0.58rem] font-bold tracking-[0.12em] uppercase ring-1 ${STATUS_STYLE[row.status]}`}
                >
                  {row.status}
                </span>

                <span className="w-[5.5rem] shrink-0 text-right text-[0.78rem] text-slate-400">
                  {when(row.createdAt)}
                </span>
              </button>

              {open && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`tel:+${row.phone.replace(/\D/g, "")}`}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-[0.84rem] font-medium text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          {row.phone}
                        </a>
                        <a
                          href={`https://wa.me/${row.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-[#25d366]/15 px-3 py-1.5 text-[0.84rem] font-medium text-[#128c4a] transition-colors hover:bg-[#25d366]/25"
                        >
                          Message on WhatsApp
                        </a>
                        {row.email && (
                          <a
                            href={`mailto:${row.email}`}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-[0.84rem] font-medium text-slate-700 transition-colors hover:bg-slate-200"
                          >
                            {row.email}
                          </a>
                        )}
                      </div>

                      {row.message && (
                        <div className="rounded-lg bg-slate-50 px-4 py-3">
                          <p className="font-heading text-[0.56rem] font-bold tracking-[0.16em] text-slate-400 uppercase">
                            What they wrote
                          </p>
                          <p className="mt-1.5 text-[0.9rem] leading-relaxed whitespace-pre-line text-ink">
                            {row.message}
                          </p>
                        </div>
                      )}

                      <p className="text-[0.78rem] text-slate-400">
                        {sourceLabel(row.source) || "Source not recorded"} ·{" "}
                        {new Date(row.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="mb-1.5 font-heading text-[0.56rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
                          Status
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              type="button"
                              disabled={
                                busy === row.id ||
                                refreshing ||
                                /* an end state is final — see the note below */
                                (FINAL.includes(row.status) && s !== row.status)
                              }
                              onClick={() => patch(row.id, { status: s })}
                              className={`rounded-lg px-2.5 py-1.5 text-[0.8rem] font-medium capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                row.status === s
                                  ? "bg-slate-800 text-white"
                                  : "bg-slate-100 text-slate-600 enabled:hover:bg-slate-200"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>

                        {FINAL.includes(row.status) && (
                          /* An end state is the end of the job, so the status
                             is fixed from here. Reopening stays possible, but
                             as a separate decision rather than a mis-click. */
                          <p className="mt-2 text-[0.78rem] leading-relaxed text-slate-400">
                            This lead is {row.status}, so the status is fixed.{" "}
                            <button
                              type="button"
                              disabled={busy === row.id || refreshing}
                              onClick={() =>
                                patch(row.id, {
                                  status: "contacted",
                                  reopen: true,
                                })
                              }
                              className="font-medium text-accent-deep underline-offset-2 hover:underline disabled:opacity-50"
                            >
                              Reopen it
                            </button>{" "}
                            if it comes back.
                          </p>
                        )}
                        {failed && (
                          <p
                            role="alert"
                            className="mt-2 text-[0.8rem] leading-relaxed text-accent"
                          >
                            {failed}
                          </p>
                        )}
                      </div>

                      <label className="block">
                        <span className="mb-1.5 block font-heading text-[0.56rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
                          Your notes
                        </span>
                        <textarea
                          rows={3}
                          defaultValue={row.notes}
                          onChange={(e) =>
                            setNotes((n) => ({ ...n, [row.id]: e.target.value }))
                          }
                          placeholder="Quoted ₹…, following up Monday"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.88rem] leading-relaxed focus:border-brand focus:outline-none"
                        />
                        <span className="mt-1 block text-[0.76rem] text-slate-400">
                          Only you see this.
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={
                            busy === row.id ||
                            refreshing ||
                            notes[row.id] === undefined
                          }
                          onClick={() => patch(row.id, { notes: notes[row.id] })}
                          className="rounded-lg bg-accent-deep px-4 py-2 font-heading text-[0.7rem] font-bold tracking-[0.1em] text-cream uppercase transition-colors hover:bg-accent disabled:opacity-40"
                        >
                          {busy === row.id || refreshing ? "Saving…" : "Save note"}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(row)}
                          disabled={busy === row.id}
                          className="ml-auto rounded-lg px-3 py-2 text-[0.8rem] text-slate-400 transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
