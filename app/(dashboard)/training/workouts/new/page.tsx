import { auth } from "@/auth";
import { getBuilderExercises } from "@/lib/training/builder-exercises";
import { WorkoutBuilder } from "@/components/training/WorkoutBuilder";

// Liest die Datenbank: nie zur Build-Zeit vorrendern.
export const dynamic = "force-dynamic";

export default async function NewWorkoutPage() {
  const session = await auth();
  const exercises = await getBuilderExercises(session!.user.id);
  return <WorkoutBuilder exercises={exercises} />;
}
