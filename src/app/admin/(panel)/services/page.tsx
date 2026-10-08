/* Read through the same loaders the site uses, so the fields show the wording
   that is actually live. Reading the settings row directly showed an empty box
   wherever a value had been saved blank — and saving that box kept it blank. */
import { connectDB } from "@/lib/db";
import { getServicesMeta } from "@/content/db";
import { Service } from "@/models";
import { toPhotoValue, s } from "@/lib/load";
import { ServicesEditor, type ServiceValue } from "./ServicesEditor";
import { EditorTabs } from "../../components/EditorTabs";
import { HeadingEditor } from "../../components/HeadingEditor";
import { PageHeader } from "../../components/PageHeader";
import { SitePreview } from "../../components/SitePreview";

export default async function ServicesPage() {
  await connectDB();
  const [rows, heading] = await Promise.all([
    Service.find({}).sort({ order: 1 }).lean(),
    getServicesMeta(),
  ]);

  const initial: ServiceValue[] = rows.map((r) => ({
    name: s(r.name),
    wide: toPhotoValue(r.wide),
    tall: toPhotoValue(r.tall),
    exif: {
      lens: s(r.exif?.lens, "50mm"),
      aperture: s(r.exif?.aperture, "f/2.8"),
      shutter: s(r.exif?.shutter, "1/250"),
      iso: s(r.exif?.iso, "ISO 400"),
    },
    active: r.active !== false,
  }));

  return (
    <div>
      <PageHeader
        title="Services"
        intro="The camera viewfinder section. Each service needs a wide photo for computers and a tall one for phones."
      />
      <SitePreview section="services" />
      <EditorTabs
        tabs={[
          {
            label: "Services",
            panel: <ServicesEditor initial={initial} />,
          },
          {
            label: "Heading",
            panel: (
              <HeadingEditor
                initial={{ ...heading }}
                settingKey="services"
                description="The words above the viewfinder."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
