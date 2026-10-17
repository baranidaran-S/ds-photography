import { Schema, deleteModel, model, models } from "mongoose";
import { orderable, photoSchema, type PhotoDoc } from "./shared";

/* Schemas are declared without mongoose's generics on purpose.
   Typing them as `new Schema<T>()` while T carries `_id: string` makes TypeScript
   recurse through mongoose's Require_id/Default__v helpers until the compiler runs
   out of heap. Reads go through `.lean()` and are cast to the plain types below,
   which is where the app actually needs type safety. */
function register(name: string, schema: Schema) {
  /* Next re-runs this module on every edit, but mongoose keeps whichever schema
     it registered first. Adding a field would then be ignored until the server
     restarts — and worse, mongoose silently strips the unknown field on save, so
     it looks like the write worked. Re-registering in dev avoids that trap.
     Production starts from a clean process, so there is nothing to replace. */
  if (process.env.NODE_ENV !== "production" && models[name]) {
    deleteModel(name);
  }
  return models[name] ?? model(name, schema);
}

/* ─────────────────────────────── Admin ─────────────────────────────── */

export type AdminUserData = {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "owner" | "editor";
  lastLoginAt?: Date;
  failedLogins?: number;
  lockedUntil?: Date;
};

export const AdminUser = register(
  "AdminUser",
  new Schema(
    {
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
      name: { type: String, default: "Administrator" },
      role: { type: String, enum: ["owner", "editor"], default: "owner" },
      lastLoginAt: Date,
      /* Wrong guesses in a row, and the time the account reopens. The login
         form is the one door into the admin and it is on the public internet,
         so it cannot be left to take guesses all day. */
      failedLogins: { type: Number, default: 0 },
      lockedUntil: Date,
    },
    { timestamps: true },
  ),
);

/* ──────────────────────── Media library (Cloudinary) ───────────────── */

export type MediaData = {
  _id: string;
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  folder: string;
  originalName: string;
  createdAt: string;
};

export const Media = register(
  "Media",
  new Schema(
    {
      publicId: { type: String, required: true, unique: true },
      url: { type: String, required: true },
      width: Number,
      height: Number,
      format: String,
      bytes: Number,
      /** hero | services | portfolio | about | reviews | instagram | films | logo */
      folder: { type: String, default: "misc", index: true },
      originalName: String,
    },
    { timestamps: true },
  ),
);

/* ───────────────────────────── Hero slides ─────────────────────────── */

export type HeroSlideData = {
  _id: string;
  label: string;
  photo: PhotoDoc;
  order: number;
  active: boolean;
};

export const HeroSlide = register(
  "HeroSlide",
  new Schema(
    {
      label: { type: String, required: true },
      photo: { type: photoSchema, default: () => ({}) },
      ...orderable,
    },
    { timestamps: true },
  ),
);

/* ─────────────────────────────── Services ──────────────────────────── */

export type ServiceData = {
  _id: string;
  name: string;
  wide: PhotoDoc;
  tall: PhotoDoc;
  exif: { lens: string; aperture: string; shutter: string; iso: string };
  order: number;
  active: boolean;
};

export const Service = register(
  "Service",
  new Schema(
    {
      name: { type: String, required: true },
      /** landscape photo — tablets and computers */
      wide: { type: photoSchema, default: () => ({}) },
      /** portrait photo — phones */
      tall: { type: photoSchema, default: () => ({}) },
      /** decorative camera readout in the viewfinder */
      exif: {
        lens: { type: String, default: "50mm" },
        aperture: { type: String, default: "f/2.8" },
        shutter: { type: String, default: "1/250" },
        iso: { type: String, default: "ISO 400" },
      },
      ...orderable,
    },
    { timestamps: true },
  ),
);

/* ──────────────────────────────── Films ────────────────────────────── */

export type FilmData = {
  _id: string;
  title: string;
  label: string;
  url: string;
  /** empty src → the film's own YouTube thumbnail is used */
  thumbnail: PhotoDoc;
  order: number;
  active: boolean;
};

export const Film = register(
  "Film",
  new Schema(
    {
      title: { type: String, required: true },
      label: { type: String, default: "" },
      url: { type: String, default: "" },
      thumbnail: { type: photoSchema, default: () => ({}) },
      ...orderable,
    },
    { timestamps: true },
  ),
);

/* ───────────────────────── Portfolio stories ───────────────────────── */

export type StoryData = {
  _id: string;
  category: string;
  title: string;
  place: string;
  date: string;
  note: string;
  cover: PhotoDoc;
  /** exactly two smaller prints from the same day */
  photos: PhotoDoc[];
  order: number;
  active: boolean;
};

