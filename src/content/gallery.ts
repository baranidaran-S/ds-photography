// The gallery (/gallery): every category, and the kinds of shoots inside each one
// (/gallery/<category>). Remove a category or a kind by deleting its lines.
// Photos: photos.ts → gallery (one per category); each kind of shoot's photos are in its own
// folder, public/images/stories/<kind slug>/ (see stories.ts).

import { photos, type Photo } from "./photos";
import { stories } from "./stories";

export type GallerySub = {
  slug: string;
  name: string;
  /** The Tamil or traditional name, shown with the English one */
  local?: string;
  /** Its folder's cover photo, filled in on the server (lib/kindPhotos.ts → withCovers) */
  cover?: Photo;
  /** That photo's width ÷ height, filled in with it */
  shape?: number;
};

export type GalleryCategory = {
  /** The category's address: /gallery/<slug> */
  slug: string;
  name: string;
  /** One line under the name on the category's page */
  intro: string;
  /** Its photo on the gallery page. An empty src shows it with "Photos coming soon". */
  cover: Photo;
  /** That photo's width ÷ height, filled in on the server (lib/kindPhotos.ts → withShapes) */
  shape?: number;
  subs: GallerySub[];
};

export const galleryCategories: GalleryCategory[] = [
  {
    slug: "weddings",
    name: "Weddings",
    intro:
      "From the first Muhurtham ritual to the last dance at the reception: every tradition, every faith.",
    cover: photos.gallery.weddings,
    subs: [
      { slug: "hindu-wedding", name: "Hindu wedding", local: "Muhurtham" },
      { slug: "christian-wedding", name: "Christian wedding" },
      { slug: "muslim-wedding", name: "Muslim wedding", local: "Nikah" },
      { slug: "reception", name: "Reception" },
      { slug: "nalangu", name: "Nalangu" },
      { slug: "mehendi-haldi", name: "Mehendi & Haldi" },
      { slug: "sangeet", name: "Sangeet" },
      { slug: "temple-wedding", name: "Temple wedding" },
      { slug: "destination-wedding", name: "Destination wedding" },
    ],
  },
  {
    slug: "couple",
    name: "Couple",
    intro:
      "Engagements, pre-wedding walks and anniversaries. Just the two of you, before and after the big day.",
    cover: photos.gallery.couple,
    subs: [
      { slug: "engagement", name: "Engagement", local: "Nichayathartham" },
      { slug: "pre-wedding", name: "Pre-wedding shoot" },
      { slug: "save-the-date", name: "Save the date" },
      { slug: "post-wedding", name: "Post-wedding shoot" },
      { slug: "anniversary", name: "Anniversary shoot" },
    ],
  },
  {
    slug: "maternity-baby",
    name: "Maternity & Baby",
    intro:
      "From the bump to the cradle: maternity shoots, Valaikappu, newborns and every first.",
    cover: photos.gallery.maternityBaby,
    subs: [
      { slug: "maternity", name: "Maternity shoot" },
      { slug: "baby-shower", name: "Baby shower", local: "Valaikappu / Seemantham" },
      { slug: "newborn", name: "Newborn" },
      { slug: "naming-ceremony", name: "Naming & cradle ceremony" },
      { slug: "baby-milestones", name: "Baby milestones", local: "3, 6, 9 months" },
      { slug: "ear-piercing", name: "Ear piercing", local: "Kaadhu Kuthu" },
      { slug: "first-rice-feeding", name: "First rice feeding", local: "Annaprasanam" },
    ],
  },
  {
    slug: "kids-birthdays",
    name: "Kids & Birthdays",
    intro:
      "First birthdays, cake smashes and little ones growing up far too fast.",
    cover: photos.gallery.kidsBirthdays,
    subs: [
      { slug: "first-birthday", name: "First birthday" },
      { slug: "kids-birthday", name: "Kids' birthday party" },
      { slug: "cake-smash", name: "Cake smash" },
      { slug: "kids-portraits", name: "Kids' portraits" },
    ],
  },
  {
    slug: "family-functions",
    name: "Family functions",
    intro:
      "The ceremonies that bring the whole family home, from Manjal Neerattu Vizha to the 60th & 80th wedding.",
    cover: photos.gallery.familyFunctions,
    subs: [
      { slug: "puberty-ceremony", name: "Puberty ceremony", local: "Manjal Neerattu Vizha" },
      { slug: "housewarming", name: "Housewarming", local: "Griha Pravesam" },
      { slug: "60th-80th-wedding", name: "60th & 80th wedding" },
      { slug: "family-portraits", name: "Family portraits" },
    ],
  },
  {
    slug: "portraits",
    name: "Portraits",
    intro:
      "Just you, in your best light: portraits, portfolios, graduations and headshots.",
    cover: photos.gallery.portraits,
    subs: [
      { slug: "personal-portraits", name: "Personal portraits" },
      { slug: "model-portfolio", name: "Model portfolio" },
      { slug: "graduation", name: "Graduation" },
      { slug: "headshots", name: "Professional headshots" },
    ],
  },
  {
    slug: "events",
    name: "Events",
    intro:
      "Corporate days, stage shows and school functions, covered from start to finish.",
    cover: photos.gallery.events,
    subs: [
      { slug: "corporate-events", name: "Corporate events" },
      { slug: "stage-shows", name: "Stage shows & concerts" },
      { slug: "school-college", name: "School & college functions" },
    ],
  },
];

/** The gallery page (/gallery/<category>/<kind>) whose story in stories.ts is about these
    names, for the home page album's "See full story" button; "" when there's none */
export function pageOfNames(names: string) {
  const kind = Object.keys(stories).find((k) => stories[k].names === names);
  const category = galleryCategories.find((c) => c.subs.some((s) => s.slug === kind));
  return category ? `/gallery/${category.slug}/${kind}` : "";
}
