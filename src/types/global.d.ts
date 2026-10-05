export {};

declare global {
  interface Window {
    /** Set once the GSAP intro has taken over the [data-reveal] elements (see layout.tsx). */
    __dsReady?: boolean;
  }
}
