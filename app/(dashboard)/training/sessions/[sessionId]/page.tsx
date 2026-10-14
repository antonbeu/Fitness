import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getLastPerformance } from "@/lib/training/stats";
import { Page } from "@/components/Page";
import { SessionLogger } from "@/components/training/SessionLogger";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const [workoutSession, exercises] = await Promise.all([
    db.workoutSession.findUnique({
      where: { id: sessionId, userId },
      include: {
        workout: {
          select: {
            name: true,
            exercises: {
              select: {
                exerciseId: true,
                targetSets: true,
                targetReps: true,
                targetWeight: true,
              },
            },
          },
        },
        exercises: {
          orderBy: { order: "asc" },
          include: {
            exercise: { select: { id: true, name: true, category: true } },
            sets: { orderBy: { setNumber: "asc" } },
          },
        },
      },
    }),
    db.exercise.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!workoutSession) {
    notFound();
  }

  const last = await getLastPerformance(
    userId,
    workoutSession.exercises.map((entry) => entry.exerciseId),
    workoutSession.id,
  );
  const targets = Object.fromEntries(
    (workoutSession.workout?.exercises ?? []).map((item) => [
      item.exerciseId,
      { sets: item.targetSets, reps: item.targetReps, weight: item.targetWeight },
    ]),
  );

  return (
    <Page>
      <SessionLogger
        sessionId={workoutSession.id}
        workoutName={workoutSession.workout?.name ?? null}
        startedAt={workoutSession.startedAt.toISOString()}
        endedAt={workoutSession.endedAt?.toISOString() ?? null}
        exercises={workoutSession.exercises.map((sessionExercise) => ({
          id: sessionExercise.id,
          exerciseId: sessionExercise.exercise.id,
          exerciseName: sessionExercise.exercise.name,
          timed: sessionExercise.exercise.category === "Zeit",
          target: targets[sessionExercise.exerciseId] ?? null,
          last: last[sessionExercise.exerciseId] ?? null,
          sets: sessionExercise.sets.map((set) => ({
            id: set.id,
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
            unit: set.unit,
          })),
        }))}
        allExercises={exercises}
      />
    </Page>
  );
}
