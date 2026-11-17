"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Blueprint Aurora motion helpers — the only JS-driven motion in the app.
 * Everything else (word-reveal, blur-rise, float-bob, bar-grow, pill-pop)
 * is pure CSS. Both helpers honour prefers-reduced-motion.
 */

function reducedMotion(): boolean {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll-reveal hook: observes every `[data-rv]` element in the document
 * and adds the `.in` class once when it enters the viewport (one-shot).
 * Re-scans whenever `deps` change (view switches, auth state, data loads),
 * so freshly mounted sections are picked up too.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rv]:not(.in)"));
    if (els.length === 0) return;
    if (reducedMotion() || typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Odometer-style count-up: animates from the previous value to `value`
 * over ~900ms with an ease-out curve. Returns the number to display.
 * Under prefers-reduced-motion (or on first mount with duration 0) it
 * snaps straight to the value.
 */
export function useCountUp(value: number, duration = 900): number {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to || reducedMotion()) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return display;
}
