import { connectDB } from "@/lib/db";
import { Setting } from "@/models";
import { s } from "@/lib/load";
import { SeoEditor, type SeoValue, type StudioFacts } from "./SeoEditor";
import { PageHeader } from "../../components/PageHeader";

/** One settings row as a plain object. */
async function read(key: string) {
  const doc = await Setting.findOne({ key }).lean();
  return (doc?.value ?? {}) as Record<string, unknown>;
}

export default async function SeoPage() {
  await connectDB();

  /* Contact and System Settings already hold the studio's name, number and
     address. The schema templates fill themselves in from those rather than
     asking for them a second time. */
  const [v, site, contact, logo, instagram] = await Promise.all([
    read("seo"),
    read("site"),
    read("contact"),
    read("logo"),
    read("instagram"),
  ]);

  const initial: SeoValue = {
    title: s(v.title),
    description: s(v.description),
    siteUrl: s(v.siteUrl),
    ogImage: s(v.ogImage),
    keywords: Array.isArray(v.keywords)
      ? v.keywords.map((k) => s(k)).filter(Boolean)
      : [],
    schema: s(v.schema),
    indexable: v.indexable !== false,
  };

  const facts: StudioFacts = {
    name: s(site.name) || "DS Photography",
    phone: s(contact.phone),
    email: s(contact.email),
    address: Array.isArray(contact.address)
      ? contact.address.map((l) => s(l)).filter(Boolean)
      : [],
    logo: s(logo.full) || s(logo.src),
    instagram: s(instagram.url),
  };

  return (
    <div>
      <PageHeader
        title="SEO Manager"
        intro="How your site appears in Google results and when a link is shared on WhatsApp or Instagram."
      />
      <SeoEditor initial={initial} facts={facts} />
    </div>
  );
}
