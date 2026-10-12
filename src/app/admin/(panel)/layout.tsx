import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Enquiry } from "@/models";
import { AdminShell } from "../AdminShell";
import { Feedback } from "../components/Feedback";
import { EnquiryAlerts } from "../components/EnquiryAlerts";

export const metadata: Metadata = {
  title: "DS Photography Admin",
  robots: { index: false, follow: false },
};

/* proxy.ts already bounces signed-out visitors, but it only reads the cookie.
   Re-checking here means a page never renders without a verified session. */
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // the badge starts correct on first paint, then the poll keeps it current
  let waiting = 0;
  try {
    await connectDB();
    waiting = await Enquiry.countDocuments({ status: "new" });
  } catch {
    // the dashboard explains a database problem; the badge just stays at zero
  }

  return (
    <Feedback>
      <EnquiryAlerts initialCount={waiting}>
        <AdminShell name={session.name}>{children}</AdminShell>
      </EnquiryAlerts>
    </Feedback>
  );
}
