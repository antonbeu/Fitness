import { useId } from "react";
import { areaPath, smoothPath } from "@/lib/smooth-path";

/** Mini-Verlauf ohne Achsen; zeigt nur die Richtung. */
export function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const W = 80;
  const H = 30;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (index: number) =>
    values.length === 1 ? W / 2 : pad + (index / (values.length - 1)) * (W - pad * 2);
  const y = (value: number) =>
    max === min ? H / 2 : pad + (1 - (value - min) / (max - min)) * (H - pad * 2);
  const pairs = values.map((value, index) => [x(index), y(value)] as [number, number]);
  const gradientId = useId();

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {values.length > 1 && (
        <>
          <path d={areaPath(pairs, H)} fill={`url(#${gradientId})`} />
          <path
            d={smoothPath(pairs)}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      <circle cx={x(values.length - 1)} cy={y(values.at(-1)!)} r={2.8} fill="var(--primary)" />
    </svg>
  );
}
