import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Page } from "@/components/Page";

export default async function TrainingPage() {
  const session = await auth();
  const sessions = await db.workoutSession.findMany({
    where: { userId: session!.user.id },
    orderBy: { startedAt: "desc" },
    include: {
      workout: { select: { name: true } },
      exercises: { include: { sets: true } },
    },
  });

  return (
    <Page>
      <h1 className="text-3xl font-bold tracking-tight">Verlauf</h1>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Trainings aufgezeichnet.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-3xl border bg-card">
          {sessions.map((workoutSession) => {
            const setCount = workoutSession.exercises.reduce(
              (total, exercise) => total + exercise.sets.length,
              0,
            );
            return (
              <li key={workoutSession.id}>
                <Link
                  href={`/training/sessions/${workoutSession.id}`}
                  className="flex items-center gap-3 px-4 py-3 active:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {workoutSession.workout?.name ?? "Freies Training"}
                      {!workoutSession.endedAt && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          läuft
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(workoutSession.startedAt, {
                        weekday: "short",
                      })}
                      {" · "}
                      {workoutSession.exercises.length}{" "}
                      {workoutSession.exercises.length === 1 ? "Übung" : "Übungen"}
                      {" · "}
                      {setCount} {setCount === 1 ? "Satz" : "Sätze"}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground/60" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
