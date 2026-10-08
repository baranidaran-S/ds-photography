"use client";

import { PhotoField, type PhotoValue } from "../../components/PhotoField";
import { SaveBar } from "../../components/SaveBar";
import { Card, TextArea, TextField } from "../../components/Field";
import { useSettings } from "../../components/useEditor";
import { DesktopAlertToggle } from "../../components/EnquiryAlerts";

/* Each block is stored under its own setting key, in exactly the shape the seed
   wrote and the site reads — site, logo, instagram, films, footer. */

export type SiteValue = {
  name: string;
  whatsappNumber: string;
  whatsappMessage: string;
  bookLabel: string;
  enquiryTitle: string;
  enquiryIntro: string;
  [key: string]: unknown;
};

export type LogoValue = {
  src: string;
  full: string;
  alt: string;
  height: number;
  showText: boolean;
  [key: string]: unknown;
};

export type InstagramMeta = {
  handle: string;
  url: string;
  [key: string]: unknown;
};

export type FilmsMeta = {
  eyebrow: string;
  title: string;
  titleFoil: string;
  intro: string;
  channelUrl: string;
  [key: string]: unknown;
};

export type FooterValue = {
  headline: string;
  headlineFoil: string;
  credit: { label: string; url: string };
  [key: string]: unknown;
};

/* The studio name, the number, the logo and the footer — the handful of things
   that are not part of any one section. The Instagram account and the films
   heading moved out to their own pages, where the rest of those settings rows
   are edited; two pages writing one row meant whichever saved last won. */
