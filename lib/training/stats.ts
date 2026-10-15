import { db } from "@/lib/db";

export type StatSet = { weight: number | null; reps: number | null; unit: string };

export type SessionStat = {
  sessionId: string;
  date: string; // ISO
  /** Haltedauer-Übung: „topWeight“ = längste Zeit, „volume“ = Gesamtzeit (Sekunden). */
  timed: boolean;
  sets: StatSet[];
  topWeight: number;
  volume: number;
  est1rm: number;
};

/** Geschätztes 1-Wiederholungs-Maximum nach Epley. */
export function estimateOneRepMax(weight: number, reps: number) {
  if (weight <= 0 || reps <= 0) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

/** Alle Trainings, in denen die Übung vorkam, chronologisch (älteste zuerst). */
export async function getExerciseHistory(
  userId: string,
  exerciseId: string,
): Promise<SessionStat[]> {
  const rows = await db.sessionExercise.findMany({
    where: { exerciseId, session: { userId } },
    include: {
      session: { select: { id: true, startedAt: true } },
      sets: { orderBy: { setNumber: "asc" } },
    },
    orderBy: { session: { startedAt: "asc" } },
  });

  return rows
    .filter((row) => row.sets.length > 0)
    .map((row) => {
      const timed = row.sets.some((set) => set.unit === "s");
      let topWeight = 0;
      let volume = 0;
      let est1rm = 0;
      for (const set of row.sets) {
        const reps = set.reps ?? 0;
        if (timed) {
          topWeight = Math.max(topWeight, reps);
          volume += reps;
          continue;
        }
        const weight = set.weight ?? 0;
        topWeight = Math.max(topWeight, weight);
        volume += weight * reps;
        est1rm = Math.max(est1rm, estimateOneRepMax(weight, reps));
      }
      return {
        sessionId: row.session.id,
        date: row.session.startedAt.toISOString(),
        timed,
        sets: row.sets.map((set) => ({ weight: set.weight, reps: set.reps, unit: set.unit })),
        topWeight,
        volume,
        est1rm,
      };
    });
}

/** Höchstgewicht je Übung (für die Übungsliste). */
export async function getBestWeights(userId: string) {
  const sets = await db.setLog.findMany({
    where: { sessionExercise: { session: { userId } }, weight: { not: null }, unit: "kg" },
    select: { weight: true, sessionExercise: { select: { exerciseId: true } } },
  });
  const best: Record<string, number> = {};
  for (const set of sets) {
    const id = set.sessionExercise.exerciseId;
    best[id] = Math.max(best[id] ?? 0, set.weight ?? 0);
  }
  return best;
}

/** Letzte Leistung je Übung vor dem angegebenen Training (für „Letztes Mal“). */
export async function getLastPerformance(
  userId: string,
  exerciseIds: string[],
  beforeSessionId: string,
) {
  const result: Record<string, { date: string; sets: StatSet[] }> = {};
  const rows = await db.sessionExercise.findMany({
    where: {
      exerciseId: { in: exerciseIds },
      session: { userId, id: { not: beforeSessionId } },
      sets: { some: {} },
    },
    include: {
      session: { select: { startedAt: true } },
      sets: { orderBy: { setNumber: "asc" } },
    },
    orderBy: { session: { startedAt: "desc" } },
  });
  for (const row of rows) {
    if (result[row.exerciseId]) continue;
    result[row.exerciseId] = {
      date: row.session.startedAt.toISOString(),
      sets: row.sets.map((set) => ({ weight: set.weight, reps: set.reps, unit: set.unit })),
    };
  }
  return result;
}

export type ExerciseOverview = {
  exerciseId: string;
  name: string;
  /** weight = kg, time = Sekunden, reps = Wiederholungen (Übungen ohne Gewicht) */
  metric: "weight" | "time" | "reps";
  unit: string;
  points: { date: string; value: number }[];
  first: number;
  last: number;
  best: number;
  sessions: number;
  lastDate: string;
};

/** Eine Zeile je trainierter Übung mit Verlauf, für die Statistik-Übersicht. */
export async function getStatsOverview(userId: string) {
  const rows = await db.sessionExercise.findMany({
    where: { session: { userId }, sets: { some: {} } },
    include: {
      exercise: { select: { id: true, name: true } },
      session: { select: { startedAt: true } },
      sets: true,
    },
    orderBy: { session: { startedAt: "asc" } },
  });

  const byExercise = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byExercise.get(row.exerciseId) ?? [];
    list.push(row);
    byExercise.set(row.exerciseId, list);
  }

  const overview: ExerciseOverview[] = [];
  for (const [exerciseId, list] of byExercise) {
    const allSets = list.flatMap((row) => row.sets);
    const timed = allSets.some((set) => set.unit === "s");
    const hasWeight = allSets.some((set) => (set.weight ?? 0) > 0);
    const metric = timed ? "time" : hasWeight ? "weight" : "reps";
    const unit =
      metric === "time"
        ? "min"
        : metric === "reps"
          ? "Wdh."
          : (list.at(-1)!.sets.find((set) => (set.weight ?? 0) > 0)?.unit ?? "kg");

    const points = list.map((row) => ({
      date: row.session.startedAt.toISOString(),
      value: Math.max(
        0,
        ...row.sets.map((set) => (metric === "weight" ? (set.weight ?? 0) : (set.reps ?? 0))),
      ),
    }));
    const values = points.map((point) => point.value);
    overview.push({
      exerciseId,
      name: list[0].exercise.name,
      metric,
      unit,
      points,
      first: values[0],
      last: values.at(-1)!,
      best: Math.max(...values),
      sessions: list.length,
      lastDate: points.at(-1)!.date,
    });
  }
  return { overview, sessionCount: new Set(rows.map((row) => row.workoutSessionId)).size, setCount: rows.reduce((sum, row) => sum + row.sets.length, 0), firstDate: rows[0]?.session.startedAt.toISOString() ?? null };
}
