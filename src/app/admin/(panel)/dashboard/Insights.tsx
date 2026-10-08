import Link from "next/link";
import type { DayPoint, InsightData, Slice, Stage } from "./stats";

/* Drawing only. Every number here was worked out in stats.ts, straight from
   the enquiries in MongoDB — nothing on this page is counted in the browser.

   The charts are plain SVG and CSS rather than a charting library: the shapes
   are a line and a few bars, and a library would cost more than it saves. */

/* ─────────────────────────── The 30-day line ───────────────────────────── */

const TOP = 8;
const BOTTOM = 92;
const WIDTH = 300;

function Trend({ data }: { data: InsightData }) {
  const days = data.days;
  const x = (i: number) => (i / (days.length - 1)) * WIDTH;
  // height arrives as 0–100 of the busiest day; here it only becomes a y value
  const y = (d: DayPoint) => BOTTOM - (d.height / 100) * (BOTTOM - TOP);

  const line = days.map((d, i) => `${i ? "L" : "M"}${x(i)} ${y(d)}`).join(" ");
  const area = `${line} L${WIDTH} ${BOTTOM} L0 ${BOTTOM} Z`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} 100`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${data.total} enquiries over the ${days.length} days to ${data.lastLabel}`}
        className="h-[8.5rem] w-full"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* the line the busiest day touches, so the height of the curve means something */}
        <line
          x1="0"
          y1={TOP}
          x2={WIDTH}
          y2={TOP}
          strokeWidth="1"
          strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"
          className="stroke-slate-200"
        />
        <line
          x1="0"
          y1={BOTTOM}
          x2={WIDTH}
          y2={BOTTOM}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="stroke-slate-200"
        />

        <path d={area} fill="url(#trendFill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--color-accent-deep)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {data.peak && (
        <span
          aria-hidden
          style={{
            left: `${(data.peak.index / (days.length - 1)) * 100}%`,
            top: `${(y(days[data.peak.index]) / 100) * 8.5}rem`,
          }}
          className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-deep ring-[3px] ring-white"
        />
      )}

      <div className="mt-2 flex items-center justify-between gap-3 font-heading text-[0.62rem] tracking-[0.12em] text-slate-400 uppercase">
        <span>{data.firstLabel}</span>
        {data.peak && (
          <span className="truncate text-accent-deep">
            Busiest · {data.peak.label} · {data.peak.count}
          </span>
        )}
        <span>{data.lastLabel}</span>
      </div>
    </div>
  );
}

/* ───────────────────────────── Ranked bars ─────────────────────────────── */

