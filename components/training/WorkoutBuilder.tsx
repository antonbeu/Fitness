"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  GripVertical,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MuscleMap } from "@/components/training/MuscleMap";
import {
  AREAS,
  computeCoverage,
  exerciseAreaKeys,
  type AreaKey,
} from "@/lib/training/coverage";
import type { BuilderExercise } from "@/lib/training/builder-exercises";
import { saveWorkout } from "@/app/(dashboard)/training/workouts/actions";
import { cn } from "@/lib/utils";

type Row = {
  key: string;
  exerciseId: string;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
};

type WorkoutBuilderProps = {
  exercises: BuilderExercise[];
  initialWorkout?: {
    id: string;
    name: string;
    description: string | null;
    items: Omit<Row, "key">[];
  };
  /** Zusätzliche Aktion in der Kopfzeile (z. B. „Starten“). */
  headerAction?: React.ReactNode;
};

const BASKET_PANEL = "basket-panel";
const BASKET_BAR = "basket-bar";
const CATALOG_PREFIX = "cat:";

let rowCounter = 0;
function newRowKey() {
  rowCounter += 1;
  return `row-${Date.now()}-${rowCounter}`;
}

// Zuerst der Zeiger (genau, was man trifft). Beim Umsortieren zusätzlich das
// nächstgelegene Zeilenziel; Katalog-Übungen landen nur, wenn man wirklich trifft
// (ausgeblendete Ablageziele haben Größe 0 und dürfen nie „näher“ sein).
const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) return pointer;
  if (String(args.active.id).startsWith(CATALOG_PREFIX)) return [];
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (container) => container.id !== BASKET_PANEL && container.id !== BASKET_BAR,
    ),
  });
};

