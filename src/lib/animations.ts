import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
export function ensureGsap() {
  if (typeof window === "undefined") return;
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
}

/** Run a GSAP setup callback once on mount; cleanup via gsap.context. */
export function useGsap(fn: (ctx: gsap.Context) => void, scope?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    ensureGsap();
    const ctx = gsap.context((self) => fn(self), scope?.current ?? undefined);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Word-drop animation for headlines marked with .drop-headline */
export function animateDropHeadlines(scope?: HTMLElement | null) {
  ensureGsap();
  const root = scope ?? document;
  const headlines = root.querySelectorAll<HTMLElement>(".drop-headline");
  headlines.forEach((headline) => {
    if (!headline.querySelector(".drop-word") && headline.textContent?.trim()) {
      const words = headline.textContent.split(" ");
      headline.innerHTML = words.map((w) => `<span class="drop-word">${w}</span>`).join(" ");
    }
    const words = headline.querySelectorAll(".drop-word");
    gsap.fromTo(
      words,
      { y: -40, opacity: 0, rotationX: 45 },
      {
        y: 0,
        opacity: 1,
        rotationX: 0,
        duration: 0.9,
        stagger: 0.05,
        ease: "expo.out",
        scrollTrigger: { trigger: headline, start: "top 88%", toggleActions: "play none none none" },
      }
    );
  });
}

export function useCountUp(target: number, durationMs = 1500) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const start = performance.now();
    const from = 0;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * eased).toLocaleString();
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return ref;
}
