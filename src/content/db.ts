/* Reads the site's content from MongoDB and returns it in exactly the shapes the
 * components already expect (see site.ts / photos.ts for the types).
 *
 * If the database is unreachable, each loader falls back to the hard-coded
 * content instead of throwing. The site therefore always builds and always
 * renders — a database outage degrades to "the content is slightly stale",
 * never to a blank page.
 */
import { connectDB } from "@/lib/db";
import {
  Film as FilmModel,
  HeroSlide as HeroSlideModel,
  InstagramPhoto as InstagramModel,
  Review as ReviewModel,
  Service as ServiceModel,
  Setting as SettingModel,
  Story as StoryModel,
} from "@/models";
import { photos, type Photo } from "./photos";
import * as fallback from "./site";
import type {
  ChatMessage,
  Film,
  HeroSlide,
  Review,
  Service,
  Story,
} from "./site";

/** Mongo subdocument → the plain `Photo` the components take. */
function toPhoto(raw: unknown): Photo {
  const p = (raw ?? {}) as Record<string, unknown>;
  const position = String(p.position ?? "");
  const mobilePosition = String(p.mobilePosition ?? "");
  return {
    src: String(p.src ?? ""),
    alt: String(p.alt ?? ""),
    ...(position ? { position } : {}),
    ...(mobilePosition ? { mobilePosition } : {}),
  };
}

const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

/* For words the page cannot do without. An empty box in the admin saves as an
   empty string, and str() would hand that straight to the page — which is how
   the album section came to open with no heading at all. Blank means "use the
   built-in wording", so a half-filled form can never wipe the site's words. */
const copy = (v: unknown, d: string) =>
  typeof v === "string" && v.trim() ? v : d;
const lines = (v: unknown, d: string[]) =>
  Array.isArray(v) && v.length ? v.map((l) => String(l)) : d;

/** Runs a loader, falling back to the static content if the database is down. */
async function safely<T>(
  load: () => Promise<T>,
  fallbackValue: T,
  what: string,
) {
  try {
    await connectDB();
    const result = await load();
    // an empty collection means "not seeded yet", so prefer the built-in content
    if (Array.isArray(result) && result.length === 0) return fallbackValue;
    return result;
  } catch (err) {
    console.warn(
      `[content] ${what} fell back to the built-in copy:`,
      err instanceof Error ? err.message : err,
    );
    return fallbackValue;
  }
}

async function setting(key: string): Promise<Record<string, unknown>> {
  const doc = await SettingModel.findOne({ key }).lean();
  return (doc?.value ?? {}) as Record<string, unknown>;
}

/* ─────────────────────────────── Lists ─────────────────────────────── */

export function getHeroSlides(): Promise<HeroSlide[]> {
  return safely(
    async () => {
      const rows = await HeroSlideModel.find({ active: true })
        .sort({ order: 1 })
        .lean();
      return rows
        .filter((r) => r.photo?.src)
        .map((r) => ({ label: str(r.label), ...toPhoto(r.photo) }));
    },
    fallback.heroSlides,
    "hero slides",
  );
}

export function getServices(): Promise<Service[]> {
  return safely(
    async () => {
      const rows = await ServiceModel.find({ active: true })
        .sort({ order: 1 })
        .lean();
      return rows.map((r) => ({
        name: str(r.name),
        wide: toPhoto(r.wide),
        tall: toPhoto(r.tall),
        exif: {
          lens: str(r.exif?.lens, "50mm"),
          aperture: str(r.exif?.aperture, "f/2.8"),
          shutter: str(r.exif?.shutter, "1/250"),
          iso: str(r.exif?.iso, "ISO 400"),
        },
      }));
    },
    fallback.serviceDetails,
    "services",
  );
}

export type FilmsBlock = {
  eyebrow: string;
  title: string;
  titleFoil: string;
  intro: string;
  channelUrl: string;
  /** the wording on the link out to the channel */
  channelLabel: string;
  list: Film[];
};

