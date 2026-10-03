"use client";

import { useEffect, useRef, useState } from "react";

/** "250K+" → { target: 250, suffix: "K+" }. Values without a leading number are left alone. */
export function splitStat(value: string) {
  const match = /^(\d+)(.*)$/.exec(value);
  return match ? { target: Number(match[1]), suffix: match[2] } : null;
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface CountUpProps {
  value: string;
  durationMs?: number;
  className?: string;
}

/**
 * Counts up to the figure the first time it is on screen. The server and no-JS render show the
 * final value, and assistive technology always reads it (sr-only text), never the in-between numbers.
 */
export function CountUp({ value, durationMs = 1400, className }: CountUpProps) {
  const parts = splitStat(value);
  const ref = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(parts?.target ?? 0);

  useEffect(() => {
    const node = ref.current;
    if (!node || !parts) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / durationMs, 1);
        setCurrent(Math.round(easeOutCubic(t) * parts.target));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // The target never changes for a given stat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  if (!parts) return <span className={className}>{value}</span>;
  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{value}</span>
      <span aria-hidden>
        {current}
        {parts.suffix}
      </span>
    </span>
  );
}
