import sharp from "sharp";

/* Looks at a blog cover once it's uploaded, for the two things the admin would otherwise have to
   set by hand: its focus point (where the people are, so the website's windows keep them in view)
   and its card's colour (a deep shade of the photo's main colour). Done here with sharp, on any
   photo address, so it works the same whichever store the photos are in. */

// the windows a cover is shown through (globals.css / the blog's cards): the story cards are 5:4,
// the big cards 4:3 on phones and 3:2 on bigger screens
const CARD = 5 / 4;
const BIG = 3 / 2;

/** The focus point as CSS's object-position takes it: where, along the side that's trimmed, sharp's
    "attention" crop (the busiest, most skin-toned, most colourful part) puts a window of shape `w:h` */
async function focusAlong(photo: Buffer, a: number, w: number, h: number) {
  const { info } = await sharp(photo).resize(w, h, { fit: "cover", position: "attention" }).toBuffer({ resolveWithObject: true });
  // the photo was first scaled to cover the window, then cut: the share of the room to move it used
  const room = a < w / h ? Math.round(w / a) - h : Math.round(h * a) - w;
  const moved = Math.abs((a < w / h ? info.cropOffsetTop : info.cropOffsetLeft) ?? 0);
  return room > 0 ? Math.min(100, Math.max(0, Math.round((moved / room) * 100))) : 50;
}

/* ── Colour, in OKLab (where lightness and colourfulness can be set without the hue drifting) ── */

const toLinear = (byte: number) => {
  const c = byte / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const toByte = (c: number) =>
  Math.round(255 * Math.min(1, Math.max(0, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)));

function oklab(r8: number, g8: number, b8: number) {
  const [r, g, b] = [toLinear(r8), toLinear(g8), toLinear(b8)];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function hexOf(L: number, A: number, B: number) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${rgb.map((c) => toByte(c).toString(16).padStart(2, "0")).join("")}`;
}

// the cards' colours sit this dark and this colourful (as the hand-picked ones did), so the cream
// words on them always read; a photo with no colour to speak of gets a warm brown
const TONE_LIGHTNESS = 0.31;
const TONE_CHROMA = { least: 0.03, most: 0.075 };
const WARM = Math.atan2(0.035, 0.03);

/** The card's colour: the photo's main colour (its colourful pixels count most; near-black,
    near-white and grey ones not at all), made deep */
async function toneOf(photo: Buffer) {
  const { data } = await sharp(photo).resize(48, 48, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let a = 0;
  let b = 0;
  let weight = 0;
  for (let i = 0; i + 2 < data.length; i += 3) {
    const [L, pa, pb] = oklab(data[i], data[i + 1], data[i + 2]);
    const chroma = Math.hypot(pa, pb);
    if (L < 0.2 || L > 0.95 || chroma < 0.02) continue;
    a += pa * chroma;
    b += pb * chroma;
    weight += chroma;
  }
  const hue = weight ? Math.atan2(b, a) : WARM;
  const chroma = weight ? Math.hypot(a / weight, b / weight) * 0.6 : 0;
  const C = Math.min(TONE_CHROMA.most, Math.max(TONE_CHROMA.least, chroma));
  return hexOf(TONE_LIGHTNESS, C * Math.cos(hue), C * Math.sin(hue));
}

export type CoverLook = { position: string; tone: string; width: number; height: number };

// the most a cover may weigh to be looked at (the upload window keeps them far smaller)
const MOST_BYTES = 40_000_000;

/** Fetches a cover and works out its focus point (as "x% y%"), its card's colour, and its size */
export async function lookAtCover(src: string): Promise<CoverLook> {
  const res = await fetch(src, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`The photo couldn't be fetched (${res.status}).`);
  if (Number(res.headers.get("content-length") ?? 0) > MOST_BYTES) throw new Error("The photo is too big to look at.");
  const file = Buffer.from(await res.arrayBuffer());

  // turned the way it's shown (a phone photo's sideways flag applied), and made small: enough to
  // see where the people are, and quick
  const photo = await sharp(file, { failOn: "none" }).rotate().resize(800, 800, { fit: "inside", withoutEnlargement: true }).toBuffer();
  const meta = await sharp(file, { failOn: "none" }).metadata();
  const sideways = (meta.orientation ?? 1) >= 5;
  const width = (sideways ? meta.height : meta.width) ?? 0;
  const height = (sideways ? meta.width : meta.height) ?? 0;
  const small = await sharp(photo).metadata();
  const a = (small.width ?? 1) / (small.height ?? 1);

  // a photo taller than the widest window loses its top and bottom somewhere: where they're
  // trimmed is set where they're trimmed most; one wider than the narrowest loses its sides.
  // Up and down, the window goes no lower than the middle: on the site's photos sharp sometimes
  // chose a bright dress or a gold cushion at the bottom and cut off the faces, which in a tall
  // photo are almost never in its lower half
  const y = a < BIG ? Math.min(50, await focusAlong(photo, a, 300, 200)) : 50;
  const x = a > CARD ? await focusAlong(photo, a, 250, 200) : 50;

  return { position: `${x}% ${y}%`, tone: await toneOf(photo), width, height };
}