export function getFilms(): Promise<FilmsBlock> {
  return safely(
    async () => {
      const [rows, meta] = await Promise.all([
        FilmModel.find({ active: true }).sort({ order: 1 }).lean(),
        setting("films"),
      ]);
      return {
        eyebrow: copy(meta.eyebrow, fallback.films.eyebrow),
        title: copy(meta.title, fallback.films.title),
        titleFoil: copy(meta.titleFoil, fallback.films.titleFoil),
        intro: copy(meta.intro, fallback.films.intro),
        channelUrl: str(meta.channelUrl, fallback.films.channelUrl),
        channelLabel: copy(meta.channelLabel, "Watch more on YouTube"),
        list: rows.length
          ? rows.map((r) => ({
              title: str(r.title),
              label: str(r.label),
              url: str(r.url),
              thumbnail: toPhoto(r.thumbnail),
            }))
          : fallback.films.list,
      };
    },
    fallback.films,
    "films",
  );
}

export function getStories(): Promise<Story[]> {
  return safely(
    async () => {
      const rows = await StoryModel.find({ active: true })
        .sort({ order: 1 })
        .lean();
      return rows.map((r) => {
        const pair = Array.isArray(r.photos) ? r.photos : [];
        return {
          category: str(r.category),
          title: str(r.title),
          place: str(r.place),
          date: str(r.date),
          note: str(r.note),
          cover: toPhoto(r.cover),
          photos: [toPhoto(pair[0]), toPhoto(pair[1])] as [Photo, Photo],
        };
      });
    },
    fallback.stories,
    "portfolio stories",
  );
}

export function getReviews(): Promise<Review[]> {
  return safely(
    async () => {
      const rows = await ReviewModel.find({ active: true })
        .sort({ order: 1 })
        .lean();
      return rows.map((r) => ({
        name: str(r.name),
        shoot: str(r.shoot),
        status: str(r.status),
        date: str(r.date),
        clock: str(r.clock),
        avatar: toPhoto(r.avatar),
        messages: (Array.isArray(r.messages) ? r.messages : []).map(
          (raw: unknown) => {
            const m = (raw ?? {}) as Record<string, unknown>;
            const photo = toPhoto(m.photo);
            return {
              from: m.from === "studio" ? "studio" : "client",
              ...(m.text ? { text: String(m.text) } : {}),
              ...(photo.src ? { photo } : {}),
              time: str(m.time),
              ...(m.reaction ? { reaction: String(m.reaction) } : {}),
            } as ChatMessage;
          },
        ),
      }));
    },
    fallback.reviews,
    "reviews",
  );
}

export type InstagramPhotoItem = Photo & { likes?: string };

export function getInstagramPhotos(): Promise<InstagramPhotoItem[]> {
  return safely(
    async () => {
      const rows = await InstagramModel.find({ active: true })
        .sort({ order: 1 })
        .lean();
      return rows
        .filter((r) => r.photo?.src)
        .map((r) => ({ ...toPhoto(r.photo), likes: str(r.likes) }));
    },
    photos.instagram,
    "instagram strip",
  );
}

/* ───────────────────────────── Settings ────────────────────────────── */

export function getSite() {
  return safely(
    async () => {
      const v = await setting("site");
      return {
        name: copy(v.name, fallback.site.name),
        whatsappNumber: copy(v.whatsappNumber, fallback.site.whatsappNumber),
        /* One label behind every booking button on the site. Separate copies
           meant changing the wording in one place and leaving three behind. */
        bookLabel: copy(v.bookLabel, "Book on WhatsApp"),
        enquiryTitle: copy(v.enquiryTitle, "Tell us about your celebration"),
        enquiryIntro: copy(
          v.enquiryIntro,
          "A few details and we'll come back to you, usually within a few hours.",
        ),
        whatsappMessage: str(v.whatsappMessage, fallback.site.whatsappMessage),
      };
    },
    fallback.site,
    "site settings",
  );
}

export function getHeroOutro() {
  return safely(
    async () => {
      const v = await setting("heroOutro");
      const cta = (v.cta ?? {}) as Record<string, unknown>;
      return {
        left: copy(v.left, fallback.heroOutro.left),
        right: copy(v.right, fallback.heroOutro.right),
        intro: copy(v.intro, fallback.heroOutro.intro),
        cta: {
          label: copy(cta.label, fallback.heroOutro.cta.label),
          href: copy(cta.href, fallback.heroOutro.cta.href),
        },
      };
    },
    fallback.heroOutro,
    "hero outro",
  );
}

