import type { MetadataRoute } from "next";
import { getSeo } from "@/content/db";

/* Served at /robots.txt. The admin can switch indexing off while the site is
   still being put together — a real noindex, not a half-measure. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeo();

  if (!seo.indexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    ...(seo.siteUrl ? { sitemap: `${seo.siteUrl}/sitemap.xml` } : {}),
  };
}
