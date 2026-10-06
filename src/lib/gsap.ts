"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP);
  // Re-measure scroll positions on resize and when the tab comes back, but not when the last photo
  // finishes downloading: nothing changes size then (photos have fixed spaces), and on slow mobile
  // data that moment can land mid-animation and make it stutter. The hero re-measures once fonts load.
  ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,resize" });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
