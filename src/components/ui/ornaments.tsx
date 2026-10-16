/* Indian decorative pieces, all drawn as SVG so they stay crisp and recolourable. */

type ClassProps = { className?: string };

/** A camera's focus frame: viewfinder corners round the focus point, like the home page's
    viewfinder. Used beside section labels, as a divider and in the text logo. Colour follows
    `currentColor`. */
export function FocusMark({ className = "h-5 w-7" }: ClassProps) {
  return (
    <svg
      viewBox="0 0 32 25"
      fill="none"
      stroke="currentColor"
      // (bold enough to draw a crisp line at the small sizes it's used, beside a label)
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M5 8.5V3.5H10M22 3.5H27V8.5M27 16.5V21.5H22M10 21.5H5V16.5" />
      <circle cx="16" cy="12.5" r="3.6" fill="currentColor" fillOpacity={0.25} />
      <circle cx="16" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Line-art mandala built from rings of petals and dots. Only for the phone menu (Navbar):
    the site doesn't use it anywhere else. */
export function Mandala({ className = "" }: ClassProps) {
  const ring = (count: number, offset = 0) => Array.from({ length: count }, (_, i) => offset + (360 / count) * i);
  return (
    <svg viewBox="-100 -100 200 200" fill="none" stroke="currentColor" strokeWidth="0.6" aria-hidden className={className}>
      <circle r="97" />
      <circle r="93" strokeDasharray="1 3" />
      {ring(32).map((d) => (
        <path key={`o${d}`} d="M0,-62 C 5,-70 5,-82 0,-91 C -5,-82 -5,-70 0,-62 Z" transform={`rotate(${d})`} />
      ))}
      <circle r="60" />
      {ring(48).map((d) => (
        <circle key={`d${d}`} cx="0" cy="-56" r="1.3" fill="currentColor" stroke="none" transform={`rotate(${d})`} />
      ))}
      {ring(12).map((d) => (
        <path key={`b${d}`} d="M0,-22 C 15,-31 15,-44 0,-52 C -15,-44 -15,-31 0,-22 Z" transform={`rotate(${d})`} />
      ))}
      {ring(12, 15).map((d) => (
        <path key={`s${d}`} d="M0,-24 C 7,-30 7,-38 0,-44 C -7,-38 -7,-30 0,-24 Z" transform={`rotate(${d})`} />
      ))}
      <circle r="20" />
      {ring(8).map((d) => (
        <path key={`i${d}`} d="M0,-4 C 5,-8 5,-13 0,-17 C -5,-13 -5,-8 0,-4 Z" transform={`rotate(${d})`} />
      ))}
      <circle r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}
