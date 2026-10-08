"use client";

import { useState } from "react";
import { PhotoField, type PhotoValue } from "../../components/PhotoField";
import { TextField } from "../../components/Field";
import { useSettings } from "../../components/useEditor";

export type SeoValue = {
  title: string;
  description: string;
  siteUrl: string;
  ogImage: string;
  keywords: string[];
  schema: string;
  indexable: boolean;
  [key: string]: unknown;
};

/** Everything already entered elsewhere in the admin, for filling a template. */
export type StudioFacts = {
  name: string;
  phone: string;
  email: string;
  address: string[];
  logo: string;
  instagram: string;
};

type PanelKey = "page" | "share" | "business" | "crawlers";

/* The site is one long page, so this is not a list of routes. It is a list of
   the things search engines and chat apps actually read, each with its own
   panel. Keeping it honest beats inventing pages that do not exist. */
const PANELS: {
  key: PanelKey;
  label: string;
  badge: string;
  heading: string;
  icon: "page" | "share" | "card" | "robot";
}[] = [
  {
    key: "page",
    label: "Home",
    badge: "The whole site",
    heading: "Search metadata",
    icon: "page",
  },
  {
    key: "share",
    label: "Social share",
    badge: "Link preview",
    heading: "Link preview",
    icon: "share",
  },
  {
    key: "business",
    label: "Business details",
    badge: "JSON-LD",
    heading: "Schema markup (JSON-LD)",
    icon: "card",
  },
  {
    key: "crawlers",
    label: "Search engines",
    badge: "Robots & sitemap",
    heading: "Robots & sitemap",
    icon: "robot",
  },
];

const ICONS: Record<string, string> = {
  page: "M6 2.5h7l5 5v14H6zM13 2.5V8h5",
  share: "M4 12v7.5h16V12M12 3.5v11M12 3.5 8 7.5M12 3.5l4 4",
  card: "M3.5 6.5h17v11h-17zM7 10.5h6M7 14h9",
  robot: "M9 3.5v3m6-3v3M5.5 6.5h13v12h-13zM9.5 11v2m5-2v2M9 16h6",
  search: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13M20 20l-4.4-4.4",
};

function Glyph({
  name,
  className = "size-4",
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ──────────────────────── Length meter ──────────────────────── */

/** Google cuts titles and descriptions off, so the room left is worth showing. */
function Counter({
  length,
  min,
  max,
}: {
  length: number;
  min: number;
  max: number;
}) {
  const over = length > max;
  const short = length > 0 && length < min;
  const tone = over
    ? "text-accent"
    : short
      ? "text-amber-600"
      : length === 0
        ? "text-slate-400"
        : "text-emerald-600";

  return (
    <div className="mt-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.76rem] text-slate-400 italic">
          Recommended {min}–{max} characters
        </span>
        <span className={`font-mono text-[0.76rem] ${tone}`}>
          {length}/{max}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          style={{ width: `${Math.min(100, (length / max) * 100)}%` }}
          className={`h-full rounded-full ${
            over ? "bg-accent" : short ? "bg-amber-400" : "bg-emerald-500"
          }`}
        />
      </div>
      {over && (
        <p className="mt-1 text-[0.76rem] text-accent">
          Google usually stops reading around {max}. The rest will be cut off.
        </p>
      )}
    </div>
  );
}

/* ──────────────────────── Keyword chips ──────────────────────── */

function Keywords({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [typed, setTyped] = useState("");

  function add() {
    // a pasted list separated by commas becomes one chip each
    const fresh = typed
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k && !value.includes(k));
    if (fresh.length) onChange([...value, ...fresh].slice(0, 25));
    setTyped("");
  }

  return (
    <div>
      <p className="mb-1 font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
        Meta keywords
      </p>
      <div className="flex gap-2">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a focus keyword…"
          aria-label="Add a focus keyword"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.9rem] text-ink placeholder:text-slate-300 focus:border-brand focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={!typed.trim()}
          className="shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-[0.84rem] font-medium text-slate-700 transition-colors hover:border-brand hover:text-accent-deep disabled:opacity-40"
        >
          + Add
        </button>
      </div>
      <p className="mt-1 text-[0.76rem] text-slate-400 italic">
        Separate keywords with commas.
      </p>

      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {value.map((k) => (
            <li key={k}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pr-1.5 pl-3 text-[0.82rem] text-slate-700">
                {k}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((x) => x !== k))}
                  aria-label={`Remove ${k}`}
                  className="grid size-5 place-items-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-accent"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden
                    className="size-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[0.78rem] leading-relaxed text-slate-400">
        Google itself ignores this tag — it reads your words instead. Keep the
        list for your own record of what each page is meant to be found for.
      </p>
    </div>
  );
}

/* ──────────────────── Structured data templates ───────────────────── */

function templates(facts: StudioFacts, url: string) {
  const sameAs = [facts.instagram].filter(Boolean);
  const address = facts.address.join(", ");

  return [
    {
      name: "Local photography studio",
      hint: "Best one for a studio. Can put you in the local map results.",
      json: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        additionalType: "https://schema.org/PhotographyBusiness",
        name: facts.name,
        ...(url ? { url } : {}),
        ...(facts.logo ? { image: facts.logo } : {}),
        ...(facts.phone ? { telephone: facts.phone } : {}),
        ...(facts.email ? { email: facts.email } : {}),
        ...(address
          ? { address: { "@type": "PostalAddress", streetAddress: address } }
          : {}),
        ...(sameAs.length ? { sameAs } : {}),
        priceRange: "₹₹",
      },
    },
    {
      name: "Organisation",
      hint: "Plain company details, without the local address.",
      json: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: facts.name,
        ...(url ? { url } : {}),
        ...(facts.logo ? { logo: facts.logo } : {}),
        ...(sameAs.length ? { sameAs } : {}),
      },
    },
    {
      name: "Website",
      hint: "Tells Google the site's name as it should be shown.",
      json: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: facts.name,
        ...(url ? { url } : {}),
      },
    },
  ];
}

