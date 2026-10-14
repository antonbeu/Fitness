import { db } from "@/lib/db";

export type BuilderExercise = {
  id: string;
  name: string;
  muscles: { slug: string; name: string; role: "PRIMARY" | "SECONDARY" }[];
};

export async function getBuilderExercises(): Promise<BuilderExercise[]> {
  const exercises = await db.exercise.findMany({
    orderBy: { name: "asc" },
    include: { muscleGroups: { include: { muscleGroup: true } } },
  });
  return exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    muscles: exercise.muscleGroups.map((link) => ({
      slug: link.muscleGroup.slug,
      name: link.muscleGroup.name,
      role: link.role,
    })),
  }));
}
