"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { ExerciseIcon } from "@/components/training/ExerciseIcon";
import { Sparkline } from "@/components/training/Sparkline";
import { Input } from "@/components/ui/input";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";
import type { ExerciseOverview } from "@/lib/training/stats";
import { cn } from "@/lib/utils";

type Sort = "recent" | "progress" | "name";

function formatValue(item: ExerciseOverview, value: number) {
  if (item.metric === "time") return formatDuration(value);
  return formatNumber(value);
}

function delta(item: ExerciseOverview) {
  const diff = item.last - item.first;
  if (item.sessions < 2) return null;
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
  const abs = Math.abs(diff);
  return {
    diff,
    text: `${sign}${item.metric === "time" ? formatDuration(abs) : formatNumber(abs)}`,
  };
}

export function StatsList({ items }: { items: ExerciseOverview[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  const visible = useMemo(() => {
    const filtered = items.filter((item) =>
      item.name.toLowerCase().includes(query.trim().toLowerCase()),
    );
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "de");
      if (sort === "progress") return relativeProgress(b) - relativeProgress(a);
      return b.lastDate.localeCompare(a.lastDate);
    });
  }, [items, query, sort]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Übung suchen"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div
        role="tablist"
        aria-label="Sortierung"
        className="flex rounded-full bg-secondary p-1 text-sm font-medium"
      >
        {(
          [
            ["recent", "Zuletzt"],
            ["progress", "Fortschritt"],
            ["name", "A–Z"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={sort === value}
            onClick={() => setSort(value)}
            className={cn(
              "h-9 flex-1 rounded-full transition-colors",
              sort === value ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="divide-y overflow-hidden rounded-3xl border bg-card">
        {visible.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">
            Keine Übungen gefunden.
          </li>
        )}
        {visible.map((item) => {
          const change = delta(item);
          return (
            <li key={item.exerciseId}>
              <Link
                href={`/training/exercises/${item.exerciseId}`}
                className="flex items-center gap-2.5 px-3 py-3 active:bg-muted"
              >
                <ExerciseIcon name={item.name} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 leading-tight font-medium">{item.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.sessions}× · {formatDate(item.lastDate, { year: undefined })}
                  </p>
                </div>
                <Sparkline values={item.points.map((p) => p.value)} className="h-8 w-14 shrink-0" />
                <div className="w-14 shrink-0 text-right">
                  <p className="font-semibold tabular-nums">
                    {formatValue(item, item.last)}
                    <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                      {item.metric === "time" ? "" : ` ${item.unit}`}
                    </span>
                  </p>
                  {change && (
                    <p
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        change.diff > 0 ? "text-emerald-600" : "text-muted-foreground",
                      )}
                    >
                      {change.text}
                    </p>
                  )}
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground/60" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Relativer Fortschritt seit dem ersten Training (Anteil), damit leichte und schwere Übungen vergleichbar sind. */
function relativeProgress(item: ExerciseOverview) {
  if (item.sessions < 2 || item.first <= 0) return -Infinity;
  return (item.last - item.first) / item.first;
}
