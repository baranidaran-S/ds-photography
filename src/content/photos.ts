/* ═══════════════════════════════════════════════════════════════════════════
   ALL PHOTOS ON THE WEBSITE — change any photo here.

   HOW TO CHANGE A PHOTO
   1. Save your photo in the matching folder inside  public/images/
        hero/        → the full-screen slideshow at the top
        services/    → the camera viewfinder
        portfolio/   → the album stories
        about/       → the photographer
   2. Point `src` at the new file. Paths start at /images, for example:
        src: "/images/hero/my-wedding-photo.jpg",
   3. Update `alt` — a short description of what is in the photo
      (Google and screen readers read it).
   4. If faces get cut off, change `position` — the point that stays in view
      when the photo is cropped, as "left-right% top-bottom%":
        "50% 50%" = centre    "50% 20%" = near the top    "30% 50%" = left of centre
      `mobilePosition` does the same on phones, where the crop is taller.

   SHORTCUT: save the new photo with exactly the same name as the old one
   (e.g. overwrite public/images/hero/haldi.jpg) — then nothing here needs to change.

   Tips: .jpg works best, about 2000px on the longest side, under ~600 KB.
   Restart or refresh the dev server if a new file doesn't show up straight away.
   ═══════════════════════════════════════════════════════════════════════════ */

export type Photo = {
  /** File path, starting with /images/ */
  src: string;
  /** Short description of the photo */
  alt: string;
  /** Focus point "x% y%" — what stays in view when the photo is cropped */
  position?: string;
  /** Focus point on phones, if it needs to be different */
  mobilePosition?: string;
};

/* ── 0. LOGO — centre of the menu bar ───────────────────────────────────────
   Set `src` to "" to go back to the plain text logo (lotus · DS | PHOTOGRAPHY).
   The menu bar is dark, so use a PNG with a transparent background (or an SVG) in a light or
   gold colour. In public/images/logo, ds-final-mark.png is the final logo (camera + DS) with the
   empty space around it trimmed off.
   src      → the menu bar;  full → the footer (shown larger)
   height   → how tall the mark shows on computers, in pixels (phones and the scrolled bar show it smaller)
   showText → also write "PHOTOGRAPHY" under it; set to false if your logo file already has the name
   (The browser-tab icon is separate, made from this logo on a dark square: src/app/favicon.ico,
   src/app/icon.png and src/app/apple-icon.png for iPhone home screens) */
const logo = {
  src: "/images/logo/ds-final-mark.png",
  full: "/images/logo/ds-final-mark.png",
  alt: "DS Photography",
  height: 54,
  showText: true,
};

/* ── 1. HERO — full-screen slideshow at the very top (6 photos) ──────────────
   Wide (landscape) photos, at least 1920px wide.   Folder: public/images/hero
   The slideshow plays them in this order. The names under each photo are in site.ts (heroSlides). */
const hero = {
  weddings: {
    src: "/images/hero/new wedding.jpg",
    alt: "Bride and groom in flower garlands greeting guests with folded hands as family cheer and shower petals",
    position: "0% 30%",
    mobilePosition: "55% 50%",
  },
  haldi: {
    src: "/images/hero/haldi.jpg",
    alt: "Bride covered in turmeric at her haldi ceremony, surrounded by friends' hands",
    position: "50% 40%",
    mobilePosition: "50% 50%",
  },
  preWedding: {
    src: "/images/hero/newpostwedding.jpg",
    alt: "Couple standing forehead to forehead on a lantern-lit balcony with white pillars",
    position: "50% 50%",
    mobilePosition: "48% 50%",
  },
  maternity: {
    src: "/images/hero/maternity1.jpg",
    alt: "Mother-to-be in a flowing red gown in a bamboo forest",
    position: "50% 50%",
    mobilePosition: "46% 50%",
  },
  newborn: {
    src: "/images/hero/newborn.jpg",
    alt: "Sleeping newborn wrapped in pink, resting in a wooden bowl",
    position: "50% 50%",
    mobilePosition: "52% 50%",
  },
  birthdays: {
    src: "/images/hero/hero7.png",
    alt: "Little girl in a purple party dress holding up a gold number 5 balloon on a lawn",
    position: "0% 50%",
    mobilePosition: "50% 50%",
  },
} satisfies Record<string, Photo>;

/* ── 1b. HERO BACKGROUND — behind the arch, once the first photo has shrunk into it ──────
   Leave src empty ("") for plain cream. Use a soft, light image (the words beside the arch are
   dark); it's cropped to fill the screen. Phones show only a narrow upright slice of it:
   `mobilePosition` picks which (here the soft leaf shadows on the left, away from the flowers
   that would sit behind the words). */
