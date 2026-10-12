import { connectDB } from "@/lib/db";
import { Setting } from "@/models";
import { s } from "@/lib/load";
import {
  SettingsEditor,
  type FooterValue,
  type LogoValue,
  type SiteValue,
} from "./SettingsEditor";
import { PageHeader } from "../../components/PageHeader";

export default async function SystemSettingsPage() {
  await connectDB();
  const docs = await Setting.find({
    key: { $in: ["site", "logo", "footer"] },
  }).lean();

  const get = (key: string) =>
    ((docs.find((d) => d.key === key)?.value ?? {}) as Record<string, unknown>);

  const siteV = get("site");
  const logoV = get("logo");
  const footerV = get("footer");
  const credit = (footerV.credit ?? {}) as Record<string, unknown>;

  const site: SiteValue = {
    name: s(siteV.name, "DS Photography"),
    whatsappNumber: s(siteV.whatsappNumber),
    whatsappMessage: s(siteV.whatsappMessage),
    bookLabel: s(siteV.bookLabel),
    enquiryTitle: s(siteV.enquiryTitle),
    enquiryIntro: s(siteV.enquiryIntro),
  };

  const logo: LogoValue = {
    src: s(logoV.src),
    full: s(logoV.full),
    alt: s(logoV.alt, "DS Photography"),
    height: Number(logoV.height) || 54,
    showText: logoV.showText !== false,
  };

  const footer: FooterValue = {
    headline: s(footerV.headline),
    headlineFoil: s(footerV.headlineFoil),
    credit: { label: s(credit.label), url: s(credit.url) },
  };

  return (
    <div>
      <PageHeader
        title="System Settings"
        intro="Your studio name, WhatsApp number, logo, booking wording and the lines in the footer."
      />
      <SettingsEditor
        site={site}
        logo={logo}
        footer={footer}
      />
    </div>
  );
}
