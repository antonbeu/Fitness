import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getBuilderExercises } from "@/lib/training/builder-exercises";
import { Button } from "@/components/ui/button";
import { WorkoutBuilder } from "@/components/training/WorkoutBuilder";
import { DeleteWorkoutButton } from "@/components/training/DeleteWorkoutButton";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const session = await auth();

  const [workout, exercises] = await Promise.all([
    db.workout.findUnique({
      where: { id: workoutId, userId: session!.user.id },
      include: { exercises: { orderBy: { order: "asc" } } },
    }),
    getBuilderExercises(session!.user.id),
  ]);

  if (!workout) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <WorkoutBuilder
        exercises={exercises}
        initialWorkout={{
          id: workout.id,
          name: workout.name,
          description: workout.description,
          items: workout.exercises.map((item) => ({
            exerciseId: item.exerciseId,
            targetSets: item.targetSets,
            targetReps: item.targetReps,
            targetWeight: item.targetWeight,
          })),
        }}
        headerAction={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/training/sessions/new?workoutId=${workout.id}`} />}
          >
            <Play className="fill-current" /> Starten
          </Button>
        }
      />
      <div className="flex justify-center pb-24 lg:pb-8">
        <DeleteWorkoutButton workoutId={workout.id} />
      </div>
    </div>
  );
}
