"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Nicht angemeldet.");
  }
  return session.user.id;
}

export async function startSession(workoutId: string | null) {
  const userId = await requireUserId();

  const session = await db.workoutSession.create({
    data: { userId, workoutId },
  });

  if (workoutId) {
    const workoutExercises = await db.workoutExercise.findMany({
      where: { workoutId, workout: { userId } },
      orderBy: { order: "asc" },
    });

    await db.sessionExercise.createMany({
      data: workoutExercises.map((item) => ({
        workoutSessionId: session.id,
        exerciseId: item.exerciseId,
        order: item.order,
      })),
    });
  }

  redirect(`/training/sessions/${session.id}`);
}

export async function addSessionExercise(sessionId: string, exerciseId: string) {
  const userId = await requireUserId();

  const session = await db.workoutSession.findUniqueOrThrow({
    where: { id: sessionId, userId },
    include: { exercises: true },
  });

  await db.sessionExercise.create({
    data: {
      workoutSessionId: session.id,
      exerciseId,
      order: session.exercises.length,
    },
  });

  revalidatePath(`/training/sessions/${sessionId}`);
}

export async function removeSessionExercise(sessionId: string, sessionExerciseId: string) {
  const userId = await requireUserId();
  await db.sessionExercise.delete({
    where: { id: sessionExerciseId, session: { userId } },
  });
  revalidatePath(`/training/sessions/${sessionId}`);
}

export async function addSetLog(
  sessionId: string,
  sessionExerciseId: string,
  data: { weight: number | null; reps: number | null; unit: string },
) {
  const userId = await requireUserId();

  const sessionExercise = await db.sessionExercise.findUniqueOrThrow({
    where: { id: sessionExerciseId, session: { userId } },
    include: { sets: true },
  });

  await db.setLog.create({
    data: {
      sessionExerciseId: sessionExercise.id,
      setNumber: sessionExercise.sets.length + 1,
      weight: data.weight,
      reps: data.reps,
      unit: data.unit,
    },
  });

  revalidatePath(`/training/sessions/${sessionId}`);
}

export async function removeSetLog(sessionId: string, setLogId: string) {
  const userId = await requireUserId();
  await db.setLog.delete({
    where: { id: setLogId, sessionExercise: { session: { userId } } },
  });
  revalidatePath(`/training/sessions/${sessionId}`);
}

export async function finishSession(sessionId: string) {
  const userId = await requireUserId();
  await db.workoutSession.update({
    where: { id: sessionId, userId },
    data: { endedAt: new Date() },
  });
  revalidatePath(`/training/sessions/${sessionId}`);
  redirect("/training");
}
