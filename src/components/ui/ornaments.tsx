/* Indian decorative pieces, all drawn as SVG so they stay crisp and recolourable. */

type ClassProps = { className?: string };

/** Five-petal lotus, used in the logo and as a divider. Colour follows `currentColor`. */
export function LotusMark({ className = "h-5 w-7" }: ClassProps) {
  const petal = "M16 22 C 12.2 15.5, 12.6 7.5, 16 2.5 C 19.4 7.5, 19.8 15.5, 16 22 Z";
  return (
    <svg viewBox="0 0 32 25" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden className={className}>
      {[-58, -29, 0, 29, 58].map((deg) => (
        <path key={deg} d={petal} transform={`rotate(${deg} 16 22)`} fill={deg === 0 ? "currentColor" : "none"} fillOpacity={0.25} />
      ))}
      <path d="M5 22.5 Q16 26 27 22.5" strokeLinecap="round" />
    </svg>
  );
}

/** Line-art mandala built from rings of petals and dots. */
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
