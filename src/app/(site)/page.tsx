import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { Films } from "@/components/home/Films";
import { Portfolio } from "@/components/home/Portfolio";
import { About } from "@/components/home/About";
import { Reviews } from "@/components/home/Reviews";
import { InstagramReel } from "@/components/home/InstagramReel";
import { Contact } from "@/components/home/Contact";
import { getHomeContent, getSeo } from "@/content/db";
import type { Metadata } from "next";

/** Title, description and the picture shown when a link is shared (SEO Manager). */
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  const images = seo.ogImage ? [{ url: seo.ogImage }] : undefined;

  return {
    title: seo.title,
    description: seo.description,
    ...(seo.keywords.length ? { keywords: seo.keywords } : {}),
    // off while the site is still being built, from the SEO Manager
    ...(seo.indexable ? {} : { robots: { index: false, follow: false } }),
    ...(seo.siteUrl ? { metadataBase: new URL(seo.siteUrl) } : {}),
    alternates: seo.siteUrl ? { canonical: "/" } : undefined,
    openGraph: {
      type: "website",
      title: seo.title,
      description: seo.description,
      ...(seo.siteUrl ? { url: seo.siteUrl } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: seo.title,
      description: seo.description,
      ...(images ? { images: [seo.ogImage] } : {}),
    },
  };
}

export default async function Home() {
  const [c, seo] = await Promise.all([getHomeContent(), getSeo()]);

  return (
    <main>
      {/* Structured data from the SEO Manager. getSeo() has already parsed it,
          so what lands here is valid JSON or nothing at all. */}
      {seo.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: seo.schema }}
        />
      )}
      <Hero slides={c.heroSlides} outro={c.heroOutro} copy={c.hero} />
      <Services services={c.services} meta={c.servicesMeta} />
      <Films films={c.films} />
      <Portfolio
        stories={c.stories}
        albumCover={c.pagePhotos.albumCover}
        copy={c.portfolio}
      />
      <About about={c.about} meta={c.aboutHeading} />
      <Reviews reviews={c.reviews} meta={c.reviewsMeta} />
      <InstagramReel
        photos={c.instagramPhotos}
        instagram={c.instagram}
        meta={c.instagramHeading}
      />
      <Contact
        contact={c.contact}
        photo={c.pagePhotos.contact}
        backdrop={c.pagePhotos.contactBackdrop}
        meta={c.contactHeading}
      />
    </main>
  );
}
