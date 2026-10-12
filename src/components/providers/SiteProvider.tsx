"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { whatsappLink } from "@/lib/whatsapp";
import { EnquiryModal, type EnquiryIntent } from "@/components/home/EnquiryModal";

/* The handful of values nearly every section needs — the WhatsApp number, the
   logo, the social links, the footer copy — plus the enquiry form, which any
   button can open. Page sections still take their own content as props. */

export type SiteContextValue = {
  site: {
    name: string;
    whatsappNumber: string;
    whatsappMessage: string;
    /** the wording on every booking button */
    bookLabel: string;
    enquiryTitle: string;
    enquiryIntro: string;
  };
  logo: { src: string; full: string; alt: string; height: number; showText: boolean };
  instagram: { handle: string; url: string };
  films: { channelUrl: string };
  footer: {
    headline: string;
    headlineFoil: string;
    credit: { label: string; url: string };
  };
  contact: {
    phone: string;
    email: string;
    address: string[];
    hours: string[];
    bookingNote: { title: string; text: string };
  };
  services: string[];
  openEnquiry: (intent: EnquiryIntent) => void;
};

const SiteContext = createContext<SiteContextValue | null>(null);

type ProviderValue = Omit<SiteContextValue, "openEnquiry">;

export function SiteProvider({
  value,
  children,
}: {
  value: ProviderValue;
  children: React.ReactNode;
}) {
  const [intent, setIntent] = useState<EnquiryIntent | null>(null);

  const openEnquiry = useCallback((next: EnquiryIntent) => setIntent(next), []);
  const closeEnquiry = useCallback(() => setIntent(null), []);

  const ctx = useMemo<SiteContextValue>(
    () => ({ ...value, openEnquiry }),
    [value, openEnquiry],
  );

  return (
    <SiteContext.Provider value={ctx}>
      {children}
      <EnquiryModal
        intent={intent}
        onClose={closeEnquiry}
        services={value.services}
        whatsappNumber={value.site.whatsappNumber}
        title={value.site.enquiryTitle}
        intro={value.site.enquiryIntro}
      />
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    throw new Error("useSite must be used inside <SiteProvider>.");
  }
  return ctx;
}

/** Opens the enquiry form. `source` records which button it came from. */
export function useEnquiry() {
  return useSite().openEnquiry;
}

/* A direct wa.me link, for the places where a form would be the wrong thing —
   the footer's social row, which sits beside Instagram and YouTube. */
export function useWhatsapp() {
  const { site } = useSite();
  return useMemo(
    () => (message?: string) =>
      whatsappLink(site.whatsappNumber, message ?? site.whatsappMessage),
    [site.whatsappNumber, site.whatsappMessage],
  );
}
