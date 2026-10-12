/** Sidebar groups. `soon` items render disabled until that phase is built. */
export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  soon?: boolean;
};

export type IconName =
  | "dashboard"
  | "inbox"
  | "image"
  | "user"
  | "phone"
  | "camera"
  | "film"
  | "album"
  | "chat"
  | "grid"
  | "media"
  | "search"
  | "settings";

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
      { label: "Enquiries & Leads", href: "/admin/enquiries", icon: "inbox" },
    ],
  },
  {
    title: "Page Content",
    items: [
      { label: "Hero Section", href: "/admin/hero", icon: "image" },
      { label: "About Page", href: "/admin/about", icon: "user" },
      { label: "Contact Page", href: "/admin/contact", icon: "phone" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Services", href: "/admin/services", icon: "camera" },
      { label: "Films", href: "/admin/films", icon: "film" },
      { label: "Portfolio Stories", href: "/admin/stories", icon: "album" },
      { label: "Reviews", href: "/admin/reviews", icon: "chat" },
      { label: "Instagram Strip", href: "/admin/instagram", icon: "grid" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "Media Library", href: "/admin/media", icon: "media" },
      { label: "SEO Manager", href: "/admin/seo", icon: "search" },
      { label: "System Settings", href: "/admin/settings", icon: "settings" },
    ],
  },
];

/** Breadcrumb label for a path, e.g. /admin/hero → "Hero Slides". */
export function labelFor(pathname: string) {
  for (const group of navGroups) {
    const hit = group.items.find((i) => pathname.startsWith(i.href));
    if (hit) return hit.label;
  }
  return "Admin";
}
