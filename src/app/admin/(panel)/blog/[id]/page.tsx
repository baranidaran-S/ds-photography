import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPostValue, categoryOptions } from "@/lib/blog";
import { BlogPostForm } from "../BlogPostForm";
import { PageHeader } from "../../../components/PageHeader";

/* One blog post, to edit. Saving changes the website straight away. */
export default async function EditBlogPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  const { id } = await params;
  const [post, categories] = await Promise.all([blogPostValue(id), categoryOptions()]);
  if (!post) notFound();

  return (
    <div>
      <Link href="/admin/blog" className="mb-3 inline-block text-[0.84rem] text-slate-500 transition-colors hover:text-accent-deep">
        &larr; All posts
      </Link>
      <PageHeader title="Edit post" intro="Saving changes the post on the website straight away.">
        <a
          href={`/blog/${post.slug}`}
          target="_blank"
          rel="noopener"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[0.84rem] font-medium text-slate-700 transition-colors hover:border-brand hover:text-accent-deep"
        >
          View on site &#8599;
        </a>
      </PageHeader>
      {/* (a new form for each post, so moving between posts never carries one's typing to another) */}
      <BlogPostForm key={post.id} initial={post} categories={categories} />
    </div>
  );
}
