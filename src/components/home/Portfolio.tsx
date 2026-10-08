"use client";

import Image, { getImageProps } from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type Lenis from "lenis";
import { useLenis } from "lenis/react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import type { Story } from "@/content/site";
import type { Photo } from "@/content/photos";
import { useEnquiry, useSite } from "@/components/providers/SiteProvider";
import { ArrowIcon, ChatIcon } from "@/components/ui/icons";
import { LotusMark } from "@/components/ui/ornaments";

const pad = (n: number) => String(n).padStart(2, "0");

export type AlbumCover = Photo & { showTitle?: boolean };

/** Every word in this section, from the SEO-free admin copy (Portfolio Stories). */
export type PortfolioCopy = {
  eyebrow: string;
  title: string;
  titleFoil: string;
  intro: string;
  albumBrand: string;
  albumTitle: string;
  albumVolume: string;
  endEyebrow: string;
  endTitle: string;
  endText: string;
  reservedLabel: string;
  reservedTitle: string;
};

// A turning paper page is drawn as this many narrow strips hinged together, so it can bend
const CURL_STRIPS = 8;

// Bending pages are added in the browser only, and not when the visitor prefers less motion
const REDUCE = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (onChange: () => void) => {
  const m = window.matchMedia(REDUCE);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
};
const motionAllowed = () => !window.matchMedia(REDUCE).matches;

const spreadLabel = (k: number, stories: Story[]) => {
  const total = stories.length;
  if (k === 0)
    return { index: "Our albums", title: "Scroll to turn the pages" };
  if (k > total)
    return { index: "The last page", title: "Your story could be next" };
  const s = stories[k - 1];
  return {
    index: `${pad(k)} / ${pad(total)}`,
    title: `${s.category} · ${s.title}`,
  };
};

type PageProps = { story: Story; index: number };

/** Edge-to-edge photo, like a flush-mount album page */
function PhotoPage({ story }: PageProps) {
  const { cover } = story;
  return (
    <div className="pf-paper">
      <Image
        src={cover.src}
        alt={cover.alt}
        fill
        sizes="(orientation: landscape) 46vw, 92vw"
        className="pf-photo object-cover [object-position:var(--pos-m)] landscape:[object-position:var(--pos)]"
        style={
          {
            "--pos": cover.position ?? "50% 50%",
            "--pos-m": cover.mobilePosition ?? cover.position ?? "50% 50%",
          } as React.CSSProperties
        }
      />
    </div>
  );
}

/** Couple names with the "&" in maroon */
function Names({ title }: { title: string }) {
  const [first, second] = title.split(" & ");
  if (!second) return title;
  return (
    <>
      {first} <span className="text-accent-deep">&amp;</span> {second}
    </>
  );
}

