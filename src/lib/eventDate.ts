/* Enquiry dates are picked from a calendar, so they arrive as 2027-02-14. That
   is right for storing and sorting but wrong for reading, and older enquiries
   were typed by hand ("14 feb2027") before the picker existed — so anything that
   is not a plain date is handed back exactly as it was given. */

const READABLE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function prettyDate(value: string) {
  const iso = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return value;
  const at = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(at.getTime()) ? value : READABLE.format(at);
}

/** Today where the studio is, for the earliest date the calendar offers. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
