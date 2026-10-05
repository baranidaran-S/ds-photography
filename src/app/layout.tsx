import type { Metadata, Viewport } from "next";
import { DM_Mono, Lato, Mrs_Saint_Delafield, Playfair_Display } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/layout/FloatingContact";

// Playfair Display for headings and the menu; Lato for text, labels and buttons
const display = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

// Camera-style readouts in the Services viewfinder
const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

// Handwritten signature in the About section (below the fold, so not preloaded)
const signature = Mrs_Saint_Delafield({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-signature-face",
  preload: false,
});

const body = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "DS Photography | Wedding, Maternity, Newborn & Birthday Photography",
  description:
    "DS Photography captures weddings, engagements, pre-wedding shoots, maternity, baby showers, newborns and birthdays. Book your shoot on WhatsApp.",
};

export const viewport: Viewport = {
  themeColor: "#0b0a0a",
};

// Runs before first paint: lets CSS hide [data-reveal] elements until GSAP animates them in,
// and shows everything again if the intro hasn't started within 4s.
const revealScript =
  "document.documentElement.classList.add('js');setTimeout(function(){if(!window.__dsReady)document.documentElement.classList.remove('js')},4000);";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} ${signature.variable} antialiased`}
    >
      <head>
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: revealScript }}
        />
      </head>
      <body className="bg-cream font-body text-ink">
        <SmoothScroll>
          <Navbar />
          {children}
          <Footer />
          <FloatingContact />
        </SmoothScroll>
      </body>
    </html>
  );
}