const heroBackdrop: Photo = {
  src: "/images/hero/hero_bg.png",
  alt: "",
  position: "50% 50%",
  mobilePosition: "15% 50%",
};

/* ── 2. SERVICES — the camera viewfinder (7 services × 2 photos) ─────────────
   wide → landscape photo, shown on computers and tablets (big picture and its small thumbnail)
   tall → portrait photo, shown on phones (big picture and its small thumbnail)
   Folder: public/images/services   (the same file can be used for both, like Baby shower) */
const services = {
  weddings: {
    wide: {
      src: "/images/services/wedding-wide.jpg",
      alt: "Bride and groom in shola crowns seated by the sacred fire during their wedding rituals",
      position: "50% 40%",
    },
    tall: {
      src: "/images/services/wedding.jpg",
      alt: "Bride and groom in gold silk and garlands, foreheads touching at a temple wedding",
    },
  },
  engagement: {
    wide: {
      src: "/images/services/engagement-wide.jpg",
      alt: "Groom slipping a ring onto the bride's hennaed finger above red roses",
    },
    tall: {
      src: "/images/services/engagement.jpg",
      alt: "Smiling couple showing the engagement ring on her hennaed hand",
    },
  },
  preWedding: {
    wide: {
      src: "/images/services/pre-wedding-wide.jpg",
      alt: "Couple in a red silk saree and black tuxedo on a leafy lane",
      position: "50% 35%",
    },
    tall: {
      src: "/images/services/pre-wedding.jpg",
      alt: "Groom kissing the bride's forehead outdoors under the trees",
    },
  },
  maternity: {
    wide: {
      src: "/images/services/maternity-wide.jpg",
      alt: "Mother-to-be in a flowing yellow satin gown against a black studio background",
    },
    tall: {
      src: "/images/services/maternity.jpg",
      alt: "Mother-to-be in a green and gold silk saree holding her bump",
    },
  },
  babyShower: {
    wide: {
      src: "/images/services/baby-shower.jpg",
      alt: "Husband kneeling to kiss his wife's baby bump at a traditional baby shower",
      position: "50% 40%",
    },
    tall: {
      src: "/images/services/baby-shower.jpg",
      alt: "Husband kneeling to kiss his wife's baby bump at a traditional baby shower",
      position: "42% 50%",
    },
  },
  newborn: {
    wide: {
      src: "/images/services/newborn-wide.jpg",
      alt: "Sleeping newborn in a yellow knitted wrap and hat on a soft white rug",
      position: "50% 45%",
    },
    tall: {
      src: "/images/services/newborn.jpg",
      alt: "Sleeping newborn held close, gripping a parent's finger",
    },
  },
  birthdays: {
    wide: {
      src: "/images/services/birthday-wide.jpg",
      alt: "Mother and toddler son smiling behind his birthday cake",
      position: "50% 38%",
    },
    tall: {
      src: "/images/services/birthday.jpg",
      alt: "Mother and toddler son behind his birthday cake with a lit candle",
    },
  },
} satisfies Record<string, { wide: Photo; tall: Photo }>;

/* ── 3. PORTFOLIO ALBUM — 5 stories × 3 photos ────────────────────────────────
   main   → fills a whole album page; a tall (portrait) photo works best.
            On phones the page is wide, so it uses `mobilePosition`.
   small1, small2 → the two smaller prints beside the names
   Folder: public/images/portfolio
   The names, places, dates and notes for each story are in site.ts (stories). */
