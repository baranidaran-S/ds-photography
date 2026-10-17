import Link from "next/link";
import { blogPostList } from "@/lib/blog";
import { BlogPostList } from "./BlogPostList";
import { PageHeader } from "../../components/PageHeader";

/* The Blog section: the website's blog posts, newest first. Each post is made in one form
   (BlogPostForm), and the website makes its card on the blog page and its own page from it. */
export default async function BlogAdminPage() {
  const posts = await blogPostList();

  return (
    <div>
      <PageHeader
        title="Blog"
        intro="The posts on the website's blog page, newest first. Each one has its card on the blog page and its own page."
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/blog"
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[0.84rem] font-medium text-slate-700 transition-colors hover:border-brand hover:text-accent-deep"
          >
            View the blog &#8599;
          </a>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-deep px-4 py-2 font-heading text-[0.72rem] font-bold tracking-[0.12em] text-cream uppercase transition-colors hover:bg-accent"
          >
            + New post
          </Link>
        </div>
      </PageHeader>
      <BlogPostList posts={posts} />
    </div>
  );
}
