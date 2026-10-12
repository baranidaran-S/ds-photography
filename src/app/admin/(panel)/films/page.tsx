/* Read through the same loaders the site uses, so the fields show the wording
   that is actually live. Reading the settings row directly showed an empty box
   wherever a value had been saved blank — and saving that box kept it blank. */
import { connectDB } from "@/lib/db";
import { getFilms } from "@/content/db";
import { Film } from "@/models";
import { toPhotoValue, s } from "@/lib/load";
import { FilmsEditor, type FilmValue } from "./FilmsEditor";
import { EditorTabs } from "../../components/EditorTabs";
import { FilmsHeadingEditor } from "./FilmsHeadingEditor";
import { PageHeader } from "../../components/PageHeader";
import { SitePreview } from "../../components/SitePreview";

export default async function FilmsPage() {
  await connectDB();
  const [rows, meta] = await Promise.all([
    Film.find({}).sort({ order: 1 }).lean(),
    getFilms(),
  ]);

  const initial: FilmValue[] = rows.map((r) => ({
    title: s(r.title),
    label: s(r.label),
    url: s(r.url),
    thumbnail: toPhotoValue(r.thumbnail),
    active: r.active !== false,
  }));

  return (
    <div>
      <PageHeader
        title="Films"
        intro="YouTube films shown under the services. The first one is the large card; the rest sit beneath it."
      />
      <SitePreview section="films" />
      <EditorTabs
        tabs={[
          { label: "Films", panel: <FilmsEditor initial={initial} /> },
          {
            label: "Heading & channel",
            panel: (
              <FilmsHeadingEditor
                initial={{
                  eyebrow: meta.eyebrow,
                  title: meta.title,
                  titleFoil: meta.titleFoil,
                  intro: meta.intro,
                  channelUrl: meta.channelUrl,
                  channelLabel: meta.channelLabel,
                }}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
