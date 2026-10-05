import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { Films } from "@/components/home/Films";
import { Portfolio } from "@/components/home/Portfolio";
import { About } from "@/components/home/About";
import { Reviews } from "@/components/home/Reviews";
import { InstagramReel } from "@/components/home/InstagramReel";
import { Contact } from "@/components/home/Contact";

export default function Home() {
  return (
    <main>
      <Hero />
      <Services />
      <Films />
      <Portfolio />
      <About />
      <Reviews />
      <InstagramReel />
      <Contact />
    </main>
  );
}
