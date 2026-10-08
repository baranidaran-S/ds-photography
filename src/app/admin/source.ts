/* Enquiries remember which button opened the form. Stored as a slug so the
   wording can change without rewriting old records. */

const NAMES: Record<string, string> = {
  hero: "Top of the page",
  contact: "Contact section",
  "contact-row": "Contact details",
  portfolio: "Album, last page",
  menu: "Phone menu",
  "floating-button": "Floating button",
};

/** "Where the enquiry came from" in words rather than the stored slug. */
export function sourceLabel(source: string) {
  if (!source) return "";
  if (source.startsWith("services:")) return `Services · ${source.slice(9)}`;
  return NAMES[source] ?? source;
}