function BarList({ rows, empty }: { rows: Slice[]; empty: string }) {
  if (rows.length === 0) {
    return (
      <p className="mt-3 text-[0.86rem] leading-relaxed text-slate-400">{empty}</p>
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[0.86rem] text-slate-600">
              {row.label}
            </span>
            <span className="font-display text-[1rem] text-ink tabular-nums">
              {row.count}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              style={{ width: `${row.share}%` }}
              className="h-full rounded-full bg-brand"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ──────────────────────────────── Pipeline ─────────────────────────────── */

/* Each stage carries its colour three ways: the dot in the legend, the slice in
   the ring, and the writing on the slice — a mid-green takes white lettering,
   a pale amber does not. */
const STAGE_COLOUR: Record<
  Stage["key"],
  { dot: string; slice: string; ink: string }
> = {
  new: { dot: "bg-amber-400", slice: "fill-amber-400", ink: "fill-ink/80" },
  contacted: { dot: "bg-sky-400", slice: "fill-sky-400", ink: "fill-ink/80" },
  confirmed: {
    dot: "bg-emerald-500",
    slice: "fill-emerald-500",
    ink: "fill-white",
  },
  closed: { dot: "bg-slate-300", slice: "fill-slate-300", ink: "fill-ink/70" },
  cancelled: { dot: "bg-rose-400", slice: "fill-rose-400", ink: "fill-white" },
};

const RING = { size: 190, outer: 88, inner: 52 };

/** A point on a circle. Turns run clockwise from the top, where a reader starts. */
function at(turn: number, radius: number) {
  const angle = turn * 2 * Math.PI - Math.PI / 2;
  const c = RING.size / 2;
  return [c + radius * Math.cos(angle), c + radius * Math.sin(angle)] as const;
}

function Ring({ stages, total }: { stages: Stage[]; total: number }) {
  const shown = stages.filter((s) => s.count > 0);

  /* Worked out before drawing: where a slice starts depends on every slice
     before it, which is a sum rather than something to carry through a loop. */
  const slices: (Stage & { d: string; lx: number; ly: number })[] = [];
  let walked = 0;
  for (const s of shown) {
    const from = walked;
    walked += s.share / 100;
    const [ox1, oy1] = at(from, RING.outer);
    const [ox2, oy2] = at(walked, RING.outer);
    const [ix2, iy2] = at(walked, RING.inner);
    const [ix1, iy1] = at(from, RING.inner);
    // the long way round, once a slice passes half the circle
    const big = s.share > 50 ? 1 : 0;
    const [lx, ly] = at((from + walked) / 2, (RING.outer + RING.inner) / 2);
    slices.push({
      ...s,
      lx,
      ly,
      d: [
        `M ${ox1} ${oy1}`,
        `A ${RING.outer} ${RING.outer} 0 ${big} 1 ${ox2} ${oy2}`,
        `L ${ix2} ${iy2}`,
        `A ${RING.inner} ${RING.inner} 0 ${big} 0 ${ix1} ${iy1}`,
        "Z",
      ].join(" "),
    });
  }

  const only = shown.length === 1 ? shown[0] : null;

  return (
    <div
      className="relative shrink-0"
      style={{ width: RING.size, height: RING.size }}
    >
      <svg
        viewBox={`0 0 ${RING.size} ${RING.size}`}
        role="img"
        aria-label={shown.map((s) => `${s.label}: ${s.count}`).join(", ")}
        className="size-full"
      >
        {/* One stage holding everything is a full turn, and an arc whose two
            ends meet draws nothing at all — so it becomes a plain ring. */}
        {only ? (
          <circle
            cx={RING.size / 2}
            cy={RING.size / 2}
            r={(RING.outer + RING.inner) / 2}
            fill="none"
            strokeWidth={RING.outer - RING.inner}
            className={STAGE_COLOUR[only.key].slice.replace("fill-", "stroke-")}
          />
        ) : (
          slices.map((s) => (
            <path
              key={s.key}
              d={s.d}
              // a hairline of the card's own white between the slices
              strokeWidth="2"
              className={`${STAGE_COLOUR[s.key].slice} stroke-white`}
            />
          ))
        )}

        {/* The share, not the name. Words only fit where the band runs across
            the page — at the sides it stands on end, and "Cancelled" ran out
            past the edge of the ring. Two or three characters always fit, and
            the names are right beside it in the legend. */}
        {slices.map((s) =>
          s.share >= 8 ? (
            <text
              key={`${s.key}-label`}
              x={s.lx}
              y={s.ly}
              textAnchor="middle"
              dominantBaseline="central"
              className={`${STAGE_COLOUR[s.key].ink} font-heading text-[0.6rem] font-bold tracking-[0.02em]`}
            >
              {Math.round(s.share)}%
            </text>
          ) : null,
        )}
      </svg>

      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-[1.7rem] leading-none text-ink tabular-nums">
            {total}
          </p>
          <p className="mt-1 font-heading text-[0.5rem] font-bold tracking-[0.16em] text-slate-400 uppercase">
            {total === 1 ? "enquiry" : "enquiries"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Pipeline({ data }: { data: InsightData }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[1.25rem] text-ink">Pipeline</h2>
        {data.pipelineTotal > 0 && (
          <p className="text-[0.84rem] text-slate-500">
            <span className="font-semibold text-emerald-600">
              {data.bookedPercent}%
            </span>{" "}
            booked
            {data.cancelled > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-rose-600">
                  {data.cancelled}
                </span>{" "}
                cancelled
              </>
            )}
          </p>
        )}
      </div>

      {data.pipelineTotal === 0 ? (
        <p className="mt-3 text-[0.86rem] leading-relaxed text-slate-400">
          Every enquiry moves through here: new, contacted, confirmed, closed.
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-5 sm:flex-nowrap sm:justify-start">
          <Ring stages={data.stages} total={data.pipelineTotal} />

          <ul className="min-w-[11rem] flex-1 space-y-2">
            {data.stages.map((s) => (
              <li key={s.key} className="flex items-center gap-2.5">
                <span
                  className={`size-2.5 shrink-0 rounded-full ${STAGE_COLOUR[s.key].dot}`}
                />
                <span className="flex-1 truncate text-[0.86rem] text-slate-600">
                  {s.label}
                </span>
                <span className="w-9 text-right font-mono text-[0.74rem] text-slate-400 tabular-nums">
                  {s.count > 0 ? `${Math.round(s.share)}%` : ""}
                </span>
                <span className="w-6 text-right font-display text-[1rem] text-ink tabular-nums">
                  {s.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────── The block ─────────────────────────────── */

function Delta({ data }: { data: InsightData }) {
  if (data.changePercent === null) {
    return data.total > 0 ? (
      <span className="text-[0.84rem] text-emerald-600">
        first enquiries in this window
      </span>
    ) : null;
  }
  const up = data.changePercent >= 0;
  return (
    <span
      className={`text-[0.84rem] ${up ? "text-emerald-600" : "text-accent"}`}
      title={`${data.total} in the last 30 days against ${data.previousTotal} in the 30 before`}
    >
      {up ? "▲" : "▼"} {Math.abs(data.changePercent)}% on the month before
    </span>
  );
}

export function Insights({ data }: { data: InsightData }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-display text-[1.25rem] text-ink">
            Enquiries over the last 30 days
          </h2>
          <Delta data={data} />
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
          <p>
            <span className="font-display text-[2.6rem] leading-none text-ink">
              {data.total}
            </span>
            <span className="ml-2 font-heading text-[0.6rem] font-bold tracking-[0.18em] text-slate-400 uppercase">
              in total
            </span>
          </p>
          <p>
            <span className="font-display text-[1.5rem] leading-none text-ink">
              {data.perWeek}
            </span>
            <span className="ml-2 font-heading text-[0.6rem] font-bold tracking-[0.18em] text-slate-400 uppercase">
              a week
            </span>
          </p>
          {data.needsChasing > 0 && (
            <Link
              href="/admin/enquiries"
              className="group"
              title="They filled in the form but never carried on to WhatsApp, so nothing will arrive from them on its own."
            >
              <span className="font-display text-[1.5rem] leading-none text-accent">
                {data.needsChasing}
              </span>
              <span className="ml-2 font-heading text-[0.6rem] font-bold tracking-[0.18em] text-accent uppercase group-hover:underline">
                need chasing
              </span>
            </Link>
          )}
        </div>

        <div className="mt-5">
          {data.total === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
              <p className="text-[0.88rem] text-slate-400">
                No enquiries in the last 30 days yet.
              </p>
              <p className="mx-auto mt-1 max-w-[44ch] text-[0.82rem] leading-relaxed text-slate-400">
                Once the form on your site starts filling up, the shape of your
                season shows here.
              </p>
            </div>
          ) : (
            <Trend data={data} />
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <Pipeline data={data} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-[1.25rem] text-ink">
          Which button they used
        </h2>
        <p className="mt-0.5 text-[0.82rem] text-slate-400">
          Where on the site the enquiry started.
        </p>
        <BarList
          rows={data.sources}
          empty="Nothing recorded yet. Every new enquiry remembers the button it came from."
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-[1.25rem] text-ink">What they ask for</h2>
        <p className="mt-0.5 text-[0.82rem] text-slate-400">
          The shoot people pick on the form.
        </p>
        <BarList rows={data.eventTypes} empty="No shoot types chosen yet." />
      </section>
    </div>
  );
}
