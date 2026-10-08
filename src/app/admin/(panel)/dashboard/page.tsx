import Link from "next/link";
import { connectDB } from "@/lib/db";
import {
  Enquiry,
  Film,
  HeroSlide,
  InstagramPhoto,
  Media,
  Review,
  Service,
  Story,
} from "@/models";
import { NavIcon } from "../../icons";
import type { IconName } from "../../nav";
import { Insights } from "./Insights";
import { loadInsights, type InsightData } from "./stats";

type Card = {
  label: string;
  href: string;
  icon: IconName;
  total: number;
  active: number;
  tint: string;
};

async function loadCounts() {
  await connectDB();

  const count = async (m: { countDocuments: (f?: object) => Promise<number> }) => ({
    total: await m.countDocuments({}),
    active: await m.countDocuments({ active: true }),
  });

  const [hero, services, stories, reviews, films, instagram, media, enquiries] =
    await Promise.all([
      count(HeroSlide),
      count(Service),
      count(Story),
      count(Review),
      count(Film),
      count(InstagramPhoto),
      Media.countDocuments({}),
      Enquiry.countDocuments({}),
    ]);

  const [newEnquiries, recent] = await Promise.all([
    Enquiry.countDocuments({ status: "new" }),
    Enquiry.find({}).sort({ createdAt: -1 }).limit(4).lean(),
  ]);

  return {
    hero,
    services,
    stories,
    reviews,
    films,
    instagram,
    media,
    enquiries,
    newEnquiries,
    recent: recent.map((e) => ({
      id: String(e._id),
      name: String(e.name ?? ""),
      eventType: String(e.eventType ?? ""),
      status: String(e.status ?? "new"),
      createdAt: new Date(e.createdAt).toISOString(),
    })),
  };
}

export default async function DashboardPage() {
  let data: Awaited<ReturnType<typeof loadCounts>> | null = null;
  let insights: InsightData | null = null;
  let dbError = "";

  try {
    [data, insights] = await Promise.all([loadCounts(), loadInsights()]);
  } catch (err) {
    dbError =
      err instanceof Error ? err.message : "Could not reach the database.";
  }

  if (!data || !insights) {
    return (
      <div className="mx-auto max-w-[40rem] rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="font-display text-[1.4rem] text-ink">
          Database not connected
        </h1>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-slate-600">
          {dbError}
        </p>
        <p className="mt-4 text-[0.88rem] leading-relaxed text-slate-600">
          Set <code className="rounded bg-white px-1.5 py-0.5">MONGODB_URI</code> in{" "}
          <code className="rounded bg-white px-1.5 py-0.5">.env.local</code>, then
          run <code className="rounded bg-white px-1.5 py-0.5">npm run seed</code> to
          load your current content into MongoDB.
        </p>
      </div>
    );
  }

  const cards: Card[] = [
    {
      label: "Hero Slides",
      href: "/admin/hero",
      icon: "image",
      ...data.hero,
      tint: "bg-amber-50 text-amber-600",
    },
    {
      label: "Services",
      href: "/admin/services",
      icon: "camera",
      ...data.services,
      tint: "bg-rose-50 text-rose-600",
    },
    {
      label: "Portfolio Stories",
      href: "/admin/stories",
      icon: "album",
      ...data.stories,
      tint: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Reviews",
      href: "/admin/reviews",
      icon: "chat",
      ...data.reviews,
      tint: "bg-sky-50 text-sky-600",
    },
  ];

  const secondary = [
    { label: "Films", href: "/admin/films", ...data.films },
    { label: "Instagram photos", href: "/admin/instagram", ...data.instagram },
  ];

  const empty = cards.every((c) => c.total === 0);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-[2rem] leading-tight text-ink">Overview</h1>
        <p className="mt-1 text-[0.95rem] text-slate-500">
          Everything on your site, editable from here.
        </p>
      </div>

      {empty && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[0.92rem] text-slate-700">
            No content yet. Run{" "}
            <code className="rounded bg-white px-1.5 py-0.5">npm run seed</code> to
            import the photos and copy that are currently hard-coded in the site.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 transition-shadow duration-300 hover:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.18)]"
          >
            <span
              className={`mb-9 grid size-11 place-items-center rounded-xl ${card.tint}`}
            >
              <NavIcon name={card.icon} className="size-5" />
            </span>
            <p className="text-[0.95rem] font-medium text-slate-700">{card.label}</p>
            <p className="mt-1 font-heading text-[0.6rem] font-bold tracking-[0.18em] text-slate-400 uppercase">
              {card.active} active
            </p>
            <p className="mt-1 font-display text-[2rem] leading-none text-ink">
              {card.total}
            </p>
          </Link>
        ))}
      </div>

      {/* How the enquiries are actually going */}
      <Insights data={insights} />

      {/* Secondary counts + quick links */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-[1.25rem] text-ink">More content</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {secondary.map((row) => (
              <li key={row.href}>
                <Link
                  href={row.href}
                  className="group flex items-center justify-between py-3.5 transition-colors"
                >
                  <span className="text-[0.92rem] text-slate-700 group-hover:text-accent-deep">
                    {row.label}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-heading text-[0.6rem] font-bold tracking-[0.16em] text-slate-400 uppercase">
                      {row.active} active
                    </span>
                    <span className="font-display text-[1.15rem] text-ink">
                      {row.total}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/admin/media"
                className="group flex items-center justify-between py-3.5"
              >
                <span className="text-[0.92rem] text-slate-700 group-hover:text-accent-deep">
                  Media library
                </span>
                <span className="font-display text-[1.15rem] text-ink">
                  {data.media}
                </span>
              </Link>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-[1.25rem] text-ink">
              Recent enquiries
            </h2>
            <Link
              href="/admin/enquiries"
              className="shrink-0 text-[0.82rem] font-medium text-accent-deep underline-offset-2 hover:underline"
            >
              View all
            </Link>
          </div>

          {data.newEnquiries > 0 && (
            <p className="mt-1 text-[0.86rem] text-amber-600">
              {data.newEnquiries} waiting for a reply.
            </p>
          )}

          {data.recent.length === 0 ? (
            <p className="mt-3 text-[0.88rem] leading-relaxed text-slate-500">
              Nothing yet. Details land here as soon as someone fills in the form
              on your site.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {data.recent.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/20 font-heading text-[0.78rem] font-bold text-accent-deep">
                    {e.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9rem] font-medium text-ink">
                      {e.name}
                    </span>
                    <span className="block truncate text-[0.8rem] text-slate-500">
                      {e.eventType || "No shoot type given"}
                    </span>
                  </span>
                  {e.status === "new" && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 font-heading text-[0.54rem] font-bold tracking-[0.1em] text-amber-700 uppercase">
                      New
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
