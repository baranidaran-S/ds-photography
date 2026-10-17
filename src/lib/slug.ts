/** A name as a web address: "Hindu wedding" → "hindu-wedding", "60th & 80th wedding" →
    "60th-and-80th-wedding". Small letters and numbers only, joined by "-"; "" when the name has
    none (one typed in Tamil letters, say), so the caller can fall back to something else. Used by
    the admin to show the address as it's typed, and by the server when it saves. */
export function slugOf(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}