export function SettingsEditor({
  site,
  logo,
  footer,
}: {
  site: SiteValue;
  logo: LogoValue;
  footer: FooterValue;
}) {
  const s = useSettings(site, "site");
  const l = useSettings(logo, "logo");
  const ft = useSettings(footer, "footer");

  const all = [s, l, ft];
  const dirty = all.some((x) => x.dirty);
  const saving = all.some((x) => x.saving);
  const error = all.find((x) => x.error)?.error ?? "";

  async function saveAll() {
    for (const block of all) {
      if (block.dirty) await block.save();
    }
  }

  const resetAll = () => all.forEach((x) => x.reset());

  const logoPhoto: PhotoValue = {
    src: l.draft.src,
    alt: l.draft.alt,
    position: "50% 50%",
  };

  const digits = s.draft.whatsappNumber.replace(/\D/g, "");
  const numberLooksOff = digits.length < 10 || digits.length > 15;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card title="Studio">
            <TextField
              label="Studio name"
              value={s.draft.name}
              onChange={(name) => s.update({ name })}
              placeholder="DS Photography"
              hint="Used in the footer and the copyright line."
            />
          </Card>

          <Card
            title="WhatsApp"
            description="Every Book and Enquire button on the site opens WhatsApp with this number."
          >
            <div>
              <TextField
                label="Number"
                value={s.draft.whatsappNumber}
                onChange={(whatsappNumber) => s.update({ whatsappNumber })}
                placeholder="919994824771"
                mono
              />
              <p
                className={`mt-1 text-[0.78rem] ${
                  numberLooksOff ? "text-accent" : "text-slate-400"
                }`}
              >
                {numberLooksOff
                  ? "Country code + number, digits only — no +, spaces or dashes."
                  : `Opens wa.me/${digits}`}
              </p>
            </div>
            <TextArea
              label="Message people start with"
              value={s.draft.whatsappMessage}
              onChange={(whatsappMessage) => s.update({ whatsappMessage })}
              rows={2}
              placeholder="Hi DS Photography! I'd like to book a photoshoot."
              hint="Pre-filled in their chat. Service Enquire buttons add their own wording instead."
            />
          </Card>

          <Card
            title="The booking form"
            description="The wording on every booking button, and the words at the top of the form they open."
          >
            <TextField
              label="Button wording"
              value={s.draft.bookLabel}
              onChange={(bookLabel) => s.update({ bookLabel })}
              placeholder="Book on WhatsApp"
              hint="Used by the button at the top of the page, in the menu, in the album and in the contact section — all four at once."
            />
            <TextField
              label="Form heading"
              value={s.draft.enquiryTitle}
              onChange={(enquiryTitle) => s.update({ enquiryTitle })}
              placeholder="Tell us about your celebration"
            />
            <TextArea
              label="Line under it"
              value={s.draft.enquiryIntro}
              onChange={(enquiryIntro) => s.update({ enquiryIntro })}
              rows={2}
              placeholder="A few details and we'll come back to you…"
            />
          </Card>

          <Card
            title="Enquiry alerts"
            description="New enquiries always show as a count beside Enquiries & Leads, and in the browser tab."
          >
            <DesktopAlertToggle />
          </Card>

        </div>

        <div className="space-y-4">
          <PhotoField
            label="Logo"
            value={logoPhoto}
            onChange={(p) => l.update({ src: p.src, full: p.src, alt: p.alt })}
            folder="logo"
            aspect="3 / 1"
            hint="The menu bar is dark, so use a PNG with a transparent background in a light or gold colour. Leave empty for the plain lotus + DS text logo."
          />

          <Card
            title="Logo settings"
            description="How the logo sits in the menu bar at the top of your site."
          >
            {/* The menu bar is dark, so the preview is too: a gold logo on
               white tells you nothing about how it will actually look. */}
            <div className="grid min-h-[6.5rem] place-items-center rounded-lg bg-night px-4 py-5">
              {l.draft.src ? (
                <span className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.draft.src}
                    alt=""
                    style={{ height: l.draft.height }}
                    className="w-auto max-w-[14rem] object-contain"
                  />
                  {l.draft.showText && (
                    <span className="block pt-2 font-display text-[0.64rem] leading-none tracking-[0.48em] text-cream uppercase">
                      Photography
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-[0.82rem] text-cream/50">
                  No logo file yet — the site shows a lotus and “DS” instead.
                </span>
              )}
            </div>

            <label className="block">
              <span className="mb-1 block font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
                Height on computers
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={28}
                  max={110}
                  value={l.draft.height}
                  onChange={(e) => l.update({ height: Number(e.target.value) })}
                  className="flex-1 accent-accent-deep"
                />
                <span className="w-16 text-right font-mono text-[0.84rem] text-slate-500">
                  {l.draft.height}px
                </span>
              </div>
              <span className="mt-1 block text-[0.76rem] text-slate-400">
                Phones and the scrolled-down bar show it smaller automatically.
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={l.draft.showText}
                onChange={(e) => l.update({ showText: e.target.checked })}
                className="mt-0.5 size-4 accent-accent-deep"
              />
              <span>
                <span className="block text-[0.9rem] text-ink">
                  Write PHOTOGRAPHY under the logo
                </span>
                <span className="block text-[0.76rem] leading-relaxed text-slate-400">
                  Your logo file is just the DS camera mark, so this adds the
                  studio name under it. Turn it off if you upload a logo that
                  already has the name written in.
                </span>
              </span>
            </label>
          </Card>

          <Card title="Footer">
            <TextField
              label="Big line"
              value={ft.draft.headline}
              onChange={(headline) => ft.update({ headline })}
              placeholder="Turning your celebrations into"
            />
            <TextField
              label="…in gold"
              value={ft.draft.headlineFoil}
              onChange={(headlineFoil) => ft.update({ headlineFoil })}
              placeholder="timeless stories."
              hint="The shimmering gold part at the end of the line."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Credit name"
                value={ft.draft.credit.label}
                onChange={(label) =>
                  ft.update({ credit: { ...ft.draft.credit, label } })
                }
                placeholder="MnT Future"
              />
              <TextField
                label="Credit link"
                value={ft.draft.credit.url}
                onChange={(url) =>
                  ft.update({ credit: { ...ft.draft.credit, url } })
                }
                placeholder="https://mntfuture.com/"
                mono
              />
            </div>
          </Card>
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        saved={all.some((x) => x.saved) && !dirty}
        onSave={saveAll}
        onReset={resetAll}
      />
    </>
  );
}