export const Story = register(
  "Story",
  new Schema(
    {
      category: { type: String, required: true },
      title: { type: String, required: true },
      place: { type: String, default: "" },
      date: { type: String, default: "" },
      note: { type: String, default: "" },
      cover: { type: photoSchema, default: () => ({}) },
      photos: { type: [photoSchema], default: [] },
      ...orderable,
    },
    { timestamps: true },
  ),
);

/* ─────────────────────────────── Gallery ───────────────────────────── */
/* The gallery (/gallery): categories, each holding kinds of shoot ("sub-categories"). A
   kind's address is made from its name (lib/slug.ts) when it's saved. Their ids stay the
   same from one save to the next, so what hangs off them (a kind's photos) stays attached. */

/** A gallery photo: where it is, its storage name (to delete or move it) and its size — the
    gallery pages lay photos out by their shape, so nothing ever needs cropping */
const galleryPhotoSchema = new Schema(
  {
    src: { type: String, default: "" },
    publicId: { type: String, default: "" },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  { _id: false },
);

export type GalleryPhotoDoc = {
  src: string;
  publicId: string;
  width: number;
  height: number;
};

export type GalleryCategoryData = {
  _id: string;
  name: string;
  slug: string;
  cover: GalleryPhotoDoc;
  order: number;
  active: boolean;
};

export const GalleryCategory = register(
  "GalleryCategory",
  new Schema(
    {
      name: { type: String, required: true },
      slug: { type: String, required: true, index: true },
      cover: { type: galleryPhotoSchema, default: () => ({}) },
      ...orderable,
    },
    { timestamps: true },
  ),
);

export type GallerySubData = {
  _id: string;
  /** the category it's in */
  category: string;
  name: string;
  /** the Tamil or traditional name, shown with the English one */
  local: string;
  slug: string;
  /** its card on the category's page, and the photo that opens its album */
  cover: GalleryPhotoDoc;
  order: number;
  active: boolean;
};

export const GallerySub = register(
  "GallerySub",
  new Schema(
    {
      category: { type: Schema.Types.ObjectId, ref: "GalleryCategory", required: true, index: true },
      name: { type: String, required: true },
      local: { type: String, default: "" },
      slug: { type: String, required: true },
      cover: { type: galleryPhotoSchema, default: () => ({}) },
      ...orderable,
    },
    { timestamps: true },
  ),
);

/* A kind of shoot's photos, one record each (a kind may hold thousands, so they're never kept in
   one list), shown newest first: the id grows with time, so sorting by it is newest first, and
   "the next ones after this id" pages through them quickly at any size */
export type GalleryPhotoData = GalleryPhotoDoc & {
  _id: string;
  /** the kind of shoot it's in */
  sub: string;
};

const galleryPhoto = new Schema(
  {
    sub: { type: Schema.Types.ObjectId, ref: "GallerySub", required: true },
    src: { type: String, required: true },
    publicId: { type: String, default: "" },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  { timestamps: true },
);
galleryPhoto.index({ sub: 1, _id: -1 });
export const GalleryPhoto = register("GalleryPhoto", galleryPhoto);

/* ──────────────────────────────── Blog ─────────────────────────────── */
/* The blog (/blog): its posts, each in one of the gallery's categories (the blog has none of its
   own). Every save is live: there are no drafts. A post's address (slug) is set when it's first
   saved and never changes after, so links to it keep working (the old site's posts keep their old
   names). */

/** A story photo: where it is, its storage name (to delete or move it), its size (the story page
    lays photos out by their shape, so nothing ever needs cropping) and its words for search
    engines ("" → made from the post's title) */
const blogPhotoSchema = new Schema(
  {
    src: { type: String, default: "" },
    publicId: { type: String, default: "" },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    alt: { type: String, default: "" },
  },
  { _id: false },
);

/** A cover: also the point kept in view when it's cropped */
const blogCoverSchema = new Schema(
  {
    src: { type: String, default: "" },
    publicId: { type: String, default: "" },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    alt: { type: String, default: "" },
    position: { type: String, default: "50% 50%" },
  },
  { _id: false },
);

export type BlogPhotoDoc = {
  src: string;
  publicId: string;
  width: number;
  height: number;
  alt: string;
};

export type BlogPostData = {
  _id: string;
  slug: string;
  title: string;
  /** the gallery category it's in (its id) */
  category: string;
  place: string;
  date: string;
  cover: BlogPhotoDoc & { position: string };
  storyCover: BlogPhotoDoc & { position: string };
  tone: string;
  excerpt: string;
  description: string;
  photos: BlogPhotoDoc[];
  seoTitle: string;
  seoDescription: string;
};

const blogPost = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    /** one of the gallery's categories (renaming it there renames it here; deleting it leaves
        the post with none) */
    category: { type: Schema.Types.ObjectId, ref: "GalleryCategory", index: true },
    /** where the shoot was */
    place: { type: String, default: "" },
    /** published, as yyyy-mm-dd: the blog lists the newest first */
    date: { type: String, required: true },
    /** its card on the blog page, and the top of its own page unless that has its own */
    cover: { type: blogCoverSchema, default: () => ({}) },
    /** the top of its own page, when a different photo is wanted there (optional) */
    storyCover: { type: blogCoverSchema, default: () => ({}) },
    /** its card's colour ("" → a warm dark brown) */
    tone: { type: String, default: "" },
    /** its card's two lines ("" → the start of the description) */
    excerpt: { type: String, default: "" },
    /** the story's words, all in one, as typed: an empty line starts a new paragraph */
    description: { type: String, default: "" },
    /** the shoot's photos, in the admin's order (a few dozen at most, so kept with the post) */
    photos: { type: [blogPhotoSchema], default: [] },
    /** what search engines show ("" → the title, and the card's two lines) */
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
  },
  { timestamps: true },
);
blogPost.index({ date: -1, _id: -1 });
export const BlogPost = register("BlogPost", blogPost);

