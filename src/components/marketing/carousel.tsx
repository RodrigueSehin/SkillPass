"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

export interface CarouselSlide {
  /** Also used as the anchor: /#id opens this slide. */
  id: string;
  kicker: string;
  title: string;
  text: string;
  points: string[];
  cta: { label: string; href: string };
  /** Server-rendered picture or illustration. */
  visual: React.ReactNode;
}

interface CarouselProps {
  slides: CarouselSlide[];
  /** Time each slide stays on screen. */
  intervalMs?: number;
  label: string;
}

/** Pure helper, exported for tests: wraps around both ends. */
export const wrapIndex = (index: number, length: number) => ((index % length) + length) % length;

const SWIPE_THRESHOLD_PX = 50;

/**
 * Accessible carousel: autoplay with a visible pause button, paused on hover/focus/off-screen,
 * disabled with "reduce motion", arrow keys, swipe, dots, and /#slide-id deep links.
 * Timing is driven by the progress bar's CSS animation, so pausing and resuming stay in sync.
 */
export function Carousel({ slides, intervalMs = 6500, label }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const reduceMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (next: number) => {
      setIndex(wrapIndex(next, slides.length));
    },
    [slides.length],
  );

  // Stop moving while the carousel is not on screen.
  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Deep links: /#entreprises opens the matching slide, on load and when the hash changes.
  useEffect(() => {
    const open = () => {
      const target = slides.findIndex((s) => s.id === window.location.hash.slice(1));
      if (target >= 0) go(target);
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [slides, go]);

  const autoplay = playing && !reduceMotion;
  const running = autoplay && !hovered && !focused && visible;

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label={label}
      // Mouse only: on touch screens "hover" would stick after a tap and freeze the carousel.
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      className="from-navy shadow-lift relative overflow-hidden rounded-[2rem] bg-gradient-to-br via-[#1b2f6b] to-blue-800 text-white"
    >
      <div
        aria-live={running ? "off" : "polite"}
        className="grid touch-pan-y"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") swipeStart.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (!start) return;
          const dx = e.clientX - start.x;
          if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(e.clientY - start.y)) {
            go(index + (dx < 0 ? 1 : -1));
          }
        }}
      >
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.id}
              id={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} sur ${slides.length}`}
              aria-hidden={!active}
              inert={!active}
              data-active={active}
              className={cn(
                "group/slide col-start-1 row-start-1 grid scroll-mt-28 items-center gap-8 p-6 transition-[opacity,transform,translate] duration-700 ease-out sm:p-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:p-14",
                active ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-6 opacity-0",
              )}
            >
              <div className="order-2 lg:order-1">
                <p
                  className="group-data-[active=true]/slide:animate-fade-up flex items-center gap-2 text-sm font-semibold text-amber-300"
                  style={{ animationDelay: "60ms" }}
                >
                  <span aria-hidden className="bg-accent h-0.5 w-6 rounded-full" /> {slide.kicker}
                </p>
                <h3
                  className="group-data-[active=true]/slide:animate-fade-up mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl"
                  style={{ animationDelay: "140ms" }}
                >
                  {slide.title}
                </h3>
                <p
                  className="group-data-[active=true]/slide:animate-fade-up mt-4 max-w-lg leading-relaxed text-blue-100"
                  style={{ animationDelay: "220ms" }}
                >
                  {slide.text}
                </p>
                <ul
                  className="group-data-[active=true]/slide:animate-fade-up mt-5 space-y-2"
                  style={{ animationDelay: "300ms" }}
                >
                  {slide.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-blue-50">
                      <Check className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden /> {point}
                    </li>
                  ))}
                </ul>
                <div
                  className="group-data-[active=true]/slide:animate-fade-up"
                  style={{ animationDelay: "380ms" }}
                >
                  <Button asChild variant="accent" size="lg" className="mt-7 rounded-full px-7">
                    <Link href={slide.cta.href}>
                      {slide.cta.label} <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative order-1 h-[22rem] sm:h-96 lg:order-2 lg:h-[26rem]">{slide.visual}</div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-6 sm:px-10 lg:px-14 lg:pb-8">
        <div className="flex items-center gap-2" role="group" aria-label="Choisir une diapositive">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Diapositive ${i + 1} : ${slide.kicker}`}
              aria-current={i === index ? "true" : undefined}
              className="group/dot relative h-2.5 overflow-hidden rounded-full bg-white/25 transition-[width] duration-300 hover:bg-white/40"
              style={{ width: i === index ? "3.5rem" : "0.625rem" }}
            >
              {i === index && (
                <span
                  key={index}
                  aria-hidden
                  onAnimationEnd={(e) => {
                    // "Reduce motion" forces a ~0 ms animation: only a full-length run may advance.
                    if (autoplay && e.elapsedTime * 1000 >= intervalMs * 0.9) go(index + 1);
                  }}
                  className="absolute inset-0 origin-left rounded-full bg-amber-300"
                  style={{
                    animation: autoplay ? `slide-progress ${intervalMs}ms linear forwards` : undefined,
                    animationPlayState: running ? "running" : "paused",
                    transform: autoplay ? undefined : "scaleX(1)",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-white hover:bg-white/15"
            aria-label={
              playing ? "Mettre le défilement automatique en pause" : "Reprendre le défilement automatique"
            }
            aria-pressed={!playing}
            disabled={reduceMotion}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing && !reduceMotion ? <Pause /> : <Play />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-white hover:bg-white/15"
            aria-label="Diapositive précédente"
            onClick={() => go(index - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-white hover:bg-white/15"
            aria-label="Diapositive suivante"
            onClick={() => go(index + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
