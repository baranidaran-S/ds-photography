/* Read through the same loaders the site uses, so the fields show the wording
   that is actually live. Reading the settings row directly showed an empty box
   wherever a value had been saved blank — and saving that box kept it blank. */
import { connectDB } from "@/lib/db";
import { getInstagramHeading, getInstagramMeta } from "@/content/db";
import { InstagramPhoto } from "@/models";
import { toPhotoValue, s } from "@/lib/load";
import { InstagramEditor, type InstagramValue } from "./InstagramEditor";
import { EditorTabs } from "../../components/EditorTabs";
import { InstagramHeadingEditor } from "./InstagramHeadingEditor";
import { PageHeader } from "../../components/PageHeader";
import { SitePreview } from "../../components/SitePreview";

export default async function InstagramPage() {
  await connectDB();
  const [rows, heading, account] = await Promise.all([
    InstagramPhoto.find({}).sort({ order: 1 }).lean(),
    getInstagramHeading(),
    getInstagramMeta(),
  ]);

  const initial: InstagramValue[] = rows.map((r) => ({
    photo: toPhotoValue(r.photo),
    likes: s(r.likes),
    active: r.active !== false,
  }));

  return (
    <div>
      <PageHeader
        title="Instagram Strip"
        intro="Two rows that glide past each other near the foot of the page. Split evenly: the first half goes in the top row."
      />
      <SitePreview section="instagram" />
      <EditorTabs
        tabs={[
          { label: "Photos", panel: <InstagramEditor initial={initial} /> },
          {
            label: "Heading & account",
            panel: (
              <InstagramHeadingEditor
                initial={{ ...heading, ...account }}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