/* ─────────────────────────────── Reviews ───────────────────────────── */

export type ChatMessageData = {
  from: "client" | "studio";
  text?: string;
  photo?: PhotoDoc;
  time: string;
  reaction?: string;
};

const chatMessageSchema = new Schema(
  {
    from: { type: String, enum: ["client", "studio"], required: true },
    text: { type: String, default: "" },
    photo: { type: photoSchema, default: undefined },
    time: { type: String, default: "" },
    reaction: { type: String, default: "" },
  },
  { _id: false },
);

export type ReviewData = {
  _id: string;
  name: string;
  shoot: string;
  status: string;
  date: string;
  clock: string;
  avatar: PhotoDoc;
  messages: ChatMessageData[];
  order: number;
  active: boolean;
};

export const Review = register(
  "Review",
  new Schema(
    {
      name: { type: String, required: true },
      /** what we shot for them — read out to screen readers */
      shoot: { type: String, default: "" },
      /** "online" or "last seen …" under the name */
      status: { type: String, default: "online" },
      /** the date chip above the messages */
      date: { type: String, default: "Today" },
      /** the time in the phone's status bar */
      clock: { type: String, default: "9:41" },
      avatar: { type: photoSchema, default: () => ({}) },
      messages: { type: [chatMessageSchema], default: [] },
      ...orderable,
    },
    { timestamps: true },
  ),
);

/* ────────────────────────── Instagram strip ────────────────────────── */

export type InstagramPhotoData = {
  _id: string;
  photo: PhotoDoc;
  likes: string;
  order: number;
  active: boolean;
};

export const InstagramPhoto = register(
  "InstagramPhoto",
  new Schema(
    {
      photo: { type: photoSchema, default: () => ({}) },
      likes: { type: String, default: "" },
      ...orderable,
    },
    { timestamps: true },
  ),
);

/* ───────────────────── Singleton settings (key → JSON) ─────────────────
   One row per block of page copy that is edited as a whole rather than as a
   list: site, heroOutro, about, contact, footer, films meta, instagram meta,
   seo. Keeps the admin simple and avoids a collection per paragraph. */

export type SettingData = {
  _id: string;
  key: string;
  value: Record<string, unknown>;
};

export const Setting = register(
  "Setting",
  new Schema(
    {
      key: { type: String, required: true, unique: true, index: true },
      value: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true, minimize: false },
  ),
);

/* ──────────────────────── Enquiries (phase 2) ──────────────────────── */

export type EnquiryData = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  message: string;
  status: "new" | "contacted" | "confirmed" | "closed" | "cancelled";
  notes: string;
  source: string;
  openedWhatsapp: boolean;
  createdAt: string;
};

export const Enquiry = register(
  "Enquiry",
  new Schema(
    {
      name: { type: String, required: true },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      eventType: { type: String, default: "" },
      eventDate: { type: String, default: "" },
      message: { type: String, default: "" },
      /* closed = the shoot happened and is finished with; cancelled = it never
         went ahead. Both are end states, kept apart so a lost lead is not
         counted as a job done. */
      status: {
        type: String,
        enum: ["new", "contacted", "confirmed", "closed", "cancelled"],
        default: "new",
        index: true,
      },
      /** internal admin notes, never shown on the site */
      notes: { type: String, default: "" },
      /** which button they came from — "hero", "services:Weddings", "contact", … */
      source: { type: String, default: "" },
      /* Whether they went on to WhatsApp after submitting. False means the lead
         is only here, so it needs chasing rather than waiting for their message. */
      openedWhatsapp: { type: Boolean, default: false },
      /* Kept only to rate-limit the public form. Never shown in the admin. */
      ip: { type: String, default: "", index: true },
    },
    { timestamps: true },
  ),
);