export function WorkoutBuilder({
  exercises,
  initialWorkout,
  headerAction,
}: WorkoutBuilderProps) {
  const [name, setName] = useState(initialWorkout?.name ?? "");
  const [rows, setRows] = useState<Row[]>(() =>
    (initialWorkout?.items ?? []).map((item) => ({ ...item, key: newRowKey() })),
  );
  const [tab, setTab] = useState<"catalog" | "workout">(
    initialWorkout ? "workout" : "catalog",
  );
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState<AreaKey | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const exerciseById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Auf dem Handy erst nach kurzem Halten, damit normales Scrollen weiter geht.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const coverage = useMemo(
    () =>
      computeCoverage(
        rows.map((row) => ({
          sets: row.targetSets ?? 3,
          muscles: exerciseById.get(row.exerciseId)?.muscles ?? [],
        })),
      ),
    [rows, exerciseById],
  );

  const visibleExercises = useMemo(
    () =>
      exercises.filter((exercise) => {
        const matchesQuery =
          query.trim() === "" ||
          exercise.name.toLowerCase().includes(query.trim().toLowerCase());
        const matchesArea =
          !areaFilter || exerciseAreaKeys(exercise.muscles).includes(areaFilter);
        return matchesQuery && matchesArea;
      }),
    [exercises, query, areaFilter],
  );

  const countByExercise = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.exerciseId, (counts.get(row.exerciseId) ?? 0) + 1);
    }
    return counts;
  }, [rows]);

  function addExercise(exerciseId: string, atIndex?: number) {
    const row: Row = {
      key: newRowKey(),
      exerciseId,
      targetSets: 3,
      targetReps: 10,
      targetWeight: null,
    };
    setRows((current) => {
      const next = [...current];
      next.splice(atIndex ?? next.length, 0, row);
      return next;
    });
  }

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
  }

  function handleDragStart(event: DragStartEvent) {
    setDraggingId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null);
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;

    if (activeId.startsWith(CATALOG_PREFIX)) {
      const exerciseId = activeId.slice(CATALOG_PREFIX.length);
      if (overId === BASKET_PANEL || overId === BASKET_BAR) {
        addExercise(exerciseId);
        return;
      }
      const overIndex = rows.findIndex((row) => row.key === overId);
      if (overIndex >= 0) addExercise(exerciseId, overIndex);
      return;
    }

    if (activeId !== overId) {
      setRows((current) => {
        const from = current.findIndex((row) => row.key === activeId);
        const to = current.findIndex((row) => row.key === overId);
        return from < 0 || to < 0 ? current : arrayMove(current, from, to);
      });
    }
  }

  function handleSave() {
    setError(null);
    if (name.trim() === "") {
      setError("Gib dem Workout einen Namen.");
      return;
    }
    if (rows.length === 0) {
      setError("Füge mindestens eine Übung hinzu.");
      setTab("catalog");
      return;
    }
    startTransition(async () => {
      try {
        await saveWorkout({
          id: initialWorkout?.id,
          name,
          description: initialWorkout?.description ?? "",
          items: rows.map(({ exerciseId, targetSets, targetReps, targetWeight }) => ({
            exerciseId,
            targetSets,
            targetReps,
            targetWeight,
          })),
        });
      } catch (err) {
        // redirect() in der Server Action wirft absichtlich; nur echte Fehler zeigen.
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        setError(err instanceof Error ? err.message : "Fehler beim Speichern.");
      }
    });
  }

  const draggingExercise = draggingId?.startsWith(CATALOG_PREFIX)
    ? exerciseById.get(draggingId.slice(CATALOG_PREFIX.length))
    : undefined;

  return (
    <DndContext
      id="workout-builder"
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div className="flex min-w-0 flex-col gap-4 pb-24 lg:pb-8">
        <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between gap-2 bg-background/95 px-4 py-2 backdrop-blur">
          <Link
            href="/"
            className="-ml-1 flex items-center text-base font-medium text-primary"
          >
            <ChevronLeft className="size-5" /> Zurück
          </Link>
          <div className="flex items-center gap-2">
            {headerAction}
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Speichern…" : "Sichern"}
            </Button>
          </div>
        </header>

        <div>
          <label htmlFor="workout-name" className="sr-only">
            Name des Workouts
          </label>
          <input
            id="workout-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name des Workouts"
            className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div
          role="tablist"
          aria-label="Bereich"
          className="flex rounded-lg bg-secondary p-0.5 text-sm font-medium lg:hidden"
        >
          {(
            [
              ["catalog", "Übungen"],
              ["workout", `Mein Workout (${rows.length})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "h-9 flex-1 rounded-md transition-colors",
                tab === value ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2 lg:items-start">
          {/* ---------- Katalog ---------- */}
          <section
            aria-label="Übungskatalog"
            className={cn("flex flex-col gap-3", tab === "catalog" ? "flex" : "hidden", "lg:flex")}
          >
            <h2 className="hidden text-lg font-semibold lg:block">Übungen</h2>
            <Input
              placeholder="Übung suchen"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
              {[{ key: null, label: "Alle" }, ...AREAS].map((area) => (
                <button
                  key={area.key ?? "all"}
                  type="button"
                  aria-pressed={areaFilter === area.key}
                  onClick={() => setAreaFilter(area.key)}
                  className={cn(
                    "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                    areaFilter === area.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card",
                  )}
                >
                  {area.label}
                </button>
              ))}
            </div>
            <p className="hidden text-sm text-muted-foreground lg:block">
              Ziehe eine Übung nach rechts in dein Workout oder tippe auf +.
            </p>
            <p className="text-sm text-muted-foreground lg:hidden">
              Tippe auf + oder halte eine Übung gedrückt und ziehe sie nach unten
              in „Mein Workout“.
            </p>
            <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
              {visibleExercises.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Keine Übungen gefunden.
                </li>
              )}
              {visibleExercises.map((exercise) => (
                <CatalogRow
                  key={exercise.id}
                  exercise={exercise}
                  count={countByExercise.get(exercise.id) ?? 0}
                  onAdd={() => addExercise(exercise.id)}
                />
              ))}
            </ul>
          </section>

          {/* ---------- Warenkorb + Analyse ---------- */}
          <section
            aria-label="Mein Workout"
            className={cn(
              "flex flex-col gap-4",
              tab === "workout" ? "flex" : "hidden",
              "lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100svh-2rem)] lg:overflow-y-auto lg:pr-1",
            )}
          >
            <h2 className="hidden text-lg font-semibold lg:block">
              Mein Workout
            </h2>
            <BasketPanel hasRows={rows.length > 0} isDragging={Boolean(draggingExercise)}>
              <SortableContext
                items={rows.map((row) => row.key)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-2">
                  {rows.map((row, index) => {
                    const exercise = exerciseById.get(row.exerciseId);
                    if (!exercise) return null;
                    return (
                      <BasketRow
                        key={row.key}
                        row={row}
                        index={index}
                        exercise={exercise}
                        onChange={(patch) => updateRow(row.key, patch)}
                        onRemove={() => removeRow(row.key)}
                      />
                    );
                  })}
                </ul>
              </SortableContext>
            </BasketPanel>

            <CoveragePanel
              coverage={coverage}
              onPickArea={(key) => {
                setAreaFilter(key);
                setTab("catalog");
              }}
            />

            {initialWorkout && (
              <p className="text-center text-xs text-muted-foreground">
                Änderungen werden erst mit „Sichern“ übernommen.
              </p>
            )}
          </section>
        </div>
      </div>

      {tab === "catalog" && (
        <BasketBar
          count={rows.length}
          isDragging={Boolean(draggingExercise)}
          onOpen={() => setTab("workout")}
        />
      )}

      <DragOverlay dropAnimation={null}>
        {draggingExercise && (
          <div className="rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-lg">
            {draggingExercise.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function CatalogRow({
  exercise,
  count,
  onAdd,
}: {
  exercise: BuilderExercise;
  count: number;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${CATALOG_PREFIX}${exercise.id}`,
  });
  const primary = exercise.muscles
    .filter((muscle) => muscle.role === "PRIMARY")
    .map((muscle) => muscle.name)
    .join(", ");

  return (
    <li
      ref={setNodeRef}
      className={cn("flex items-center", isDragging && "opacity-40")}
    >
      <div
        {...listeners}
        {...attributes}
        className="flex min-w-0 flex-1 cursor-grab items-center gap-3 py-3 pl-4 select-none active:cursor-grabbing"
      >
        <GripVertical className="size-5 shrink-0 text-muted-foreground/50" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{exercise.name}</p>
          <p className="truncate text-sm text-muted-foreground">{primary}</p>
        </div>
        {count > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
            <Check className="size-4" />
            {count > 1 ? `${count}×` : "dabei"}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`${exercise.name} zum Workout hinzufügen`}
        className="flex size-14 shrink-0 items-center justify-center text-primary active:bg-muted"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <Plus className="size-5" />
        </span>
      </button>
    </li>
  );
}

function BasketPanel({
  hasRows,
  isDragging,
  children,
}: {
  hasRows: boolean;
  isDragging: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: BASKET_PANEL });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border bg-card p-3 transition-colors",
        isDragging && "border-dashed border-primary/60",
        isOver && "bg-primary/5 ring-2 ring-primary/40",
      )}
    >
      {!hasRows && (
        <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
          <Dumbbell className="size-8 text-muted-foreground/50" />
          <p className="font-medium">Noch keine Übungen</p>
          <p className="text-sm text-muted-foreground">
            Ziehe Übungen aus dem Katalog hierher oder tippe dort auf +.
          </p>
        </div>
      )}
      {children}
    </div>
  );
}