export function getAbout() {
  return safely(
    async () => {
      const v = await setting("about");
      return {
        name: copy(v.name, fallback.about.name),
        firstName: copy(v.firstName, fallback.about.firstName),
        role: copy(v.role, fallback.about.role),
        story: lines(v.story, fallback.about.story),
        stats: (Array.isArray(v.stats) && v.stats.length
          ? v.stats
          : fallback.about.stats
        ).map((raw: unknown) => {
          const s = (raw ?? {}) as Record<string, unknown>;
          return {
            value: Number(s.value) || 0,
            suffix: str(s.suffix, "+"),
            label: str(s.label),
          };
        }),
        photo: v.photo ? toPhoto(v.photo) : fallback.about.photo,
      };
    },
    fallback.about,
    "about",
  );
}

export function getContact() {
  return safely(
    async () => {
      const v = await setting("contact");
      const note = (v.bookingNote ?? {}) as Record<string, unknown>;
      return {
        phone: str(v.phone, fallback.contact.phone),
        email: str(v.email, fallback.contact.email),
        address: lines(v.address, fallback.contact.address),
        hours: lines(v.hours, fallback.contact.hours),
        bookingNote: {
          title: str(note.title, fallback.contact.bookingNote.title),
          text: str(note.text, fallback.contact.bookingNote.text),
        },
      };
    },
    fallback.contact,
    "contact",
  );
}

export function getFooter() {
  return safely(
    async () => {
      const v = await setting("footer");
      const credit = (v.credit ?? {}) as Record<string, unknown>;
      return {
        headline: copy(v.headline, fallback.footer.headline),
        headlineFoil: copy(v.headlineFoil, fallback.footer.headlineFoil),
        credit: {
          label: str(credit.label, fallback.footer.credit.label),
          url: str(credit.url, fallback.footer.credit.url),
        },
      };
    },
    fallback.footer,
    "footer",
  );
}

export function getInstagramMeta() {
  return safely(
    async () => {
      const v = await setting("instagram");
      return {
        handle: str(v.handle, fallback.instagram.handle),
        url: str(v.url, fallback.instagram.url),
      };
    },
    fallback.instagram,
    "instagram details",
  );
}

export function getLogo() {
  return safely(
    async () => {
      const v = await setting("logo");
      return {
        src: str(v.src, photos.logo.src),
        full: str(v.full, photos.logo.full),
        alt: str(v.alt, photos.logo.alt),
        height: Number(v.height) || photos.logo.height,
        showText: v.showText !== false,
      };
    },
    photos.logo,
    "logo",
  );
}

/* The album cover is decorative — it sits behind the stamped title — so it has no
   alt of its own, and `showTitle` says whether the lotus and "Our Stories" are
   drawn on top or already baked into the file. */
const builtInAlbumCover = {
  ...photos.albumCover,
  alt: "",
  showTitle: photos.albumCover.showTitle,
};

export function getPagePhotos() {
  const built = {
    contact: photos.contact,
    contactBackdrop: photos.contactBackdrop,
    albumCover: builtInAlbumCover,
  };
  return safely(
    async () => {
      const v = await setting("pagePhotos");
      const cover = (v.albumCover ?? {}) as Record<string, unknown>;
      return {
        contact: v.contact ? toPhoto(v.contact) : photos.contact,
        contactBackdrop: v.contactBackdrop
          ? toPhoto(v.contactBackdrop)
          : photos.contactBackdrop,
        albumCover: cover.src
          ? {
              ...toPhoto(cover),
              showTitle: cover.showTitle === true,
            }
          : builtInAlbumCover,
      };
    },
    built,
    "page photos",
  );
}

/* Structured data is hand-written in the admin, so it is parsed here before it
   can reach a page: a stray comma would otherwise put broken JSON-LD in front of
   Google, which is worse than having none. */
