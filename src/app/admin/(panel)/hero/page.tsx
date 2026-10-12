/* Read through the same loaders the site uses, so the fields show the wording
   that is actually live. Reading the settings row directly showed an empty box
   wherever a value had been saved blank — and saving that box kept it blank. */
import { connectDB } from "@/lib/db";
import { getHero, getHeroOutro } from "@/content/db";
import { HeroSlide } from "@/models";
import { HeroEditor, type HeroSlideValue } from "./HeroEditor";
import { EditorTabs } from "../../components/EditorTabs";
import {
  HeroCopyEditor,
  type HeroCopyValue,
  type HeroOutroValue,
} from "./HeroCopyEditor";
import { PageHeader } from "../../components/PageHeader";
import { SitePreview } from "../../components/SitePreview";

export default async function HeroPage() {
  await connectDB();
  const [rows, live, outro] = await Promise.all([
    HeroSlide.find({}).sort({ order: 1 }).lean(),
    getHero(),
    getHeroOutro(),
  ]);
  const copy: HeroCopyValue = { ...live };
  const arch: HeroOutroValue = { ...outro };

  const initial: HeroSlideValue[] = rows.map((r) => ({
    label: String(r.label ?? ""),
    photo: {
      src: String(r.photo?.src ?? ""),
      alt: String(r.photo?.alt ?? ""),
      position: String(r.photo?.position ?? "50% 50%"),
      mobilePosition: String(r.photo?.mobilePosition ?? ""),
      publicId: String(r.photo?.publicId ?? ""),
    },
    active: r.active !== false,
  }));

  return (
    <div>
      <PageHeader
        title="Hero Section"
        intro="The first screen visitors see: the slideshow, and the words written over it."
      />
      <SitePreview section="home" />
      <EditorTabs
        tabs={[
          { label: "Photos", panel: <HeroEditor initial={initial} /> },
          {
            label: "Words & buttons",
            panel: <HeroCopyEditor initial={copy} outro={arch} />,
          },
        ]}
      />
    </div>
  );
}
