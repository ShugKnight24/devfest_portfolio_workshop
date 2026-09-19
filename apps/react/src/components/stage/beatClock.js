import { useEffect, useState } from "react";

/**
 * Beat clock — the one timeline every stage beat animates against.
 *
 * A beat (the ripcord, the evidence thread) is drawn as a pure function of a
 * single number `t` in [0, 1]: 0 is armed and waiting, 1 is the finished pull.
 * That keeps the art testable — any frame can be rendered statically by passing
 * `frame` — and it means reduced motion is not a separate code path: it simply
 * jumps to t = 1, so the end state is identical for everyone.
 */

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export const prefersReducedMotion = () => {
  try {
    return typeof window !== "undefined" && window.matchMedia?.(reducedMotionQuery).matches === true;
  } catch {
    return false;
  }
};

/**
 * @param {boolean} fired     has the beat been pulled
 * @param {number}  duration  milliseconds from pull to finished
 * @param {number}  [frame]   freeze at this t (previews and tests); overrides everything
 * @returns {number} t in [0, 1]
 */
export const useBeatClock = (fired, duration, frame) => {
  const [t, setT] = useState(fired ? 1 : 0);

  useEffect(() => {
    if (typeof frame === "number") return undefined;
    if (!fired) {
      setT(0);
      return undefined;
    }
    if (prefersReducedMotion() || typeof window.requestAnimationFrame !== "function") {
      setT(1);
      return undefined;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const next = Math.min(1, (now - start) / duration);
      setT(next);
      if (next < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [fired, duration, frame]);

  return typeof frame === "number" ? Math.min(1, Math.max(0, frame)) : t;
};

/**
 * Seconds elapsed since `active` turned true, ticking every frame.
 *
 * The beat clock ends at t = 1 and holds there, which is right for a stamp and
 * wrong for an engine: a chainsaw that has caught should keep running until the
 * slide moves on. Callers layer this on top of `t` for the part of the drawing
 * that never settles. Returns 0 while inactive and under reduced motion, so the
 * held frame stays the fallback for everyone.
 *
 * @param {boolean} active  run the clock
 * @returns {number} seconds since activation
 */
export const useIdleClock = (active) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return undefined;
    }
    if (
      prefersReducedMotion() ||
      typeof window === "undefined" ||
      typeof window.requestAnimationFrame !== "function"
    ) {
      return undefined;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      setSeconds((now - start) / 1000);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [active]);

  return seconds;
};

/** Progress through the sub-span [a, b] of t, clamped to [0, 1]. */
export const span = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : Math.min(1, Math.max(0, (t - a) / (b - a))));

export const easeOutCubic = (x) => 1 - (1 - x) ** 3;
export const easeInOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

/** Overshoot then settle — for things that snap back (a cord, a stamp). */
export const easeOutBack = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};

/** A damped wobble in [-1, 1] that dies out by x = 1 — engine shake, impact. */
export const shake = (x, cycles = 6) => Math.sin(x * Math.PI * 2 * cycles) * (1 - x);
