"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ChevronRight, Star } from "lucide-react";
import { ExerciseIcon } from "@/components/training/ExerciseIcon";
import { MuscleMap } from "@/components/training/MuscleMap";
import { Input } from "@/components/ui/input";
import { toggleFavorite } from "@/app/(dashboard)/training/exercises/actions";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type CatalogExercise = {
  id: string;
  name: string;
  equipment: string | null;
  muscleGroups: { slug: string; name: string; role: string }[];
  best: number | null;
};

type ExerciseCatalogProps = {
  exercises: CatalogExercise[];
  muscleGroupNames: Record<string, string>;
  initialFavoriteIds: string[];
};

export function ExerciseCatalog({
  exercises,
  muscleGroupNames,
  initialFavoriteIds,
}: ExerciseCatalogProps) {
  const [view, setView] = useState<"front" | "back">("front");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set(initialFavoriteIds));
  const [, startTransition] = useTransition();

  function handleToggleFavorite(exerciseId: string) {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
    startTransition(() => toggleFavorite(exerciseId));
  }

  const filtered = useMemo(
    () =>
      exercises.filter((exercise) => {
        const matchesMuscle =
          !activeSlug ||
          exercise.muscleGroups.some((group) => group.slug === activeSlug);
        const matchesQuery =
          query.trim() === "" ||
          exercise.name.toLowerCase().includes(query.trim().toLowerCase());
        const matchesFavorite = !onlyFavorites || favoriteIds.has(exercise.id);
        return matchesMuscle && matchesQuery && matchesFavorite;
      }),
    [exercises, activeSlug, query, onlyFavorites, favoriteIds],
  );

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col items-center gap-3 rounded-3xl border bg-card px-4 pt-3 pb-4">
        <div
          role="tablist"
          aria-label="Ansicht"
          className="flex w-full max-w-xs rounded-full bg-secondary p-1 text-sm font-medium"
        >
          {(["front", "back"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={view === value}
              onClick={() => setView(value)}
              className={cn(
                "h-9 flex-1 rounded-full transition-colors",
                view === value
                  ? "bg-card shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {value === "front" ? "Vorderseite" : "Rückseite"}
            </button>
          ))}
        </div>
        <MuscleMap
          view={view}
          activeSlug={activeSlug}
          onSelect={(slug) =>
            setActiveSlug((current) => (current === slug ? null : slug))
          }
          className="max-h-[62svh] max-w-[17rem]"
        />
        <p className="min-h-5 text-sm text-muted-foreground">
          {activeSlug
            ? `Filter: ${muscleGroupNames[activeSlug] ?? activeSlug}`
            : "Tippe auf einen Muskel, um Übungen zu filtern."}
        </p>
      </section>

      <div className="flex gap-2">
        <Input
          placeholder="Übung suchen"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1"
        />
        <button
          type="button"
          aria-pressed={onlyFavorites}
          onClick={() => setOnlyFavorites((current) => !current)}
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
            onlyFavorites
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card",
          )}
        >
          <Star className={cn("size-4", onlyFavorites && "fill-current")} />
          Favoriten
        </button>
      </div>

      {(activeSlug || onlyFavorites) && (
        <button
          type="button"
          className="self-start text-sm font-medium text-primary"
          onClick={() => {
            setActiveSlug(null);
            setOnlyFavorites(false);
          }}
        >
          Filter zurücksetzen
        </button>
      )}

      <ul className="divide-y overflow-hidden rounded-3xl border bg-card">
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">
            Keine Übungen gefunden.
          </li>
        )}
        {filtered.map((exercise) => {
          const isFavorite = favoriteIds.has(exercise.id);
          const primary = exercise.muscleGroups
            .filter((group) => group.role === "PRIMARY")
            .map((group) => group.name)
            .join(", ");
          return (
            <li key={exercise.id} className="flex items-center">
              <Link
                href={`/training/exercises/${exercise.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 active:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 leading-tight font-medium">{exercise.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {primary}
                    {exercise.best ? ` · Bestwert ${formatNumber(exercise.best)} kg` : ""}
                  </p>
                </div>
                <ExerciseIcon name={exercise.name} />
                <ChevronRight className="size-5 shrink-0 text-muted-foreground/60" />
              </Link>
              <button
                type="button"
                aria-label={
                  isFavorite ? "Favorit entfernen" : "Als Favorit markieren"
                }
                aria-pressed={isFavorite}
                onClick={() => handleToggleFavorite(exercise.id)}
                className="flex size-12 shrink-0 items-center justify-center"
              >
                <Star
                  className={cn(
                    "size-5",
                    isFavorite
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/60",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
