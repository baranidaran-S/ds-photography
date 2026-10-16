import { getImageProps } from "next/image";

/* Getting photos to the screen sooner. Each gallery page holds an arrangement for every screen
   size (only the one that fits showing), so its photos have to stay lazy, or every arrangement's
   photos would download. These hand the browser the right ones early, at exactly the size the
   page's <Image> will ask for, so when it does they're already there. */

export type PhotoAsk = { src: string; sizes: string };

const srcSetOf = ({ src, sizes }: PhotoAsk) => getImageProps({ src, alt: "", fill: true, sizes }).props.srcSet;

/** The photos at the top of a page, asked for as soon as the page arrives (in its <head>) rather
    than once the browser has laid it out and found them; only on screens matching `media` */
export function PreloadPhotos({ photos, media }: { photos: PhotoAsk[]; media: string }) {
  return photos.map((p) => (
    <link
      key={`${media} ${p.src}`}
      rel="preload"
      as="image"
      imageSrcSet={srcSetOf(p)}
      imageSizes={p.sizes}
      media={media}
      fetchPriority="high"
    />
  ));
}

/** Starts downloading photos that are about to be shown (in the browser, while the page runs) */
export function warmPhotos(photos: PhotoAsk[]) {
  for (const p of photos) {
    const img = document.createElement("img");
    img.sizes = p.sizes;
    img.srcset = srcSetOf(p) ?? "";
  }
}

/** The screen sizes the arrangements are for (Tailwind's md and lg) */
export const SCREENS = {
  phone: "(max-width: 767px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
  computer: "(min-width: 1024px)",
  biggerThanPhone: "(min-width: 768px)",
} as const;
