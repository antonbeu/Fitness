import { db } from "@/lib/db";

export type BuilderExercise = {
  id: string;
  name: string;
  muscles: { slug: string; name: string; role: "PRIMARY" | "SECONDARY" }[];
  /** Vom Nutzer als Favorit markiert */
  favorite: boolean;
  /** In wie vielen Trainings der Nutzer die Übung schon gemacht hat */
  uses: number;
};

export async function getBuilderExercises(userId: string): Promise<BuilderExercise[]> {
  const [exercises, favorites, usage] = await Promise.all([
    db.exercise.findMany({
      orderBy: { name: "asc" },
      include: { muscleGroups: { include: { muscleGroup: true } } },
    }),
    db.favoriteExercise.findMany({ where: { userId }, select: { exerciseId: true } }),
    db.sessionExercise.groupBy({
      by: ["exerciseId"],
      where: { session: { userId }, sets: { some: {} } },
      _count: { _all: true },
    }),
  ]);
  const favoriteIds = new Set(favorites.map((f) => f.exerciseId));
  const usesById = new Map(usage.map((u) => [u.exerciseId, u._count._all]));
  return exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    muscles: exercise.muscleGroups.map((link) => ({
      slug: link.muscleGroup.slug,
      name: link.muscleGroup.name,
      role: link.role,
    })),
    favorite: favoriteIds.has(exercise.id),
    uses: usesById.get(exercise.id) ?? 0,
  }));
}
