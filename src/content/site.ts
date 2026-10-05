// All editable text and links for the site live here. Photos are in photos.ts.

import { photos, type Photo } from "./photos";

export const site = {
  name: "DS Photography",
  // TODO: replace with the client's WhatsApp number — country code + number, digits only (e.g. 919876543210)
  whatsappNumber: "910000000000",
  whatsappMessage: "Hi DS Photography! I'd like to book a photoshoot.",
};

// Menu links in page order. On computers the first half sits left of the logo, the rest on the right.
export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "About", href: "#about" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

export type Service = {
  name: string;
  /** Landscape photo for computers, portrait photo for phones (see photos.ts) */
  wide: Photo;
  tall: Photo;
  /** Camera readout shown in the viewfinder (decorative) */
  exif: { lens: string; aperture: string; shutter: string; iso: string };
};

// Services section (camera viewfinder). Photos: photos.ts → services.
export const serviceDetails: Service[] = [
  {
    name: "Weddings",
    ...photos.services.weddings,
    exif: { lens: "85mm", aperture: "f/1.8", shutter: "1/250", iso: "ISO 400" },
  },
  {
    name: "Engagement",
    ...photos.services.engagement,
    exif: {
      lens: "100mm",
      aperture: "f/2.8",
      shutter: "1/320",
      iso: "ISO 200",
    },
  },
  {
    name: "Pre-wedding",
    ...photos.services.preWedding,
    exif: { lens: "35mm", aperture: "f/2", shutter: "1/1000", iso: "ISO 100" },
  },
  {
    name: "Maternity",
    ...photos.services.maternity,
    exif: { lens: "85mm", aperture: "f/2.2", shutter: "1/200", iso: "ISO 100" },
  },
  {
    name: "Baby shower",
    ...photos.services.babyShower,
    exif: { lens: "35mm", aperture: "f/2.8", shutter: "1/160", iso: "ISO 800" },
  },
  {
    name: "Newborn",
    ...photos.services.newborn,
    exif: { lens: "50mm", aperture: "f/2.8", shutter: "1/125", iso: "ISO 400" },
  },
  {
    name: "Birthdays",
    ...photos.services.birthdays,
    exif: {
      lens: "24mm",
      aperture: "f/2.8",
      shutter: "1/250",
      iso: "ISO 1600",
    },
  },
];

export const services = serviceDetails.map((s) => s.name);

export type Film = {
  title: string;
  /** the line under the title, e.g. "Wedding film · Madurai" */
  label: string;
  /** the film's YouTube link */
  url: string;
  thumbnail: Photo;
};

// Films section, right after "What we capture": 4 YouTube films — the first one large, three underneath.
// Paste each film's YouTube link in `url` — any of these work:
//   https://www.youtube.com/watch?v=XXXXXXXXXXX   https://youtu.be/XXXXXXXXXXX   https://www.youtube.com/shorts/XXXXXXXXXXX
// Clicking a film plays it in a pop-up on the page. Card pictures: photos.ts → films.
export const films = {
  eyebrow: "Our films",
  title: "Stories in",
  titleFoil: "motion",
  intro:
    "The walk in, the vows, the music and the small pauses before everyone cheers, edited to feel just like the day itself.",
  // TODO: the studio's YouTube channel link, for the "Watch more on YouTube" button
  channelUrl: "https://www.youtube.com/@maduraiweddingphotography/videos",
  list: [
    {
      title: "Aravindh  & Thenmozhi ",
      label: "Wedding film · Madurai",
      url: "https://www.youtube.com/watch?v=tJakFNv75aI",
      thumbnail: photos.films[0],
    },
    {
      title: "Revanth & Vinu",
      label: "Post-wedding film",
      url: "https://www.youtube.com/watch?v=1aPharM39UY&t=1s",
      thumbnail: photos.films[1],
    },
    {
      title: "Aravindh & Thenmozhi ",
      label: "Haldi film",
      url: "https://www.youtube.com/watch?v=albnQqWfpRI",
      thumbnail: photos.films[2],
    },
    {
      title: "Aditi turns one",
      label: "First birthday film",
      url: "https://www.youtube.com/watch?v=A29FVL3ZGf0&t=3s",
      thumbnail: photos.films[3],
    },
  ] satisfies Film[],
};

/** Full-screen hero photo plus the name shown for it (photos: photos.ts → hero) */
export type HeroSlide = Photo & { label: string };

export const heroSlides: HeroSlide[] = [
  { label: "Weddings", ...photos.hero.weddings },
  { label: "Haldi & Mehendi", ...photos.hero.haldi },
  { label: "Pre-wedding", ...photos.hero.preWedding },
  { label: "Maternity", ...photos.hero.maternity },
  { label: "Newborn", ...photos.hero.newborn },
  { label: "Birthdays", ...photos.hero.birthdays },
];

export type Story = {
  category: string;
  title: string;
  place: string;
  date: string;
  note: string;
  /** Full-page photo */
  cover: Photo;
  /** Two smaller prints from the same day */
  photos: [Photo, Photo];
};

