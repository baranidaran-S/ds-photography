import type { GalleryCategory } from "@/content/gallery";
import { FocusMark } from "@/components/ui/ornaments";

/* Under the gallery tiles: every kind of shoot gliding past in two rows, the English names one
   way and the traditional ones (Valaikappu, Manjal Neerattu Vizha…) the other. Pure CSS
   (globals.css → .gc-band): each row holds its list twice and slides by one copy, so it never
   ends. It pauses under the mouse, and holds still for reduced motion. A short list is repeated
   so a row always runs wider than the screen; with no kinds of shoot yet, there's no band. */
// a row has at least this many names in it
const FEWEST = 12;
const fill = (items: string[]) => {
  let out = items;
  while (out.length && out.length < FEWEST) out = [...out, ...items];
  return out;
};

export function KindsBand({ categories }: { categories: GalleryCategory[] }) {
  const names = categories.flatMap((c) => c.subs.map((s) => s.name));
  // "Valaikappu / Seemantham" becomes two; descriptions like "3, 6, 9 months" aren't names
  const traditional = categories.flatMap((c) =>
    c.subs.flatMap((s) => (s.local && !/\d/.test(s.local) ? s.local.split(" / ") : [])),
  );

  if (!names.length) return null;

  const row = (items: string[], className: string, reverse = false) => (
    <div className="gc-band-row overflow-hidden">
      <div className="gc-band-track" data-reverse={reverse ? "" : undefined}>
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy ? true : undefined} className="flex shrink-0 items-center">
            {fill(items).map((item, i) => (
              <li key={i} className="flex shrink-0 items-center">
                <span className={className}>{item}</span>
                <FocusMark className="mx-6 h-4 w-6 shrink-0 text-accent/80 sm:mx-9 sm:h-5 sm:w-7" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );

  return (
    <section aria-label="Every kind of shoot we cover" className="gc-band mt-20 lg:mt-28">
      <p className="mb-8 text-center font-mono text-[0.64rem] tracking-[0.22em] text-ink/50 uppercase">
        Every kind of shoot we cover
      </p>
      <div className="space-y-3 border-y border-ink/10 py-7 sm:space-y-4 sm:py-9">
        {row(names, "font-display text-[clamp(1.7rem,3.8vw,3.4rem)] leading-[1.15] whitespace-nowrap text-ink/85")}
        {traditional.length > 0 &&
          row(
            traditional,
            "foil-deep font-display text-[clamp(1.35rem,2.8vw,2.5rem)] leading-[1.2] whitespace-nowrap",
            true,
          )}
      </div>
    </section>
  );
}
