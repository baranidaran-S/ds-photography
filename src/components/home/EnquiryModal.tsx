"use client";

import { useEffect, useId, useRef, useState } from "react";
import { whatsappLink } from "@/lib/whatsapp";
import { prettyDate, todayISO } from "@/lib/eventDate";
import { ChatIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";

export type EnquiryIntent = {
  /** Which button opened it — stored so you can see what draws enquiries. */
  source: string;
  /** Pre-selects the shoot type when opened from a service card. */
  eventType?: string;
};

type Props = {
  intent: EnquiryIntent | null;
  onClose: () => void;
  services: string[];
  whatsappNumber: string;
  /** the form's own wording, from System Settings */
  title: string;
  intro: string;
};

const field =
  "w-full rounded-[3px] border border-ink/15 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink/30 focus:border-accent-deep focus:outline-none";
const label =
  "mb-1.5 block font-heading text-[0.62rem] font-semibold tracking-[0.2em] text-ink/55 uppercase";

/** Builds the WhatsApp message from what they typed, so they don't retype it. */
function composeMessage(v: {
  name: string;
  eventType: string;
  eventDate: string;
  message: string;
}) {
  const parts = [`Hi DS Photography! I'm ${v.name}.`];
  if (v.eventType) parts.push(`I'd like to enquire about ${v.eventType.toLowerCase()}.`);
  if (v.eventDate) parts.push(`Date: ${prettyDate(v.eventDate)}.`);
  if (v.message) parts.push(v.message);
  return parts.join(" ");
}

export function EnquiryModal({
  intent,
  onClose,
  services,
  whatsappNumber,
  title,
  intro,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const formId = useId();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ link: string; id: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    eventType: "",
    eventDate: "",
    message: "",
    website: "", // honeypot
  });

  const open = intent !== null;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setDone(null);
      setError("");
      setForm((f) => ({ ...f, eventType: intent?.eventType ?? "" }));
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open, intent]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: intent?.source ?? "" }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      const link = whatsappLink(whatsappNumber, composeMessage(form));
      setDone({ link, id: String(json.id ?? "") });
    } catch {
      setError(
        "We could not reach the studio just now. Please check your connection and try again.",
      );
    } finally {
      setSending(false);
    }
  }

  /* Opening WhatsApp is a separate click rather than an automatic redirect: a
     redirect fired after the fetch is not a user gesture, so browsers block it,
     and the visitor loses the confirmation that their details went through. */
  function goToWhatsapp() {
    if (!done) return;
    if (done.id) {
      // tells the admin this lead did carry on to WhatsApp
      fetch("/api/enquiry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: done.id }),
        keepalive: true,
      }).catch(() => {});
    }
    window.open(done.link, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={`${formId}-title`}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none place-items-center overflow-y-auto border-0 bg-night/80 p-4 backdrop:bg-transparent open:grid sm:p-8"
    >
      <div className="relative my-auto w-[min(100%,34rem)] rounded-[6px] bg-cream p-6 text-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)] sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        {done ? (
          /* ── Sent ── */
          <div className="py-4 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#25d366]/15 text-[#128c4a]">
              <svg viewBox="0 0 24 24" aria-hidden className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 13 4.5 4.5L19 7" />
              </svg>
            </span>
            <h2
              id={`${formId}-title`}
              className="mt-5 font-display text-[1.7rem] leading-tight"
            >
              Got it, {form.name.split(" ")[0]}
            </h2>
            <p className="mx-auto mt-2 max-w-[38ch] text-[0.95rem] leading-relaxed text-ink/65">
              Your details are with us and we&apos;ll be in touch. Carry on to
              WhatsApp if you&apos;d like to chat right away — your message is
              already written out.
            </p>
            <button
              type="button"
              onClick={goToWhatsapp}
              className="btn-brand mt-6 w-full justify-center sm:w-auto"
            >
              <ChatIcon className="size-[1.15rem]" />
              Continue on WhatsApp
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 block w-full text-[0.86rem] text-ink/45 underline-offset-2 hover:text-accent-deep hover:underline"
            >
              No thanks, I&apos;ll wait to hear from you
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <>
            <LotusMark className="h-5 w-7 text-accent" />
            <h2
              id={`${formId}-title`}
              className="mt-3 font-display text-[1.7rem] leading-tight"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-[0.92rem] leading-relaxed text-ink/60">
              {intro}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {/* Hidden from people, filled in by bots (see the API route). */}
              <div aria-hidden className="absolute left-[-9999px] h-0 overflow-hidden">
                <label htmlFor={`${formId}-website`}>Website</label>
                <input
                  id={`${formId}-website`}
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => set({ website: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${formId}-name`} className={label}>
                    Your name
                  </label>
                  <input
                    id={`${formId}-name`}
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    className={field}
                    placeholder="e.g. Ananya"
                  />
                </div>
                <div>
                  <label htmlFor={`${formId}-phone`} className={label}>
                    Phone
                  </label>
                  <input
                    id={`${formId}-phone`}
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                    className={field}
                    placeholder="+91 ….."
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${formId}-type`} className={label}>
                    What are we shooting?
                  </label>
                  <select
                    id={`${formId}-type`}
                    value={form.eventType}
                    onChange={(e) => set({ eventType: e.target.value })}
                    className={field}
                  >
                    <option value="">Choose one</option>
                    {services.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value="Something else">Something else</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`${formId}-date`} className={label}>
                    Date <span className="normal-case opacity-60">(if known)</span>
                  </label>
                  {/* A calendar rather than a text box: "15 feb2026" was what
                      people actually typed, and no two of them the same way.
                      The value is stored as 2026-02-15 and read back out in
                      words wherever it is shown. */}
                  <input
                    id={`${formId}-date`}
                    type="date"
                    value={form.eventDate}
                    min={todayISO()}
                    onChange={(e) => set({ eventDate: e.target.value })}
                    className={field}
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${formId}-message`} className={label}>
                  Anything else{" "}
                  <span className="normal-case opacity-60">(optional)</span>
                </label>
                <textarea
                  id={`${formId}-message`}
                  rows={3}
                  value={form.message}
                  onChange={(e) => set({ message: e.target.value })}
                  className={`${field} resize-y leading-relaxed`}
                  placeholder="Venue, number of days, what matters most to you…"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-[3px] bg-accent/10 px-3.5 py-2.5 text-[0.88rem] text-accent-deep ring-1 ring-accent/25"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="btn-brand w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ChatIcon className="size-[1.15rem]" />
                {sending ? "Sending…" : "Send & open WhatsApp"}
              </button>

              <p className="text-center text-[0.78rem] leading-relaxed text-ink/45">
                We only use these details to reply to you.
              </p>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
