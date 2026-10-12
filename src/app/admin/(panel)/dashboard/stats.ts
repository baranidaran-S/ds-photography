import { connectDB } from "@/lib/db";
import { Enquiry } from "@/models";
import { sourceLabel } from "../../source";

/* Every figure on the dashboard is worked out here, from the enquiries in
   MongoDB. Nothing is hard-coded and nothing is counted in the browser: the
   charts receive finished numbers and only draw them. */

export type DayPoint = {
  /** YYYY-MM-DD in the studio's own calendar */
  date: string;
  /** "8 Sep", formatted once here rather than in the chart */
  label: string;
  count: number;
  /** 0–100, this day against the busiest one — the height of the curve */
  height: number;
};

export type Slice = {
  label: string;
  count: number;
  /** 0–100, against the largest row — the width of the bar */
  share: number;
};

export type Stage = {
  key: "new" | "contacted" | "confirmed" | "closed" | "cancelled";
  label: string;
  count: number;
  /** 0–100 of every enquiry — the width of the segment */
  share: number;
};

export type InsightData = {
  days: DayPoint[];
  firstLabel: string;
  lastLabel: string;
  /** the busiest day in the window, or null while nothing has come in */
  peak: { label: string; count: number; index: number } | null;
  total: number;
  previousTotal: number;
  /** growth against the previous thirty days; null when there is no baseline */
  changePercent: number | null;
  /** average enquiries a week across the window, to one decimal */
  perWeek: string;
  sources: Slice[];
  eventTypes: Slice[];
  stages: Stage[];
  pipelineTotal: number;
  bookedPercent: number;
  needsChasing: number;
  /** leads that never went ahead — worth watching next to the booked share */
  cancelled: number;
};

/* The studio reads these numbers against its own day: an enquiry sent at eleven
   at night belongs to that evening, not to the next morning in UTC. */
const TIMEZONE = "Asia/Kolkata";
const WINDOW = 30;

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const STAGES: { key: Stage["key"]; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "confirmed", label: "Confirmed" },
  { key: "closed", label: "Closed" },
  { key: "cancelled", label: "Cancelled" },
];

/** YYYY-MM-DD for today where the studio is, then counted backwards from there. */
function calendarDays(count: number, skip = 0) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = today.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);

  const keys: string[] = [];
  for (let i = count + skip - 1; i >= skip; i--) {
    keys.push(new Date(start - i * 86_400_000).toISOString().slice(0, 10));
  }
  return keys;
}

/** Ranked rows with the bar widths already worked out. */
function toSlices(rows: { _id: unknown; n: unknown }[], name: (id: string) => string) {
  const counts = rows.map((r) => ({
    label: name(String(r._id)),
    count: Number(r.n),
  }));
  const max = Math.max(1, ...counts.map((c) => c.count));
  return counts.map((c) => ({ ...c, share: (c.count / max) * 100 }));
}

export async function loadInsights(): Promise<InsightData> {
  // runs beside loadCounts(), so it opens the connection rather than assuming one
  await connectDB();

  // two windows, so this month can be set against the one before it
  const since = new Date(Date.now() - WINDOW * 2 * 86_400_000);

  const [buckets, sourceRows, typeRows, statusRows, needsChasing, cancelled] =
    await Promise.all([
      Enquiry.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: TIMEZONE,
              },
            },
            n: { $sum: 1 },
          },
        },
      ]),
      Enquiry.aggregate([
        { $match: { source: { $nin: ["", null] } } },
        { $group: { _id: "$source", n: { $sum: 1 } } },
        { $sort: { n: -1 } },
        { $limit: 6 },
      ]),
      Enquiry.aggregate([
        { $match: { eventType: { $nin: ["", null] } } },
        { $group: { _id: "$eventType", n: { $sum: 1 } } },
        { $sort: { n: -1 } },
        { $limit: 6 },
      ]),
      Enquiry.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      /* A lead that never carried on to WhatsApp will not message you, so it is
         waiting on a call. Once it is confirmed or closed that no longer holds. */
      Enquiry.countDocuments({
        openedWhatsapp: false,
        status: { $in: ["new", "contacted"] },
      }),
      Enquiry.countDocuments({ status: "cancelled" }),
    ]);

  /* ── the 30-day curve ── */
  const counts = new Map<string, number>(
    buckets.map((b) => [String(b._id), Number(b.n)]),
  );
  const window = calendarDays(WINDOW).map((date) => ({
    date,
    count: counts.get(date) ?? 0,
  }));
  const busiest = Math.max(...window.map((d) => d.count));

  const days: DayPoint[] = window.map((d) => ({
    ...d,
    label: DAY_LABEL.format(new Date(`${d.date}T00:00:00Z`)),
    height: busiest === 0 ? 0 : (d.count / busiest) * 100,
  }));

  // ties go to the most recent day — that is the one worth looking at
  let peakIndex = -1;
  days.forEach((d, i) => {
    if (busiest > 0 && d.count === busiest) peakIndex = i;
  });

  const total = days.reduce((sum, d) => sum + d.count, 0);
  const previousTotal = calendarDays(WINDOW, WINDOW).reduce(
    (sum, date) => sum + (counts.get(date) ?? 0),
    0,
  );

  /* ── the pipeline ── */
  const byStatus = new Map<string, number>(
    statusRows.map((r) => [String(r._id), Number(r.n)]),
  );
  const pipelineTotal = STAGES.reduce(
    (sum, s) => sum + (byStatus.get(s.key) ?? 0),
    0,
  );
  const stages: Stage[] = STAGES.map((s) => {
    const count = byStatus.get(s.key) ?? 0;
    return {
      ...s,
      count,
      share: pipelineTotal === 0 ? 0 : (count / pipelineTotal) * 100,
    };
  });
  const booked = byStatus.get("confirmed") ?? 0;

  return {
    days,
    firstLabel: days[0].label,
    lastLabel: days[days.length - 1].label,
    peak:
      peakIndex === -1
        ? null
        : {
            label: days[peakIndex].label,
            count: days[peakIndex].count,
            index: peakIndex,
          },
    total,
    previousTotal,
    changePercent:
      previousTotal === 0
        ? null
        : Math.round(((total - previousTotal) / previousTotal) * 100),
    perWeek: (total / (WINDOW / 7)).toFixed(1),
    sources: toSlices(sourceRows, sourceLabel),
    eventTypes: toSlices(typeRows, (id) => id),
    stages,
    pipelineTotal,
    bookedPercent:
      pipelineTotal === 0 ? 0 : Math.round((booked / pipelineTotal) * 100),
    needsChasing,
    cancelled,
  };
}
