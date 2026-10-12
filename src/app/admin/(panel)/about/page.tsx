import { connectDB } from "@/lib/db";
import { headingDefaults } from "@/content/db";
import { Setting } from "@/models";
import { toPhotoValue, s } from "@/lib/load";
import { AboutEditor, type AboutValue, type Stat } from "./AboutEditor";
import { PageHeader } from "../../components/PageHeader";
import { SitePreview } from "../../components/SitePreview";

export default async function AboutPage() {
  await connectDB();
  const doc = await Setting.findOne({ key: "about" }).lean();
  const v = (doc?.value ?? {}) as Record<string, unknown>;

  const initial: AboutValue = {
    eyebrow: s(v.eyebrow, headingDefaults.about.eyebrow),
    title: s(v.title, headingDefaults.about.title),
    titleFoil: s(v.titleFoil, headingDefaults.about.titleFoil),
    intro: s(v.intro, headingDefaults.about.intro),
    name: s(v.name),
    firstName: s(v.firstName),
    role: s(v.role),
    story: Array.isArray(v.story) ? v.story.map((p) => String(p)) : [],
    stats: (Array.isArray(v.stats) ? v.stats : []).map((raw) => {
      const st = (raw ?? {}) as Record<string, unknown>;
      return {
        value: Number(st.value) || 0,
        suffix: s(st.suffix, "+"),
        label: s(st.label),
      } satisfies Stat;
    }),
    photo: toPhotoValue(v.photo),
  };

  return (
    <div>
      <PageHeader
        title="About Page"
        intro="Your story, the numbers and the portrait that assembles from tiles."
      />
      <SitePreview section="about" />
      <AboutEditor initial={initial} />
    </div>
  );
}
