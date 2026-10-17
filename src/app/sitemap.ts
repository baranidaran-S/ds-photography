import type { MetadataRoute } from "next";
import { getSeo } from "@/content/db";
import { getGallery } from "@/lib/gallery";

/* Served at /sitemap.xml: the home page, the gallery, each of its categories, and each album
   (kind of shoot) that has photos, as the admin's Gallery section has them. Hidden ones and
   empty albums are left out. The home page's sections are anchors on it, not pages, so they
   aren't listed. Without a site address there is nothing absolute to list, so it stays empty
   rather than publishing a sitemap full of broken links. Saving the gallery, or an album's
   photos, in the admin makes it again (if the database can't be reached then, the last one
   stays). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeo();
  if (!seo.siteUrl) return [];
  const site = seo.siteUrl.replace(/\/+$/, "");

  const gallery = await getGallery();
  return [
    {
      url: seo.siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    { url: `${site}/gallery`, changeFrequency: "weekly", priority: 0.8 },
    ...gallery.flatMap((c) => [
      { url: `${site}/gallery/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 },
      ...c.subs
        .filter((s) => (s.count ?? 0) > 0)
        .map((s) => ({ url: `${site}/gallery/${c.slug}/${s.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ]),
  ];
}
