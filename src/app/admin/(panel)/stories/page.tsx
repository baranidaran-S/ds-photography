import { connectDB } from "@/lib/db";
import { getPortfolio } from "@/content/db";
import { Setting, Story } from "@/models";
import { toPhotoValue, s } from "@/lib/load";
import type { StoryValue } from "./StoriesEditor";
import { PortfolioTabs } from "./PortfolioTabs";
import type { PagePhotosValue, PortfolioValue } from "./SectionEditor";
import { PageHeader } from "../../components/PageHeader";
import { SitePreview } from "../../components/SitePreview";

/* The fields show the wording that is live, read through the same loader the
   site uses. Clearing one puts the built-in wording back rather than leaving a
   gap on the page. */
export default async function StoriesPage() {
  await connectDB();
  const [rows, photoDoc] = await Promise.all([
    Story.find({}).sort({ order: 1 }).lean(),
    Setting.findOne({ key: "pagePhotos" }).lean(),
  ]);

  const initial: StoryValue[] = rows.map((r) => {
    const pair = Array.isArray(r.photos) ? r.photos : [];
    return {
      category: s(r.category),
      title: s(r.title),
      place: s(r.place),
      date: s(r.date),
      note: s(r.note),
      cover: toPhotoValue(r.cover),
      photos: [toPhotoValue(pair[0]), toPhotoValue(pair[1])] as [
        ReturnType<typeof toPhotoValue>,
        ReturnType<typeof toPhotoValue>,
      ],
      active: r.active !== false,
    };
  });

  /* Read through the same loader the site uses, so the fields show the
     wording that is live rather than an empty box that saves as empty. */
  const live = await getPortfolio();
  const copy: PortfolioValue = { ...live };


  const p = (photoDoc?.value ?? {}) as Record<string, unknown>;
  const albumCover = (p.albumCover ?? {}) as Record<string, unknown>;
  const photos: PagePhotosValue = {
    // carried through untouched; the Contact page owns these two
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
        title="Portfolio Stories"
        intro="One album spread per shoot. Pages turn as visitors scroll, in this order."
      />
      <SitePreview section="portfolio" />
      <PortfolioTabs stories={initial} copy={copy} photos={photos} />
    </div>
  );
}
