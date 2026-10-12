"use client";

import { PhotoField, type PhotoValue } from "../../components/PhotoField";
import { SaveBar } from "../../components/SaveBar";
import { Card, LinesField, TextField } from "../../components/Field";
import { HeadingFields } from "../../components/HeadingFields";
import { useSettings } from "../../components/useEditor";

export type ContactValue = {
  eyebrow: string;
  title: string;
  titleFoil: string;
  intro: string;
  phone: string;
  email: string;
  address: string[];
  hours: string[];
  bookingNote: { title: string; text: string };
  [key: string]: unknown;
};

export type PagePhotosValue = {
  contact: PhotoValue;
  contactBackdrop: PhotoValue;
  /* Not edited here — it belongs to the album section, under Portfolio Stories.
     Carried in the draft so saving this page does not wipe it. */
  albumCover: PhotoValue & { showTitle?: boolean };
  [key: string]: unknown;
};

export function ContactEditor({
  initial,
  photos,
}: {
  initial: ContactValue;
  photos: PagePhotosValue;
}) {
  const ed = useSettings(initial, "contact");
  const ph = useSettings(photos, "pagePhotos");
  const c = ed.draft;

  const dirty = ed.dirty || ph.dirty;
  const saving = ed.saving || ph.saving;
  const error = ed.error || ph.error;

  // the two blocks live under different setting keys, so both go up together
  async function saveBoth() {
    if (ed.dirty) await ed.save();
    if (ph.dirty) await ph.save();
  }

  function resetBoth() {
    ed.reset();
    ph.reset();
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <HeadingFields
            value={c}
            onChange={ed.update}
            description="The words above your phone number and address."
          />
          <Card title="How people reach you">
            <TextField
              label="Phone"
              value={c.phone}
              onChange={(phone) => ed.update({ phone })}
              placeholder="+91 99948 24771"
              hint="Shown as typed. The Call button strips everything but the digits."
            />
            <TextField
              label="Email"
              value={c.email}
              onChange={(email) => ed.update({ email })}
              placeholder="studio@example.com"
            />
            <LinesField
              label="Studio address"
              value={c.address}
              onChange={(address) => ed.update({ address })}
              rows={3}
              hint="One line per row. Tapping it opens Google Maps directions."
            />
            <LinesField
              label="Opening hours"
              value={c.hours}
              onChange={(hours) => ed.update({ hours })}
              rows={2}
              hint="One line per row, e.g. “Mon – Sat · 9 am – 8 pm”."
            />
          </Card>

          <Card
            title="Booking note"
            description="The dark strip under the photo."
          >
            <TextField
              label="Heading"
              value={c.bookingNote.title}
              onChange={(title) =>
                ed.update({ bookingNote: { ...c.bookingNote, title } })
              }
              placeholder="Now booking 2026 – 27 dates"
            />
            <TextField
              label="Line under it"
              value={c.bookingNote.text}
              onChange={(text) =>
                ed.update({ bookingNote: { ...c.bookingNote, text } })
              }
              placeholder="Only a few celebrations each month…"
            />
          </Card>
        </div>

        <div className="space-y-4">
          <PhotoField
            label="Framed photo"
            value={ph.draft.contact}
            onChange={(contact) => ph.update({ contact })}
            folder="contact"
            aspect="4 / 5"
            hint="The large photo beside the contact details."
          />
          <PhotoField
            label="Background photo (optional)"
            value={ph.draft.contactBackdrop}
            onChange={(contactBackdrop) => ph.update({ contactBackdrop })}
            folder="contact"
            aspect="16 / 9"
            optional
            hint="Leave empty for the drifting bokeh lights and turning aperture instead."
          />

        </div>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        saved={ed.saved || ph.saved}
        onSave={saveBoth}
        onReset={resetBoth}
      />
    </>
  );
}
