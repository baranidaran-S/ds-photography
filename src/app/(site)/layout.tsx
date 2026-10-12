import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { SectionJump } from "@/components/providers/SectionJump";
import { SiteProvider } from "@/components/providers/SiteProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/layout/FloatingContact";
import {
  getContact,
  getFilms,
  getFooter,
  getInstagramMeta,
  getLogo,
  getServices,
  getSite,
} from "@/content/db";

// Runs before first paint:
// - every visit and refresh starts at the top so the intro plays: the browser doesn't restore the
//   old scroll position, and a "#section" in the address is dropped instead of jumped to
//   (the scroll animations are built to start from the top)
// - lets CSS hide [data-reveal] elements until GSAP animates them in, and shows everything again
//   if the intro hasn't started within 4s
const revealScript =
  "if('scrollRestoration' in history)history.scrollRestoration='manual';if(location.hash)history.replaceState(null,'',location.pathname+location.search);document.documentElement.classList.add('js');setTimeout(function(){if(!window.__dsReady)document.documentElement.classList.remove('js')},4000);";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [site, logo, instagram, films, footer, contact, services] =
    await Promise.all([
      getSite(),
      getLogo(),
      getInstagramMeta(),
      getFilms(),
      getFooter(),
      getContact(),
      getServices(),
    ]);

  return (
    <>
      <script
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: revealScript }}
      />
      <SiteProvider
        value={{
          site,
          logo,
          instagram,
          films: { channelUrl: films.channelUrl },
          footer,
          contact,
          services: services.map((s) => s.name),
        }}
      >
        <SmoothScroll>
          {/* handles /?view=services from the admin's "View on site" buttons */}
          <SectionJump />
          <Navbar />
          {children}
          <Footer />
          <FloatingContact />
        </SmoothScroll>
      </SiteProvider>
    </>
  );
}
