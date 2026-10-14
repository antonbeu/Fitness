import "dotenv/config";
import { db } from "../lib/db";
import { history, SKIPPED } from "./data/history";

const IMPORT_NOTE = "Import: handschriftliches Trainingsbuch";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run db:import-history -- <email>");
    process.exit(1);
  }
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error(`Kein Nutzer mit E-Mail ${email}`);

  const exercises = await db.exercise.findMany({ select: { id: true, name: true } });
  const idByName = new Map(exercises.map((e) => [e.name, e.id]));
  const missing = new Set<string>();
  for (const session of history) {
    for (const exercise of session.exercises) {
      if (!idByName.has(exercise.name)) missing.add(exercise.name);
    }
  }
  if (missing.size > 0) {
    throw new Error(
      `Übungen fehlen in der Datenbank (erst npm run db:import-exercises ausführen): ${[...missing].join(", ")}`,
    );
  }

  const removed = await db.workoutSession.deleteMany({
    where: { userId: user.id, notes: IMPORT_NOTE },
  });
  if (removed.count > 0) console.log(`Frühere Importe entfernt: ${removed.count}`);

  let setCount = 0;
  for (const entry of history) {
    // Mitte Juni bis Ende Oktober gilt in Deutschland Sommerzeit (+02:00).
    const startedAt = new Date(`${entry.date}T18:00:00+02:00`);
    const endedAt = new Date(startedAt.getTime() + 60 * 60 * 1000);
    await db.workoutSession.create({
      data: {
        userId: user.id,
        startedAt,
        endedAt,
        notes: IMPORT_NOTE,
        exercises: {
          create: entry.exercises.map((exercise, order) => ({
            exerciseId: idByName.get(exercise.name)!,
            order,
            sets: {
              create: exercise.sets.map((set, index) => ({
                setNumber: index + 1,
                weight: set.weight,
                reps: set.reps,
                unit: set.unit,
                completedAt: startedAt,
              })),
            },
          })),
        },
      },
    });
    setCount += entry.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  }

  console.log(`${history.length} Trainings mit ${setCount} Sätzen für ${email} importiert.`);
  console.log("Nicht importiert (bitte klären):\n- " + SKIPPED.join("\n- "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
