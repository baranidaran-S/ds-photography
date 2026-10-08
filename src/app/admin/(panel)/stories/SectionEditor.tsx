"use client";

import { PhotoField, type PhotoValue } from "../../components/PhotoField";
import { SaveBar } from "../../components/SaveBar";
import { Card, TextArea, TextField } from "../../components/Field";
import { useSettings } from "../../components/useEditor";

export type PortfolioValue = {
  eyebrow: string;
  title: string;
  titleFoil: string;
  intro: string;
  albumBrand: string;
  albumTitle: string;
  albumVolume: string;
  endEyebrow: string;
  endTitle: string;
  endText: string;
  reservedLabel: string;
  reservedTitle: string;
  [key: string]: unknown;
};

/* The whole pagePhotos row, not just the cover: useSettings saves the draft as
   the complete value, so leaving the contact photos out here would wipe them. */
export type PagePhotosValue = {
  contact: PhotoValue;
  contactBackdrop: PhotoValue;
  albumCover: PhotoValue & { showTitle?: boolean };
  [key: string]: unknown;
};

/* The wording around the album, and the album cover itself. The cover used to be
   edited on the Contact page, which is nowhere near where it appears. */
export function SectionEditor({
  copy,
  photos,
}: {
  copy: PortfolioValue;
  photos: PagePhotosValue;
}) {
  const ed = useSettings(copy, "portfolio");
  const ph = useSettings(photos, "pagePhotos");
  const v = ed.draft;
  const cover = ph.draft.albumCover;

  // two settings rows, one Save button
  async function saveBoth() {
    if (ed.dirty) await ed.save();
    if (ph.dirty) await ph.save();
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card
            title="Section heading"
            description="The words above the album, before the pages start turning."
          >
            <TextField
              label="Small label"
              value={v.eyebrow}
              onChange={(eyebrow) => ed.update({ eyebrow })}
              placeholder="Recent stories"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Heading"
                value={v.title}
                onChange={(title) => ed.update({ title })}
                placeholder="Pages from our"
              />
              <TextField
                label="Last word, in gold"
                value={v.titleFoil}
                onChange={(titleFoil) => ed.update({ titleFoil })}
                placeholder="albums"
                hint="Drawn in the gold foil that shimmers."
              />
            </div>
            <TextArea
              label="Intro"
              value={v.intro}
              onChange={(intro) => ed.update({ intro })}
              rows={2}
              placeholder="A few of the families who let us into their celebrations."
            />
          </Card>

          <Card
            title="The last page"
            description="After the last shoot, the album invites the visitor to book."
          >
            <TextField
              label="Small label"
              value={v.endEyebrow}
              onChange={(endEyebrow) => ed.update({ endEyebrow })}
              placeholder="Your celebration"
            />
            <TextField
              label="Heading"
              value={v.endTitle}
              onChange={(endTitle) => ed.update({ endTitle })}
              placeholder="Your story could be the next page"
            />
            <TextArea
              label="Line underneath"
              value={v.endText}
              onChange={(endText) => ed.update({ endText })}
              rows={2}
              placeholder="Tell us about your day…"
              hint="Hidden on narrow phones, where there is no room for it."
            />
            <p className="text-[0.78rem] leading-relaxed text-slate-400">
              The button underneath says whatever your booking button says
              everywhere else — change it once under System Settings.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Empty slot label"
                value={v.reservedLabel}
                onChange={(reservedLabel) => ed.update({ reservedLabel })}
                placeholder="Reserved for"
              />
              <TextField
                label="Empty slot words"
                value={v.reservedTitle}
                onChange={(reservedTitle) => ed.update({ reservedTitle })}
                placeholder="your memories"
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card
            title="Album cover"
            description="The closed album visitors see first. It is also used as the leather texture on the album's edges."
          >
            <PhotoField
              label="Cover photo"
              value={cover}
              onChange={(next) =>
                ph.update({ albumCover: { ...cover, ...next } })
              }
              folder="portfolio"
              aspect="1 / 1"
              optional
              hint="Square. Leave empty for the plain red leather cover."
            />

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={cover.showTitle === true}
                onChange={(e) =>
                  ph.update({
                    albumCover: { ...cover, showTitle: e.target.checked },
                  })
                }
                className="mt-0.5 size-4 accent-accent-deep"
              />
              <span>
                <span className="block text-[0.9rem] text-ink">
                  Stamp the lettering on top
                </span>
                <span className="block text-[0.78rem] leading-relaxed text-slate-400">
                  Adds the gold lotus, border and the words below. Leave it off
                  if your cover photo already has them printed on it.
                </span>
              </span>
            </label>

            {cover.showTitle && (
              <div className="space-y-3 border-l-2 border-brand/40 pl-4">
                <TextField
                  label="Studio name"
                  value={v.albumBrand}
                  onChange={(albumBrand) => ed.update({ albumBrand })}
                  placeholder="DS Photography"
                />
                <TextField
                  label="Album title"
                  value={v.albumTitle}
                  onChange={(albumTitle) => ed.update({ albumTitle })}
                  placeholder="Our Stories"
                />
                <TextField
                  label="Volume line"
                  value={v.albumVolume}
                  onChange={(albumVolume) => ed.update({ albumVolume })}
                  placeholder="Volume I"
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      <SaveBar
        dirty={ed.dirty || ph.dirty}
        saving={ed.saving || ph.saving}
        error={ed.error || ph.error}
        saved={ed.saved || ph.saved}
        onSave={saveBoth}
        onReset={() => {
          ed.reset();
          ph.reset();
        }}
      />
    </>
  );
}
