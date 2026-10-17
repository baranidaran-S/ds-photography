import type { Metadata } from "next";
import { BlogList } from "@/components/blog/BlogList";
import { getBlog } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | DS Photography",
  description:
    "Stories from our shoots in Madurai and around: weddings, newborns, birthdays, maternity and baby showers.",
};

/* Blog: the newest post large at the top, then every post as a card, which the category tabs
   narrow down, as the admin's Blog section has them (lib/blog.ts). With none yet, it says the
   first stories are on their way. */
export default async function BlogPage() {
  const { posts, categories } = await getBlog();
  return <BlogList posts={posts} categories={categories} />;
}