/** Names, place and date, a line about the day and two smaller prints */
function StoryPage({ story, index }: PageProps) {
  return (
    <div className="pf-paper flex flex-col p-[5.5cqmin] landscape:p-[8cqw]">
      <p className="flex items-center gap-3 font-heading text-[clamp(0.6rem,2.6cqw,0.84rem)] font-bold tracking-[0.26em] text-accent-deep uppercase">
        <span className="text-accent tabular-nums">{pad(index + 1)}</span>
        <span aria-hidden className="h-px w-[7cqw] bg-accent/60" />
        {story.category}
      </p>
      <h3 className="mt-[2.5cqmin] font-display text-[clamp(1.5rem,10cqw,3.5rem)] leading-[1.05] text-ink landscape:mt-[3cqw]">
        <Names title={story.title} />
      </h3>
      <p className="mt-[1.5cqmin] font-heading text-[clamp(0.6rem,2.5cqw,0.8rem)] font-semibold tracking-[0.2em] text-ink/80 uppercase landscape:mt-[2cqw]">
        {story.place} <span className="text-accent">·</span> {story.date}
      </p>
      <p className="mt-[3.5cqw] hidden text-[clamp(0.8rem,3.3cqw,1.08rem)] leading-[1.7] text-pretty text-ink/85 @[22rem]:block">
        {story.note}
      </p>
      {/* Side by side the prints sit at the foot of the page, the second a little lower; when the
          text leaves less room they shrink (container query on the space left below the text) */}
      <div className="mt-[3.5cqmin] grid min-h-0 flex-1 grid-cols-2 gap-[3cqw] landscape:mt-[5cqw] landscape:flex landscape:items-end landscape:gap-[4cqw] landscape:[container-type:size]">
        {story.photos.map((p, k) => (
          <div
            key={p.src}
            className={`relative h-full overflow-hidden shadow-[0_1px_2px_rgb(0_0_0/0.18),0_8px_18px_-12px_rgb(0_0_0/0.5)] landscape:aspect-square landscape:h-auto landscape:max-w-[calc(100cqh-6cqw)] landscape:flex-1 ${k ? "" : "landscape:mb-[6cqw]"}`}
          >
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(orientation: landscape) 22vw, 46vw"
              className="object-cover"
              style={{ objectPosition: p.position }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type SideProps = { front: React.ReactNode; back: React.ReactNode };

/** One strip of a turning page: its slice of both sides, and the next strip hinged to its far edge */
function CurlStrip({ k, front, back }: SideProps & { k: number }) {
  return (
    <div className="pf-strip">
      <div className="pf-slice">
        <div
          className="pf-slice-page"
          style={{ "--i": k } as React.CSSProperties}
        >
          {front}
        </div>
        <span className="pf-slice-shade" />
      </div>
      <div className="pf-slice pf-slice-back">
        <div
          className="pf-slice-page"
          style={{ "--i": CURL_STRIPS - 1 - k } as React.CSSProperties}
        >
          {back}
        </div>
        <span className="pf-slice-shade" />
      </div>
      {k + 1 < CURL_STRIPS && <CurlStrip k={k + 1} front={front} back={back} />}
    </div>
  );
}

/** The bending copy of a paper page, shown only while it turns (driven by Portfolio below) */
function Curl({ front, back }: SideProps) {
  return (
    <div
      aria-hidden
      inert
      className="pf-curl"
      style={{ "--n": CURL_STRIPS } as React.CSSProperties}
    >
      <span className="pf-cast pf-cast-r" />
      <span className="pf-cast pf-cast-l" />
      <CurlStrip k={0} front={front} back={back} />
    </div>
  );
}

function CoverArt({ cover, copy }: { cover: AlbumCover; copy: PortfolioCopy }) {
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden rounded-[7px] text-center">
      {cover.src && (
        <Image
          src={cover.src}
          alt=""
          fill
          sizes="(orientation: landscape) 46vw, 92vw"
          className="object-cover"
          style={{ objectPosition: cover.position }}
        />
      )}
      {/* hinge: the groove beside the spine where the cover bends */}
      <span
        aria-hidden
        className={`absolute inset-x-0 h-[2px] bg-black/35 shadow-[0_1px_0_rgb(255_255_255/0.09)] landscape:inset-x-auto landscape:inset-y-0 landscape:top-0 landscape:h-auto landscape:w-[2px] landscape:shadow-[1px_0_0_rgb(255_255_255/0.09)] ${
          cover.src
            ? "top-[1.8%] landscape:left-[1.8%]"
            : "top-[4.5%] landscape:left-[4.5%]"
        }`}
      />
      {cover.showTitle && (
        <>
          <div aria-hidden className="pf-stamp absolute inset-0">
            <span className="absolute inset-[5cqmin] border border-brand/60" />
            <span className="absolute inset-[6.6cqmin] border border-brand/30" />
          </div>
          <div className="pf-stamp relative flex flex-col items-center px-[8cqmin]">
            <LotusMark className="h-[8cqmin] w-[11cqmin] text-brand" />
            <p className="mt-[3.5cqmin] font-heading text-[clamp(0.5rem,2.6cqmin,0.8rem)] font-semibold tracking-[0.42em] text-brand-light/80 uppercase">
              {copy.albumBrand}
            </p>
            <p className="foil mt-[2.5cqmin] font-display text-[13cqmin] leading-[1.1]">
              {copy.albumTitle}
            </p>
            <span
              aria-hidden
              className="mt-[3.5cqmin] h-px w-[16cqmin] bg-brand/60"
            />
            <p className="mt-[3cqmin] font-heading text-[clamp(0.5rem,2.3cqmin,0.72rem)] tracking-[0.36em] text-brand-light/65 uppercase">
              {copy.albumVolume}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/** Last spread, left page: the invitation */
function EndPage({
  enquire,
  copy,
  book,
}: {
  enquire: (i: { source: string }) => void;
  copy: PortfolioCopy;
  /** the site-wide booking label, so all four buttons read the same */
  book: string;
}) {
  return (
    <div className="pf-paper flex flex-col items-center justify-center p-[7cqmin] text-center">
      <LotusMark className="h-[6cqmin] w-[9cqmin] text-accent" />
      <p className="mt-[3cqmin] font-heading text-[clamp(0.55rem,2.4cqmin,0.72rem)] font-semibold tracking-[0.3em] text-accent-deep uppercase">
        {copy.endEyebrow}
      </p>
      <h3 className="mt-[2.5cqmin] font-display text-[clamp(1.4rem,8.5cqmin,2.9rem)] leading-[1.08] text-balance text-ink">
        {copy.endTitle}
      </h3>
      <p className="mt-[3cqmin] hidden max-w-[30ch] text-[clamp(0.75rem,3cqw,0.98rem)] leading-[1.75] text-ink/70 @[22rem]:block">
        {copy.endText}
      </p>
      <button
        type="button"
        onClick={() => enquire({ source: "portfolio" })}
        className="btn-brand btn-sm mt-[5cqmin]"
      >
        <ChatIcon className="size-4" />
        {book}
      </button>
    </div>
  );
}

/** Last spread, right page: an empty print slot waiting for a photo */
function ReservedPage({ copy }: { copy: PortfolioCopy }) {
  return (
    <div className="pf-paper grid place-items-center p-[9cqmin]">
      <div className="relative grid size-full place-items-center border border-dashed border-ink/20 bg-ink/[0.025]">
        <span aria-hidden className="pf-corner top-0 left-0" />
        <span aria-hidden className="pf-corner top-0 right-0 rotate-90" />
        <span aria-hidden className="pf-corner right-0 bottom-0 rotate-180" />
        <span aria-hidden className="pf-corner bottom-0 left-0 -rotate-90" />
        <div className="px-[6cqmin] text-center">
          <p className="font-heading text-[clamp(0.5rem,2.3cqmin,0.7rem)] tracking-[0.3em] text-ink/45 uppercase">
            {copy.reservedLabel}
          </p>
          <p className="mt-[2cqmin] font-display text-[clamp(1.2rem,7cqmin,2.4rem)] leading-[1.1] text-ink/60">
            {copy.reservedTitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Portfolio({
  stories,
  albumCover: cover,
  copy,
}: {
  stories: Story[];
  albumCover: AlbumCover;
  copy: PortfolioCopy;
}) {
  const root = useRef<HTMLElement>(null);
  const enquire = useEnquiry();
  const { site } = useSite();
  const total = stories.length;
  // Spreads: 0 = closed cover, 1..total = one story each, total + 1 = "your story next"
  const TURNS = total + 1;
  // Scroll steps while pinned: one per turn, plus half a step so the last spread stays a moment
  const STEPS = TURNS + 0.5;
  const coverTexture = cover.src
    ? getImageProps({
        src: cover.src,
        alt: "",
        // a texture for the board edges: about 1200px is plenty (it is softened by the leather shading)
        width: 600,
        height: 600,
        quality: 75,
      }).props.src
    : null;
  const nav = useRef<(step: number) => void>(() => {});
  const lenisRef = useRef<Lenis | undefined>(undefined);
  const lenis = useLenis();
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);
  const canCurl = useSyncExternalStore(
    subscribeMotion,
    motionAllowed,
    () => false,
  );
  // The open spread: only the two pages that can turn from it keep a bending copy, which keeps the
  // page light (each copy repeats a whole page eight times)
  const [spread, setSpread] = useState(0);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const stage = q<HTMLElement>(".pf-stage")[0];
      const book = q<HTMLElement>(".pf-book")[0];
      const leaves = q<HTMLElement>(".pf-leaf");
      const faces = q<HTMLElement>(".pf-face");
      const face = (i: number, side: "front" | "back") =>
        leaves[i]?.querySelector<HTMLElement>(`:scope > .pf-${side}`) ?? null;
      const shade = (i: number, side: "front" | "back") =>
        face(i, side)?.querySelector<HTMLElement>(":scope > .pf-shade") ?? null;
      const ui = {
        index: q<HTMLElement>(".pf-nav-index")[0],
        title: q<HTMLElement>(".pf-nav-title")[0],
        prev: q<HTMLButtonElement>(".pf-prev")[0],
        next: q<HTMLButtonElement>(".pf-next")[0],
        fill: q<HTMLElement>(".pf-progress-fill")[0],
      };

      /* ── Entrance: heading rises, the album is set down ── */
      if (!reduce) {
        const split = SplitText.create(q(".pf-title"), {
          type: "words",
          mask: "words",
          ignore: q(".pf-foil-mask"),
        });
        gsap.set(split.masks, {
          paddingBottom: "0.12em",
          marginBottom: "-0.12em",
        });
        gsap
          .timeline({
            scrollTrigger: {
              trigger: q(".pf-head")[0],
              start: "top 80%",
              once: true,
            },
            defaults: { ease: "expo.out" },
          })
          .from(q(".pf-eyebrow"), { autoAlpha: 0, y: 16, duration: 0.9 }, 0)
          .from(
            split.words,
            { yPercent: 115, duration: 1.1, stagger: 0.07 },
            0.1,
          )
          .from(q(".pf-foil"), { yPercent: 115, duration: 1.1 }, 0.38)
          .from(q(".pf-intro"), { autoAlpha: 0, y: 20, duration: 1 }, 0.4);

        gsap
          .timeline({
            scrollTrigger: { trigger: stage, start: "top 75%", once: true },
            defaults: { ease: "expo.out" },
          })
          .fromTo(
            q(".pf-album"),
            { autoAlpha: 0, y: 90, scale: 0.94 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 1.4 },
            0,
          )
          .from(q(".pf-nav"), { autoAlpha: 0, y: 20, duration: 1 }, 0.5);
      }

      /* ── Page turning ── */
      const mm = gsap.matchMedia();
      mm.add(
        { wide: "(orientation: landscape)", narrow: "(orientation: portrait)" },
        (ctx, contextSafe) => {
          const wide = Boolean(ctx.conditions?.wide);

          // One unit of time per page turn; time k = spread k is open
          const tl = gsap.timeline({
            paused: true,
            defaults: { ease: "none" },
          });
          // The closed album sits centred, then slides over as the cover opens
          tl.fromTo(
            book,
            wide ? { xPercent: -25 } : { yPercent: -25 },
            { xPercent: 0, yPercent: 0, duration: 1 },
            0,
          );
          // The cover is a stiff board: it swings over in one piece, darkening as it lifts away from
          // the light and brightening as it lands
          tl.set(leaves[0], { zIndex: 100 }, 0)
            .to(
              leaves[0],
              wide
                ? { rotationY: -180, duration: 1 }
                : { rotationX: 180, duration: 1 },
              0,
            )
            .fromTo(
              shade(0, "front"),
              { opacity: 0 },
              { opacity: 0.28, duration: 0.5 },
              0,
            )
            .fromTo(
              shade(0, "back"),
              { opacity: 0.28 },
              { opacity: 0, duration: 0.5, immediateRender: false },
              0.5,
            )
            .set(leaves[0], { zIndex: 1 }, 1);
          // Paper pages: on top while turning, then onto the left-hand pile (the turn itself is bend())
          for (let i = 1; i < TURNS; i++) {
            tl.set(leaves[i], { zIndex: 100 }, i).set(
              leaves[i],
              { zIndex: i + 1 },
              i + 1,
            );
          }

          /* ── Paper pages bend as they turn ──
             While a page turns, its flat leaf hides and its strips (Curl) take over: the free edge lifts
             first and leads, the part by the spine follows, so the page curves like real paper. Each
             strip darkens as it turns away from the light, and the lifted page casts a soft shadow
             into the fold. Resting pages are the flat leaf again. */
          type Rig = {
            strips: HTMLElement[];
            shades: HTMLElement[][];
            casts: (HTMLElement | null)[];
          };
          const rigs: Rig[] = [];
          const rigOf = (i: number) => {
            // a page's bending copy comes and goes with the open spread, so check it's still there
            if (rigs[i]?.strips[0]?.isConnected) return rigs[i];
            const leaf = leaves[i];
            const strips = Array.from(
              leaf.querySelectorAll<HTMLElement>(":scope > .pf-curl .pf-strip"),
            );
            rigs[i] = {
              strips,
              shades: strips.map((s) =>
                Array.from(
                  s.querySelectorAll<HTMLElement>(
                    ":scope > .pf-slice > .pf-slice-shade",
                  ),
                ),
              ),
              casts: [
                leaf.querySelector<HTMLElement>(":scope > .pf-curl > .pf-cast-r"),
                leaf.querySelector<HTMLElement>(":scope > .pf-curl > .pf-cast-l"),
              ],
            };
            return rigs[i];
          };
          const turnStiff = (leaf: HTMLElement, deg: number) =>
            gsap.set(leaf, wide ? { rotationY: -deg } : { rotationX: deg });
          const dark = (deg: number) =>
            (0.46 * (1 - Math.abs(Math.cos((deg * Math.PI) / 180)))).toFixed(3);

          const lastP: number[] = [];
          const bend = (i: number, p: number) => {
            if (lastP[i] === p) return;
            lastP[i] = p;
            const leaf = leaves[i];
            const { strips, shades, casts } = rigOf(i);
            if (!strips.length || p <= 0 || p >= 1) {
              leaf.removeAttribute("data-curl");
              // without strips (less motion) the page simply turns in one piece
              turnStiff(leaf, strips.length ? (p >= 1 ? 180 : 0) : 180 * p);
              return;
            }
            if (!leaf.hasAttribute("data-curl")) {
              leaf.setAttribute("data-curl", "");
              turnStiff(leaf, 0);
            }
            // angle of the paper at the spine and at the free edge; strips in between curve smoothly
            const spine = 180 * p ** 1.6;
            const edge = 180 * (1 - (1 - p) ** 1.6);
            const last = strips.length - 1;
            const angle = (k: number) =>
              spine +
              (edge - spine) * Math.min(1, Math.max(0, k / last)) ** 1.5;
            let prev = 0;
            strips.forEach((strip, k) => {
              const a = angle(k);
              // each strip turns relative to the one it hangs from
              strip.style.transform = wide
                ? `rotateY(${(prev - a).toFixed(2)}deg)`
                : `rotateX(${(a - prev).toFixed(2)}deg)`;
              prev = a;
              const [front, back] = shades[k];
              const near = dark(angle(k - 0.5));
              const far = dark(angle(k + 0.5));
              front.style.setProperty("--s0", near);
              front.style.setProperty("--s1", far);
              back.style.setProperty("--s0", far);
              back.style.setProperty("--s1", near);
            });
            const lift = Math.sin(Math.PI * p);
            const [castR, castL] = casts;
            if (castR) castR.style.opacity = String(Math.min(1, lift * (1 - p) * 1.7));
            if (castL) castL.style.opacity = String(Math.min(1, lift * p * 1.7));
          };
          const bendAll = () => {
            const t = tl.time();
            for (let i = 1; i < TURNS; i++)
              bend(i, gsap.utils.clamp(0, 1, t - i));
          };
          tl.eventCallback("onUpdate", bendAll);

          // The fold appears once the cover is open; the page block on the near edge moves from
          // the right-hand pile to the left-hand pile as pages turn (board + one line per page)
          const PAGE = wide ? 1.8 : 1.4;
          const BOARD = 3;
          const pages = leaves.length - 1;
          tl.fromTo(
            q(".pf-spine"),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.5 },
            0.5,
          )
            .fromTo(
              q(".pf-edge-r"),
              { height: BOARD * 2 + pages * PAGE },
              { height: BOARD + pages * PAGE, duration: 1 },
              0,
            )
            .fromTo(
              q(".pf-edge-l"),
              // hidden while the album is shut; the cover's board edge appears as it opens
              { height: 0, autoAlpha: 0 },
              { height: BOARD, autoAlpha: 1, duration: 1 },
              0,
            );
          for (let i = 1; i < TURNS; i++) {
            tl.to(
              q(".pf-edge-r"),
              { height: BOARD + (pages - i) * PAGE, duration: 1 },
              i,
            ).to(q(".pf-edge-l"), { height: BOARD + i * PAGE, duration: 1 }, i);
          }

          let state = -1;
          const show = contextSafe!((target: number, instant = false) => {
            const k = gsap.utils.clamp(0, TURNS, target);
            if (k === state) return;
            const first = state === -1;
            state = k;
            setSpread(k);

            if (instant || reduce) {
              tl.time(k);
              bendAll();
            } else {
              // several pages at once riffle through quickly
              const d = Math.abs(k - tl.time());
              gsap.to(tl, {
                time: k,
                duration: 0.9 + 0.22 * Math.max(0, d - 1),
                ease: d > 1.2 ? "power1.inOut" : "power2.inOut",
                overwrite: true,
              });
            }

            // Only the open spread can be focused or read out
            const open = [face(k - 1, "back"), face(k, "front")];
            faces.forEach((f) => (f.inert = !open.includes(f)));

            const label = spreadLabel(k, stories);
            ui.index.textContent = label.index;
            ui.title.textContent = label.title;
            ui.prev.disabled = k === 0;
            ui.next.disabled = k === TURNS;
            gsap.to(ui.fill, {
              scaleX: k / TURNS,
              duration: instant || reduce ? 0 : 0.8,
              ease: "power2.out",
            });

            if (first || instant || reduce) return;
            gsap.fromTo(
              [ui.index, ui.title],
              { autoAlpha: 0, y: 10 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.06,
                ease: "expo.out",
              },
            );
            // the newly opened photos settle into place
            open.forEach(
              (f) =>
                f &&
                gsap.fromTo(
                  f.querySelectorAll(".pf-photo"),
                  { scale: 1.12 },
                  { scale: 1, duration: 1.8, delay: 0.2, ease: "power3.out" },
                ),
            );
          });

          if (reduce) {
            // No scroll-driven turning: open on the first story and let the arrows flip pages
            show(1, true);
            nav.current = (step) => show(state + step, true);
            return;
          }

          show(0, true);
          const st = ScrollTrigger.create({
            trigger: stage,
            start: "top top",
            end: () => `+=${STEPS * window.innerHeight * 0.5}`,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => show(Math.round(self.progress * STEPS)),
            onRefresh: (self) => show(Math.round(self.progress * STEPS), true),
          });

          // Arrows scroll to the matching point of the pinned section, so scroll and pages stay in step
          nav.current = (step) => {
            const k = gsap.utils.clamp(0, TURNS, state + step);
            const y = st.start + (k / STEPS) * (st.end - st.start);
            if (lenisRef.current)
              lenisRef.current.scrollTo(y, {
                duration: 0.9 + 0.15 * Math.abs(k - state),
              });
            else window.scrollTo({ top: y, behavior: "smooth" });
          };

          return () => leaves.forEach((l) => l.removeAttribute("data-curl"));
        },
      );
    },
    { scope: root },
  );

  const leftPage = (s: number) =>
    s % 2 === 0 ? (
      <PhotoPage story={stories[s]} index={s} />
    ) : (
      <StoryPage story={stories[s]} index={s} />
    );
  const rightPage = (s: number) =>
    s % 2 === 0 ? (
      <StoryPage story={stories[s]} index={s} />
    ) : (
      <PhotoPage story={stories[s]} index={s} />
    );

  // Leaf i: front = right page of spread i, back = left page of spread i + 1
  const leaves: { front: React.ReactNode; back?: React.ReactNode }[] = [
    { front: <CoverArt cover={cover} copy={copy} />, back: leftPage(0) },
    ...stories.map((_, s) => ({
      front: rightPage(s),
      back:
        s + 1 < total ? (
          leftPage(s + 1)
        ) : (
          <EndPage enquire={enquire} copy={copy} book={site.bookLabel} />
        ),
    })),
    { front: <ReservedPage copy={copy} /> },
  ];
  const intro = spreadLabel(0, stories);

  return (
    <section
      id="portfolio"
      ref={root}
      aria-labelledby="portfolio-title"
      className="relative bg-cream text-ink"
    >
      {/* Heading */}
      <div className="pf-head mx-auto grid max-w-[1320px] items-end gap-6 px-5 pt-24 sm:px-8 lg:grid-cols-[1.25fr_1fr] lg:px-12 lg:pt-32">
        <div>
          <p className="pf-eyebrow mb-5 flex items-center gap-3 font-heading text-[0.72rem] font-semibold tracking-[0.3em] text-accent-deep uppercase">
            <LotusMark className="h-4 w-6 text-accent" />
            {copy.eyebrow}
          </p>
          <h2
            id="portfolio-title"
            className="pf-title font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.06]"
          >
            {copy.title}{" "}
            <span className="pf-foil-mask -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
              <span className="pf-foil foil-deep inline-block">
                {copy.titleFoil}
              </span>
            </span>
          </h2>
        </div>
        <p className="pf-intro max-w-[44ch] text-[1rem] leading-[1.8] text-ink/65 lg:justify-self-end">
          {copy.intro}
        </p>
      </div>

      {/* Album: pinned while its pages turn */}
      <div
        data-nav-view
        className="pf-stage relative flex h-svh flex-col items-center justify-center px-5 sm:px-8"
      >
        {/* Backdrop: soft studio light with window-blind shadows slowly drifting across */}
        <div
          aria-hidden
          className="pf-backdrop pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="pf-window absolute inset-0">
            <div className="pf-blinds absolute -inset-[15%]" />
          </div>
          <div className="pf-grain absolute inset-0" />
        </div>

        <div
          className="pf-album"
          data-cover={coverTexture ? "" : undefined}
          style={
            coverTexture
              ? ({
                  "--cover-img": `url("${coverTexture}")`,
                } as React.CSSProperties)
              : undefined
          }
          data-reveal
          role="group"
          aria-roledescription="photo album"
          aria-label="Recent stories"
        >
          <div className="pf-book">
            <div className="pf-board" />
            <div aria-hidden className="pf-edge pf-edge-l" />
            <div aria-hidden className="pf-edge pf-edge-r" />
            <div aria-hidden className="pf-spine" />
            {leaves.map((leaf, i) => (
              <div
                key={i}
                className={`pf-leaf ${i === 0 ? "pf-leaf-cover" : ""}`}
                style={{ zIndex: leaves.length - i }}
              >
                <div className="pf-face pf-front">
                  {leaf.front}
                  <span aria-hidden className="pf-shade" />
                </div>
                {leaf.back && (
                  <div className="pf-face pf-back">
                    {leaf.back}
                    <span aria-hidden className="pf-shade" />
                  </div>
                )}
                {/* paper pages (not the stiff cover) get a bending copy for turning: only the page
                    that turns forward from the open spread (i = spread) and the one that turns back
                    (i = spread − 1); any other page turning in a quick flick turns stiffly */}
                {canCurl &&
                  i > 0 &&
                  leaf.back &&
                  (i === spread || i === spread - 1) && (
                    <Curl front={leaf.front} back={leaf.back} />
                  )}
              </div>
            ))}
          </div>
        </div>

        {/* Page controls */}
        <div className="pf-nav relative flex w-full max-w-[34rem] items-center gap-4">
          <button
            type="button"
            onClick={() => nav.current(-1)}
            aria-label="Previous page"
            className="pf-prev grid size-11 shrink-0 place-items-center rounded-full border border-ink/20 text-ink transition duration-500 hover:border-accent-deep hover:bg-accent-deep hover:text-cream disabled:pointer-events-none disabled:opacity-30"
          >
            <ArrowIcon className="size-4 rotate-180" />
          </button>
          <div className="min-w-0 flex-1 text-center" aria-live="polite">
            <p className="pf-nav-index font-mono text-[0.66rem] tracking-[0.14em] text-ink/50 uppercase tabular-nums">
              {intro.index}
            </p>
            <p className="pf-nav-title mt-1 truncate font-heading text-[0.72rem] font-semibold tracking-[0.16em] text-ink uppercase sm:text-[0.78rem]">
              {intro.title}
            </p>
            <span
              aria-hidden
              className="relative mx-auto mt-3 block h-px w-full max-w-[16rem] overflow-hidden bg-ink/15"
            >
              <span className="pf-progress-fill absolute inset-0 origin-left scale-x-0 bg-accent" />
            </span>
          </div>
          <button
            type="button"
            onClick={() => nav.current(1)}
            aria-label="Next page"
            className="pf-next grid size-11 shrink-0 place-items-center rounded-full border border-ink/20 text-ink transition duration-500 hover:border-accent-deep hover:bg-accent-deep hover:text-cream disabled:pointer-events-none disabled:opacity-30"
          >
            <ArrowIcon className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
