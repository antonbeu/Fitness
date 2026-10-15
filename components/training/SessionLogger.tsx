"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ChevronLeft, ChartLine, Trash2, X } from "lucide-react";
import { ExerciseIcon } from "@/components/training/ExerciseIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addSessionExercise,
  addSetLog,
  finishSession,
  removeSessionExercise,
  removeSetLog,
} from "@/app/(dashboard)/training/sessions/actions";
import { formatDate, formatDateTime, formatNumber, summarizeSets } from "@/lib/format";

type SetEntry = {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  unit: string;
};

type SessionExerciseEntry = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  timed: boolean;
  sets: SetEntry[];
  target: { sets: number | null; reps: number | null; weight: number | null } | null;
  last: {
    date: string;
    sets: { weight: number | null; reps: number | null; unit: string }[];
  } | null;
};

type SessionLoggerProps = {
  sessionId: string;
  workoutName: string | null;
  startedAt: string;
  endedAt: string | null;
  exercises: SessionExerciseEntry[];
  allExercises: { id: string; name: string }[];
};

export function SessionLogger({
  sessionId,
  workoutName,
  startedAt,
  endedAt,
  exercises,
  allExercises,
}: SessionLoggerProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingExerciseId, setPendingExerciseId] = useState("");
  const finished = Boolean(endedAt);

  return (
    <>
      <Link
        href={finished ? "/training" : "/"}
        className="-ml-1 flex w-fit items-center text-sm font-medium text-primary"
      >
        <ChevronLeft className="size-5" /> {finished ? "Verlauf" : "Zurück"}
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {workoutName ?? "Freies Training"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDateTime(startedAt)}
          {endedAt && " · abgeschlossen"}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {exercises.map((sessionExercise) => (
          <ExerciseCard
            key={sessionExercise.id}
            sessionId={sessionId}
            sessionExercise={sessionExercise}
            readOnly={finished}
          />
        ))}
        {exercises.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Noch keine Übungen in diesem Training.
          </p>
        )}
      </div>

      {!finished && (
        <div className="flex gap-2">
          <Select
            value={pendingExerciseId}
            onValueChange={(value) => setPendingExerciseId(value ?? "")}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Übung hinzufügen">
                {(value: string | null) =>
                  value
                    ? allExercises.find((exercise) => exercise.id === value)?.name
                    : "Übung hinzufügen"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {allExercises.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            disabled={!pendingExerciseId || isPending}
            onClick={() => {
              const exerciseId = pendingExerciseId;
              setPendingExerciseId("");
              startTransition(() => addSessionExercise(sessionId, exerciseId));
            }}
          >
            Hinzufügen
          </Button>
        </div>
      )}

      {!finished && (
        <Button
          size="lg"
          className="mt-2 w-full"
          disabled={isPending}
          onClick={() => startTransition(() => finishSession(sessionId))}
        >
          Training abschließen
        </Button>
      )}
    </>
  );
}

function ExerciseCard({
  sessionId,
  sessionExercise,
  readOnly,
}: {
  sessionId: string;
  sessionExercise: SessionExerciseEntry;
  readOnly: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const timed = sessionExercise.timed;
  const lastSet = sessionExercise.sets.at(-1);
  // Hat der Vater zuletzt „kg pro Seite“ notiert, bleibt die Eingabe in dieser Einheit.
  const weightUnit =
    (lastSet ?? sessionExercise.last?.sets[0])?.unit === "kg/Seite" ? "kg/Seite" : "kg";
  const nextIndex = sessionExercise.sets.length;
  const suggestion =
    lastSet ??
    sessionExercise.last?.sets[Math.min(nextIndex, (sessionExercise.last?.sets.length ?? 1) - 1)] ??
    null;
  const [weight, setWeight] = useState(
    String(
      suggestion?.weight ?? sessionExercise.target?.weight ?? "",
    ),
  );
  const [reps, setReps] = useState(
    String(suggestion?.reps ?? sessionExercise.target?.reps ?? ""),
  );

  function handleAddSet() {
    startTransition(() =>
      addSetLog(
        sessionId,
        sessionExercise.id,
        timed
          ? { weight: null, reps: reps === "" ? null : Number(reps), unit: "s" }
          : {
              weight: weight === "" ? null : Number(weight),
              reps: reps === "" ? null : Number(reps),
              unit: weightUnit,
            },
      ),
    );
  }

  const target = sessionExercise.target;
  const targetText =
    target && (target.sets || target.reps || target.weight)
      ? `Ziel: ${target.sets ?? "–"} × ${target.reps ?? "–"}${
          target.weight ? ` mit ${formatNumber(target.weight)} kg` : ""
        }`
      : null;

  return (
    <section className="rounded-3xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <ExerciseIcon name={sessionExercise.exerciseName} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{sessionExercise.exerciseName}</h2>
          {targetText && (
            <p className="text-sm text-muted-foreground">{targetText}</p>
          )}
          {sessionExercise.last && (
            <p className="text-sm text-muted-foreground">
              Letztes Mal ({formatDate(sessionExercise.last.date, { year: undefined })}):{" "}
              {summarizeSets(sessionExercise.last.sets)}
            </p>
          )}
        </div>
        <Link
          href={`/training/exercises/${sessionExercise.exerciseId}`}
          aria-label="Statistik ansehen"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-primary active:bg-muted"
        >
          <ChartLine className="size-5" />
        </Link>
        {!readOnly && (
          <button
            type="button"
            disabled={isPending}
            aria-label="Übung entfernen"
            onClick={() =>
              startTransition(() => removeSessionExercise(sessionId, sessionExercise.id))
            }
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted"
          >
            <Trash2 className="size-5" />
          </button>
        )}
      </div>

      {sessionExercise.sets.length > 0 && (
        <ol className="mt-3 divide-y rounded-xl border">
          {sessionExercise.sets.map((set) => (
            <li key={set.id} className="flex items-center gap-3 px-3 py-2">
              <span className="w-14 text-sm text-muted-foreground">Satz {set.setNumber}</span>
              <span className="flex-1 font-medium tabular-nums">{summarizeSets([set])}</span>
              {!readOnly && (
                <button
                  type="button"
                  disabled={isPending}
                  aria-label={`Satz ${set.setNumber} entfernen`}
                  onClick={() => startTransition(() => removeSetLog(sessionId, set.id))}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground active:bg-muted"
                >
                  <X className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      {!readOnly && (
        <div className="mt-3 flex items-end gap-2">
          {!timed && (
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {weightUnit === "kg" ? "Gewicht (kg)" : "kg pro Seite"}
            </span>
            <Input
              type="number"
              inputMode="decimal"
              step={0.5}
              min={0}
              className="h-12 text-lg"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </label>
          )}
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs text-muted-foreground">{timed ? "Dauer (Sekunden)" : "Wiederholungen"}</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              className="h-12 text-lg"
              value={reps}
              onChange={(event) => setReps(event.target.value)}
            />
          </label>
          <Button
            type="button"
            size="lg"
            disabled={isPending}
            onClick={handleAddSet}
          >
            Satz sichern
          </Button>
        </div>
      )}
    </section>
  );
}