function validSchema(raw: unknown) {
  const text = str(raw).trim();
  if (!text) return "";
  try {
    JSON.parse(text);
    return text;
  } catch {
    console.warn(
      "[content] the JSON-LD in SEO Manager is not valid JSON; skipping it",
    );
    return "";
  }
}

/* ───────────────────────── Portfolio section ───────────────────────── */

/** Every word printed in the album section, from the heading to the last page. */
export function getPortfolio() {
  const built = {
    eyebrow: "Recent stories",
    title: "Pages from our",
    /** the last word of the heading, drawn in gold foil */
    titleFoil: "albums",
    intro:
      "A few of the families who let us into their celebrations. Keep scrolling to turn the pages.",
    /* Stamped on the closed cover. Only used when the cover photo does not
       already have the lettering printed on it — see pagePhotos.albumCover. */
    albumBrand: "DS Photography",
    albumTitle: "Our Stories",
    albumVolume: "Volume I",
    /* The invitation on the last spread. */
    endEyebrow: "Your celebration",
    endTitle: "Your story could be the next page",
    endText: "Tell us about your day and we'll keep a page ready for you.",
    reservedLabel: "Reserved for",
    reservedTitle: "your memories",
  };

  return safely(
    async () => {
      const v = await setting("portfolio");
      const take = (key: keyof typeof built) => copy(v[key], built[key]);
      return {
        eyebrow: take("eyebrow"),
        title: take("title"),
        titleFoil: take("titleFoil"),
        intro: take("intro"),
        albumBrand: take("albumBrand"),
        albumTitle: take("albumTitle"),
        albumVolume: take("albumVolume"),
        endEyebrow: take("endEyebrow"),
        endTitle: take("endTitle"),
        endText: take("endText"),
        reservedLabel: take("reservedLabel"),
        reservedTitle: take("reservedTitle"),
      };
    },
    built,
    "portfolio",
  );
}

/* ───────────────────── Section headings and labels ──────────────────────
   Every section opens the same way: a small label, a two-part heading with its
   last words in gold, and a line of introduction. They were written into the
   components, which meant the most visible words on the site were the only ones
   the studio could not change. */

export type SectionHeading = {
  eyebrow: string;
  title: string;
  /** the closing words, drawn in gold foil */
  titleFoil: string;
  intro: string;
};

function headingOf(key: string, built: SectionHeading) {
  return safely(
    async () => {
      const v = await setting(key);
      return {
        eyebrow: copy(v.eyebrow, built.eyebrow),
        title: copy(v.title, built.title),
        titleFoil: copy(v.titleFoil, built.titleFoil),
        intro: copy(v.intro, built.intro),
      };
    },
    built,
    `${key} heading`,
  );
}

/* The built-in wording, exported so the admin can show it in its fields rather
   than an empty box. An empty box that saves as empty is how a heading quietly
   disappears from the site. */
export const headingDefaults = {
  services: {
    eyebrow: "What we capture",
    title: "Every ritual, every",
    titleFoil: "milestone",
    intro:
      "Seven kinds of shoots, one way of seeing. Tap a frame below, or let the camera take you through each one.",
  },
  reviews: {
    eyebrow: "Kind words",
    title: "Messages we",
    titleFoil: "treasure",
    intro:
      "A few of the notes families sent us after their photos arrived. We read every one, usually more than once.",
  },
  instagram: {
    eyebrow: "On Instagram",
    title: "Fresh from our latest",
    titleFoil: "shoots",
    // the strip has no paragraph under its heading
    intro: "",
  },
  about: {
    eyebrow: "Our story",
    title: "The eyes behind",
    titleFoil: "every frame",
    intro: "",
  },
  contact: {
    eyebrow: "Get in touch",
    title: "Let's talk about your",
    titleFoil: "celebration",
    intro:
      "Tell us the date, the place and what you're celebrating. We usually reply within a few hours.",
  },
} satisfies Record<string, SectionHeading>;

export function getServicesMeta() {
  return headingOf("services", headingDefaults.services);
}

export function getReviewsMeta() {
  return headingOf("reviews", headingDefaults.reviews);
}

export function getInstagramHeading() {
  return headingOf("instagram", headingDefaults.instagram);
}

