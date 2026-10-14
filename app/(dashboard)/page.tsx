import Link from "next/link";
import { Plus } from "lucide-react";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { computeCoverage } from "@/lib/training/coverage";
import { relativeDays } from "@/lib/format";
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [workouts, lastSessions] = await Promise.all([
    db.workout.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        exercises: {
          include: {
            exercise: {
              include: { muscleGroups: { include: { muscleGroup: true } } },
            },
          },
        },
      },
    }),
    db.workoutSession.groupBy({
      by: ["workoutId"],
      where: { userId, workoutId: { not: null } },
      _max: { startedAt: true },
    }),
  ]);

  const lastByWorkout = new Map(
    lastSessions.map((entry) => [entry.workoutId, entry._max.startedAt]),
  );

  return (
    <Page>
      <h1 className="text-3xl font-bold tracking-tight">Training</h1>

      {workouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-4 py-10 text-center">
          <p className="font-medium">Noch kein Workout angelegt</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Stelle dir aus dem Übungskatalog dein erstes Workout zusammen.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {workouts.map((workout) => {
            const coverage = computeCoverage(
              workout.exercises.map((item) => ({
                sets: item.targetSets ?? 3,
                muscles: item.exercise.muscleGroups.map((link) => ({
                  slug: link.muscleGroup.slug,
                  role: link.role,
                })),
              })),
            );
            const trained = coverage.areas
              .filter((area) => area.status === "trained")
              .map((area) => area.label);
            const last = lastByWorkout.get(workout.id);
            return (
              <li
                key={workout.id}
                className="rounded-2xl border bg-card p-4"
              >
                <h2 className="text-lg font-semibold">{workout.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {workout.exercises.length}{" "}
                  {workout.exercises.length === 1 ? "Übung" : "Übungen"}
                  {trained.length > 0 && ` · ${trained.join(", ")}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {last ? `Zuletzt ${relativeDays(last)}` : "Noch nicht trainiert"}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="lg"
                    className="flex-1"
                    nativeButton={false}
                    render={
                      <Link href={`/training/sessions/new?workoutId=${workout.id}`} />
                    }
                  >
                    Starten
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={`/training/workouts/${workout.id}`} />}
                  >
                    Bearbeiten
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          variant="outline"
          className="h-14 justify-start bg-card"
          nativeButton={false}
          render={<Link href="/training/workouts/new" />}
        >
          <Plus className="text-primary" /> Neues Workout zusammenstellen
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="h-12 text-primary"
          nativeButton={false}
          render={<Link href="/training/sessions/new" />}
        >
          Freies Training ohne Plan starten
        </Button>
      </div>

      <form
        className="mt-4 flex justify-center"
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button type="submit" className="px-3 py-2 text-sm text-muted-foreground">
          Abmelden
        </button>
      </form>
    </Page>
  );
}
