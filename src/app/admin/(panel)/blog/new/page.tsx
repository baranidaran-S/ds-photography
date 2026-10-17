import Link from "next/link";
import { categoryOptions } from "@/lib/blog";
import { BlogPostForm } from "../BlogPostForm";
import { newPost } from "../values";
import { PageHeader } from "../../../components/PageHeader";

/** Today in India, as yyyy-mm-dd (a new post's date to start with) */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

/* A new blog post. Publishing it puts it on the website straight away, then it's edited from its
   own page (../[id]). */
export default async function NewBlogPostPage() {
  const categories = await categoryOptions();

  return (
    <div>
      <Link href="/admin/blog" className="mb-3 inline-block text-[0.84rem] text-slate-500 transition-colors hover:text-accent-deep">
        &larr; All posts
      </Link>
      <PageHeader title="New post" intro="Fill it in and press Publish: the website makes the post's card on the blog page and its own page from it." />
      <BlogPostForm initial={newPost(today())} categories={categories} />
    </div>
  );
}