export function getAboutHeading() {
  return headingOf("about", headingDefaults.about);
}

export function getContactHeading() {
  return headingOf("contact", headingDefaults.contact);
}

export type HeroCopy = {
  eyebrow: string;
  lines: string[];
  foilLine: number;
  sub: string;
  portfolioLabel: string;
};

/** The first screen: the biggest words on the site, and the two buttons under them. */
export const heroDefaults: HeroCopy = {
  eyebrow: "Weddings · Celebrations · Little ones",
  /* One line each, stacked. Kept as lines rather than one paragraph because
       the break points are a design decision, not something to leave to the
       width of the window. */
  lines: ["Capturing the", "colours", "of every", "celebration"],
  /** which of those lines is drawn in gold */
  foilLine: 1,
  sub: "From wedding rituals and baby showers to first birthdays, we capture your family's most precious moments with love and tradition.",
  portfolioLabel: "View portfolio",
};

export function getHero(): Promise<HeroCopy> {
  const built = heroDefaults;

  return safely(
    async () => {
      const v = await setting("hero");
      const lineList = lines(v.lines, built.lines);
      const foil = Number(v.foilLine);
      return {
        eyebrow: copy(v.eyebrow, built.eyebrow),
        lines: lineList,
        /* A line number left over from a longer heading would silently drop the
           gold; clamped to a line that exists. */
        foilLine:
          Number.isInteger(foil) && foil >= 0 && foil < lineList.length
            ? foil
            : Math.min(built.foilLine, lineList.length - 1),
        sub: copy(v.sub, built.sub),
        portfolioLabel: copy(v.portfolioLabel, built.portfolioLabel),
      };
    },
    built,
    "hero heading",
  );
}

export function getSeo() {
  const built = {
    title:
      "DS Photography | Wedding, Engagement, Newborn & Birthday Photography",
    description:
      "DS Photography captures weddings, engagements, pre-wedding shoots, maternity, baby showers, newborns and birthdays. Book your shoot on WhatsApp.",
    siteUrl: "",
    ogImage: "",
    keywords: [] as string[],
    /** JSON-LD, already checked for being parseable */
    schema: "",
    /** false puts noindex on the site — for while it is still being built */
    indexable: true,
  };
  return safely(
    async () => {
      const v = await setting("seo");
      return {
        title: copy(v.title, built.title),
        description: copy(v.description, built.description),
        /* These three stay exactly as given: empty is a real answer for a
           site address, a share image and structured data. */
        siteUrl: str(v.siteUrl),
        ogImage: str(v.ogImage),
        keywords: Array.isArray(v.keywords)
          ? v.keywords
              .map((k) => str(k))
              .filter(Boolean)
              .slice(0, 25)
          : built.keywords,
        schema: validSchema(v.schema),
        indexable: v.indexable !== false,
      };
    },
    built,
    "seo",
  );
}

/* ──────────────────── Everything the home page needs ───────────────── */

export async function getHomeContent() {
  const [
    heroSlides,
    heroOutro,
    services,
    films,
    stories,
    reviews,
    instagramPhotos,
    instagram,
    about,
    contact,
    site,
    pagePhotos,
    portfolio,
    hero,
    servicesMeta,
    reviewsMeta,
    instagramHeading,
    aboutHeading,
    contactHeading,
  ] = await Promise.all([
    getHeroSlides(),
    getHeroOutro(),
    getServices(),
    getFilms(),
    getStories(),
    getReviews(),
    getInstagramPhotos(),
    getInstagramMeta(),
    getAbout(),
    getContact(),
    getSite(),
    getPagePhotos(),
    getPortfolio(),
    getHero(),
    getServicesMeta(),
    getReviewsMeta(),
    getInstagramHeading(),
    getAboutHeading(),
    getContactHeading(),
  ]);

  return {
    heroSlides,
    heroOutro,
    services,
    films,
    stories,
    reviews,
    instagramPhotos,
    instagram,
    about,
    contact,
    site,
    pagePhotos,
    portfolio,
    hero,
    servicesMeta,
    reviewsMeta,
    instagramHeading,
    aboutHeading,
    contactHeading,
  };
}
