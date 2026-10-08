import { connectDB } from "@/lib/db";
import { headingDefaults } from "@/content/db";
import { Setting } from "@/models";
import { toPhotoValue, s } from "@/lib/load";
import {
  ContactEditor,
  type ContactValue,
  type PagePhotosValue,
} from "./ContactEditor";
import { PageHeader } from "../../components/PageHeader";
import { SitePreview } from "../../components/SitePreview";

const lines = (v: unknown) =>
  Array.isArray(v) ? v.map((l) => String(l)) : [];

export default async function ContactPage() {
  await connectDB();
  const [contactDoc, photoDoc] = await Promise.all([
    Setting.findOne({ key: "contact" }).lean(),
    Setting.findOne({ key: "pagePhotos" }).lean(),
  ]);

  const c = (contactDoc?.value ?? {}) as Record<string, unknown>;
  const p = (photoDoc?.value ?? {}) as Record<string, unknown>;
  const note = (c.bookingNote ?? {}) as Record<string, unknown>;

  const initial: ContactValue = {
    eyebrow: s(c.eyebrow, headingDefaults.contact.eyebrow),
    title: s(c.title, headingDefaults.contact.title),
    titleFoil: s(c.titleFoil, headingDefaults.contact.titleFoil),
    intro: s(c.intro, headingDefaults.contact.intro),
    phone: s(c.phone),
    email: s(c.email),
    address: lines(c.address),
    hours: lines(c.hours),
    bookingNote: { title: s(note.title), text: s(note.text) },
  };

  /* The album cover is edited under Portfolio Stories, where it is shown. It is
     still loaded and sent back untouched, because saving this page writes the
     whole pagePhotos row — including its showTitle flag, which a plain
     toPhotoValue() would have quietly dropped. */
  const albumCover = (p.albumCover ?? {}) as Record<string, unknown>;
  const photos: PagePhotosValue = {
    contact: toPhotoValue(p.contact),
    contactBackdrop: toPhotoValue(p.contactBackdrop),
    albumCover: {
      ...toPhotoValue(albumCover),
      showTitle: albumCover.showTitle === true,
    },
  };

  return (
    <div>
      <PageHeader
        title="Contact Page"
        intro="Your phone, email, studio address and opening hours, plus the photos on this part of the page."
      />
      <SitePreview section="contact" />
      <ContactEditor initial={initial} photos={photos} />
    </div>
  );
}
