/* Read through the same loaders the site uses, so the fields show the wording
   that is actually live. Reading the settings row directly showed an empty box
   wherever a value had been saved blank — and saving that box kept it blank. */
import { connectDB } from "@/lib/db";
import { getReviewsMeta } from "@/content/db";
import { Review } from "@/models";
import { toPhotoValue, s } from "@/lib/load";
import { ReviewsEditor, type ReviewValue } from "./ReviewsEditor";
import { EditorTabs } from "../../components/EditorTabs";
import { HeadingEditor } from "../../components/HeadingEditor";
import { PageHeader } from "../../components/PageHeader";
import { SitePreview } from "../../components/SitePreview";

export default async function ReviewsPage() {
  await connectDB();
  const [rows, heading] = await Promise.all([
    Review.find({}).sort({ order: 1 }).lean(),
    getReviewsMeta(),
  ]);

  const initial: ReviewValue[] = rows.map((r) => ({
    name: s(r.name),
    shoot: s(r.shoot),
    status: s(r.status, "online"),
    date: s(r.date, "Today"),
    clock: s(r.clock, "9:41"),
    avatar: toPhotoValue(r.avatar),
    messages: (Array.isArray(r.messages) ? r.messages : ([] as unknown[])).map(
      (raw: unknown) => {
        const m = (raw ?? {}) as Record<string, unknown>;
        return {
          from: m.from === "studio" ? ("studio" as const) : ("client" as const),
          text: s(m.text),
          photo: toPhotoValue(m.photo),
          time: s(m.time),
          reaction: s(m.reaction),
        };
      },
    ),
    active: r.active !== false,
  }));

  return (
    <div>
      <PageHeader
        title="Reviews"
        intro="Each review is drawn as a screenshot of a WhatsApp chat. Write both sides of the conversation."
      />
      <SitePreview section="reviews" />
      <EditorTabs
        tabs={[
          { label: "Reviews", panel: <ReviewsEditor initial={initial} /> },
          {
            label: "Heading",
            panel: (
              <HeadingEditor
                initial={{ ...heading }}
                settingKey="reviews"
                description="The words above the chat screenshots."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
