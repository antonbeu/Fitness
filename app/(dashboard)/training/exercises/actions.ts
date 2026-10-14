"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Nicht angemeldet.");
  }
  return session.user.id;
}

export async function toggleFavorite(exerciseId: string) {
  const userId = await requireUserId();

  const existing = await db.favoriteExercise.findUnique({
    where: { userId_exerciseId: { userId, exerciseId } },
  });

  if (existing) {
    await db.favoriteExercise.delete({ where: { id: existing.id } });
  } else {
    await db.favoriteExercise.create({ data: { userId, exerciseId } });
  }

  revalidatePath("/training/exercises");
  revalidatePath(`/training/exercises/${exerciseId}`);
}