// Portfolio album: one spread per past shoot. Names, places, dates and notes are placeholders —
// replace with real clients (with their permission). Photos: photos.ts → portfolio.
export const stories: Story[] = [
  {
    category: "Wedding",
    title: "Ananya & Sourav",
    place: "Kolkata",
    date: "February 2025",
    note: "Haldi in the morning, sindoor daan by night. Two days of conch shells, laughter and happy tears.",
    cover: photos.portfolio.wedding.main,
    photos: [photos.portfolio.wedding.small1, photos.portfolio.wedding.small2],
  },
  {
    category: "Pre-wedding",
    title: "Riya & Kabir",
    place: "Hampi",
    date: "November 2024",
    note: "Sunrise among the old temple ruins, then a quiet hour by the water before the crowds came in.",
    cover: photos.portfolio.preWedding.main,
    photos: [
      photos.portfolio.preWedding.small1,
      photos.portfolio.preWedding.small2,
    ],
  },
  {
    category: "Baby shower",
    title: "Meghna & Arijit",
    place: "Bengaluru",
    date: "August 2025",
    note: "Balloons, bangles and blessings from both families, and a lot of happy chaos in between.",
    cover: photos.portfolio.babyShower.main,
    photos: [
      photos.portfolio.babyShower.small1,
      photos.portfolio.babyShower.small2,
    ],
  },
  {
    category: "Newborn",
    title: "Baby Ved",
    place: "Chennai",
    date: "March 2025",
    note: "Twelve days old and fast asleep. A calm, cosy session at home with his proud new parents.",
    cover: photos.portfolio.newborn.main,
    photos: [photos.portfolio.newborn.small1, photos.portfolio.newborn.small2],
  },
  {
    category: "First birthday",
    title: "Myra turns one",
    place: "Kochi",
    date: "June 2025",
    note: "A garden party with golden balloons, a flower crown and one very serious cake smash.",
    cover: photos.portfolio.birthday.main,
    photos: [
      photos.portfolio.birthday.small1,
      photos.portfolio.birthday.small2,
    ],
  },
];

// About / Our story. Placeholder name, story and numbers — replace with the photographer's own.
// Photos: photos.ts → about.
export const about = {
  name: "Sivakumar",
  firstName: "Sivakumar",
  role: "Founder & lead photographer",
  since: 2014,
  story: [
    "DS Photography, led by Sivakumar, believes in capturing genuine moments as they naturally unfold. Our team combines candid photography with thoughtful lighting to preserve the emotions and atmosphere of every celebration.",
    "From Hindu, Christian, and Islamic weddings to other special occasions, we adapt to each event and our clients’ preferences. Alongside photography, we offer videography, cinematography, and webcasting, creating memories with creativity, comfort, and a natural approach.",
  ],
  stats: [
    { value: 12, suffix: "+", label: "Years behind the lens" },
    { value: 850, suffix: "+", label: "Celebrations captured" },
    { value: 1043, suffix: "+", label: "Locations" },
  ],
  photo: photos.about.portrait,
};

export type ChatMessage = {
  /** "client" = the family (left, white bubble), "studio" = our reply (right) */
  from: "client" | "studio";
  text?: string;
  /** a photo sent in the chat */
  photo?: Photo;
  time: string;
  /** a little emoji reaction on the bubble */
  reaction?: string;
};

export type Review = {
  /** contact name at the top of the chat */
  name: string;
  /** what we shot for them (read out to screen readers) */
  shoot: string;
  /** "online" or "last seen …" under the name */
  status: string;
  /** the date chip above the messages */
  date: string;
  /** the time in the phone's status bar */
  clock: string;
  avatar: Photo;
  messages: ChatMessage[];
};

