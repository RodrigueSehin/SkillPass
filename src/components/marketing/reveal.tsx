"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Milliseconds to wait once visible; use it to stagger siblings. */
  delay?: number;
  as?: "div" | "li" | "section" | "article";
}

/**
 * Fades and slides its content in the first time it scrolls into view.
 * Without JavaScript the layout's <noscript> rule shows everything; with "reduce motion"
 * the content is shown at once.
 */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const shown = inView || reduceMotion;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-reveal
      className={cn(
        "transition-[opacity,transform,translate] duration-700 ease-out",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={{ transitionDelay: shown && delay ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  );
}
