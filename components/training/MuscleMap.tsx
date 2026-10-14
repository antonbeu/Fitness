"use client";

import { useId, useState } from "react";
import {
  BODY_VIEWBOX,
  bodyBack,
  bodyFront,
  muscleLabels,
} from "@/lib/training/body-model";
import { cn } from "@/lib/utils";

type MuscleMapProps = {
  view: "front" | "back";
  /** Ausgewählte Muskelgruppe (Filter-Modus). */
  activeSlug?: string | null;
  /** Wenn gesetzt, sind die Muskeln anklickbar. Ohne: reine Anzeige. */
  onSelect?: (slug: string) => void;
  /** Auslastung je Muskelgruppe, 0 bis 1 (Anzeige-Modus). */
  intensity?: Record<string, number>;
  className?: string;
};

const SILHOUETTE = "oklch(0.91 0.006 90)";
const MUSCLE = "oklch(0.8 0.012 250)";

function fillFor(
  slug: string,
  active: boolean,
  hovered: boolean,
  intensity?: Record<string, number>,
) {
  if (active) return "var(--primary)";
  if (intensity) {
    const level = intensity[slug] ?? 0;
    if (level <= 0) return MUSCLE;
    const pct = Math.round(35 + Math.min(level, 1) * 65);
    return `color-mix(in oklch, var(--primary) ${pct}%, ${MUSCLE})`;
  }
  if (hovered) return "color-mix(in oklch, var(--primary) 45%, oklch(0.8 0.012 250))";
  return MUSCLE;
}

export function MuscleMap({
  view,
  activeSlug = null,
  onSelect,
  intensity,
  className,
}: MuscleMapProps) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const titleId = useId();
  const parts = view === "front" ? bodyFront : bodyBack;
  const interactive = Boolean(onSelect);

  return (
    <svg
      viewBox={BODY_VIEWBOX}
      role={interactive ? "group" : "img"}
      aria-labelledby={titleId}
      className={cn("h-auto w-full", className)}
    >
      <title id={titleId}>
        {interactive
          ? `Körperdiagramm (${view === "front" ? "Vorderansicht" : "Rückansicht"}): Muskelgruppe auswählen`
          : `Körperdiagramm (${view === "front" ? "Vorderansicht" : "Rückansicht"})`}
      </title>

      {/* Silhouette: die Polygone mit dicker Kontur schließen die Lücken zu einem Körper */}
      <g
        aria-hidden="true"
        fill={SILHOUETTE}
        stroke={SILHOUETTE}
        strokeWidth={3.8}
        strokeLinejoin="round"
      >
        {parts.map((part, index) => (
          <polygon key={index} points={part.points} />
        ))}
      </g>

      <g strokeLinejoin="round" stroke="var(--card)" strokeWidth={0.6}>
        {parts.map((part, index) => {
          if (!part.slug) {
            return (
              <polygon
                key={index}
                points={part.points}
                fill={SILHOUETTE}
                stroke="none"
                aria-hidden="true"
              />
            );
          }
          const slug = part.slug;
          const active = slug === activeSlug;
          const fill = fillFor(slug, active, slug === hoveredSlug, intensity);
          if (!interactive) {
            return (
              <polygon key={index} points={part.points} fill={fill} aria-hidden="true" />
            );
          }
          return (
            <polygon
              key={index}
              points={part.points}
              fill={fill}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              aria-label={muscleLabels[slug] ?? part.label}
              className="cursor-pointer outline-none transition-[fill] focus-visible:stroke-foreground"
              onClick={() => onSelect?.(slug)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect?.(slug);
                }
              }}
              onMouseEnter={() => setHoveredSlug(slug)}
              onMouseLeave={() => setHoveredSlug(null)}
            />
          );
        })}
      </g>
    </svg>
  );
}
