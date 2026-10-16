"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { fromDateTimeLocal } from "@/lib/format";

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
  const current = await db.workoutSession.findUniqueOrThrow({
    where: { id: sessionId, userId },
    select: { startedAt: true },
  });
  // Wurde das Datum in die Vergangenheit gelegt, nicht „jetzt“ als Ende nehmen, sondern eine Stunde danach.
  const now = new Date();
  const backdated = now.getTime() - current.startedAt.getTime() > 12 * 60 * 60 * 1000;
  await db.workoutSession.update({
    where: { id: sessionId, userId },
    data: { endedAt: backdated ? new Date(current.startedAt.getTime() + 60 * 60 * 1000) : now },
  });
  revalidatePath(`/training/sessions/${sessionId}`);
  redirect("/training");
}

/** Löscht ein Training samt aller Sätze. Mit `backToHistory` geht es danach in den Verlauf. */
export async function deleteSession(sessionId: string, backToHistory = false) {
  const userId = await requireUserId();
  await db.workoutSession.delete({ where: { id: sessionId, userId } });
  // Verlauf, Statistik, Startseite und Übungsseiten zeigen alle daraus abgeleitete Zahlen.
  revalidatePath("/", "layout");
  if (backToHistory) redirect("/training");
}

/** Datum/Uhrzeit eines Trainings ändern (z. B. zum nachträglichen Eintragen). Wert: „2026-10-16T18:00“ in Berliner Zeit. */
export async function updateSessionDate(sessionId: string, value: string) {
  const userId = await requireUserId();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new Error("Bitte ein gültiges Datum wählen.");
  }
  const startedAt = fromDateTimeLocal(value);
  if (Number.isNaN(startedAt.getTime())) throw new Error("Bitte ein gültiges Datum wählen.");
  if (startedAt.getTime() > Date.now() + 5 * 60 * 1000) {
    throw new Error("Das Datum liegt in der Zukunft.");
  }

  const current = await db.workoutSession.findUniqueOrThrow({
    where: { id: sessionId, userId },
    select: { startedAt: true, endedAt: true },
  });
  // Die Dauer eines abgeschlossenen Trainings bleibt erhalten.
  const shift = startedAt.getTime() - current.startedAt.getTime();
  await db.workoutSession.update({
    where: { id: sessionId, userId },
    data: {
      startedAt,
      endedAt: current.endedAt ? new Date(current.endedAt.getTime() + shift) : null,
    },
  });
  revalidatePath("/", "layout");
}