const portfolio = {
  wedding: {
    main: {
      src: "/images/portfolio/wedding-1.jpg",
      alt: "Bengali bride in a red Banarasi saree and shola crown, holding her wedding garland",
      position: "50% 30%",
      mobilePosition: "50% 22%",
    },
    small1: {
      src: "/images/portfolio/wedding-2.jpg",
      alt: "Bride and groom in shola crowns during the wedding rituals",
      position: "50% 22%",
    },
    small2: {
      src: "/images/portfolio/wedding-3.jpg",
      alt: "Bride smiling at her haldi as friends in yellow saris bless her",
      position: "46% 45%",
    },
  },
  preWedding: {
    main: {
      src: "/images/portfolio/prewedding-1.jpg",
      alt: "Couple laughing together on the rocks beside a green lake",
      position: "50% 62%",
      mobilePosition: "55% 62%",
    },
    small1: {
      src: "/images/portfolio/prewedding-2.jpg",
      alt: "Couple standing between the carved pillars of an old stone temple",
      position: "50% 62%",
    },
    small2: {
      src: "/images/portfolio/prewedding-3.jpg",
      alt: "Couple embracing at the edge of a lake",
      position: "44% 50%",
    },
  },
  babyShower: {
    main: {
      src: "/images/portfolio/babyshower-1.jpg",
      alt: "Mother-to-be in a red silk saree beside BABY letter blocks and a balloon arch",
      position: "55% 40%",
      mobilePosition: "55% 30%",
    },
    small1: {
      src: "/images/portfolio/babyshower-2.jpg",
      alt: "Husband holding his wife's baby bump in front of the balloon arch",
      position: "50% 35%",
    },
    small2: {
      src: "/images/portfolio/babyshower-3.jpg",
      alt: "Couple wearing flower garlands, smiling with their guests",
      position: "50% 28%",
    },
  },
  newborn: {
    main: {
      src: "/images/portfolio/newborn-1.jpg",
      alt: "New parents smiling down at their sleeping baby boy",
      position: "45% 35%",
      mobilePosition: "45% 30%",
    },
    small1: {
      src: "/images/portfolio/newborn-2.jpg",
      alt: "Newborn smiling in his sleep, wrapped in white in a cane cradle",
      position: "45% 50%",
    },
    small2: {
      src: "/images/portfolio/newborn-3.jpg",
      alt: "Newborn asleep in a little basket with a mustard wrap",
      position: "50% 50%",
    },
  },
  birthday: {
    main: {
      src: "/images/portfolio/birthday-1.jpg",
      alt: "Baby girl in a flower crown sitting on a golden balloon at her first birthday",
      position: "50% 55%",
      mobilePosition: "50% 45%",
    },
    small1: {
      src: "/images/portfolio/birthday-2.jpg",
      alt: "Baby with cake on her face during the cake smash",
      position: "35% 40%",
    },
    small2: {
      src: "/images/portfolio/birthday-3.jpg",
      alt: "Birthday girl among yellow balloons as confetti falls",
      position: "52% 55%",
    },
  },
} satisfies Record<string, { main: Photo; small1: Photo; small2: Photo }>;

/* ── 3b. ALBUM COVER — the closed album at the start of the portfolio ────────────
   Leave `src` empty ("") to keep the drawn red leather cover.
   To use a photo of a real cover: save a SQUARE image of just the cover surface — straight on,
   edge to edge, no table or background around it — in public/images/portfolio/ and set `src`.
   The same image also lines the inside of the cover and the board edges, so the colours match.
   showTitle → keep the gold lotus, border and "Our Stories" stamped on top of your image.
               Set to false if your image already has its own title or design.
   On phones the cover is a little wider than tall, so keep anything important away from the
   top and bottom edges. */
const albumCover = {
  src: "/images/portfolio/album-cover.jpg",
  position: "50% 50%",
  showTitle: false, // the image already has the lotus, border and "Our Stories"
};

/* ── 4. ABOUT — the photographer ───────────────────────────────────────────────
   Folder: public/images/about
   portrait → his photo on the left: a tall photo with his face in the upper part. Its right
              edge fades into the dark page, so keep him to the left or centre.
   bride    → the picture at the top right; its edges fade into the dark, so keep her face near
              the middle of what shows (shown about 4:5, a little taller than wide)
   temple   → our city, bottom right, melting into the dark page */
const about = {
  portrait: {
    src: "/images/about/sivakumar new image.png",
    alt: "Sivakumar, founder of DS Photography, holding his camera in the studio",
    position: "50% 20%",
  },
  bride: {
    src: "/images/about/bridal image.png",
    alt: "Bride in a red silk saree with jasmine in her hair, smiling down in warm lamplight",
    position: "92% 40%",
  },
  temple: {
    src: "/images/about/meenakshi amman temple.png",
    alt: "The Meenakshi Amman temple tower in Madurai at sunset",
    position: "78% 70%",
  },
} satisfies Record<string, Photo>;

/* ── 5. REVIEWS — the chat screenshots (6 families) ─────────────────────────────
   avatar → the small round profile picture: a square photo with the face in the middle.
            Folder: public/images/reviews (these were cropped from the portfolio photos)
   sent   → a photo the family sent back in the chat (optional — delete the line to leave it out)
   The names and messages themselves are in site.ts (reviews). */