function BasketRow({
  row,
  index,
  exercise,
  onChange,
  onRemove,
}: {
  row: Row;
  index: number;
  exercise: BuilderExercise;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.key });

  const numberField = (
    label: string,
    value: number | null,
    key: "targetSets" | "targetReps" | "targetWeight",
    step?: number,
  ) => (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        type="number"
        inputMode={step ? "decimal" : "numeric"}
        min={0}
        step={step}
        value={value ?? ""}
        onChange={(event) =>
          onChange({
            [key]: event.target.value === "" ? null : Number(event.target.value),
          })
        }
      />
    </label>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border bg-background p-3",
        isDragging && "relative z-10 opacity-80 shadow-lg",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...listeners}
          {...attributes}
          aria-label={`${exercise.name} verschieben`}
          className="-ml-1 flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-5" />
        </button>
        <p className="min-w-0 flex-1 truncate font-medium">
          <span className="mr-2 text-muted-foreground tabular-nums">{index + 1}.</span>
          {exercise.name}
        </p>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${exercise.name} entfernen`}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {numberField("Sätze", row.targetSets, "targetSets")}
        {numberField("Wdh.", row.targetReps, "targetReps")}
        {numberField("kg", row.targetWeight, "targetWeight", 0.5)}
      </div>
    </li>
  );
}

function BasketBar({
  count,
  isDragging,
  onOpen,
}: {
  count: number;
  isDragging: boolean;
  onOpen: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: BASKET_BAR });
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div ref={setNodeRef} className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "flex h-14 w-full items-center gap-3 rounded-xl border px-4 text-left transition-colors",
            isDragging && "border-dashed border-primary/60 bg-primary/5",
            isOver && "bg-primary/15 ring-2 ring-primary/40",
          )}
        >
          <Dumbbell className="size-5 text-primary" />
          <span className="flex-1 font-medium">
            {isDragging ? "Hier ablegen" : "Mein Workout"}
          </span>
          <span
            key={count}
            className="animate-in zoom-in-75 rounded-full bg-primary px-2.5 py-0.5 text-sm font-semibold text-primary-foreground tabular-nums duration-200"
          >
            {count}
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function CoveragePanel({
  coverage,
  onPickArea,
}: {
  coverage: ReturnType<typeof computeCoverage>;
  onPickArea: (key: AreaKey) => void;
}) {
  return (
    <section aria-label="Analyse" className="rounded-2xl border bg-card p-4">
      <h3 className="font-semibold">Analyse</h3>
      <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
        {coverage.summary}
      </p>

      <div className="mt-3 flex justify-center gap-2">
        <MuscleMap view="front" intensity={coverage.intensity} className="max-h-72 max-w-36" />
        <MuscleMap view="back" intensity={coverage.intensity} className="max-h-72 max-w-36" />
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2">
        {coverage.areas.map((area) => (
          <li key={area.key}>
            {area.status === "trained" ? (
              <div className="flex h-10 items-center gap-2 rounded-lg bg-primary/10 px-3 text-sm font-medium text-primary">
                <Check className="size-4" />
                <span className="flex-1">{area.label}</span>
                <span className="text-xs tabular-nums opacity-70">{area.sets} Sätze</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onPickArea(area.key)}
                className="flex h-10 w-full items-center gap-2 rounded-lg bg-secondary px-3 text-left text-sm text-muted-foreground"
              >
                <Plus className="size-4" />
                <span className="flex-1">{area.label}</span>
                <span className="text-xs">{area.status === "light" ? "nebenbei" : "fehlt"}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
