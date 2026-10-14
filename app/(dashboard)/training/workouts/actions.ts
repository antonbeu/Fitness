"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type WorkoutItemInput = {
  exerciseId: string;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
};

export type SaveWorkoutInput = {
  id?: string;
  name: string;
  description: string;
  items: WorkoutItemInput[];
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Nicht angemeldet.");
  }
  return session.user.id;
}

export async function saveWorkout(input: SaveWorkoutInput) {
  const userId = await requireUserId();

  if (input.name.trim() === "") {
    throw new Error("Name darf nicht leer sein.");
  }
  if (input.items.length === 0) {
    throw new Error("Ein Workout braucht mindestens eine Übung.");
  }

  const workout = input.id
    ? await db.workout.update({
        where: { id: input.id, userId },
        data: { name: input.name, description: input.description || null },
      })
    : await db.workout.create({
        data: { userId, name: input.name, description: input.description || null },
      });

  await db.workoutExercise.deleteMany({ where: { workoutId: workout.id } });
  await db.workoutExercise.createMany({
    data: input.items.map((item, index) => ({
      workoutId: workout.id,
      exerciseId: item.exerciseId,
      order: index,
      targetSets: item.targetSets,
      targetReps: item.targetReps,
      targetWeight: item.targetWeight,
    })),
  });

  revalidatePath("/");
  redirect("/");
}

export async function deleteWorkout(id: string) {
  const userId = await requireUserId();
  await db.workout.delete({ where: { id, userId } });
  revalidatePath("/");
  redirect("/");
}
