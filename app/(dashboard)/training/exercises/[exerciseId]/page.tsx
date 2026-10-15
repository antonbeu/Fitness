import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getExerciseHistory } from "@/lib/training/stats";
import { formatDate, formatDuration, formatNumber, summarizeSets } from "@/lib/format";
import { Page } from "@/components/Page";
import { MuscleMap } from "@/components/training/MuscleMap";
import { ProgressChart } from "@/components/training/ProgressChart";

function Stat({
  label,
  value,
  unit,
  tone = "bg-tile-sage",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: string;
}) {
  return (
    <div className={`rounded-3xl px-4 py-4 ${tone}`}>
      <p className="text-xs text-foreground/70">{label}</p>
      <p className="text-2xl font-bold tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const exercise = await db.exercise.findUnique({
    where: { id: exerciseId },
    include: { muscleGroups: { include: { muscleGroup: true } } },
  });
  if (!exercise) notFound();

  const history = await getExerciseHistory(userId, exerciseId);

  const intensity: Record<string, number> = {};
  for (const link of exercise.muscleGroups) {
    intensity[link.muscleGroup.slug] = link.role === "PRIMARY" ? 1 : 0.45;
  }

  const timed = history.some((entry) => entry.timed);
  const unit =
    history.at(-1)?.sets.find((set) => set.unit !== "s")?.unit ?? "kg";
  const best = Math.max(0, ...history.map((entry) => entry.topWeight));
  const best1rm = Math.max(0, ...history.map((entry) => entry.est1rm));
  const totalVolume = history.reduce((sum, entry) => sum + entry.volume, 0);
  const reversed = [...history].reverse();

  return (
    <Page>
      <Link
        href="/training/exercises"
        className="-ml-1 flex w-fit items-center text-sm font-medium text-primary"
      >
        <ChevronLeft className="size-5" /> Übungen
      </Link>

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{exercise.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {exercise.muscleGroups
              .filter((link) => link.role === "PRIMARY")
              .map((link) => link.muscleGroup.name)
              .join(", ")}
            {exercise.muscleGroups.some((link) => link.role === "SECONDARY") && (
              <>
                {" · "}
                <span>
                  auch:{" "}
                  {exercise.muscleGroups
                    .filter((link) => link.role === "SECONDARY")
                    .map((link) => link.muscleGroup.name)
                    .join(", ")}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex w-28 shrink-0 gap-0.5">
          <MuscleMap view="front" intensity={intensity} />
          <MuscleMap view="back" intensity={intensity} />
        </div>
      </div>

      {history.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-card px-4 py-10 text-center">
          <p className="font-medium">Noch keine Daten</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sobald du diese Übung trainierst, siehst du hier deinen Verlauf.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {timed ? (
              <>
                <Stat label="Bestzeit" value={formatDuration(best)} unit="min" />
                <Stat tone="bg-tile-sand" label="Trainings" value={String(history.length)} />
              </>
            ) : (
              <>
                <Stat label="Bestes Gewicht" value={formatNumber(best)} unit={unit} />
                {unit === "kg" ? (
                  <Stat tone="bg-tile-sand" label="Geschätztes Maximum" value={formatNumber(Math.round(best1rm * 10) / 10)} unit="kg" />
                ) : (
                  <Stat tone="bg-tile-clay" label="Trainings" value={String(history.length)} />
                )}
                {unit === "kg" && <Stat tone="bg-tile-clay" label="Trainings" value={String(history.length)} />}
                <Stat tone="bg-card" label="Gesamtvolumen" value={formatNumber(Math.round(totalVolume))} unit={unit} />
              </>
            )}
          </div>

          <section className="rounded-3xl border bg-card p-4">
            <h2 className="mb-3 font-semibold">Entwicklung</h2>
            <ProgressChart
              timed={timed}
              unit={unit}
              points={history.map((entry) => ({
                date: entry.date,
                topWeight: entry.topWeight,
                est1rm: Math.round(entry.est1rm * 10) / 10,
                volume: Math.round(entry.volume),
              }))}
            />
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Alle Trainings</h2>
            <ul className="divide-y overflow-hidden rounded-3xl border bg-card">
              {reversed.map((entry) => (
                <li key={entry.sessionId}>
                  <Link
                    href={`/training/sessions/${entry.sessionId}`}
                    className="block px-4 py-3 active:bg-muted"
                  >
                    <p className="text-sm font-medium">{formatDate(entry.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {summarizeSets(entry.sets)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </Page>
  );
}
