import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getLogo, getSite } from "@/content/db";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in · DS Photography Admin",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  /* The studio's own mark and name. Both loaders fall back to the built-in copy
     if the database is unreachable, so the sign-in page still renders when the
     thing you are signing in to fix is the database. */
  const [logo, site] = await Promise.all([getLogo(), getSite()]);

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-night px-5 py-12">
      {/* The studio's own desk. Wide and dark through the middle, which is
          where the card sits — so the photograph is never fighting the form. */}
      <Image
        src="/images/adminloginbg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Two veils: a light flat one so the lettering holds wherever the crop
          lands on a given screen, and a soft darkening at the edges to draw the
          eye in. Kept thin — the point was to show the photograph. */}
      <div aria-hidden className="absolute inset-0 bg-night/25" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(11_10_10/0.35)_10%,rgb(11_10_10/0.7)_80%)]"
      />

      <div className="relative w-full max-w-[25.5rem]">
        {/* Mark */}
        <div className="mb-9 flex flex-col items-center">
          {logo.src ? (
            <Image
              src={logo.src}
              alt={logo.alt}
              // the file's own proportions decide the width; this only sizes the download
              width={logo.height * 6}
              height={logo.height}
              priority
              className="h-[3.6rem] w-auto max-w-[60vw] object-contain drop-shadow-[0_4px_24px_rgb(0_0_0/0.6)]"
            />
          ) : (
            <p className="font-display text-[2rem] leading-none text-cream">DS</p>
          )}
          {(logo.showText || !logo.src) && (
            <p className="mt-2.5 font-heading text-[0.6rem] font-semibold tracking-[0.42em] text-brand-light/80 uppercase">
              Photography
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl bg-night/55 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] ring-1 ring-cream/12 backdrop-blur-xl">
          {/* a thread of gold across the top, brightest in the middle */}
          <div
            aria-hidden
            className="h-px bg-gradient-to-r from-transparent via-brand/70 to-transparent"
          />

          <div className="p-7 sm:p-8">
            <h1 className="font-display text-[1.6rem] leading-tight text-cream">
              Admin sign in
            </h1>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-cream/50">
              Manage the photos and words on your site.
            </p>

            {/* LoginForm reads the ?next= param, which needs a boundary to prerender */}
            <Suspense fallback={<div className="mt-6 h-[19rem]" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <p className="mt-7 text-center font-heading text-[0.58rem] font-semibold tracking-[0.26em] text-cream/30 uppercase">
          {site.name}
        </p>
      </div>
    </main>
  );
}
