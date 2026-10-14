"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";

type Point = {
  date: string;
  topWeight: number;
  est1rm: number;
  volume: number;
};

type MetricKey = "topWeight" | "est1rm" | "volume";
type Metric = { key: MetricKey; label: string; unit: string };

const WEIGHT_METRICS: Metric[] = [
  { key: "topWeight", label: "Höchstgewicht", unit: "kg" },
  { key: "est1rm", label: "Max (geschätzt)", unit: "kg" },
  { key: "volume", label: "Volumen", unit: "kg" },
];
const TIME_METRICS: Metric[] = [
  { key: "topWeight", label: "Längste Zeit", unit: "min" },
  { key: "volume", label: "Gesamtzeit", unit: "min" },
];

const W = 600;
const H = 240;
const PAD = { left: 56, right: 20, top: 16, bottom: 38 };

function niceTicks(min: number, max: number, count = 4) {
  if (max === min) {
    const pad = Math.max(1, Math.abs(max) * 0.1);
    min -= pad;
    max += pad;
  }
  const rough = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)!;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= end + step / 2; value += step) ticks.push(value);
  return ticks;
}

export function ProgressChart({
  points,
  timed = false,
  unit = "kg",
}: {
  points: Point[];
  timed?: boolean;
  unit?: string;
}) {
  const METRICS = timed
    ? TIME_METRICS
    : WEIGHT_METRICS.filter((m) => m.key !== "est1rm" || unit === "kg").map((m) => ({
        ...m,
        unit,
      }));
  const format = timed ? formatDuration : formatNumber;
  const [metricKey, setMetricKey] = useState<MetricKey>("topWeight");
  const [selected, setSelected] = useState<number | null>(null);
  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];

  const chart = useMemo(() => {
    const values = points.map((p) => p[metricKey]);
    const ticks = niceTicks(Math.min(...values), Math.max(...values));
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1];
    const times = points.map((p) => new Date(p.date).getTime());
    const tMin = Math.min(...times);
    const tMax = Math.max(...times);
    const x = (time: number) =>
      tMax === tMin
        ? (PAD.left + W - PAD.right) / 2
        : PAD.left + ((time - tMin) / (tMax - tMin)) * (W - PAD.left - PAD.right);
    const y = (value: number) =>
      PAD.top + (1 - (value - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
    const coords = points.map((p, index) => ({
      x: x(times[index]),
      y: y(values[index]),
      value: values[index],
    }));
    return { ticks, coords, y, tMin, tMax };
  }, [points, metricKey]);

  const activeIndex = selected ?? points.length - 1;
  const active = chart.coords[activeIndex];
  const line = chart.coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  // Jeweils ersten und letzten Termin beschriften; bei vielen Punkten reicht das.
  const xLabels =
    points.length === 1
      ? [{ x: chart.coords[0].x, iso: points[0].date, anchor: "middle" as const }]
      : [
          { x: chart.coords[0].x, iso: points[0].date, anchor: "start" as const },
          { x: chart.coords.at(-1)!.x, iso: points.at(-1)!.date, anchor: "end" as const },
        ];

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="Kennzahl"
        className="flex rounded-lg bg-secondary p-0.5 text-sm font-medium"
      >
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={metricKey === m.key}
            onClick={() => setMetricKey(m.key)}
            className={cn(
              "h-9 flex-1 rounded-md px-1 transition-colors",
              metricKey === m.key ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div>
        <p className="text-3xl font-bold tracking-tight tabular-nums">
          {format(active.value)} <span className="text-lg font-medium text-muted-foreground">{metric.unit}</span>
        </p>
        <p className="text-sm text-muted-foreground">{formatDate(points[activeIndex].date)}</p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Verlauf: ${metric.label}`}
        className="h-auto w-full"
      >
        {chart.ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={chart.y(tick)}
              y2={chart.y(tick)}
              stroke="var(--border)"
            />
            <text
              x={PAD.left - 8}
              y={chart.y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[19px] tabular-nums"
            >
              {format(tick)}
            </text>
          </g>
        ))}
        {xLabels.map((label) => (
          <text
            key={label.iso}
            x={label.x}
            y={H - 10}
            textAnchor={label.anchor}
            className="fill-muted-foreground text-[19px]"
          >
            {formatDate(label.iso, { year: "2-digit" })}
          </text>
        ))}

        {points.length > 1 && (
          <polyline
            points={line}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {chart.coords.map((c, index) => (
          <g key={index} onClick={() => setSelected(index)} className="cursor-pointer">
            <circle cx={c.x} cy={c.y} r={16} fill="transparent" />
            <circle
              cx={c.x}
              cy={c.y}
              r={index === activeIndex ? 6 : 3.5}
              fill={index === activeIndex ? "var(--primary)" : "var(--card)"}
              stroke="var(--primary)"
              strokeWidth={2}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