type ReviewPhotos = { avatar: Photo; sent?: Photo };
const reviewPhotos = {
  ananya: {
    avatar: { src: "/images/reviews/ananya.jpg", alt: "" },
  },
  riya: {
    avatar: { src: "/images/reviews/riya.jpg", alt: "" },
    sent: {
      src: "/images/portfolio/prewedding-3.jpg",
      alt: "Riya and Kabir embracing at the edge of the lake",
    },
  },
  meghna: {
    avatar: { src: "/images/reviews/meghna.jpg", alt: "" },
  },
  ved: {
    avatar: { src: "/images/reviews/ved.jpg", alt: "" },
    sent: {
      src: "/images/portfolio/newborn-2.jpg",
      alt: "Baby Ved smiling in his sleep",
      position: "45% 50%",
    },
  },
  myra: {
    avatar: { src: "/images/reviews/myra.jpg", alt: "" },
    sent: {
      src: "/images/portfolio/birthday-2.jpg",
      alt: "Myra with cake all over her face",
      position: "35% 40%",
    },
  },
  shruti: {
    avatar: { src: "/images/reviews/shruti.jpg", alt: "" },
  },
} satisfies Record<string, ReviewPhotos>;
// every family may or may not have a sent photo
const reviews: Record<keyof typeof reviewPhotos, ReviewPhotos> = reviewPhotos;

/* ── 6. INSTAGRAM — a grid of 6 photos of different sizes, plus the "Follow us" tile ──────
   The order sets each photo's spot (on computers):
     1 → the big one, top left          2 → small, top middle      3 → tall, right
     4 → small, under 2                 5 → small, bottom left     6 → wide, bottom middle
   Any photo works (it's cropped to fit its spot); use `position` to keep faces in view.
   Save new ones in public/images/instagram/.
   likes → the number shown with a heart on the photo (optional). */
const instagram: (Photo & { likes?: string })[] = [
  {
    src: "/images/hero/pre-wedding.jpg",
    alt: "Couple holding hands under an old stone arch at sunset",
    likes: "2.4k",
  },
  {
    src: "/images/services/engagement.jpg",
    alt: "Bride showing her engagement ring",
    position: "50% 55%",
    likes: "1.3k",
  },
  {
    src: "/images/services/baby-shower.jpg",
    alt: "Husband kneeling to kiss his wife's baby bump at her baby shower",
    position: "46% 50%",
    likes: "2.1k",
  },
  {
    src: "/images/portfolio/newborn-3.jpg",
    alt: "Newborn asleep in a little basket",
    likes: "1.1k",
  },
  {
    src: "/images/portfolio/birthday-3.jpg",
    alt: "Birthday girl among yellow balloons",
    likes: "874",
  },
  {
    src: "/images/services/wedding.jpg",
    alt: "Bride and groom in garlands at a temple wedding",
    position: "50% 35%",
    likes: "1.8k",
  },
];

/* ── 6b. INSTAGRAM BACKGROUND — the image behind the whole Instagram section ─────────────
   Leave src empty ("") for plain dark. Use a dark image (the heading is light), wider than tall;
   it's cropped to fill the section, so keep the main glow near the edges and the middle dark. */
const instagramBackdrop: Photo = {
  src: "/images/instagram/Moody Amber-Edged Dark Backdrop.png",
  alt: "",
  position: "50% 50%",
};

/* ── 7. CONTACT — the framed photo beside the contact details ───────────────────
   A tall crop works best; `position` keeps the couple in view. */
const contactPhoto: Photo = {
  src: "/images/hero/contact.jpg",
  alt: "Bride and groom exchanging wedding garlands during a traditional Hindu wedding ceremony at a temple.",
  position: "62% 45%",
};

/* ── 7b. CONTACT BACKGROUND — optional image behind the whole contact section ─────
   Leave src empty ("") to keep the drawn background (soft bokeh lights + camera aperture).
   Use a very light, soft, out-of-focus image; the site lays cream over it so the text stays readable. */
const contactBackdrop: Photo = {
  src: "/images/hero/contact-bg.jpg",
  alt: "",
  position: "50% 50%",
};

/* ── 8. FILMS — the picture on each film card (4 films, same order as site.ts → films) ──
   Leave a src empty ("") to use the film's own YouTube thumbnail instead (needs its YouTube link
   in site.ts). These are placeholders until the real films are added.   Any folder works. */
const films: Photo[] = [
  {
    src: "", // empty → the YouTube thumbnail of film 1's link
    alt: "",
    position: "50% 35%",
  },
  {
    src: "",
    alt: "",
    position: "70% 35%",
  },
  {
    src: "",
    alt: "",
    position: "50% 40%",
  },
  {
    src: "",
    alt: "",
    position: "50% 45%",
  },
];

export const photos = {
  logo,
  hero,
  heroBackdrop,
  services,
  portfolio,
  albumCover,
  about,
  reviews,
  instagram,
  instagramBackdrop,
  contact: contactPhoto,
  contactBackdrop,
  films,
};