// Reviews: shown as screenshots of thank-you chats. Four are in Tamil written in English letters
// (Tanglish), two in English. Placeholder messages — replace them with real ones (with the
// family's permission). Profile pictures and sent photos: photos.ts → reviews.
export const reviews: Review[] = [
  {
    name: "Ananya & Sourav",
    shoot: "Wedding",
    status: "online",
    date: "Today",
    clock: "9:41",
    avatar: photos.reviews.ananya.avatar,
    messages: [
      {
        from: "client",
        text: "Hi!! The album just arrived and the whole family is sitting around it 😭",
        time: "9:12 pm",
      },
      {
        from: "client",
        text: "The sindoor daan photos… we have no words. Thank you for not missing a single ritual 🙏",
        time: "9:13 pm",
        reaction: "❤️",
      },
      {
        from: "studio",
        text: "This made our whole week! It was an honour to be part of your wedding ❤️",
        time: "9:20 pm",
      },
    ],
  },
  {
    name: "Riya",
    shoot: "Pre-wedding",
    status: "last seen today at 7:05 am",
    date: "Yesterday",
    clock: "7:12",
    avatar: photos.reviews.riya.avatar,
    messages: [
      { from: "client", photo: photos.reviews.riya.sent, time: "6:58 am" },
      {
        from: "client",
        text: "Okay THIS one is going on our wedding invite 😍",
        time: "6:58 am",
      },
      {
        from: "client",
        text: "Waking up at 5 am was so worth it. You made us look like a film poster!",
        time: "7:01 am",
        reaction: "🔥",
      },
      {
        from: "studio",
        text: "The sunrise did half the work 😄 So glad you both love them!",
        time: "7:04 am",
      },
    ],
  },
  {
    name: "Meghna",
    shoot: "Baby shower",
    status: "online",
    date: "12 August",
    clock: "6:21",
    avatar: photos.reviews.meghna.avatar,
    messages: [
      {
        from: "client",
        text: "Akka, valaikappu video-va Amma already pathu thadava paathutaanga 😂",
        time: "6:02 pm",
      },
      {
        from: "client",
        text: "Ovvoru valayal, ovvoru blessing-um miss pannama eduthirukeenga. Romba thanks!",
        time: "6:03 pm",
        reaction: "❤️",
      },
      {
        from: "studio",
        text: "Ammakku engaloda love sollunga 🙏 Kutty paapava paaka waiting!",
        time: "6:15 pm",
      },
    ],
  },
  {
    name: "Anjali (Ved's Amma)",
    shoot: "Newborn",
    status: "online",
    date: "Today",
    clock: "11:34",
    avatar: photos.reviews.ved.avatar,
    messages: [
      {
        from: "client",
        text: "Newborn shoot-ku romba tension-a irundhom, aana neenga avlo patience-a handle panneenga",
        time: "11:20 am",
      },
      {
        from: "client",
        photo: photos.reviews.ved.sent,
        text: "Indha smile-a paarunga 🥹 Avan room-la frame panna poren",
        time: "11:21 am",
      },
      {
        from: "studio",
        text: "Ivlo calm-ana kutty model-a naanga paathadhe illa 😊",
        time: "11:30 am",
        reaction: "🥰",
      },
    ],
  },
  {
    name: "Divya (Myra's mom)",
    shoot: "First birthday",
    status: "last seen yesterday at 10:48 pm",
    date: "Yesterday",
    clock: "8:05",
    avatar: photos.reviews.myra.avatar,
    messages: [
      { from: "client", photo: photos.reviews.myra.sent, time: "10:31 pm" },
      {
        from: "client",
        text: "Cake smash photos!!! 🎂😂 Sirippa adakkave mudiyala",
        time: "10:31 pm",
      },
      {
        from: "client",
        text: "Party-la ellarum unga number kekkuraanga. Ippove share panren!",
        time: "10:33 pm",
      },
      {
        from: "studio",
        text: "Haha romba thanks! Myra-ku happy birthday 🎈",
        time: "10:40 pm",
      },
    ],
  },
  {
    name: "Shruti",
    shoot: "Maternity",
    status: "online",
    date: "Today",
    clock: "4:16",
    avatar: photos.reviews.shruti.avatar,
    messages: [
      {
        from: "client",
        text: "Photos-la naan ivlo azhaga irundhadhe illa. Romba comfortable-a feel panna vechadhuku thanks 💛",
        time: "4:05 pm",
      },
      {
        from: "studio",
        text: "Shoot full-a neenga glow aagitte irundheenga! Safe delivery-ku engaloda wishes 🙏",
        time: "4:12 pm",
        reaction: "❤️",
      },
    ],
  },
];

// Instagram strip. TODO: put the client's handle and their profile link
// (e.g. https://www.instagram.com/their_handle/). Photos: photos.ts → instagram.
export const instagram = {
  handle: "dsphotography",
  url: "https://www.instagram.com/ds_photography/?hl=en",
};

// Contact section. TODO: replace every value with the studio's real details. Photo: photos.ts → contact.
export const contact = {
  phone: "+91 99948 24771",
  email: "hello@dsphotography.in",
  address: ["1st Floor, 29/2, Aruppukottai Rd, near : Little Diamonds School, Villapuram, Madurai, Tamil Nadu 625012"],
  hours: ["Mon – Sat · 9 am – 8 pm", "Sunday by appointment"],
  /** The strip under the photo */
  bookingNote: {
    title: "Now booking 2026 – 27 dates",
    text: "Only a few celebrations each month, so popular dates go early.",
  },
};

// Footer: the big line in the middle, and the credit in the bottom bar.
export const footer = {
  headline: "Turning your celebrations into",
  headlineFoil: "timeless stories.",
  // TODO: MnT Future's website link
  credit: { label: "MnT Future", url: "https://mntfuture.com/" },
};

// Shown beside the arch when the hero photo shrinks on scroll
export const heroOutro = {
  left: "Rooted in tradition,",
  right: "framed for today.",
  intro:
    "DS Photography captures weddings, baby showers, newborns and birthdays with the warmth of tradition and a clean, modern eye.",
  cta: { label: "Our story", href: "#about" },
};
