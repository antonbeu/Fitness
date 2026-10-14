import "dotenv/config";
import { db } from "../lib/db";

// Aufruf: npm run db:starter-workouts -- <email>
// Legt zwei einfache Ganzkörper-Pläne für den Nutzer an (falls noch nicht vorhanden).
const plans = [
  {
    name: "Ganzkörper A",
    items: [
      ["Barbell_Squat", 3, 8],
      ["Barbell_Bench_Press_-_Medium_Grip", 3, 8],
      ["Seated_Cable_Rows", 3, 10],
      ["Dumbbell_Shoulder_Press", 3, 10],
      ["Barbell_Curl", 2, 12],
      ["Plank", 3, 1],
    ],
  },
  {
    name: "Ganzkörper B",
    items: [
      ["Romanian_Deadlift", 3, 8],
      ["Leg_Press", 3, 10],
      ["Wide-Grip_Lat_Pulldown", 3, 10],
      ["Incline_Dumbbell_Press", 3, 10],
      ["Triceps_Pushdown", 2, 12],
      ["Crunches", 3, 15],
    ],
  },
] as const;

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: npm run db:starter-workouts -- <email>");
  const user = await db.user.findUniqueOrThrow({ where: { email } });

  for (const plan of plans) {
    const exists = await db.workout.findFirst({
      where: { userId: user.id, name: plan.name },
    });
    if (exists) continue;
    await db.workout.create({
      data: {
        userId: user.id,
        name: plan.name,
        exercises: {
          create: plan.items.map(([id, sets, reps], order) => ({
            exerciseId: `import-${id}`,
            order,
            targetSets: sets,
            targetReps: reps,
          })),
        },
      },
    });
    console.log(`Angelegt: ${plan.name}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
