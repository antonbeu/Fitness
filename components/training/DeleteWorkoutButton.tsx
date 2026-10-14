"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteWorkout } from "@/app/(dashboard)/training/workouts/actions";

export function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Dieses Workout wirklich löschen?")) return;
        startTransition(() => deleteWorkout(workoutId));
      }}
    >
      {isPending ? "Löschen…" : "Workout löschen"}
    </Button>
  );
}
