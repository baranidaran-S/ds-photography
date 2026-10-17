import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogStory } from "@/components/blog/BlogStory";
import { blogAddresses, findPost } from "@/lib/blog";
import { getSeo } from "@/content/db";

// The posts there are when the site is built are made ahead; one added later in the admin is made
// on its first visit. An address that isn't a post is a 404.
export function generateStaticParams() {
  return blogAddresses();
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = (await findPost(slug))?.post;
  return post ? { title: post.seo.title, description: post.seo.description } : {};
}

/* A story's page (BlogStory), with three more stories under it. For search engines it also says
   what the page is: an article, when it was published and who by (with full addresses once the
   admin's SEO section has the site's). */
export default async function StoryPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const found = await findPost(slug);
  if (!found) notFound();
  const { post, more } = found;

  const site = (await getSeo()).siteUrl.replace(/\/+$/, "");
  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "DS Photography" },
    publisher: { "@type": "Organization", name: "DS Photography" },
    ...(site && {
      url: `${site}/blog/${post.slug}`,
      ...(post.storyCover.src && {
        image: post.storyCover.src.startsWith("/") ? `${site}${encodeURI(post.storyCover.src)}` : post.storyCover.src,
      }),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, "\\u003c") }}
      />
      <BlogStory key={slug} post={post} more={more} />
    </>
  );
}
