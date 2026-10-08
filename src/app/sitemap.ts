import type { MetadataRoute } from "next";
import { getSeo } from "@/content/db";

/* Served at /sitemap.xml. One entry, because the site is one page — the sections
   are anchors on it, and listing anchors as pages would only mislead Google.
   Without a site address there is nothing absolute to list, so it stays empty
   rather than publishing a sitemap full of broken links. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeo();
  if (!seo.siteUrl) return [];

  return [
    {
      url: seo.siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
