import type { BlogCoverValue, BlogPostValue } from "@/lib/blog";

/* The blanks a post's form starts from (kept apart from lib/blog.ts, which talks to the database
   and so can't be sent to the browser) */

export const NO_COVER: BlogCoverValue = { src: "", publicId: "", width: 0, height: 0, position: "50% 50%" };

/** A new post, dated `date` */
export const newPost = (date: string): BlogPostValue => ({
  id: "",
  slug: "",
  title: "",
  category: "",
  place: "",
  date,
  description: "",
  cover: NO_COVER,
  storyCover: NO_COVER,
  tone: "",
  photos: [],
});

// blog photos are shrunk to this (width or height) in the browser before they're uploaded
export const SHRINK_TO = 2400;