/* ─────────────────────────── The editor ─────────────────────────── */

export function SeoEditor({
  initial,
  facts,
}: {
  initial: SeoValue;
  facts: StudioFacts;
}) {
  const ed = useSettings(initial, "seo");
  const v = ed.draft;
  const [panel, setPanel] = useState<PanelKey>("page");

  const ogPhoto: PhotoValue = { src: v.ogImage, alt: "", position: "50% 50%" };
  const host = v.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // the editor warns; getSeo() on the server refuses to serve it either way
  let schemaError = "";
  if (v.schema.trim()) {
    try {
      JSON.parse(v.schema);
    } catch (err) {
      schemaError = err instanceof Error ? err.message : "Not valid JSON.";
    }
  }

  const active = PANELS.find((p) => p.key === panel) ?? PANELS[0];

  return (
    <>
      <div className="grid items-start gap-5 lg:grid-cols-[16rem_1fr]">
        {/* What there is to optimise */}
        <nav
          aria-label="SEO sections"
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-accent-deep">
              <Glyph name="search" className="size-[1.05rem]" />
            </span>
            <span>
              <span className="block text-[0.9rem] font-semibold text-ink">
                Target pages
              </span>
              <span className="block font-heading text-[0.52rem] font-bold tracking-[0.14em] text-slate-400 uppercase">
                Select what to optimise
              </span>
            </span>
          </div>

          <ul className="p-2">
            {PANELS.map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => setPanel(p.key)}
                  aria-current={panel === p.key ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
                    panel === p.key ? "bg-brand/15" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                      panel === p.key
                        ? "bg-accent-deep text-cream"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Glyph name={p.icon} className="size-[1.05rem]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[0.88rem] font-semibold ${
                        panel === p.key ? "text-accent-deep" : "text-slate-700"
                      }`}
                    >
                      {p.label}
                    </span>
                    <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-heading text-[0.5rem] font-bold tracking-[0.12em] text-slate-500 uppercase">
                      {p.badge}
                    </span>
                  </span>
                  {panel === p.key && (
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden
                      className="size-3.5 shrink-0 text-accent-deep"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 5 7 7-7 7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <p className="border-t border-slate-100 px-4 py-3 text-[0.76rem] leading-relaxed text-slate-400">
            Your site is one long page, so everything here applies to all of it.
          </p>
        </nav>

        {/* The panel */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Header strip: what you are editing, and the save for it */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-slate-200 px-5 py-3.5">
            <span className="flex items-center gap-2 font-heading text-[0.66rem] font-bold tracking-[0.2em] text-accent-deep uppercase">
              <Glyph name="search" className="size-4" />
              SEO Hub
            </span>
            <span aria-hidden className="h-4 w-px bg-slate-200" />
            <span className="text-[0.88rem] text-slate-500">
              Optimising:{" "}
              <span className="font-semibold text-ink">{active.label}</span>
            </span>

            <div className="ml-auto flex items-center gap-3">
              <p
                role={ed.error ? "alert" : "status"}
                className={`text-[0.82rem] ${
                  ed.error
                    ? "text-accent"
                    : ed.saved
                      ? "text-emerald-600"
                      : ed.dirty
                        ? "text-amber-600"
                        : "text-slate-400"
                }`}
              >
                {ed.error
                  ? ed.error
                  : ed.saved
                    ? "Saved. Your site is updated."
                    : ed.dirty
                      ? "Unsaved changes"
                      : "All saved"}
              </p>
              {ed.dirty && !ed.saving && (
                <button
                  type="button"
                  onClick={ed.reset}
                  className="text-[0.82rem] text-slate-400 underline-offset-2 hover:text-ink hover:underline"
                >
                  Discard
                </button>
              )}
              <button
                type="button"
                onClick={ed.save}
                disabled={!ed.dirty || ed.saving}
                className="inline-flex items-center gap-2 rounded-lg bg-accent-deep px-4 py-2 font-heading text-[0.68rem] font-bold tracking-[0.1em] text-cream uppercase transition-colors hover:bg-accent disabled:opacity-40"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 4.5h11l3 3v12H5zM8.5 4.5v5h6v-5M8.5 19v-5h7v5" />
                </svg>
                {ed.saving ? "Saving…" : "Save meta data"}
              </button>
            </div>
          </div>

          <div className="p-6">
            <h2 className="flex items-center gap-2 border-b border-slate-100 pb-3 font-heading text-[0.64rem] font-bold tracking-[0.18em] text-slate-500 uppercase">
              <Glyph name={active.icon} className="size-4 text-accent-deep" />
              {active.heading}
            </h2>

            {panel === "page" && (
              <>
                <div className="mt-5 space-y-6">
                  <div>
                    <TextField
                      label="Meta title"
                      value={v.title}
                      onChange={(title) => ed.update({ title })}
                      placeholder="DS Photography | Wedding & Celebration Photography"
                    />
                    <Counter length={v.title.length} min={50} max={60} />
                  </div>

                  <div>
                    <label className="block">
                      <span className="mb-1 block font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
                        Meta description
                      </span>
                      <textarea
                        value={v.description}
                        onChange={(e) =>
                          ed.update({ description: e.target.value })
                        }
                        rows={4}
                        placeholder="DS Photography captures weddings, engagements…"
                        className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-[0.9rem] leading-relaxed text-ink placeholder:text-slate-300 focus:border-brand focus:outline-none"
                      />
                    </label>
                    <Counter
                      length={v.description.length}
                      min={150}
                      max={160}
                    />
                  </div>

                  <Keywords
                    value={v.keywords}
                    onChange={(keywords) => ed.update({ keywords })}
                  />

                  {/* Makes the character limits concrete */}
                  <div>
                    <p className="mb-2 font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
                      How it looks in Google
                    </p>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="truncate text-[0.78rem] text-emerald-700">
                        {host || "your-site.com"}
                      </p>
                      <p className="mt-0.5 truncate text-[1.05rem] text-blue-700">
                        {v.title || "Your page title"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[0.84rem] leading-relaxed text-slate-600">
                        {v.description || "Your description will appear here."}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {panel === "share" && (
              <>
                <p className="mt-4 max-w-[60ch] text-[0.86rem] leading-relaxed text-slate-500">
                  What shows up when someone sends your link on WhatsApp,
                  Instagram or Facebook. The words come from the Home panel; the
                  picture is set here.
                </p>

                <div className="mt-5 grid gap-6 xl:grid-cols-2">
                  <PhotoField
                    label="Share image"
                    value={ogPhoto}
                    onChange={(p) => ed.update({ ogImage: p.src })}
                    folder="misc"
                    aspect="1200 / 630"
                    optional
                    hint="Landscape, around 1200×630. Without one, shared links show no picture at all."
                  />

                  <div>
                    <p className="mb-2 font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
                      How the message looks
                    </p>
                    <div className="max-w-[20rem] overflow-hidden rounded-lg border border-slate-200">
                      {v.ogImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={v.ogImage}
                          alt=""
                          className="aspect-[1200/630] w-full object-cover"
                        />
                      ) : (
                        <div className="grid aspect-[1200/630] w-full place-items-center bg-slate-100 text-[0.8rem] text-slate-400">
                          No picture
                        </div>
                      )}
                      <div className="bg-slate-50 px-3 py-2">
                        <p className="truncate text-[0.7rem] text-slate-400 uppercase">
                          {host || "your-site.com"}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[0.84rem] font-medium text-ink">
                          {v.title || "Your page title"}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[0.78rem] leading-relaxed text-slate-500">
                          {v.description ||
                            "Your description will appear here."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {panel === "business" && (
              <>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-[52ch] text-[0.86rem] leading-relaxed text-slate-500">
                    A hidden block that spells out your studio&rsquo;s details
                    for Google.
                  </p>
                  {/* Filled from Contact and System Settings, so the studio's
                    details are not typed out a second time here. */}
                  <label className="flex items-center gap-2">
                    <span className="sr-only">Insert a template</span>
                    <select
                      value=""
                      onChange={(e) => {
                        const t = templates(facts, v.siteUrl).find(
                          (x) => x.name === e.target.value,
                        );
                        if (t)
                          ed.update({
                            schema: JSON.stringify(t.json, null, 2),
                          });
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-[0.82rem] font-medium text-slate-600 focus:border-brand focus:outline-none"
                    >
                      <option value="">Insert template…</option>
                      {templates(facts, v.siteUrl).map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} — {t.hint}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <p className="mt-2 max-w-[60ch] text-[0.86rem] leading-relaxed text-slate-500">
                  A hidden block that spells out your studio&rsquo;s name, phone
                  number and address for Google. Press a button above to fill it
                  in from what you have already entered in Contact and System
                  Settings, then change anything that is off.
                </p>

                <textarea
                  value={v.schema}
                  onChange={(e) => ed.update({ schema: e.target.value })}
                  rows={16}
                  spellCheck={false}
                  aria-label="Schema markup"
                  placeholder="Leave empty for none."
                  className={`mt-4 w-full resize-y rounded-lg border px-3 py-2.5 font-mono text-[0.8rem] leading-relaxed text-ink focus:outline-none ${
                    schemaError
                      ? "border-accent/50 focus:border-accent"
                      : "border-slate-200 focus:border-brand"
                  }`}
                />

                {schemaError ? (
                  <p role="alert" className="mt-2 text-[0.8rem] text-accent">
                    Not valid JSON — {schemaError}. Nothing will be added to the
                    site until this is fixed.
                  </p>
                ) : (
                  v.schema.trim() && (
                    <p className="mt-2 text-[0.8rem] text-emerald-600">
                      Valid JSON. This goes into the page for Google to read.
                    </p>
                  )
                )}
              </>
            )}

            {panel === "crawlers" && (
              <>
                <div className="mt-5 space-y-6">
                  <TextField
                    label="Full website address"
                    value={v.siteUrl}
                    onChange={(siteUrl) => ed.update({ siteUrl })}
                    placeholder="https://dsphotography.com"
                    mono
                    hint="Include https:// and no trailing slash. Shared links and the sitemap are built from this, so fill it in the day the site goes live."
                  />

                  <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={v.indexable}
                      onChange={(e) =>
                        ed.update({ indexable: e.target.checked })
                      }
                      className="mt-0.5 size-4 accent-accent-deep"
                    />
                    <span>
                      <span className="block text-[0.9rem] font-medium text-ink">
                        Let Google list this site
                      </span>
                      <span className="mt-0.5 block text-[0.8rem] leading-relaxed text-slate-400">
                        Turn it off while the site is still being put together.
                        With it off, robots.txt blocks everything and the page
                        carries noindex, so nothing of yours shows up in search.
                      </span>
                    </span>
                  </label>

                  {!v.indexable && (
                    <p
                      role="alert"
                      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[0.84rem] leading-relaxed text-amber-800"
                    >
                      Your site is currently hidden from Google. Remember to
                      switch this back on when you are ready.
                    </p>
                  )}

                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="font-heading text-[0.56rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
                      Built for you automatically
                    </p>
                    <ul className="mt-2 space-y-1.5 text-[0.84rem] text-slate-600">
                      <li>
                        <a
                          href="/robots.txt"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-accent-deep underline-offset-2 hover:underline"
                        >
                          /robots.txt
                        </a>{" "}
                        — tells crawlers what they may read. The admin is always
                        kept out.
                      </li>
                      <li>
                        <a
                          href="/sitemap.xml"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-accent-deep underline-offset-2 hover:underline"
                        >
                          /sitemap.xml
                        </a>{" "}
                        — the list of pages. One entry, because your site is one
                        page.
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
