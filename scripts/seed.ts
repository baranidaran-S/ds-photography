/* Imports the content that is currently hard-coded in src/content into MongoDB.
 *
 *   npm run seed            — insert only what is missing, keep existing edits
 *   npm run seed -- --force — wipe the content collections and re-import
 *
 * Photos keep their /images/... paths. They still work, because the files stay in
 * public/. Replacing one with a Cloudinary upload happens later, per photo, in the
 * admin — so this script never needs Cloudinary keys to run.
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

loadEnv({ path: ".env.local", override: true });

import {
  about,
  contact,
  films,
  footer,
  heroOutro,
  heroSlides,
  instagram,
  reviews,
  serviceDetails,
  site,
  stories,
} from "../src/content/site";
import { photos } from "../src/content/photos";
import {
  getPortfolio,
  headingDefaults,
  heroDefaults,
} from "../src/content/db";
import {
  AdminUser,
  Film,
  HeroSlide,
  InstagramPhoto,
  Review,
  Service,
  Setting,
  Story,
} from "../src/models";

const force = process.argv.includes("--force");

function log(step: string, detail = "") {
  console.log(`  ${step.padEnd(22)} ${detail}`);
}

/** Drops Mongo-only keys and fills the defaults the schema expects. */
function photo(p?: { src?: string; alt?: string; position?: string; mobilePosition?: string }) {
  return {
    src: p?.src ?? "",
    alt: p?.alt ?? "",
    position: p?.position ?? "50% 50%",
    mobilePosition: p?.mobilePosition ?? "",
    publicId: "",
  };
}

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    log("admin", "skipped — SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set");
    return;
  }
  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
  }

  const existing = await AdminUser.findOne({ email });
  if (existing) {
    log("admin", `already exists — ${email}`);
    return;
  }

  await AdminUser.create({
    email,
    passwordHash: await bcrypt.hash(password, 12),
    name: process.env.SEED_ADMIN_NAME || "Administrator",
    role: "owner",
  });
  log("admin", `created — ${email}`);
}

/** Inserts rows only when the collection is empty, so re-running is safe. */
async function fill(
  name: string,
  Model: {
    countDocuments: (f?: object) => Promise<number>;
    deleteMany: (f: object) => Promise<unknown>;
    insertMany: (d: object[]) => Promise<unknown[]>;
  },
  rows: object[],
) {
  if (force) await Model.deleteMany({});
  const have = await Model.countDocuments({});
  if (have > 0) {
    log(name, `skipped — ${have} already there (use --force to replace)`);
    return;
  }
  await Model.insertMany(rows);
  log(name, `${rows.length} inserted`);
}

async function upsertSetting(key: string, value: Record<string, unknown>) {
  if (force) {
    await Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true });
    return true;
  }
  const existing = await Setting.findOne({ key });
  if (existing) return false;
  await Setting.create({ key, value });
  return true;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Copy .env.example to .env.local and fill it in.",
    );
  }

  console.log(`\n→ Connecting to MongoDB…`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  console.log(`✓ Connected${force ? "  (--force: content will be replaced)" : ""}\n`);

  await seedAdmin();

  await fill(
    "hero slides",
    HeroSlide,
    heroSlides.map((s, i) => ({
      label: s.label,
      photo: photo(s),
      order: i,
      active: true,
    })),
  );

  await fill(
    "services",
    Service,
    serviceDetails.map((s, i) => ({
      name: s.name,
      wide: photo(s.wide),
      tall: photo(s.tall),
      exif: s.exif,
      order: i,
      active: true,
    })),
  );

  await fill(
    "films",
    Film,
    films.list.map((f, i) => ({
      title: f.title.trim(),
      label: f.label,
      url: f.url,
      thumbnail: photo(f.thumbnail),
      order: i,
      active: true,
    })),
  );

  await fill(
    "portfolio stories",
    Story,
    stories.map((s, i) => ({
      category: s.category,
      title: s.title,
      place: s.place,
      date: s.date,
      note: s.note,
      cover: photo(s.cover),
      photos: s.photos.map(photo),
      order: i,
      active: true,
    })),
  );

  await fill(
    "reviews",
    Review,
    reviews.map((r, i) => ({
      name: r.name,
      shoot: r.shoot,
      status: r.status,
      date: r.date,
      clock: r.clock,
      avatar: photo(r.avatar),
      messages: r.messages.map((m) => ({
        from: m.from,
        text: m.text ?? "",
        photo: m.photo ? photo(m.photo) : undefined,
        time: m.time,
        reaction: m.reaction ?? "",
      })),
      order: i,
      active: true,
    })),
  );

  await fill(
    "instagram strip",
    InstagramPhoto,
    photos.instagram.map((p, i) => ({
      photo: photo(p),
      likes: p.likes ?? "",
      order: i,
      active: true,
    })),
  );

  /* Blocks of copy edited as a whole rather than as a list */
  const settings: [string, Record<string, unknown>][] = [
    ["site", { ...site }],
    ["heroOutro", { ...heroOutro }],
    ["about", { ...about, ...headingDefaults.about, photo: photo(about.photo) }],
    ["contact", { ...contact, ...headingDefaults.contact }],
    ["footer", { ...footer }],
    [
      "films",
      {
        eyebrow: films.eyebrow,
        title: films.title,
        titleFoil: films.titleFoil,
        intro: films.intro,
        channelUrl: films.channelUrl,
        channelLabel: films.channelLabel,
      },
    ],
    /* The words at the top of each section. The site falls back to the same
       wording when a row is missing, so these are written for the admin's sake:
       its fields show what is live rather than an empty box. */
    ["hero", { ...heroDefaults }],
    ["services", { ...headingDefaults.services }],
    ["reviews", { ...headingDefaults.reviews }],
    ["portfolio", { ...(await getPortfolio()) }],
    ["instagram", { ...instagram, ...headingDefaults.instagram }],
    ["logo", { ...photos.logo }],
    [
      "pagePhotos",
      {
        contact: photo(photos.contact),
        contactBackdrop: photo(photos.contactBackdrop),
        albumCover: photo(photos.albumCover),
      },
    ],
    [
      "seo",
      {
        title:
          "DS Photography | Wedding, Engagement, Newborn & Birthday Photography",
        description:
          "DS Photography captures weddings, engagements, pre-wedding shoots, maternity, baby showers, newborns and birthdays. Book your shoot on WhatsApp.",
        siteUrl: "",
        ogImage: "",
      },
    ],
  ];

  let written = 0;
  for (const [key, value] of settings) {
    if (await upsertSetting(key, value)) written += 1;
  }
  log("settings", `${written} written, ${settings.length - written} already there`);

  console.log(`\n✓ Seed complete.\n`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(`\n✗ Seed failed: ${err instanceof Error ? err.message : err}\n`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
