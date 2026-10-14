import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBestWeights } from "@/lib/training/stats";
import { Page } from "@/components/Page";
import { ExerciseCatalog } from "@/components/training/ExerciseCatalog";

export default async function ExercisesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [exercises, muscleGroups, favorites, best] = await Promise.all([
    db.exercise.findMany({
      orderBy: { name: "asc" },
      include: { muscleGroups: { include: { muscleGroup: true } } },
    }),
    db.muscleGroup.findMany({ orderBy: { name: "asc" } }),
    db.favoriteExercise.findMany({
      where: { userId },
      select: { exerciseId: true },
    }),
    getBestWeights(userId),
  ]);

  const catalogExercises = exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    equipment: exercise.equipment,
    best: best[exercise.id] ?? null,
    muscleGroups: exercise.muscleGroups.map((link) => ({
      slug: link.muscleGroup.slug,
      name: link.muscleGroup.name,
      role: link.role,
    })),
  }));

  const muscleGroupNames = Object.fromEntries(
    muscleGroups.map((group) => [group.slug, group.name]),
  );

  return (
    <Page>
      <h1 className="text-3xl font-bold tracking-tight">Übungen</h1>
      <ExerciseCatalog
        exercises={catalogExercises}
        muscleGroupNames={muscleGroupNames}
        initialFavoriteIds={favorites.map((f) => f.exerciseId)}
      />
    </Page>
  );
}
